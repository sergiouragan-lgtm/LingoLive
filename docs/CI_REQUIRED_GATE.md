# Gate obrigatório de engenharia

O workflow `.github/workflows/quality-gate.yml` executa em pushes e pull
requests para `main` e `develop`. O check estável é:

`Required Quality Gate / typecheck-tests-rules-build`

Ele usa Node 22, Java 21, instalação por lockfile e executa `npm run check`:

1. TypeScript sem emissão;
2. suíte Vitest completa;
3. regras Firestore no emulador;
4. auditoria do grafo de produção, bloqueando severidade alta/crítica;
5. build Vite + servidor.

As actions estão fixadas por SHA e o token possui apenas `contents: read`.
CODEOWNERS, Dependabot e formulário de bug também estão versionados.

## Configuração administrativa necessária no GitHub

O repositório deve ter um ruleset/branch protection para `main` com:

- pull request obrigatório;
- check `Required Quality Gate / typecheck-tests-rules-build` obrigatório;
- aprovação de CODEOWNER e descarte de aprovações obsoletas;
- bloqueio de force push e remoção da branch.

A integração GitHub disponível durante esta auditoria recebeu HTTP 403 ao ler
branch protection e não possui permissão administrativa para aplicar o
ruleset. Logo, o workflow está configurado no código, mas a obrigatoriedade
remota só pode ser confirmada por um administrador do repositório.
