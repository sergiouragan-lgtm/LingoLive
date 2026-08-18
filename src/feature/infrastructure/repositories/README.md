# Infrastructure Repositories Implementations (`feature/infrastructure/repositories`)

Aqui residem as implementações concretas das interfaces de persistência definidas na camada de domínio.

## Exemplo
```typescript
import { ISessaoPraticaRepository } from '../../domain/repositories/ISessaoPraticaRepository';

export class FirestoreSessaoPraticaRepository implements ISessaoPraticaRepository {
  async salvarSessao(userId: string, sessao: any): Promise<void> {
    // Implementação direta usando Firebase Firestore Admin ou Client SDK
  }
}
```
Isso garante o desacoplamento absoluto exigido pelas diretrizes do monorepo e Clean Architecture.
