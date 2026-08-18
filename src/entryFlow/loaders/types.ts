/**
 * LingoLIVE IA - Contratos de Tipos para Carregadores de Dados
 * 
 * Este ficheiro define as estruturas e envelopes de retorno de todos os carregadores seguros.
 */

import { SmartProfile } from '../../profile/types';

export type LoaderErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHENTICATED'
  | 'FIRESTORE_READ_FAILED'
  | 'MALFORMED_DOCUMENT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Envelope padrão e seguro para resultados dos carregadores (LoaderResult).
 * Implementado como uma união discriminada baseada em 'status' para evitar combinações de estados impossíveis.
 */
export type LoaderResult<T> =
  | {
      status: 'FOUND';
      data: T;
      metadata: {
        loadedAt: string;
        source: string;
      };
    }
  | {
      status: 'NOT_FOUND';
    }
  | {
      status: 'ERROR';
      error: {
        code: LoaderErrorCode;
        message: string;
      };
    };

/**
 * Dados mínimos e seguros da sessão de autenticação.
 */
export interface SessionData {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  providerId: string;
}

/**
 * Dados de conta retornados pelo utilizador da coleção "users".
 */
export interface AccountData {
  id: string;
  email: string;
  roles: string[];
  tenantId?: string;
  provider?: string;
  status?: string;
  createdAt?: string;
}

/**
 * Dados de atribuição de acesso retornados de "email_permissions".
 */
export interface AccessAssignmentData {
  email: string;
  role: string;
  organizationId?: string;
  grantedAt?: string;
  status?: string;
}

/**
 * Dados de subscrição retornados de "subscriptions".
 */
export interface SubscriptionData {
  status: string;
  planId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}
