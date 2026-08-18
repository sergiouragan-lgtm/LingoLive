/**
 * LingoLIVE IA - SessionLoader
 * 
 * Responsável por receber ou observar o estado do Firebase Authentication,
 * expondo apenas os dados mínimos e seguros da sessão de utilizador.
 */

import { auth } from '../../firebase';
import { LoaderResult, SessionData } from './types';
import { User as FirebaseAuthUser } from 'firebase/auth';

export class SessionLoader {
  /**
   * Converte uma instância bruta de utilizador do Firebase Auth para o contrato estruturado SessionData.
   */
  loadFromUser(user: FirebaseAuthUser | null): LoaderResult<SessionData> {
    if (!user) {
      return {
        status: 'NOT_FOUND'
      };
    }

    try {
      if (!user.uid || typeof user.uid !== 'string' || user.uid.trim() === '') {
        return {
          status: 'ERROR',
          error: {
            code: 'INVALID_INPUT',
            message: 'O identificador único (UID) da sessão é inválido.'
          }
        };
      }

      return {
        status: 'FOUND',
        data: {
          uid: user.uid,
          email: user.email || null,
          emailVerified: user.emailVerified,
          providerId: user.providerId || (user.providerData && user.providerData[0]?.providerId) || 'unknown'
        },
        metadata: {
          loadedAt: new Date().toISOString(),
          source: 'firebase_auth'
        }
      };
    } catch (err) {
      return {
        status: 'ERROR',
        error: {
          code: 'MALFORMED_DOCUMENT',
          message: 'Os dados da sessão de autenticação encontram-se malformados.'
        }
      };
    }
  }

  /**
   * Obtém a sessão atual a partir do estado instantâneo do Firebase Auth.
   */
  async loadCurrentSession(): Promise<LoaderResult<SessionData>> {
    try {
      const currentUser = auth.currentUser;
      return this.loadFromUser(currentUser);
    } catch (err) {
      return {
        status: 'ERROR',
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Ocorreu um erro desconhecido ao carregar a sessão de autenticação.'
        }
      };
    }
  }
}
