import { describe, it, expect, beforeEach } from 'vitest';
import { assinar } from './assinatura.ts';
import { AdaptadorKWiK, PERFIL_POR_DEFEITO } from './adaptador-kwik.ts';
import { receberWebhook, chaveIdempotencia } from './webhook.ts';
import { reconciliar } from './reconciliacao.ts';
import { dividirContribuicao, lancamentosContribuicao } from './comissoes.ts';
import type {
  Divergencia, EstadoPagamento, Lancamento, Obrigacao, PedidoCru, Repositorio,
} from './contrato.ts';

const SEGREDO = 'segredo-de-teste';
const AGORA = new Date('2026-08-28T12:00:00Z');

const adaptador = new AdaptadorKWiK({ ...PERFIL_POR_DEFEITO, segredoWebhook: SEGREDO });

/** Repositório em memória com as mesmas garantias que o PostgreSQL impõe. */
class RepoMemoria implements Repositorio {
  eventos = new Set<string>();
  obrigacoes = new Map<string, Obrigacao>();
  razao: { chave: string; tipo: string; lancamentos: Lancamento[] }[] = [];
  divergencias: Divergencia[] = [];
  sinais: { regra: string; detalhe: unknown }[] = [];

  async registarEvento(chave: string) {
    if (this.eventos.has(chave)) return 'DUPLICADO' as const;
    this.eventos.add(chave);
    return 'NOVO' as const;
  }
  async obrigacaoPorReferencia(ref: string) {
    return this.obrigacoes.get(ref) ?? null;
  }
  async transitar(id: string, de: EstadoPagamento[], para: EstadoPagamento, canal?: Obrigacao['canal']) {
    const o = [...this.obrigacoes.values()].find((x) => x.id === id);
    if (!o || !de.includes(o.estado)) return false;
    o.estado = para;
    if (canal) o.canal = canal;
    return true;
  }
  async lancar(chave: string, tipo: string, _em: Date, lancamentos: Lancamento[]) {
    // Espelha a constraint deferida do schema: nada entra desequilibrado.
    const soma = lancamentos.reduce((s, l) => s + l.montanteKz, 0);
    if (soma !== 0) throw new Error(`Transação não fecha: desequilíbrio de ${soma}`);
    if (this.razao.some((r) => r.chave === chave)) throw new Error('chave de idempotência duplicada');
    this.razao.push({ chave, tipo, lancamentos });
  }
  async abrirDivergencia(d: Divergencia) { this.divergencias.push(d); }
  async sinalRisco(regra: string, detalhe: Record<string, unknown>) { this.sinais.push({ regra, detalhe }); }

  saldo(conta: string) {
    return this.razao.flatMap((r) => r.lancamentos).filter((l) => l.conta === conta)
      .reduce((s, l) => s + l.montanteKz, 0);
  }
}

function obrigacao(over: Partial<Obrigacao> = {}): Obrigacao {
  return {
    id: 'OBR-1', rodadaId: 'ROD-1', grupoId: 'G1', devedorId: 'U3', maeId: 'U7',
    montanteKz: 2_500_000, estado: 'ALEGADO', ...over,
  };
}

function pedido(payload: unknown, opcoes: { agora?: Date; segredo?: string } = {}): PedidoCru {
  const corpo = JSON.stringify(payload);
  const quando = opcoes.agora ?? AGORA;
  const { assinatura, carimbo } = assinar(corpo, opcoes.segredo ?? SEGREDO, quando);
  return {
    corpo,
    cabecalhos: { 'x-kwik-signature': assinatura, 'x-kwik-timestamp': carimbo },
    recebidoEm: quando,
  };
}

const liquidacao = (over: Record<string, unknown> = {}) => ({
  transaction_id: 'KWIK-TXN-88213',
  merchant_reference: 'OBR-1',
  amount: 25000,
  status: 'success',
  payer_msisdn_hash: 'hash:U3',
  occurred_at: AGORA.toISOString(),
  ...over,
});

