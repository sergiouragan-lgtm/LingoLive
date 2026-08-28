import type {
  Canal, Divergencia, EstadoPagamento, Lancamento, Obrigacao, PedidoCru, Repositorio,
} from './contrato.ts';

/**
 * Implementação do Repositorio sobre PostgreSQL, contra o schema de
 * docs/kixidigital/schema.sql.
 *
 * Propositadamente NÃO importa o pacote `pg`: está tipada contra a forma
 * mínima de um cliente SQL (query parametrizada + transação por BEGIN/COMMIT),
 * que um `pg.Pool` ou `pg.PoolClient` já satisfazem estruturalmente. A
 * KixiDigital não faz parte do runtime do LingoLive — este ficheiro não deve
 * obrigar este repositório a instalar uma dependência que só serve um produto
 * diferente. Quando a KixiDigital tiver o seu próprio repositório e o seu
 * próprio package.json, `new PoolPostgres(pg.Pool)` funciona sem adaptador.
 */
export interface ClientePg {
  query<T = Record<string, unknown>>(texto: string, parametros?: unknown[]): Promise<{ rows: T[] }>;
}
export interface PoolPg extends ClientePg {
  connect(): Promise<ClientePg & { release(): void }>;
}

/** Código de erro do PostgreSQL para violação de constraint única (23505). */
const ERRO_UNIQUE_VIOLATION = '23505';

interface ErroPg { code?: string }
function ehViolacaoUnica(erro: unknown): boolean {
  return typeof erro === 'object' && erro !== null && (erro as ErroPg).code === ERRO_UNIQUE_VIOLATION;
}

export class RepositorioPostgres implements Repositorio {
  constructor(private readonly pool: PoolPg) {}

  async registarEvento(chave: string, pedido: PedidoCru, assinaturaValida: boolean): Promise<'NOVO' | 'DUPLICADO'> {
    try {
      await this.pool.query(
        `insert into evento_webhook (operadora, referencia_externa, corpo_cru, assinatura_valida, recebido_em)
         values ('KWIK', $1, $2::jsonb, $3, $4)`,
        [chave, corpoParaJson(pedido.corpo), assinaturaValida, pedido.recebidoEm],
      );
      return 'NOVO';
    } catch (erro) {
      if (ehViolacaoUnica(erro)) return 'DUPLICADO';
      throw erro;
    }
  }

  async obrigacaoPorReferencia(referenciaInterna: string): Promise<Obrigacao | null> {
    const r = await this.pool.query<{
      id: string; rodada_id: string; grupo_id: string; devedor_id: string; mae_id: string;
      montante_kz: string; estado: EstadoPagamento; canal: Canal | null; rodada_entregue_em: Date | null;
    }>(
      `select o.id, o.rodada_id, c.grupo_id, o.devedor_id, g.mae_id,
              o.montante_kz, o.estado, o.canal, r.entregue_em as rodada_entregue_em
         from obrigacao o
         join rodada r on r.id = o.rodada_id
         join ciclo  c on c.id = r.ciclo_id
         join grupo  g on g.id = c.grupo_id
        where o.id = $1`,
      [referenciaInterna],
    );
    const linha = r.rows[0];
    if (!linha) return null;
    return {
      id: linha.id, rodadaId: linha.rodada_id, grupoId: linha.grupo_id,
      devedorId: linha.devedor_id, maeId: linha.mae_id,
      montanteKz: Number(linha.montante_kz), estado: linha.estado, canal: linha.canal ?? undefined,
      rodadaEntregueEm: linha.rodada_entregue_em ?? undefined,
    };
  }

  /**
   * Transição condicional: só grava se o estado actual estiver em `de`.
   * A cláusula `estado = ANY($2)` faz da verificação e da escrita uma única
   * operação atómica — sem isto, duas transições concorrentes (o webhook e a
   * reconciliação a chegar ao mesmo tempo) podiam ambas ler "ALEGADO" antes de
   * qualquer uma escrever, e a segunda pisava silenciosamente a primeira.
   */
  async transitar(obrigacaoId: string, de: EstadoPagamento[], para: EstadoPagamento, canal?: Canal): Promise<boolean> {
    const r = await this.pool.query(
      `update obrigacao
          set estado = $1::estado_pagamento, canal = coalesce($2::canal_pagamento, canal),
              liquidada_em = case when $1::estado_pagamento = 'CONFIRMADO' then now() else liquidada_em end
        where id = $3 and estado = any($4::estado_pagamento[])`,
      [para, canal ?? null, obrigacaoId, de],
    );
    return (r as unknown as { rowCount: number }).rowCount > 0;
  }

  /**
   * Escreve a transação inteira num único BEGIN/COMMIT. A verificação de que
   * os lançamentos somam zero, a cadeia de hash e a chave de idempotência são
   * garantidas pelo próprio schema (constraint deferida, trigger e índice
   * único) — este método não reimplementa essas regras, confia nelas.
   */
  async lancar(chaveIdempotencia: string, tipo: string, ocorridoEm: Date, lancamentos: Lancamento[]): Promise<void> {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('begin');
      const t = await cliente.query<{ id: string }>(
        `insert into transacao (tipo, ocorrido_em, chave_idempotencia) values ($1, $2, $3) returning id`,
        [tipo, ocorridoEm, chaveIdempotencia],
      );
      const transacaoId = t.rows[0]!.id;
      for (const l of lancamentos) {
        await cliente.query(
          `insert into lancamento (transacao_id, conta, montante_kz) values ($1, $2, $3)`,
          [transacaoId, l.conta, l.montanteKz],
        );
      }
      await cliente.query('commit');
    } catch (erro) {
      await cliente.query('rollback');
      throw erro;
    } finally {
      cliente.release();
    }
  }

  async abrirDivergencia(d: Divergencia): Promise<void> {
    await this.pool.query(
      `insert into divergencia (tipo, obrigacao_id, detalhe) values ($1, $2, $3::jsonb)`,
      [d.tipo, d.obrigacaoId ?? null, JSON.stringify(d.detalhe)],
    );
  }

  async sinalRisco(regra: string, detalhe: Record<string, unknown>): Promise<void> {
    const utilizadorId = typeof detalhe.utilizadorId === 'string' ? detalhe.utilizadorId : null;
    const grupoId = typeof detalhe.grupoId === 'string' ? detalhe.grupoId : null;
    const pontos = typeof detalhe.pontos === 'number' ? detalhe.pontos : 10;
    await this.pool.query(
      `insert into sinal_risco (regra, utilizador_id, grupo_id, pontos, detalhe) values ($1, $2, $3, $4, $5::jsonb)`,
      [regra, utilizadorId, grupoId, pontos, JSON.stringify(detalhe)],
    );
  }
}

/** O corpo cru do webhook é guardado como JSONB para poder ser consultado; se não for JSON válido, guarda-se como string envolvida. */
function corpoParaJson(corpo: string): string {
  try {
    JSON.parse(corpo);
    return corpo;
  } catch {
    return JSON.stringify({ corpoNaoJson: corpo });
  }
}
