import {
  PayloadInvalido,
  type AdaptadorOperadora,
  type NotificacaoPagamento,
  type Obrigacao,
  type PedidoCru,
  type Repositorio,
} from './contrato.ts';
import { lancamentosContribuicao, lancamentosEstorno } from './comissoes.ts';

/**
 * Recepção de callbacks de operadora.
 *
 * A premissa que estrutura tudo: um webhook é uma ALEGAÇÃO, não uma prova.
 * O que ele consegue fazer, no máximo, é levar uma obrigação a
 * PENDENTE_RECONCILIACAO. Só o extracto de liquidação do dia seguinte a
 * promove a CONFIRMADO, e só uma obrigação CONFIRMADA liberta uma entrega.
 */

export type DecisaoWebhook =
  | 'ASSINATURA_INVALIDA'
  | 'PAYLOAD_INVALIDO'
  | 'DUPLICADO'
  | 'ACEITE_PENDENTE'
  | 'JA_PENDENTE'
  | 'QUARENTENA_SEM_OBRIGACAO'
  | 'QUARENTENA_MONTANTE'
  | 'ESTORNADO'
  | 'REVERSAO_APOS_ENTREGA'
  | 'REVERSAO_IGNORADA'
  | 'FALHA_REGISTADA';

export interface ResultadoWebhook {
  decisao: DecisaoWebhook;
  /** Código HTTP a devolver à operadora. */
  estadoHttp: number;
  obrigacaoId?: string;
  detalhe?: string;
}

/**
 * A chave de idempotência inclui o TIPO do evento. Uma liquidação e a sua
 * posterior reversão partilham a referência externa mas são acontecimentos
 * diferentes — se a chave fosse só a referência, a reversão seria silenciosamente
 * descartada como duplicado e o dinheiro ficaria a contar como recebido.
 */
export function chaveIdempotencia(n: Pick<NotificacaoPagamento, 'operadora' | 'referenciaExterna' | 'tipo'>): string {
  return `${n.operadora}:${n.referenciaExterna}:${n.tipo}`;
}

export async function receberWebhook(
  adaptador: AdaptadorOperadora,
  repo: Repositorio,
  pedido: PedidoCru,
  agora: Date,
): Promise<ResultadoWebhook> {
  // ---- 1. Autenticidade -------------------------------------------------
  const assinatura = adaptador.verificarAssinatura(pedido, agora);
  if (!assinatura.valida) {
    // Guarda-se o pedido rejeitado: uma rajada destes é sinal de ataque, e sem
    // registo não há como investigar. A chave usa o instante de chegada porque
    // um payload não confiável não pode ditar a chave da nossa base de dados.
    await repo.registarEvento(`REJEITADO:${adaptador.canal}:${pedido.recebidoEm.toISOString()}`, pedido, false);
    await repo.sinalRisco('WEBHOOK_ASSINATURA_INVALIDA', { canal: adaptador.canal, motivo: assinatura.motivo });
    return { decisao: 'ASSINATURA_INVALIDA', estadoHttp: 401, detalhe: assinatura.motivo };
  }

  // ---- 2. Interpretação -------------------------------------------------
  let n: NotificacaoPagamento;
  try {
    n = adaptador.normalizar(pedido);
  } catch (erro) {
    if (erro instanceof PayloadInvalido) {
      await repo.abrirDivergencia({ tipo: 'SEM_OBRIGACAO', detalhe: { erro: erro.message } });
      // 400 e não 500: o pedido é que está mal formado. Devolver 500 faz a
      // operadora repetir indefinidamente um payload que nunca vai ser aceite.
      return { decisao: 'PAYLOAD_INVALIDO', estadoHttp: 400, detalhe: erro.message };
    }
    throw erro;
  }

  // ---- 3. Idempotência, ao nível da base de dados -----------------------
  const chave = chaveIdempotencia(n);
  if ((await repo.registarEvento(chave, pedido, true)) === 'DUPLICADO') {
    // 200 e não erro: para a operadora, um reenvio tem de parecer sucesso, ou
    // ela continua a repetir. A idempotência é nossa, não dela.
    return { decisao: 'DUPLICADO', estadoHttp: 200 };
  }

  const obrigacao = await repo.obrigacaoPorReferencia(n.referenciaInterna);
  if (!obrigacao) {
    await repo.abrirDivergencia({ tipo: 'SEM_OBRIGACAO', detalhe: { referencia: n.referenciaInterna, ...resumo(n) } });
    return { decisao: 'QUARENTENA_SEM_OBRIGACAO', estadoHttp: 202, detalhe: n.referenciaInterna };
  }

  if (n.tipo === 'REVERTIDO') return reverter(repo, n, obrigacao);
  if (n.tipo === 'FALHADO') {
    await repo.sinalRisco('PAGAMENTO_FALHADO', { obrigacaoId: obrigacao.id, ...resumo(n) });
    return { decisao: 'FALHA_REGISTADA', estadoHttp: 200, obrigacaoId: obrigacao.id };
  }

  // ---- 4. O montante do payload NUNCA é aceite --------------------------
  // Confronta-se com o que o servidor sabe ser devido. Sem isto, forjar um
  // valor no payload cria saldo do nada — e a assinatura, por si, não impede
  // um pagamento genuíno de 100 Kz de ser apresentado como 100.000 Kz se a
  // operadora alguma vez enviar um campo controlável pelo pagador.
  if (n.montanteKzAlegado !== obrigacao.montanteKz) {
    await repo.transitar(obrigacao.id, ['ALEGADO', 'PENDENTE_RECONCILIACAO'], 'QUARENTENA');
    await repo.abrirDivergencia({
      tipo: 'MONTANTE_DIFERE',
      obrigacaoId: obrigacao.id,
      detalhe: { esperado: obrigacao.montanteKz, alegado: n.montanteKzAlegado, ...resumo(n) },
    });
    // Numa kixikila a contribuição é fixa e igual para todos: um pagamento
    // parcial não é "meio pago", é um caso que precisa de decisão humana,
    // porque aceitar metade altera silenciosamente a ordem do rodízio.
    return { decisao: 'QUARENTENA_MONTANTE', estadoHttp: 202, obrigacaoId: obrigacao.id };
  }

  // ---- 5. Transição de estado -------------------------------------------
  const transitou = await repo.transitar(
    obrigacao.id,
    ['ALEGADO'],
    'PENDENTE_RECONCILIACAO',
    adaptador.canal,
  );
  if (!transitou) {
    // Já lá estava, ou já foi confirmada por um extracto que chegou primeiro.
    // Chegar aqui é normal e não é erro: os webhooks não chegam por ordem.
    return { decisao: 'JA_PENDENTE', estadoHttp: 200, obrigacaoId: obrigacao.id };
  }

  await repo.lancar(
    chave,
    'CONTRIBUICAO',
    n.ocorridoEm,
    lancamentosContribuicao({ ...obrigacao, canal: adaptador.canal }, true),
  );

  // Quem paga por conta de outro é legítimo e comum numa kixikila — o marido
  // paga pela mulher. Não se bloqueia, regista-se: em conjunto com outros
  // sinais é o que denuncia contas-fantasma controladas pela mesma pessoa.
  if (n.pagadorHash && n.pagadorHash !== hashEsperado(obrigacao)) {
    await repo.sinalRisco('PAGADOR_DIFERENTE_DO_DEVEDOR', {
      obrigacaoId: obrigacao.id,
      pagadorHash: n.pagadorHash,
    });
  }

  return { decisao: 'ACEITE_PENDENTE', estadoHttp: 200, obrigacaoId: obrigacao.id };
}

