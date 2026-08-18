/**
 * LingoLIVE IA - AccessAssignmentLoader
 * 
 * Responsável por obter as permissões e convites em email_permissions/{email_normalizado}.
 * Normaliza o e-mail unicamente para a localização do documento. Não converte papéis legados
 * e não atribui organizações ou permissões por si só.
 */

import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../../firebase';
import { LoaderResult, AccessAssignmentData } from './types';
import { OfficialUserRole } from '../../types/entryFlow';

/**
 * Função pura de normalização canónica de papéis/roles de utilizador.
 * Mapeia papéis brutos, legados e aliases do sistema para um OfficialUserRole válido.
 * 
 * Regra de Segurança: Qualquer entrada inválida, nula, indefinida ou não reconhecida
 * é mapeada de forma totalmente segura para 'LEARNER' (o papel não-administrativo padrão),
 * prevenindo categoricamente a elevação indevida de privilégios.
 *
 * @param rawRole Valor bruto ou legado recebido.
 * @returns OfficialUserRole canónico.
 */
export function normalizeUserRole(rawRole: unknown): OfficialUserRole {
  if (typeof rawRole !== 'string') {
    return 'LEARNER';
  }

  const trimmed = rawRole.trim();
  if (!trimmed) {
    return 'LEARNER';
  }

  // Normalização de formato (caixa e separadores)
  const normalizedKey = trimmed.toUpperCase().replace(/[\-\s]+/g, '_');

  // Mapeamento determinístico de aliases e papéis legados/oficiais
  switch (normalizedKey) {
    // ----------------------------------------------------
    // ROLES CANÓNICOS (Pass-through direto sem degradação)
    // ----------------------------------------------------
    case 'SUPER_ADMIN':
    case 'PLATFORM_ADMIN':
    case 'SUPER_ADMINISTRATOR':
    case 'SUPER_ADMINISTRADOR':
    case 'SUPERADMIN':
      return 'SUPER_ADMIN';

    case 'SCHOOL_OWNER':
      return 'SCHOOL_OWNER';

    case 'SCHOOL_ADMIN':
      return 'SCHOOL_ADMIN';

    case 'SCHOOL_MANAGER':
      return 'SCHOOL_MANAGER';

    case 'TEACHER':
    case 'PROFESSOR':
    case 'PROFESSORES':
    case 'EDUCATOR':
    case 'EDUCADOR':
    case 'TUTOR':
      return 'TEACHER';

    case 'NATIVE_LANGUAGE_INSTRUCTOR':
      return 'NATIVE_LANGUAGE_INSTRUCTOR';

    case 'PARENT_GUARDIAN':
      return 'PARENT_GUARDIAN';

    case 'STUDENT':
      return 'STUDENT';

    case 'LINGUISTIC_RESEARCHER':
      return 'LINGUISTIC_RESEARCHER';

    case 'COMPANY_OWNER':
      return 'COMPANY_OWNER';

    case 'COMPANY_ADMIN':
      return 'COMPANY_ADMIN';

    case 'COMPANY_MANAGER':
      return 'COMPANY_MANAGER';

    case 'BUSINESS_EMPLOYEE':
      return 'BUSINESS_EMPLOYEE';

    // ----------------------------------------------------
    // ROLES LEGADOS MANTIDOS TEMPORARIAMENTE (Compatibilidade)
    // ----------------------------------------------------
    case 'ORG_ADMIN':
    case 'SCHOOL_ADMINISTRATOR':
    case 'ADMINISTRADOR_ESCOLAR':
    case 'ESCOLA_ADMIN':
      return 'ORG_ADMIN';

    case 'MANAGER':
    case 'COORDINATOR':
    case 'COORDENADOR':
    case 'GESTOR':
      return 'MANAGER';

    case 'NATIVE_TEACHER':
    case 'NATIVE_TUTOR':
    case 'PROFESSOR_NATIVO':
    case 'TUTOR_NATIVO':
    case 'INSTRUTOR_DE_LÍNGUA_NATIVA':
      return 'NATIVE_TEACHER';

    case 'PARENT':
      return 'PARENT_GUARDIAN';

    case 'PAIS':
    case 'PAI':
    case 'MAE':
    case 'MÃE':
    case 'ENCARREGADO':
    case 'ENCARREGADO_DE_EDUCACAO':
      return 'PARENT';

    case 'BUSINESS_USER':
    case 'BUSINESS':
    case 'CORPORATE':
    case 'EMPRESARIAL':
    case 'COLABORADOR':
      return 'BUSINESS_USER';

    case 'LEARNER':
      return 'STUDENT';

    case 'ALUNO':
    case 'ESTUDANTE':
    case 'GUEST':
    case 'CONVIDADO':
    case 'USER':
    case 'UTILIZADOR':
      return 'LEARNER';

    // Caso 'ADMIN' genérico
    case 'ADMIN':
      return 'ORG_ADMIN';

    // Fallback estritamente seguro
    default:
      return 'LEARNER';
  }
}

export class AccessAssignmentLoader {
  /**
   * Carrega um convite/permissão a partir do e-mail do utilizador.
   * 
   * @param email E-mail bruto do utilizador.
   */
  async loadAssignment(email: string | null | undefined): Promise<LoaderResult<AccessAssignmentData>> {
    // Regra: email ausente não pode consultar email_permissions
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return {
        status: 'ERROR',
        error: {
          code: 'INVALID_INPUT',
          message: 'O endereço de e-mail fornecido é inválido ou ausente.'
        }
      };
    }

    try {
      // Regra: Normalizar o e-mail apenas para localizar o documento
      const normalizedEmail = email.trim().toLowerCase();

      const docRef = doc(db, 'email_permissions', normalizedEmail);
      const docSnap = await getDocFromServer(docRef);

      if (!docSnap.exists()) {
        return {
          status: 'NOT_FOUND'
        };
      }

      const rawData: unknown = docSnap.data();

      if (!this.validateAssignment(rawData)) {
        return {
          status: 'ERROR',
          error: {
            code: 'MALFORMED_DOCUMENT',
            message: 'O documento de permissão na coleção "email_permissions" está malformado.'
          }
        };
      }

      // Normaliza o papel bruto para um OfficialUserRole canónico
      const assignmentData: AccessAssignmentData = {
        ...rawData,
        role: normalizeUserRole(rawData.role)
      };

      return {
        status: 'FOUND',
        data: assignmentData,
        metadata: {
          loadedAt: new Date().toISOString(),
          source: 'firestore_email_permissions'
        }
      };
    } catch (err: any) {
      console.error('AccessAssignmentLoader - Falha ao ler Firestore:', err);

      const isNetwork = err?.message?.includes('offline') || err?.code === 'unavailable';
      return {
        status: 'ERROR',
        error: {
          code: isNetwork ? 'NETWORK_ERROR' : 'FIRESTORE_READ_FAILED',
          message: 'Não foi possível carregar as permissões de acesso no servidor.'
        }
      };
    }
  }

  /**
   * Type guard estrito para validar os dados de atribuição de acesso.
   */
  private validateAssignment(data: unknown): data is AccessAssignmentData {
    if (typeof data !== 'object' || data === null) return false;
    const candidate = data as Record<string, unknown>;

    // O campo 'role' é obrigatório para ser um convite ou atribuição de papel válida
    if (typeof candidate.role !== 'string' || candidate.role.trim() === '') return false;

    // Se o email estiver presente no documento, deve ser uma string
    if (candidate.email !== undefined && typeof candidate.email !== 'string') return false;

    return true;
  }
}
