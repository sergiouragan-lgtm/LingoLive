# Integração KixiDigital ↔ KWiK

Adaptador de operadora de pagamento para a KixiDigital, desenhado para que a
parte que depende da documentação da KWiK esteja isolada num único ficheiro.

```
contrato.ts            Porta: tipos e interfaces. Não sabe o que é a KWiK.
comissoes.ts           Divisão 1% / 0,5% / 0,5% em aritmética inteira.
assinatura.ts          HMAC-SHA256 com comparação timing-safe e janela de 5 min.
webhook.ts             Núcleo: autenticidade → idempotência → montante → estado.
reconciliacao.ts       Cruzamento nocturno entre razão interno e extracto.
adaptador-kwik.ts      ⚠️ Tudo o que depende da KWiK vive aqui.
repositorio-postgres.ts   Repositorio sobre PostgreSQL. Não importa `pg` — ver o seu topo.
endpoint.ts            Router Express de referência. Não está montado em server.ts.
kwik.test.ts                              27 testes do núcleo.
repositorio-postgres.test.ts              11 testes de contrato do repositório (cliente falso).
repositorio-postgres.integration.test.ts  5 testes contra PostgreSQL real — excluído da CI, corre à mão.
```

Os três primeiros ficheiros de teste correm na CI do repositório com
`npx vitest run`. O de integração está excluído em `vitest.config.ts` porque
a CI não tem PostgreSQL disponível — as instruções para o correr estão no
topo do próprio ficheiro. Foi ao correr esse teste contra um PostgreSQL real
que se encontraram e corrigiram dois bugs que os testes com cliente falso não
apanhavam: uma junção a buscar `grupo_id` na tabela errada, e uma comparação
`estado = any(...)` sem o `cast` para o tipo enum do PostgreSQL.

`repositorio-postgres.ts` e `endpoint.ts` não importam `pg` nem alteram o
`package.json` do LingoLive — a KixiDigital não corre no processo deste
repositório (ver a decisão #5 do `relatorio.html`). O repositório está tipado
contra a forma mínima de um cliente SQL que `pg.Pool` já satisfaz
estruturalmente, para que ligar isto a um servidor real, no repositório
próprio da KixiDigital, seja só `new RepositorioPostgres(new pg.Pool(...))`.

## Estado desta integração

O núcleo está completo e testado. **O adaptador contém suposições por
confirmar**, porque não foi possível verificar a documentação de parceiro da
KWiK. Cada suposição está marcada com `SUPOSIÇÃO` no código e concentrada em
`adaptador-kwik.ts` e no objecto `PerfilKWiK` — confirmar a integração é editar
esse ficheiro, e mais nenhum.

## O que perguntar à KWiK

Por ordem de impacto. Cada resposta corresponde a um campo do `PerfilKWiK`.

| # | Pergunta | Se a resposta for má |
|---|---|---|
| 1 | Esquema de assinatura do webhook: HMAC-SHA256? Que cabeçalhos? O carimbo entra no valor assinado? | Se o carimbo não entrar no HMAC, um callback capturado é reutilizável para sempre. Exigir que passe a entrar. |
| 2 | Existe reversão após liquidação? É notificada, e em que prazo? | É a pergunta com maior impacto financeiro: define se `REVERSAO_APOS_ENTREGA` é raro ou frequente. |
| 3 | Formato e periodicidade do extracto de liquidação. | Sem extracto não há reconciliação, e o webhook passa a ser prova única — que é exactamente o que esta arquitectura evita. |
| 4 | Montantes em kwanzas ou cêntimos? Inteiro ou decimal? | Erro de fator 100 num livro-razão. Ver `montanteEmKwanzas`. |
| 5 | Garantias de entrega: repetição, ordem, janela de retentativa. | Determina se `JA_PENDENTE` e chegadas fora de ordem são comuns. |
| 6 | Deep link de cobrança e limites por transacção e por dia. | Os limites têm de bater com os níveis de KYC do `schema.sql`. |
| 7 | Ambiente de testes com credenciais próprias. | Sem sandbox, o piloto testa em produção com dinheiro real. |

## Decisões que valem a pena conhecer

**O montante do payload nunca é aceite.** É sempre confrontado com a obrigação
que o servidor calculou. Divergência põe em quarentena, não credita.

**Pagamento parcial vai para quarentena.** Numa kixikila a contribuição é fixa;
aceitar metade altera silenciosamente quem está em dia e, por consequência, a
ordem do rodízio. É um caso para decisão humana.

**A chave de idempotência inclui o tipo do evento.** Uma liquidação e a sua
reversão partilham a referência externa. Se a chave fosse só a referência, a
reversão seria descartada como duplicado e o dinheiro continuaria a contar.

**Estado desconhecido nunca é sucesso.** Se a KWiK acrescentar um estado novo
ao vocabulário, o pagamento fica em análise em vez de ser creditado.

**As comissões arredondam para baixo e o resto vai para o grupo.** Arredondar
cada parcela à parte deixa cêntimos órfãos e a transação é rejeitada pela
constraint de partida dobrada. Coberto por um teste sobre 5.000 valores.

**400, não 500, para payload inválido.** Um 500 faz a operadora repetir
indefinidamente um pedido que nunca vai ser aceite.

## Correr os testes

```bash
npx vitest run docs/kixidigital/kwik/kwik.test.ts
```

Não precisam de rede, base de dados nem credenciais: o repositório é uma
implementação em memória que replica as garantias impostas pelo `schema.sql`,
incluindo a rejeição de transações que não fecham em zero.