let repo: RepoMemoria;
beforeEach(() => {
  repo = new RepoMemoria();
  repo.obrigacoes.set('OBR-1', obrigacao());
});

describe('divisão de comissões', () => {
  it('divide 25.000 Kz como especificado', () => {
    expect(dividirContribuicao(2_500_000, true)).toEqual({
      fundoGrupo: 2_450_000, plataforma: 25_000, mae: 12_500, operadora: 12_500,
    });
  });

  it('não cobra comissão sobre numerário', () => {
    expect(dividirContribuicao(2_500_000, false)).toEqual({
      fundoGrupo: 2_500_000, plataforma: 0, mae: 0, operadora: 0,
    });
  });

  it('fecha sempre em zero, incluindo em valores que não dividem certo', () => {
    // O caso que parte implementações ingénuas: arredondar cada parcela à parte
    // deixa cêntimos órfãos e a transação é rejeitada pelo razão.
    for (let montante = 1; montante <= 5000; montante++) {
      const d = dividirContribuicao(montante, true);
      expect(d.fundoGrupo + d.plataforma + d.mae + d.operadora).toBe(montante);
      expect(d.fundoGrupo).toBeGreaterThan(0);
      for (const parcela of [d.plataforma, d.mae, d.operadora]) {
        expect(Number.isInteger(parcela)).toBe(true);
        expect(parcela).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('produz lançamentos de partida dobrada que somam zero', () => {
    const linhas = lancamentosContribuicao(obrigacao({ canal: 'KWIK' }), true);
    expect(linhas.reduce((s, l) => s + l.montanteKz, 0)).toBe(0);
  });

  it('recusa montantes não inteiros', () => {
    expect(() => dividirContribuicao(2500.5, true)).toThrow(RangeError);
  });
});

describe('assinatura do webhook', () => {
  it('aceita uma assinatura válida', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao()), AGORA);
    expect(r.decisao).toBe('ACEITE_PENDENTE');
  });

  it('recusa assinatura forjada e não toca no razão', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao(), { segredo: 'errado' }), AGORA);
    expect(r).toMatchObject({ decisao: 'ASSINATURA_INVALIDA', estadoHttp: 401, detalhe: 'HMAC_NAO_BATE' });
    expect(repo.razao).toHaveLength(0);
    expect(repo.sinais[0]?.regra).toBe('WEBHOOK_ASSINATURA_INVALIDA');
  });

  it('recusa um callback capturado e reenviado horas depois', async () => {
    const antigo = pedido(liquidacao(), { agora: new Date('2026-08-28T09:00:00Z') });
    const r = await receberWebhook(adaptador, repo, antigo, AGORA);
    expect(r.detalhe).toBe('FORA_DA_JANELA');
  });

  it('recusa pedido sem cabeçalhos de assinatura', async () => {
    const cru: PedidoCru = { corpo: JSON.stringify(liquidacao()), cabecalhos: {}, recebidoEm: AGORA };
    const r = await receberWebhook(adaptador, repo, cru, AGORA);
    expect(r.detalhe).toBe('CABECALHO_AUSENTE');
  });
});

describe('idempotência', () => {
  it('trata o reenvio do mesmo callback como sucesso sem duplicar o lançamento', async () => {
    const p = pedido(liquidacao());
    expect((await receberWebhook(adaptador, repo, p, AGORA)).decisao).toBe('ACEITE_PENDENTE');
    const segundo = await receberWebhook(adaptador, repo, p, AGORA);

    expect(segundo).toMatchObject({ decisao: 'DUPLICADO', estadoHttp: 200 });
    expect(repo.razao).toHaveLength(1);
    expect(repo.saldo('grupo:G1:fundo')).toBe(2_450_000);
  });

  it('distingue a liquidação da reversão com a mesma referência', () => {
    const base = { operadora: 'KWIK' as const, referenciaExterna: 'KWIK-TXN-88213' };
    expect(chaveIdempotencia({ ...base, tipo: 'LIQUIDADO' }))
      .not.toBe(chaveIdempotencia({ ...base, tipo: 'REVERTIDO' }));
  });
});

