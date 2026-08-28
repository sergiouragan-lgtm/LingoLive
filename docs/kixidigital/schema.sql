-- =====================================================================
-- KixiDigital — livro-razão anti-fraude (PostgreSQL 15+)
--
-- Princípio: a plataforma é NOTÁRIO, não banco. Nunca guarda dinheiro de
-- membros; regista, prova e reconcilia movimentos entre terceiros.
--
-- Três garantias forçadas pelo schema, não pelo código de aplicação:
--   1. Partida dobrada — cada transação soma exactamente zero.
--   2. Append-only — nada se altera nem se apaga; corrige-se por estorno.
--   3. Cadeia de hash — qualquer edição retroactiva no SQL quebra a cadeia,
--      inclusive feita por quem tem acesso directo à base de dados.
--
-- Montantes em CÊNTIMOS de kwanza (bigint). Nunca float.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type canal_pagamento   as enum ('KWIK','UNITEL_MONEY','MULTICAIXA_EXPRESS','DINHEIRO');
create type estado_pagamento  as enum ('ALEGADO','PENDENTE_RECONCILIACAO','CONFIRMADO','QUARENTENA','ANULADO');
create type nivel_kyc         as enum ('NIVEL_0','NIVEL_1','NIVEL_2');
create type estado_ciclo      as enum ('RASCUNHO','ABERTO','ATIVO','CONCLUIDO','DISSOLVIDO','CONGELADO');
create type papel_membro      as enum ('MAE','MEMBRO');

-- ---------------------------------------------------------------------
-- Identidade
-- ---------------------------------------------------------------------
create table utilizador (
  id                uuid primary key default gen_random_uuid(),
  telemovel_hash    bytea       not null unique,   -- HMAC(telemóvel, pepper). Nunca em claro.
  telemovel_ultimos char(3)     not null,          -- só para a UI: "…789"
  nome              text        not null,
  nivel_kyc         nivel_kyc   not null default 'NIVEL_0',
  nif               text,                          -- exigido no NIVEL_2 (comissões, AGT)
  iban_hash         bytea,                         -- comparável entre contas sem expor o IBAN
  criado_em         timestamptz not null default now(),
  bloqueado_em      timestamptz,
  motivo_bloqueio   text,
  -- Um NIVEL_2 sem NIF/IBAN não pode existir: é o nível que recebe comissão.
  constraint kyc2_exige_fiscais check (nivel_kyc <> 'NIVEL_2' or (nif is not null and iban_hash is not null))
);

-- Limite por nível de KYC, aplicado no fecho de cada obrigação.
create table limite_kyc (
  nivel              nivel_kyc primary key,
  max_por_ciclo_kz   bigint not null,
  max_mensal_kz      bigint not null
);
insert into limite_kyc values
  ('NIVEL_0',   5000000,  10000000),   --  50.000 Kz / 100.000 Kz
  ('NIVEL_1',  50000000, 150000000),   -- 500.000 Kz / 1.500.000 Kz
  ('NIVEL_2', 999999999999, 999999999999);

-- Vinculação de dispositivo: base da detecção de SIM swap e de contas-fantasma.
create table dispositivo (
  id                uuid primary key default gen_random_uuid(),
  utilizador_id     uuid not null references utilizador(id),
  impressao_digital bytea not null,                -- fingerprint estável do aparelho
  primeiro_visto    timestamptz not null default now(),
  ultimo_visto      timestamptz not null default now(),
  confiavel_a_partir_de timestamptz,               -- null = ainda em arrefecimento (48h)
  unique (utilizador_id, impressao_digital)
);
-- Quantos utilizadores partilham o mesmo aparelho? >3 é sinal de sybil.
create index idx_dispositivo_fp on dispositivo (impressao_digital);

-- ---------------------------------------------------------------------
-- Grupo, ciclo e rodízio
-- ---------------------------------------------------------------------
create table grupo (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null,
  mae_id             uuid not null references utilizador(id),
  contribuicao_kz    bigint not null check (contribuicao_kz > 0),
  periodicidade_dias smallint not null check (periodicidade_dias between 1 and 90),
  criado_em          timestamptz not null default now()
);