/**
 * Reversão (estorno da operadora). É o caso que mais frequentemente fica por
 * tratar nas integrações — e o único em que a plataforma pode ficar a dever
 * dinheiro real.
 */
async function reverter(
  repo: Repositorio,
  n: NotificacaoPagamento,
  obrigacao: Obrigacao,
): Promise<ResultadoWebhook> {
  if (obrigacao.estado === 'ALEGADO' || obrigacao.estado === 'ANULADO') {
    // Reverter algo que nunca chegámos a creditar. Não há nada a estornar,
    // mas é anómalo o suficiente para ficar registado.
    await repo.abrirDivergencia({
      tipo: 'REVERSAO_SEM_LIQUIDACAO',
      obrigacaoId: obrigacao.id,
      detalhe: { estado: obrigacao.estado, ...resumo(n) },
    });
    return { decisao: 'REVERSAO_IGNORADA', estadoHttp: 200, obrigacaoId: obrigacao.id };
  }

  // O razão é append-only: desfaz-se com lançamentos de sinal contrário, que
  // repõem a dívida do membro e retiram as comissões já reconhecidas.
  await repo.lancar(
    chaveIdempotencia(n),
    'ESTORNO',
    n.ocorridoEm,
    lancamentosEstorno(lancamentosContribuicao(obrigacao, true)),
  );
  await repo.transitar(obrigacao.id, ['PENDENTE_RECONCILIACAO', 'CONFIRMADO'], 'ANULADO');

  if (obrigacao.rodadaEntregueEm) {
    // O pior caso: o dinheiro já saiu para o beneficiário e a operadora
    // reverteu a entrada. O fundo do grupo fica curto e não há forma
    // automática de o repor — a app não tem custódia. Isto é uma dívida a
    // cobrar a uma pessoa concreta, com um humano a conduzir o processo.
    await repo.abrirDivergencia({
      tipo: 'REVERSAO_APOS_ENTREGA',
      obrigacaoId: obrigacao.id,
      detalhe: { entregueEm: obrigacao.rodadaEntregueEm.toISOString(), montanteKz: obrigacao.montanteKz, ...resumo(n) },
    });
    await repo.sinalRisco('REVERSAO_APOS_ENTREGA', { obrigacaoId: obrigacao.id, pontos: 90 });
    return { decisao: 'REVERSAO_APOS_ENTREGA', estadoHttp: 200, obrigacaoId: obrigacao.id };
  }

  return { decisao: 'ESTORNADO', estadoHttp: 200, obrigacaoId: obrigacao.id };
}

function resumo(n: NotificacaoPagamento) {
  return {
    operadora: n.operadora,
    referenciaExterna: n.referenciaExterna,
    montanteKzAlegado: n.montanteKzAlegado,
    tipo: n.tipo,
  };
}

/** Ponto de extensão: em produção compara com o telemovel_hash do devedor. */
function hashEsperado(obrigacao: Obrigacao): string {
  return `hash:${obrigacao.devedorId}`;
}