describe('o montante do payload nunca é aceite', () => {
  it('põe em quarentena quando o valor não bate com a obrigação', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao({ amount: 100000 })), AGORA);

    expect(r.decisao).toBe('QUARENTENA_MONTANTE');
    expect(repo.obrigacoes.get('OBR-1')!.estado).toBe('QUARENTENA');
    expect(repo.razao).toHaveLength(0);
    expect(repo.divergencias[0]).toMatchObject({
      tipo: 'MONTANTE_DIFERE', detalhe: { esperado: 2_500_000, alegado: 10_000_000 },
    });
  });

  it('põe em quarentena um pagamento parcial em vez de o creditar', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao({ amount: 12500 })), AGORA);
    expect(r.decisao).toBe('QUARENTENA_MONTANTE');
    expect(repo.razao).toHaveLength(0);
  });
});

describe('payloads mal formados', () => {
  it('devolve 400 e não 500, para a operadora não repetir para sempre', async () => {
    const r = await receberWebhook(adaptador, repo, pedido({ transaction_id: 'X' }), AGORA);
    expect(r).toMatchObject({ decisao: 'PAYLOAD_INVALIDO', estadoHttp: 400 });
  });

  it('não trata um estado desconhecido como sucesso', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao({ status: 'partially_settled' })), AGORA);
    expect(r.decisao).toBe('PAYLOAD_INVALIDO');
    expect(repo.razao).toHaveLength(0);
  });

  it('recusa um montante com precisão inferior ao cêntimo', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao({ amount: 250.005 })), AGORA);
    expect(r.decisao).toBe('PAYLOAD_INVALIDO');
  });

  it('aceita montante decimal em texto, como "25000.00"', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao({ amount: '25000.00' })), AGORA);
    expect(r.decisao).toBe('ACEITE_PENDENTE');
  });
});

describe('referência desconhecida', () => {
  it('não credita nada quando a obrigação não existe', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao({ merchant_reference: 'OBR-999' })), AGORA);
    expect(r.decisao).toBe('QUARENTENA_SEM_OBRIGACAO');
    expect(repo.razao).toHaveLength(0);
    expect(repo.divergencias[0]?.tipo).toBe('SEM_OBRIGACAO');
  });
});

describe('reversões', () => {
  it('estorna com lançamentos de sinal contrário, sem apagar nada', async () => {
    await receberWebhook(adaptador, repo, pedido(liquidacao()), AGORA);
    const r = await receberWebhook(
      adaptador, repo,
      pedido(liquidacao({ transaction_id: 'KWIK-TXN-88213', status: 'reversed' })),
      AGORA,
    );

    expect(r.decisao).toBe('ESTORNADO');
    expect(repo.razao).toHaveLength(2);
    expect(repo.razao[1]!.tipo).toBe('ESTORNO');
    expect(repo.saldo('grupo:G1:fundo')).toBe(0);
    expect(repo.saldo('plataforma:receita_taxa')).toBe(0);
    expect(repo.saldo('membro:U3:obrigacao')).toBe(0); // a dívida volta
    expect(repo.obrigacoes.get('OBR-1')!.estado).toBe('ANULADO');
  });

  it('escala quando a reversão chega depois de a kixikila já ter sido entregue', async () => {
    await receberWebhook(adaptador, repo, pedido(liquidacao()), AGORA);
    repo.obrigacoes.get('OBR-1')!.rodadaEntregueEm = new Date('2026-08-28T13:00:00Z');

    const r = await receberWebhook(adaptador, repo, pedido(liquidacao({ status: 'chargeback' })), AGORA);

    expect(r.decisao).toBe('REVERSAO_APOS_ENTREGA');
    expect(repo.divergencias.map((d) => d.tipo)).toContain('REVERSAO_APOS_ENTREGA');
    expect(repo.sinais.some((s) => s.regra === 'REVERSAO_APOS_ENTREGA')).toBe(true);
  });

  it('regista, sem estornar, uma reversão sobre algo que nunca foi creditado', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao({ status: 'reversed' })), AGORA);
    expect(r.decisao).toBe('REVERSAO_IGNORADA');
    expect(repo.razao).toHaveLength(0);
    expect(repo.divergencias[0]?.tipo).toBe('REVERSAO_SEM_LIQUIDACAO');
  });
});

