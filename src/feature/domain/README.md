# Domain Layer (`feature/domain`)

O núcleo de negócio puro (Core) do LingoLIVE IA. É a camada mais interna e estável, não possuindo qualquer dependência externa ou conhecimento sobre bibliotecas visuais, APIs de rede ou bancos de dados.

## Subdiretórios
- **models/**: Entidades puras e classes de domínio.
- **repositories/**: Contratos de persistência (interfaces/interfaces abstratas).
- **validators/**: Regras de validação estritas de dados.
