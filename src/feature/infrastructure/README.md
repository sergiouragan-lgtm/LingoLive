# Infrastructure Layer (`feature/infrastructure`)

Esta camada cuida de todos os detalhes técnicos e integrações do LingoLIVE com tecnologias externas, serviços em nuvem e mecanismos físicos de persistência de dados.

## Subdiretórios
- **services/**: Conexão direta com APIs externas (como ElevenLabs, OpenAI, Gemini).
- **repositories/**: Implementações reais de salvamento de dados baseadas em Firestore, Drizzle ORM ou LocalStorage.
- **routes/**: Endpoints HTTP de APIs do Express para disponibilizar e expor serviços para os frontends da aplicação.
