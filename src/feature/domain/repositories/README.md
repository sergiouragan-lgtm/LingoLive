# Domain Repositories Contratos (`feature/domain/repositories`)

Este diretório contém as interfaces (contratos de assinaturas) para todas as operações de persistência que o LingoLIVE necessita.

## Exemplo
```typescript
export interface ISessaoPraticaRepository {
  salvarSessao(userId: string, sessao: SessaoPratica): Promise<void>;
  obterHistorico(userId: string): Promise<SessaoPratica[]>;
  removerSessao(userId: string, sessaoId: string): Promise<void>;
}
```
A implementação real deste contrato é colocada na camada de **Infrastructure**, permitindo mudar de Firestore para SQLite, PostgreSQL ou armazenamento em cache sem mexer no resto da aplicação.