create table ciclo (
  id            uuid primary key default gen_random_uuid(),
  grupo_id      uuid not null references grupo(id),
  numero        int  not null,
  estado        estado_ciclo not null default 'RASCUNHO',
  iniciado_em   timestamptz,
  -- Selo do rodízio: SHA-256 da ordem acordada, calculado no arranque e
  -- mostrado a todos os membros na app. Reordenar exige novo ciclo com quórum.
  hash_rodizio  bytea,
  aprovado_por  int not null default 0,            -- nº de membros que aprovaram a ordem
  unique (grupo_id, numero),
  constraint ativo_exige_selo check (estado <> 'ATIVO' or hash_rodizio is not null)
);

create table membro_ciclo (
  ciclo_id      uuid not null references ciclo(id),
  utilizador_id uuid not null references utilizador(id),
  papel         papel_membro not null default 'MEMBRO',
  posicao       int not null check (posicao > 0),  -- ordem de recebimento
  aderiu_em     timestamptz not null default now(),
  primary key (ciclo_id, utilizador_id),
  -- Duas pessoas nunca ocupam a mesma vez no rodízio.
  unique (ciclo_id, posicao)
);

create table rodada (
  id               uuid primary key default gen_random_uuid(),
  ciclo_id         uuid not null references ciclo(id),
  posicao          int  not null,
  beneficiario_id  uuid not null references utilizador(id),
  abre_em          timestamptz not null,
  vence_em         timestamptz not null,
  entregue_em      timestamptz,
  -- IBAN/carteira de destino, congelado 48h antes da entrega.
  destino_hash     bytea,
  destino_fixado_em timestamptz,
  unique (ciclo_id, posicao),
  constraint prazo_coerente check (vence_em > abre_em)
);

-- ---------------------------------------------------------------------
-- Obrigações: o que cada membro deve em cada rodada.
-- Geradas pelo servidor quando a rodada abre — nunca criadas pelo cliente.
-- ---------------------------------------------------------------------
create table obrigacao (
  id             uuid primary key default gen_random_uuid(),
  rodada_id      uuid not null references rodada(id),
  devedor_id     uuid not null references utilizador(id),
  montante_kz    bigint not null check (montante_kz > 0),
  estado         estado_pagamento not null default 'ALEGADO',
  canal          canal_pagamento,
  liquidada_em   timestamptz,
  -- Uma obrigação por membro por rodada. Bloqueia cobrança dupla.
  unique (rodada_id, devedor_id)
);
create index idx_obrigacao_devedor on obrigacao (devedor_id, estado);

-- Atestações: pagamento em DINHEIRO precisa de duas assinaturas independentes
-- (quem entregou e quem recebeu). Uma só nunca confirma.
create table atestacao (
  id             uuid primary key default gen_random_uuid(),
  obrigacao_id   uuid not null references obrigacao(id),
  atestante_id   uuid not null references utilizador(id),
  papel          papel_membro not null,
  atestado_em    timestamptz not null default now(),
  origem_ip      inet,
  dispositivo_id uuid references dispositivo(id),
  -- A mesma pessoa não atesta duas vezes o mesmo pagamento.
  unique (obrigacao_id, atestante_id)
);

-- ---------------------------------------------------------------------
-- LIVRO-RAZÃO — append-only, partida dobrada, encadeado por hash
-- ---------------------------------------------------------------------
create table transacao (
  id                 uuid primary key default gen_random_uuid(),
  tipo               text not null,                -- CONTRIBUICAO | ENTREGA | ESTORNO | TAXA
  ocorrido_em        timestamptz not null,
  registado_em       timestamptz not null default now(),
  -- Idempotência dura: o mesmo evento externo nunca gera dois registos.
  chave_idempotencia text not null unique,
  estorna_id         uuid references transacao(id) -- correcção = estorno, nunca UPDATE
);

