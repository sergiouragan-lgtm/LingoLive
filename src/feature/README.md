# Arquitetura de Referência DDD / Clean Architecture (LingoLIVE IA)

Este diretório contém o blueprint de arquitetura limpa a ser seguido para o desenvolvimento de todas as futuras funcionalidades do ecossistema LingoLIVE IA. Ele separa as responsabilidades de forma clara e estrita para facilitar a escalabilidade, manutenção de testes unitários e migração futura para microsserviços ou monorepo.

## Visão Geral da Estrutura

```
feature/
├── application/         # Casos de uso, orquestradores e regras de aplicação
├── domain/              # Núcleo de negócios puro (modelos, validadores, contratos)
│   ├── models/
│   ├── repositories/    # Interfaces / Contratos abstratos
│   └── validators/
├── infrastructure/      # Detalhes de implementação tecnológica (APIs, Firebase, Bancos)
│   ├── services/
│   ├── repositories/    # Implementações reais dos repositórios
│   └── routes/
├── presentation/        # Interface com o utilizador (UI/UX)
│   ├── components/      # Componentes React/Vite puros e reutilizáveis
│   └── hooks/           # Custom hooks de consumo de estado e controllers
├── types/               # Tipagens e esquemas estritos do TypeScript
└── tests/               # Testes automatizados unitários, de comportamento e mocks
```
