import { verificarHmac } from './assinatura.ts';
import {
  PayloadInvalido,
  type AdaptadorOperadora,
  type Canal,
  type CobrancaIniciada,
  type LinhaExtracto,
  type NotificacaoPagamento,
  type PedidoCobranca,
  type PedidoCru,
  type ResultadoAssinatura,
} from './contrato.ts';

/**
 * ADAPTADOR KWiK
 * ==============================================================
 * ATENÇÃO — este ficheiro contém SUPOSIÇÕES por confirmar.
 *
 * Não foi possível verificar a documentação de parceiro da KWiK. Tudo o que
 * depende dela está isolado aqui e marcado com «SUPOSIÇÃO», precisamente para
 * que a confirmação com a operadora seja uma edição a este ficheiro e a mais
 * nenhum. O núcleo (webhook.ts, reconciliacao.ts, comissoes.ts) não contém
 * nenhuma suposição sobre a KWiK e não precisa de mudar.
 *
 * O que perguntar à KWiK, por ordem de impacto — cada resposta corresponde a
 * um campo do PerfilKWiK abaixo:
 *
 *  1. Esquema de assinatura do webhook: HMAC-SHA256? Que cabeçalhos? O carimbo
 *     entra no valor assinado? (Se NÃO entrar, exigir que passe a entrar ou
 *     assumir risco de repetição.)
 *  2. Existe reversão/estorno após liquidação, e é notificada? Em que prazo?
 *     Esta é a pergunta mais importante do ponto de vista financeiro.
 *  3. Formato e periodicidade do extracto de liquidação. Sem extracto não há
 *     reconciliação, e o webhook passa a ser prova — o que não queremos.
 *  4. Unidade monetária do payload: kwanzas ou cêntimos? Inteiro ou decimal?
 *  5. Garantias de entrega: repetição em caso de erro, ordem, janela.
 *  6. Deep link de cobrança e limites por transacção e por dia.
 *  7. Ambiente de testes com credenciais próprias.
 * ==============================================================
 */

export interface PerfilKWiK {
  segredoWebhook: string;
  cabecalhoAssinatura: string;
  cabecalhoCarimbo: string;
  /** true se o payload traz kwanzas (multiplicamos por 100); false se já vem em cêntimos. */
  montanteEmKwanzas: boolean;
  urlBase: string;
  janelaMs?: number;
}

/** SUPOSIÇÃO — valores por defeito plausíveis, a substituir pelo perfil real. */
export const PERFIL_POR_DEFEITO: Omit<PerfilKWiK, 'segredoWebhook'> = {
  cabecalhoAssinatura: 'x-kwik-signature',
  cabecalhoCarimbo: 'x-kwik-timestamp',
  montanteEmKwanzas: true,
  urlBase: 'https://api.kwik.ao/v1',
};

/** SUPOSIÇÃO — forma do callback. */
interface PayloadKWiK {
  transaction_id?: string;
  merchant_reference?: string;
  amount?: number | string;
  status?: string;
  payer_msisdn_hash?: string | null;
  occurred_at?: string;
}

/** SUPOSIÇÃO — vocabulário de estados. Mapeado, nunca usado em bruto. */
const ESTADOS: Record<string, NotificacaoPagamento['tipo']> = {
  success: 'LIQUIDADO',
  completed: 'LIQUIDADO',
  settled: 'LIQUIDADO',
  reversed: 'REVERTIDO',
  refunded: 'REVERTIDO',
  chargeback: 'REVERTIDO',
  failed: 'FALHADO',
  declined: 'FALHADO',
  cancelled: 'FALHADO',
};

export class AdaptadorKWiK implements AdaptadorOperadora {
  readonly canal: Canal = 'KWIK';

  constructor(private readonly perfil: PerfilKWiK) {}

  verificarAssinatura(pedido: PedidoCru, agora: Date): ResultadoAssinatura {
    return verificarHmac(pedido, agora, {
      segredo: this.perfil.segredoWebhook,
      cabecalhoAssinatura: this.perfil.cabecalhoAssinatura,
      cabecalhoCarimbo: this.perfil.cabecalhoCarimbo,
      janelaMs: this.perfil.janelaMs,
    });
  }

