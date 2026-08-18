/**
 * LingoLIVE IA - IntelligentProfileLoader
 * 
 * Responsável por carregar o Perfil Inteligente oficial em intelligentProfiles/{uid}.
 * É estritamente proibido ler de profiles/{uid} como fallback ou segunda fonte.
 */

import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../../firebase';
import { LoaderResult } from './types';
import { SmartProfile } from '../../profile/types';

export class IntelligentProfileLoader {
  /**
   * Carrega o perfil inteligente do utilizador.
   * 
   * @param uid Identificador único do utilizador.
   */
  async loadProfile(uid: string | null | undefined): Promise<LoaderResult<SmartProfile>> {
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
      // Regra: Fonte EXCLUSIVA é intelligentProfiles/{uid}. Proibido ler de profiles/{uid}.
      const docRef = doc(db, 'intelligentProfiles', uid);
      
      // Forçar leitura do servidor
      const docSnap = await getDocFromServer(docRef);

      if (!docSnap.exists()) {
        return {
          status: 'NOT_FOUND'
        };
      }

      const rawData: unknown = docSnap.data();

      if (!this.validateProfile(rawData)) {
        return {
          status: 'ERROR',
          error: {
            code: 'MALFORMED_DOCUMENT',
            message: 'O documento do Perfil Inteligente na coleção "intelligentProfiles" está malformado.'
          }
        };
      }

      return {
        status: 'FOUND',
        data: rawData,
        metadata: {
          loadedAt: new Date().toISOString(),
          source: 'firestore_intelligentProfiles'
        }
      };
    } catch (err: any) {
      console.error('IntelligentProfileLoader - Falha ao ler Firestore:', err);
      
      const isNetwork = err?.message?.includes('offline') || err?.code === 'unavailable';
      return {
        status: 'ERROR',
        error: {
          code: isNetwork ? 'NETWORK_ERROR' : 'FIRESTORE_READ_FAILED',
          message: 'Não foi possível carregar o Perfil Inteligente no servidor.'
        }
      };
    }
  }

  /**
   * Type guard estrito para validar a estrutura do Perfil Inteligente.
   */
  private validateProfile(data: unknown): data is SmartProfile {
    if (typeof data !== 'object' || data === null) return false;
    const candidate = data as Record<string, unknown>;

    // userId é campo obrigatório
    if (typeof candidate.userId !== 'string' || candidate.userId.trim() === '') return false;

    // Domínios principais devem ser objetos válidos (se presentes)
    if (candidate.identity && (typeof candidate.identity !== 'object' || candidate.identity === null)) return false;
    if (candidate.account && (typeof candidate.account !== 'object' || candidate.account === null)) return false;
    if (candidate.learning && (typeof candidate.learning !== 'object' || candidate.learning === null)) return false;
    if (candidate.subscription && (typeof candidate.subscription !== 'object' || candidate.subscription === null)) return false;

    return true;
  }
}
