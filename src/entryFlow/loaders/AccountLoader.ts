/**
 * LingoLIVE IA - AccountLoader
 * 
 * Responsável por carregar de forma estrita o documento da conta do utilizador em users/{uid}.
 * Não efetua escritas, não corrige dados e não confia em cache offline local.
 */

import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../../firebase';
import { LoaderResult, AccountData } from './types';

export class AccountLoader {
  /**
   * Carrega um documento de conta a partir da coleção 'users'.
   * 
   * @param uid Identificador único validado do utilizador.
   */
  async loadAccount(uid: string | null | undefined): Promise<LoaderResult<AccountData>> {
    // Regra: UID vazio ou inválido não pode iniciar leitura
    if (!uid || typeof uid !== 'string' || uid.trim() === '') {
      return {
        status: 'ERROR',
        error: {
          code: 'INVALID_INPUT',
          message: 'O identificador único (UID) fornecido é inválido ou vazio.'
        }
      };
    }

    try {
      const docRef = doc(db, 'users', uid);
      
      // Regra: Não confiar em cache local -> Forçar leitura direta do servidor
      const docSnap = await getDocFromServer(docRef);

      if (!docSnap.exists()) {
        return {
          status: 'NOT_FOUND'
        };
      }

      const rawData: unknown = docSnap.data();

      // Regra: Aplicar validações/type guards antes de retornar os dados
      if (!this.validateAccount(rawData)) {
        return {
          status: 'ERROR',
          error: {
            code: 'MALFORMED_DOCUMENT',
            message: 'O documento da conta do utilizador na coleção "users" está malformado.'
          }
        };
      }

      return {
        status: 'FOUND',
        data: rawData,
        metadata: {
          loadedAt: new Date().toISOString(),
          source: 'firestore_users'
        }
      };
    } catch (err: any) {
      console.error('AccountLoader - Falha ao ler Firestore:', err);
      
      const isNetwork = err?.message?.includes('offline') || err?.code === 'unavailable';
      return {
        status: 'ERROR',
        error: {
          code: isNetwork ? 'NETWORK_ERROR' : 'FIRESTORE_READ_FAILED',
          message: 'Não foi possível ler os dados da conta no servidor. Por favor, verifique a sua ligação.'
        }
      };
    }
  }

  /**
   * Type guard estrito para validar os dados retornados do Firestore.
   */
  private validateAccount(data: unknown): data is AccountData {
    if (typeof data !== 'object' || data === null) return false;
    const candidate = data as Record<string, unknown>;

    // id e email são campos obrigatórios
    if (typeof candidate.id !== 'string' || candidate.id.trim() === '') return false;
    if (typeof candidate.email !== 'string' || candidate.email.trim() === '') return false;

    // roles deve ser um array de strings
    if (!Array.isArray(candidate.roles)) return false;
    if (!candidate.roles.every(role => typeof role === 'string')) return false;

    return true;
  }
}
