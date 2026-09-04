// @ts-nocheck — importa `pg` dinamicamente, uma dependência opcional
// deliberadamente não instalada neste repositório partilhado (ver o
// comentário abaixo). `tsc --noEmit` corre sobre todo o repositório em CI e
// não tem como saber que este ficheiro está excluído do `vitest run`.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RepositorioPostgres, type PoolPg } from './repositorio-postgres.ts';

/**
 * Verificação do SQL de repositorio-postgres.ts contra um PostgreSQL real.
 *
 * EXCLUÍDO do `npx vitest run` da CI (ver vitest.config.ts) — a CI deste
 * repositório não tem um PostgreSQL disponível, e os testes de contrato em
 * repositorio-postgres.test.ts já cobrem a lógica com um cliente falso. Este
 * ficheiro existe para correr à mão sempre que o SQL mudar, porque um mock
 * nunca apanha um nome de coluna errado ou um tipo enum mal comparado — foi
 * assim que se encontraram e corrigiram dois bugs reais ao escrever isto
 * (grupo_id estava na tabela errada, e a comparação `estado = any($4::text[])`
 * não batia com a coluna `estado_pagamento`).
 *
 * Para correr:
 *   npm install pg --no-save
 *   # arrancar um PostgreSQL 16 vazio, escutando em PGHOST/PGPORT (ou socket)
 *   psql -f docs/kixidigital/schema.sql
 *   PGHOST=... PGPORT=... npx vitest run docs/kixidigital/kwik/repositorio-postgres.integration.test.ts
 *   npm uninstall pg --no-save
 *
 * Sem PGHOST definido, os testes são saltados — nunca falham por engano numa
 * máquina sem PostgreSQL.
 */

const activo = Boolean(process.env.PGHOST || process.env.PGSOCKET);

describe.runIf(activo)('RepositorioPostgres — SQL real contra PostgreSQL 16', () => {
  let pool: PoolPg;
  let idObrigacao: string;

  beforeAll(async () => {
    const { Pool } = await import('pg');
    pool = new Pool(
      process.env.PGSOCKET
        ? { host: process.env.PGSOCKET, user: 'dev', database: 'postgres' }
        : undefined,
    ) as unknown as PoolPg;

    const bruto = pool as unknown as { query(t: string, p?: unknown[]): Promise<{ rows: { id: string }[] }> };
    const utilizador = await bruto.query(
      `insert into utilizador (telemovel_hash, telemovel_ultimos, nome, nivel_kyc)
       values ('\\x01', '789', 'Dona Maria', 'NIVEL_1') returning id`,
    );
    const membro = await bruto.query(
      `insert into utilizador (telemovel_hash, telemovel_ultimos, nome, nivel_kyc)
       values ('\\x02', '654', 'João Baptista', 'NIVEL_0') returning id`,
    );
    const grupo = await bruto.query(
      `insert into grupo (nome, mae_id, contribuicao_kz, periodicidade_dias)
       values ('Mercado do Povo', $1, 2500000, 14) returning id`,
      [utilizador.rows[0]!.id],
    );
    const ciclo = await bruto.query(
      `insert into ciclo (grupo_id, numero, estado, hash_rodizio) values ($1, 1, 'ATIVO', '\\xAB') returning id`,
      [grupo.rows[0]!.id],
    );
    const rodada = await bruto.query(
      `insert into rodada (ciclo_id, posicao, beneficiario_id, abre_em, vence_em)
       values ($1, 1, $2, now(), now() + interval '7 days') returning id`,
      [ciclo.rows[0]!.id, utilizador.rows[0]!.id],
    );
    const obrigacao = await bruto.query(
      `insert into obrigacao (rodada_id, devedor_id, montante_kz, estado) values ($1, $2, 2500000, 'ALEGADO') returning id`,
      [rodada.rows[0]!.id, membro.rows[0]!.id],
    );
    idObrigacao = obrigacao.rows[0]!.id;
  });

  afterAll(async () => {
    await (pool as unknown as { end(): Promise<void> }).end();
  });

  it('lê e mapeia a obrigação, com o grupo vindo do ciclo (não da rodada)', async () => {
    const repo = new RepositorioPostgres(pool);
    const o = await repo.obrigacaoPorReferencia(idObrigacao);
    expect(o).toMatchObject({ montanteKz: 2_500_000, estado: 'ALEGADO' });
  });

  it('transita apenas quando o estado de origem bate, comparando o enum correctamente', async () => {
    const repo = new RepositorioPostgres(pool);
    expect(await repo.transitar(idObrigacao, ['ALEGADO'], 'PENDENTE_RECONCILIACAO', 'KWIK')).toBe(true);
    expect(await repo.transitar(idObrigacao, ['ALEGADO'], 'CONFIRMADO')).toBe(false);
  });

  it('regista eventos com idempotência real (índice único)', async () => {
    const repo = new RepositorioPostgres(pool);
    const pedido = { corpo: '{"a":1}', cabecalhos: {}, recebidoEm: new Date() };
    expect(await repo.registarEvento('KWIK:TXN-1:LIQUIDADO', pedido, true)).toBe('NOVO');
    expect(await repo.registarEvento('KWIK:TXN-1:LIQUIDADO', pedido, true)).toBe('DUPLICADO');
  });

  it('lancar() grava uma transação equilibrada dentro de begin/commit', async () => {
    const repo = new RepositorioPostgres(pool);
    await repo.lancar('KWIK:TXN-2:LIQUIDADO', 'CONTRIBUICAO', new Date(), [
      { conta: 'grupo:G1:fundo', montanteKz: 2_450_000 },
      { conta: 'plataforma:receita_taxa', montanteKz: 25_000 },
      { conta: 'mae:U1:comissao', montanteKz: 12_500 },
      { conta: 'operadora:KWIK:processamento', montanteKz: 12_500 },
      { conta: 'membro:U2:obrigacao', montanteKz: -2_500_000 },
    ]);
    const bruto = pool as unknown as { query(t: string, p?: unknown[]): Promise<{ rows: { s: string }[] }> };
    const saldo = await bruto.query("select coalesce(sum(montante_kz),0) as s from lancamento where conta='grupo:G1:fundo'");
    expect(Number(saldo.rows[0]!.s)).toBe(2_450_000);
  });

  it('lancar() faz rollback quando o schema rejeita um desequilíbrio, sem deixar a transação gravada', async () => {
    const repo = new RepositorioPostgres(pool);
    await expect(
      repo.lancar('KWIK:TXN-FRAUDE', 'CONTRIBUICAO', new Date(), [
        { conta: 'grupo:G1:fundo', montanteKz: 999_999 },
        { conta: 'membro:U2:obrigacao', montanteKz: -1 },
      ]),
    ).rejects.toThrow(/não fecha|desequilíbrio/i);

    const bruto = pool as unknown as { query(t: string, p?: unknown[]): Promise<{ rows: { n: string }[] }> };
    const contagem = await bruto.query("select count(*) as n from transacao where chave_idempotencia='KWIK:TXN-FRAUDE'");
    expect(Number(contagem.rows[0]!.n)).toBe(0);
  });
});
