# ADR-001: Adoção de Domain-Driven Design (DDD)

## Status
Aprovado

## Contexto
O LingoLIVE Enterprise cresceu em complexidade, exigindo uma arquitetura que suporte múltiplos Bounded Contexts (Learning, AI-Cost, Enterprise Management, Payments) com desacoplamento rigoroso.

## Decisão
Adotamos uma abordagem de arquitetura modular baseada em DDD:
- **Domain:** Lógica de negócio pura (Entities, Value Objects, Aggregates).
- **Application:** Orquestração de casos de uso (Use Cases).
- **Infrastructure:** Implementação técnica (Repositories, Anti-Corruption Layers, Persistence).
- **Shared:** Código compartilhado (Kernel).

## Consequências
- Aumenta a curva de aprendizado inicial.
- Garante escalabilidade e manutenção de longo prazo.
- Facilita testes unitários da lógica de negócio.