create table lancamento (
  id            bigserial primary key,
  transacao_id  uuid not null references transacao(id),
  -- Plano de contas: 'grupo:{id}:fundo', 'membro:{id}:obrigacao',
  -- 'plataforma:receita_taxa', 'mae:{id}:comissao', 'operadora:{id}:processamento'
  conta         text   not null,
  -- Positivo = débito, negativo = crédito. A soma por transação é sempre 0.
  montante_kz   bigint not null check (montante_kz <> 0),
  criado_em     timestamptz not null default now(),
  hash_anterior bytea not null,
  hash          bytea not null unique
);
create index idx_lancamento_conta on lancamento (conta, id);
create index idx_lancamento_transacao on lancamento (transacao_id);

-- --- Garantia 1: partida dobrada -------------------------------------
-- Constraint DEFERIDA: valida no COMMIT, quando a transação já está completa.
create or replace function verificar_partida_dobrada() returns trigger as $$
declare
  desequilibrio bigint;
begin
  select coalesce(sum(montante_kz), 0) into desequilibrio
    from lancamento where transacao_id = new.transacao_id;
  if desequilibrio <> 0 then
    raise exception 'Transação % não fecha: desequilíbrio de % cêntimos',
      new.transacao_id, desequilibrio;
  end if;
  return null;
end;
$$ language plpgsql;

create constraint trigger trg_partida_dobrada
  after insert on lancamento
  deferrable initially deferred
  for each row execute function verificar_partida_dobrada();

-- --- Garantia 2: append-only -----------------------------------------
create or replace function bloquear_mutacao() returns trigger as $$
begin
  raise exception 'O livro-razão é imutável. Corrija com um lançamento de estorno.';
end;
$$ language plpgsql;

create trigger trg_lancamento_imutavel
  before update or delete on lancamento
  for each row execute function bloquear_mutacao();

create trigger trg_transacao_imutavel
  before update or delete on transacao
  for each row execute function bloquear_mutacao();

-- --- Garantia 3: cadeia de hash --------------------------------------
-- Cada lançamento sela o anterior. Editar uma linha antiga por SQL directo
-- quebra a cadeia e é detectado pela verificação diária.
create or replace function encadear_lancamento() returns trigger as $$
declare
  anterior bytea;
begin
  -- Serializa os acréscimos à cadeia; sem isto duas escritas concorrentes
  -- selariam o mesmo antecessor.
  perform pg_advisory_xact_lock(hashtext('livro_razao'));

  select hash into anterior from lancamento order by id desc limit 1;
  anterior := coalesce(anterior, '\x00'::bytea);

  new.hash_anterior := anterior;
  new.hash := digest(
      anterior
      || new.transacao_id::text::bytea
      || new.conta::bytea
      || new.montante_kz::text::bytea
      || new.criado_em::text::bytea,
    'sha256');
  return new;
end;
$$ language plpgsql;

create trigger trg_encadear
  before insert on lancamento
  for each row execute function encadear_lancamento();

-- Selo diário publicado aos membros: se o servidor reescrever o passado,
-- o selo de ontem deixa de bater certo e qualquer membro consegue notar.
create table selo_diario (
  dia             date primary key,
  ultimo_id       bigint not null,
  hash_raiz       bytea not null,
  publicado_em    timestamptz not null default now()
);

-- Saldo de qualquer conta = soma dos lançamentos. Nunca guardado como campo.
create or replace function saldo(p_conta text) returns bigint as $$
  select coalesce(sum(montante_kz), 0) from lancamento where conta = p_conta;
$$ language sql stable;

-- ---------------------------------------------------------------------
-- Webhooks das operadoras
-- ---------------------------------------------------------------------
-- O callback é uma ALEGAÇÃO, não prova. Guarda-se cru, assinado e único;
-- só o extracto diário da operadora promove a obrigação a CONFIRMADO.
create table evento_webhook (
  id                 uuid primary key default gen_random_uuid(),
  operadora          canal_pagamento not null,
  referencia_externa text not null,
  corpo_cru          jsonb not null,
  assinatura_valida  boolean not null,
  recebido_em        timestamptz not null default now(),
  processado_em      timestamptz,
  obrigacao_id       uuid references obrigacao(id),
  -- Replay do mesmo callback colide aqui, antes de tocar no livro-razão.
  unique (operadora, referencia_externa)
);

