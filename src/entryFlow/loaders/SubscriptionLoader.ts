/**
 * LingoLIVE IA - SubscriptionLoader
 * 
 * Responsável por carregar o estado bruto de subscrição diretamente de subscriptions/{uid}_sub.
 * Não confia em campos duplicados em users/{uid} ou no Perfil Inteligente. Não lê localStorage,
 * não interpreta ou converte trial para ACTIVE, e preserva o estado bruto para validação a jusante.
 */

import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../../firebase';
import { LoaderResult, SubscriptionData } from './types';

export class SubscriptionLoader {
  /**
   * Carrega o documento de subscrição a partir do UID do utilizador.
   * 
   * @param uid Identificador único do utilizador.
   */
  async loadSubscription(uid: string | null | undefined): Promise<LoaderResult<SubscriptionData>> {
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
      // Regra: Fonte atual: subscriptions/{uid}_sub
      const subDocId = `${uid}_sub`;
      const docRef = doc(db, 'subscriptions', subDocId);
      
      // Forçar leitura direta do servidor
      const docSnap = await getDocFromServer(docRef);

      if (!docSnap.exists()) {
        return {
          status: 'NOT_FOUND'
        };
      }

      const rawData: unknown = docSnap.data();

      if (!this.validateSubscription(rawData)) {
        return {
          status: 'ERROR',
          error: {
            code: 'MALFORMED_DOCUMENT',
            message: 'O documento de subscrição na coleção "subscriptions" está malformado.'
          }
        };
      }

      return {
        status: 'FOUND',
        data: rawData,
        metadata: {
          loadedAt: new Date().toISOString(),
          source: 'firestore_subscriptions'
        }
      };
    } catch (err: any) {
      console.error('SubscriptionLoader - Falha ao ler Firestore:', err);

      const isNetwork = err?.message?.includes('offline') || err?.code === 'unavailable';
      return {
        status: 'ERROR',
        error: {
          code: isNetwork ? 'NETWORK_ERROR' : 'FIRESTORE_READ_FAILED',
          message: 'Não foi possível ler as informações de subscrição no servidor.'
        }
      };
    }
  }

  /**
   * Type guard estrito para validar os dados de subscrição.
   */
  private validateSubscription(data: unknown): data is SubscriptionData {
    if (typeof data !== 'object' || data === null) return false;
    const candidate = data as Record<string, unknown>;

    // O campo 'status' é estritamente obrigatório
    if (typeof candidate.status !== 'string' || candidate.status.trim() === '') return false;

    return true;
  }
}