describe('sinais de risco', () => {
  it('regista quando quem paga não é o devedor, sem bloquear o pagamento', async () => {
    const r = await receberWebhook(adaptador, repo, pedido(liquidacao({ payer_msisdn_hash: 'hash:U9' })), AGORA);
    expect(r.decisao).toBe('ACEITE_PENDENTE');
    expect(repo.sinais.some((s) => s.regra === 'PAGADOR_DIFERENTE_DO_DEVEDOR')).toBe(true);
  });
});

describe('reconciliação a três fontes', () => {
  const pendente = {
    obrigacaoId: 'OBR-1', referenciaExterna: 'KWIK-TXN-88213',
    montanteKz: 2_500_000, desde: new Date('2026-08-28T10:00:00Z'),
  };

  beforeEach(() => { repo.obrigacoes.set('OBR-1', obrigacao({ estado: 'PENDENTE_RECONCILIACAO' })); });

  it('só o extracto promove a CONFIRMADO', async () => {
    const extracto = adaptador.importarExtracto(
      'transaction_id,amount,settled_at\nKWIK-TXN-88213,25000,2026-08-28T12:05:00Z',
    );
    const r = await reconciliar(repo, 'KWIK', [pendente], extracto, AGORA);

    expect(r.confirmadas).toEqual(['OBR-1']);
    expect(repo.obrigacoes.get('OBR-1')!.estado).toBe('CONFIRMADO');
    expect(r.divergencias).toHaveLength(0);
  });

  it('não abre divergência enquanto a liquidação ainda pode chegar', async () => {
    const r = await reconciliar(repo, 'KWIK', [pendente], [], AGORA);
    expect(r.divergencias).toHaveLength(0);
    expect(repo.obrigacoes.get('OBR-1')!.estado).toBe('PENDENTE_RECONCILIACAO');
  });

  it('abre SEM_EXTRACTO passadas 48 horas', async () => {
    const r = await reconciliar(repo, 'KWIK', [pendente], [], new Date('2026-08-31T12:00:00Z'));
    expect(r.divergencias[0]).toMatchObject({ tipo: 'SEM_EXTRACTO', obrigacaoId: 'OBR-1' });
  });

  it('apanha dinheiro liquidado cujo webhook se perdeu', async () => {
    const extracto = adaptador.importarExtracto('KWIK-TXN-OUTRO,25000,2026-08-28T12:05:00Z');
    const r = await reconciliar(repo, 'KWIK', [], extracto, AGORA);
    expect(r.divergencias[0]).toMatchObject({
      tipo: 'SEM_WEBHOOK', detalhe: { referenciaExterna: 'KWIK-TXN-OUTRO' },
    });
  });

  it('põe em quarentena quando o extracto discorda do nosso valor', async () => {
    const extracto = adaptador.importarExtracto('KWIK-TXN-88213,24000,2026-08-28T12:05:00Z');
    const r = await reconciliar(repo, 'KWIK', [pendente], extracto, AGORA);

    expect(r.divergencias[0]).toMatchObject({ tipo: 'MONTANTE_DIFERE' });
    expect(repo.obrigacoes.get('OBR-1')!.estado).toBe('QUARENTENA');
  });
});