-- Extracto da operadora: a fonte que fecha a reconciliação.
create table extracto_operadora (
  id                 uuid primary key default gen_random_uuid(),
  operadora          canal_pagamento not null,
  referencia_externa text not null,
  montante_kz        bigint not null,
  liquidado_em       timestamptz not null,
  importado_em       timestamptz not null default now(),
  unique (operadora, referencia_externa)
);

create table divergencia (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null,   -- SEM_EXTRACTO | SEM_WEBHOOK | MONTANTE_DIFERE | CADEIA_QUEBRADA
  obrigacao_id  uuid references obrigacao(id),
  detalhe       jsonb not null,
  detectada_em  timestamptz not null default now(),
  resolvida_em  timestamptz,
  resolucao     text
);

-- ---------------------------------------------------------------------
-- Risco
-- ---------------------------------------------------------------------
create table sinal_risco (
  id            bigserial primary key,
  regra         text not null,   -- ver docs/kixidigital/arquitetura-antifraude.html
  utilizador_id uuid references utilizador(id),
  grupo_id      uuid references grupo(id),
  pontos        smallint not null check (pontos between 1 and 100),
  detalhe       jsonb not null,
  criado_em     timestamptz not null default now()
);
create index idx_sinal_utilizador on sinal_risco (utilizador_id, criado_em desc);

-- Reputação derivada só de factos verificados por terceiros — nunca da
-- palavra da Mãe da Kixikila, senão o selo compra-se com atestações falsas.
create or replace view reputacao as
select u.id as utilizador_id,
       count(*) filter (where o.estado = 'CONFIRMADO' and o.canal <> 'DINHEIRO') as pagamentos_verificados,
       count(*) filter (where o.estado = 'CONFIRMADO' and o.liquidada_em <= r.vence_em) as pagamentos_a_tempo,
       count(*) filter (where o.estado = 'CONFIRMADO' and o.liquidada_em >  r.vence_em) as pagamentos_atrasados
  from utilizador u
  left join obrigacao o on o.devedor_id = u.id
  left join rodada    r on r.id = o.rodada_id
 group by u.id;

-- ---------------------------------------------------------------------
-- Trilho de auditoria de acções internas (suporte, administração)
-- ---------------------------------------------------------------------
create table acao_interna (
  id           bigserial primary key,
  operador     text not null,
  acao         text not null,
  alvo         text not null,
  justificacao text not null,          -- obrigatória: nenhuma acção sem motivo
  aprovada_por text,                   -- estornos exigem segunda pessoa
  criado_em    timestamptz not null default now(),
  constraint estorno_exige_dois check (acao <> 'ESTORNO' or aprovada_por is not null)
);

-- ---------------------------------------------------------------------
-- Exemplo: João paga 25.000 Kz via KWiK (2.500.000 cêntimos)
-- ---------------------------------------------------------------------
-- begin;
--   insert into transacao (tipo, ocorrido_em, chave_idempotencia)
--   values ('CONTRIBUICAO', now(), 'KWIK:TXN-88213') returning id;  -- :tx
--
--   insert into lancamento (transacao_id, conta, montante_kz) values
--     (:tx, 'grupo:G1:fundo',              2450000),  -- débito
--     (:tx, 'plataforma:receita_taxa',       25000),  -- 1,0%
--     (:tx, 'mae:U7:comissao',               12500),  -- 0,5%
--     (:tx, 'operadora:KWIK:processamento',  12500),  -- 0,5%
--     (:tx, 'membro:U3:obrigacao',        -2500000);  -- crédito
--   -- soma = 0  →  a constraint deferida deixa o COMMIT passar
-- commit;
