import { describe, it, expect, vi } from 'vitest';
import { RepositorioPostgres, type PoolPg } from './repositorio-postgres.ts';

/**
 * Testes de contrato: não tocam em PostgreSQL. Verificam que cada método
 * emite o SQL e os parâmetros certos — em particular, que nada concatena
 * valores directamente no texto da query (injecção de SQL) e que
 * `transitar` faz da verificação e da escrita uma única operação atómica.
 *
 * A prova de que este SQL corre correctamente contra o schema real fica em
 * repositorio-postgres.integration.test.ts, corrido manualmente contra um
 * PostgreSQL — ver esse ficheiro para o porquê de não fazer parte do
 * `npx vitest run` da CI.
 */

function poolFalso(respostas: Record<string, unknown> = {}) {
  const chamadas: { texto: string; parametros: unknown[] }[] = [];
  const query = vi.fn(async (texto: string, parametros: unknown[] = []) => {
    chamadas.push({ texto, parametros });
    const chave = Object.keys(respostas).find((k) => texto.includes(k));
    return (chave ? respostas[chave] : { rows: [] }) as { rows: unknown[] };
  });
  const pool = {
    query,
    connect: vi.fn(async () => ({ query, release: vi.fn() })),
  } as unknown as PoolPg;
  return { pool, chamadas, query };
}

describe('registarEvento', () => {
  it('devolve NOVO e insere na tabela de eventos', async () => {
    const { pool, chamadas } = poolFalso();
    const repo = new RepositorioPostgres(pool);
    const r = await repo.registarEvento('KWIK:TXN-1:LIQUIDADO', { corpo: '{}', cabecalhos: {}, recebidoEm: new Date() }, true);

    expect(r).toBe('NOVO');
    expect(chamadas[0]!.texto).toMatch(/insert into evento_webhook/i);
    expect(chamadas[0]!.parametros).toEqual(['KWIK:TXN-1:LIQUIDADO', '{}', true, expect.any(Date)]);
  });

  it('devolve DUPLICADO quando a base rejeita por chave repetida (23505)', async () => {
    const pool = {
      query: vi.fn(async () => { throw Object.assign(new Error('duplicado'), { code: '23505' }); }),
      connect: vi.fn(),
    } as unknown as PoolPg;
    const repo = new RepositorioPostgres(pool);
    const r = await repo.registarEvento('X', { corpo: '{}', cabecalhos: {}, recebidoEm: new Date() }, true);
    expect(r).toBe('DUPLICADO');
  });

  it('propaga qualquer outro erro da base de dados', async () => {
    const pool = {
      query: vi.fn(async () => { throw new Error('ligação perdida'); }),
      connect: vi.fn(),
    } as unknown as PoolPg;
    const repo = new RepositorioPostgres(pool);
    await expect(repo.registarEvento('X', { corpo: '{}', cabecalhos: {}, recebidoEm: new Date() }, true))
      .rejects.toThrow('ligação perdida');
  });
});

describe('obrigacaoPorReferencia', () => {
  it('devolve null quando não existe', async () => {
    const { pool } = poolFalso();
    const repo = new RepositorioPostgres(pool);
    expect(await repo.obrigacaoPorReferencia('OBR-999')).toBeNull();
  });

  it('mapeia a linha para o formato do núcleo, incluindo o montante como número', async () => {
    const { pool } = poolFalso({
      'select o.id': {
        rows: [{
          id: 'OBR-1', rodada_id: 'ROD-1', grupo_id: 'G1', devedor_id: 'U3', mae_id: 'U7',
          montante_kz: '2500000', estado: 'ALEGADO', canal: null, rodada_entregue_em: null,
        }],
      },
    });
    const repo = new RepositorioPostgres(pool);
    const o = await repo.obrigacaoPorReferencia('OBR-1');
    expect(o).toEqual({
      id: 'OBR-1', rodadaId: 'ROD-1', grupoId: 'G1', devedorId: 'U3', maeId: 'U7',
      montanteKz: 2_500_000, estado: 'ALEGADO', canal: undefined, rodadaEntregueEm: undefined,
    });
  });
});