  normalizar(pedido: PedidoCru): NotificacaoPagamento {
    let p: PayloadKWiK;
    try {
      p = JSON.parse(pedido.corpo) as PayloadKWiK;
    } catch {
      throw new PayloadInvalido('corpo', 'não é JSON válido');
    }

    if (!p.transaction_id) throw new PayloadInvalido('transaction_id', 'ausente');
    if (!p.merchant_reference) throw new PayloadInvalido('merchant_reference', 'ausente');

    const tipo = ESTADOS[String(p.status ?? '').toLowerCase()];
    if (!tipo) {
      // Estado desconhecido nunca é tratado como sucesso. Se a KWiK acrescentar
      // um estado novo, o pagamento fica em análise em vez de ser creditado.
      throw new PayloadInvalido('status', `estado desconhecido: ${String(p.status)}`);
    }

    return {
      operadora: 'KWIK',
      referenciaExterna: String(p.transaction_id),
      referenciaInterna: String(p.merchant_reference),
      montanteKzAlegado: this.paraCentimos(p.amount),
      pagadorHash: p.payer_msisdn_hash ?? null,
      ocorridoEm: p.occurred_at ? new Date(p.occurred_at) : pedido.recebidoEm,
      tipo,
    };
  }

  /**
   * Conversão para cêntimos inteiros. O ponto delicado: aceitar "250.00" ou
   * 250.5 e converter sem erro de vírgula flutuante. Math.round sobre o
   * produto resolve os casos reais (2 casas decimais); um valor com mais
   * precisão do que um cêntimo é recusado em vez de silenciosamente truncado.
   */
  private paraCentimos(valor: number | string | undefined): number {
    if (valor === undefined || valor === null || valor === '') {
      throw new PayloadInvalido('amount', 'ausente');
    }
    const n = typeof valor === 'string' ? Number(valor.replace(',', '.')) : valor;
    if (!Number.isFinite(n) || n < 0) throw new PayloadInvalido('amount', `valor inválido: ${valor}`);

    if (!this.perfil.montanteEmKwanzas) {
      if (!Number.isInteger(n)) throw new PayloadInvalido('amount', 'cêntimos têm de ser inteiros');
      return n;
    }
    const centimos = Math.round(n * 100);
    if (Math.abs(n * 100 - centimos) > 1e-6) {
      throw new PayloadInvalido('amount', `precisão inferior ao cêntimo: ${valor}`);
    }
    return centimos;
  }

  /** SUPOSIÇÃO — extracto em CSV. Colunas: referência, montante, data. */
  importarExtracto(conteudo: string): LinhaExtracto[] {
    const linhas = conteudo.trim().split('\n');
    const dados = linhas[0]?.toLowerCase().includes('transaction') ? linhas.slice(1) : linhas;
    return dados
      .filter((l) => l.trim() !== '')
      .map((linha, i) => {
        const [ref, montante, data] = linha.split(',').map((c) => c.trim());
        if (!ref || !montante || !data) {
          throw new PayloadInvalido(`extracto:linha:${i + 1}`, 'colunas em falta');
        }
        return {
          operadora: 'KWIK' as const,
          referenciaExterna: ref,
          montanteKz: this.paraCentimos(montante),
          liquidadoEm: new Date(data),
        };
      });
  }

  /** SUPOSIÇÃO — contrato da API de cobrança. */
  async iniciarCobranca(pedido: PedidoCobranca): Promise<CobrancaIniciada> {
    const resposta = await fetch(`${this.perfil.urlBase}/charges`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Chave de idempotência do NOSSO lado: se a rede falhar e repetirmos o
        // pedido, a operadora não pode criar duas cobranças ao mesmo membro.
        'idempotency-key': `kixi:${pedido.obrigacaoId}`,
      },
      body: JSON.stringify({
        amount: this.perfil.montanteEmKwanzas ? pedido.montanteKz / 100 : pedido.montanteKz,
        merchant_reference: pedido.obrigacaoId,
        msisdn: pedido.telemovelPagador,
        description: pedido.descricao,
      }),
    });

    if (!resposta.ok) {
      throw new Error(`KWiK recusou a cobrança: ${resposta.status} ${await resposta.text()}`);
    }
    const corpo = (await resposta.json()) as { transaction_id: string; deep_link: string; expires_at: string };
    return {
      referenciaExterna: corpo.transaction_id,
      ligacao: corpo.deep_link,
      expiraEm: new Date(corpo.expires_at),
    };
  }
}
