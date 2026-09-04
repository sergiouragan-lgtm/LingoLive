-- Testes de regressão das garantias do livro-razão.
-- Correr contra uma base limpa onde schema.sql já foi aplicado:
--   psql -v ON_ERROR_STOP=0 -f schema.sql -f schema_testes.sql
-- Esperado: T1 insere 5 lançamentos; T2, T3 e T4 falham com erro; T5 devolve "t".

\set ON_ERROR_STOP 0
-- ==== T1: transação equilibrada deve passar ====
begin;
  insert into transacao (id, tipo, ocorrido_em, chave_idempotencia)
    values ('11111111-1111-1111-1111-111111111111','CONTRIBUICAO', now(), 'KWIK:TXN-88213');
  insert into lancamento (transacao_id, conta, montante_kz) values
    ('11111111-1111-1111-1111-111111111111','grupo:G1:fundo',              2450000),
    ('11111111-1111-1111-1111-111111111111','plataforma:receita_taxa',       25000),
    ('11111111-1111-1111-1111-111111111111','mae:U7:comissao',               12500),
    ('11111111-1111-1111-1111-111111111111','operadora:KWIK:processamento',  12500),
    ('11111111-1111-1111-1111-111111111111','membro:U3:obrigacao',        -2500000);
commit;
select 'T1 equilibrada' as teste, count(*) as lancamentos from lancamento;

-- ==== T2: transação desequilibrada tem de rebentar no COMMIT ====
begin;
  insert into transacao (id, tipo, ocorrido_em, chave_idempotencia)
    values ('22222222-2222-2222-2222-222222222222','CONTRIBUICAO', now(), 'FRAUDE:1');
  insert into lancamento (transacao_id, conta, montante_kz) values
    ('22222222-2222-2222-2222-222222222222','grupo:G1:fundo',   2500000),
    ('22222222-2222-2222-2222-222222222222','membro:U3:obrigacao', -100);
commit;

-- ==== T3: UPDATE e DELETE no razão têm de rebentar ====
update lancamento set montante_kz = 999 where id = 1;
delete from lancamento where id = 1;

-- ==== T4: replay do mesmo webhook tem de colidir ====
insert into transacao (tipo, ocorrido_em, chave_idempotencia)
  values ('CONTRIBUICAO', now(), 'KWIK:TXN-88213');

-- ==== T5: cadeia de hash íntegra? ====
select 'T5 cadeia' as teste,
       bool_and(hash_anterior = esperado) as intacta
from (select hash_anterior,
             coalesce(lag(hash) over (order by id), '\x00'::bytea) as esperado
      from lancamento) c;

-- ==== T6: saldos ====
select conta, saldo(conta) as centimos from (select distinct conta from lancamento) c order by conta;