describe('transitar', () => {
  it('verifica o estado actual e escreve na mesma instrução SQL', async () => {
    const { pool, chamadas } = poolFalso({ 'update obrigacao': { rowCount: 1 } as never });
    const repo = new RepositorioPostgres(pool);
    const ok = await repo.transitar('OBR-1', ['ALEGADO'], 'PENDENTE_RECONCILIACAO', 'KWIK');

    expect(ok).toBe(true);
    expect(chamadas[0]!.texto).toMatch(/update obrigacao/i);
    expect(chamadas[0]!.texto).toMatch(/estado = any\(\$4/i);
    expect(chamadas[0]!.parametros).toEqual(['PENDENTE_RECONCILIACAO', 'KWIK', 'OBR-1', ['ALEGADO']]);
  });

  it('devolve false quando nenhuma linha bate com os estados de origem', async () => {
    const { pool } = poolFalso({ 'update obrigacao': { rowCount: 0 } as never });
    const repo = new RepositorioPostgres(pool);
    expect(await repo.transitar('OBR-1', ['CONFIRMADO'], 'ANULADO')).toBe(false);
  });
});

describe('lancar', () => {
  it('envolve os lançamentos em begin/commit no mesmo cliente', async () => {
    const chamadas: string[] = [];
    const cliente = {
      query: vi.fn(async (texto: string) => {
        chamadas.push(texto.trim().split('\n')[0]!.trim());
        if (/insert into transacao/i.test(texto)) return { rows: [{ id: 'TX-1' }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const pool = { query: vi.fn(), connect: vi.fn(async () => cliente) } as unknown as PoolPg;
    const repo = new RepositorioPostgres(pool);

    await repo.lancar('KWIK:TXN-1:LIQUIDADO', 'CONTRIBUICAO', new Date(), [
      { conta: 'grupo:G1:fundo', montanteKz: 2_450_000 },
      { conta: 'membro:U3:obrigacao', montanteKz: -2_450_000 },
    ]);

    expect(chamadas[0]).toBe('begin');
    expect(chamadas.filter((c) => /insert into lancamento/i.test(c))).toHaveLength(2);
    expect(chamadas.at(-1)).toBe('commit');
    expect(cliente.release).toHaveBeenCalledOnce();
  });

  it('faz rollback e liberta o cliente quando um INSERT falha', async () => {
    const cliente = {
      query: vi.fn(async (texto: string) => {
        if (/insert into transacao/i.test(texto)) return { rows: [{ id: 'TX-1' }] };
        if (/insert into lancamento/i.test(texto)) throw new Error('desequilíbrio: constraint deferida falhou');
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const pool = { query: vi.fn(), connect: vi.fn(async () => cliente) } as unknown as PoolPg;
    const repo = new RepositorioPostgres(pool);

    await expect(repo.lancar('X', 'CONTRIBUICAO', new Date(), [{ conta: 'a', montanteKz: 1 }]))
      .rejects.toThrow('desequilíbrio');

    expect(cliente.query).toHaveBeenCalledWith('rollback');
    expect(cliente.release).toHaveBeenCalledOnce();
  });
});

describe('abrirDivergencia e sinalRisco', () => {
  it('serializa o detalhe como JSON', async () => {
    const { pool, chamadas } = poolFalso();
    const repo = new RepositorioPostgres(pool);
    await repo.abrirDivergencia({ tipo: 'MONTANTE_DIFERE', obrigacaoId: 'OBR-1', detalhe: { esperado: 1, alegado: 2 } });

    expect(chamadas[0]!.parametros).toEqual(['MONTANTE_DIFERE', 'OBR-1', '{"esperado":1,"alegado":2}']);
  });

  it('usa 10 pontos por defeito quando a regra não especifica', async () => {
    const { pool, chamadas } = poolFalso();
    const repo = new RepositorioPostgres(pool);
    await repo.sinalRisco('PAGADOR_DIFERENTE_DO_DEVEDOR', { obrigacaoId: 'OBR-1' });

    expect(chamadas[0]!.parametros).toEqual(['PAGADOR_DIFERENTE_DO_DEVEDOR', null, null, 10, '{"obrigacaoId":"OBR-1"}']);
  });
});
