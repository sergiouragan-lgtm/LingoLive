/**
 * LingoLIVE IA - Suíte de Testes Unitários para os Carregadores de Dados
 * 
 * Testa todos os cenários obrigatórios e adicionais usando Vitest.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionLoader } from './SessionLoader';
import { AccountLoader } from './AccountLoader';
import { IntelligentProfileLoader } from './IntelligentProfileLoader';
import { AccessAssignmentLoader, normalizeUserRole } from './AccessAssignmentLoader';
import { SubscriptionLoader } from './SubscriptionLoader';

// Mocks do Firebase Firestore
const mockDoc = vi.fn();
const mockGetDocFromServer = vi.fn();

vi.mock('firebase/firestore', () => {
  return {
    getFirestore: vi.fn(() => ({})),
    doc: (...args: any[]) => {
      mockDoc(...args);
      return { path: args.slice(1).join('/') };
    },
    getDocFromServer: (...args: any[]) => mockGetDocFromServer(...args),
  };
});

vi.mock('firebase/auth', () => {
  return {
    getAuth: vi.fn(() => ({
      currentUser: {
        uid: 'user-123',
        email: 'learner@lingolive.com',
        emailVerified: true,
        providerId: 'google.com',
        providerData: [{ providerId: 'google.com' }]
      }
    }))
  };
});

// Mock da nossa própria instância do Firebase para evitar efeitos colaterais
vi.mock('../../firebase', () => {
  return {
    db: {},
    auth: {
      currentUser: {
        uid: 'user-123',
        email: 'learner@lingolive.com',
        emailVerified: true,
        providerId: 'google.com',
        providerData: [{ providerId: 'google.com' }]
      }
    }
  };
});

describe('EntryFlow Loaders - Suite de Testes Unitários', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // SESSION LOADER
  // ==========================================
  describe('SessionLoader', () => {
    const loader = new SessionLoader();

    it('deve carregar sessão válida com sucesso', () => {
      const mockUser = {
        uid: 'user-123',
        email: 'learner@lingolive.com',
        emailVerified: true,
        providerId: 'google.com',
        providerData: []
      } as any;

      const result = loader.loadFromUser(mockUser);
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.uid).toBe('user-123');
        expect(result.data.email).toBe('learner@lingolive.com');
        expect(result.data.emailVerified).toBe(true);
      }
    });

    it('deve retornar NOT_FOUND se a sessão estiver ausente', () => {
      const result = loader.loadFromUser(null);
      expect(result.status).toBe('NOT_FOUND');
    });

    it('deve lidar com email sendo null na sessão', () => {
      const mockUser = {
        uid: 'user-123',
        email: null,
        emailVerified: false,
        providerId: 'google.com',
        providerData: []
      } as any;

      const result = loader.loadFromUser(mockUser);
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.email).toBeNull();
        expect(result.data.emailVerified).toBe(false);
      }
    });

    it('deve retornar erro se o UID do utilizador for inválido ou vazio', () => {
      const mockUser = {
        uid: '  ',
        email: 'test@test.com',
        emailVerified: true
      } as any;

      const result = loader.loadFromUser(mockUser);
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });
  });

  // ==========================================
  // ACCOUNT LOADER
  // ==========================================
  describe('AccountLoader', () => {
    const loader = new AccountLoader();

    it('deve retornar FOUND quando users/{uid} é encontrado e está correto', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: 'user-123',
          email: 'learner@lingolive.com',
          roles: ['LEARNER'],
          status: 'ACTIVE'
        })
      });

      const result = await loader.loadAccount('user-123');
      expect(result.status).toBe('FOUND');
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'user-123');
      if (result.status === 'FOUND') {
        expect(result.data.id).toBe('user-123');
        expect(result.data.email).toBe('learner@lingolive.com');
        expect(result.data.roles).toContain('LEARNER');
      }
    });

    it('deve retornar NOT_FOUND quando users/{uid} está ausente', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => false,
        data: () => null
      });

      const result = await loader.loadAccount('user-404');
      expect(result.status).toBe('NOT_FOUND');
    });

    it('deve rejeitar entrada com UID inválido ou vazio', async () => {
      const result = await loader.loadAccount('');
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('deve retornar ERROR quando ocorre falha de leitura no Firestore', async () => {
      mockGetDocFromServer.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await loader.loadAccount('user-123');
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
      }
    });

    it('deve retornar ERROR com código MALFORMED_DOCUMENT se o documento estiver incorreto', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          // Sem email e ID obrigatórios
          roles: 1234
        })
      });

      const result = await loader.loadAccount('user-bad');
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('MALFORMED_DOCUMENT');
      }
    });
  });

  // ==========================================
  // INTELLIGENT PROFILE LOADER
  // ==========================================
  describe('IntelligentProfileLoader', () => {
    const loader = new IntelligentProfileLoader();

    it('deve carregar intelligentProfiles/{uid} com sucesso e NUNCA ler de profiles/{uid}', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          userId: 'user-123',
          identity: { fullName: { value: 'User Test', confidence: 1, source: 'user', lastUpdated: '', validationStatus: 'valid', version: '1' } },
          account: { role: { value: 'LEARNER' } }
        })
      });

      const result = await loader.loadProfile('user-123');
      expect(result.status).toBe('FOUND');
      
      // Confirmar que a rota consultada é 'intelligentProfiles' e nunca 'profiles'
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'intelligentProfiles', 'user-123');
      expect(mockDoc).not.toHaveBeenCalledWith(expect.anything(), 'profiles', expect.any(String));
    });

    it('deve retornar NOT_FOUND se o perfil inteligente estiver ausente', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => false,
        data: () => null
      });

      const result = await loader.loadProfile('user-404');
      expect(result.status).toBe('NOT_FOUND');
    });

    it('deve retornar ERROR se o documento do perfil for malformado', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          // Faltando userId
          identity: 'corrupt_data'
        })
      });

      const result = await loader.loadProfile('user-bad');
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('MALFORMED_DOCUMENT');
      }
    });
  });

  // ==========================================
  // ACCESS ASSIGNMENT LOADER
  // ==========================================
  describe('AccessAssignmentLoader', () => {
    const loader = new AccessAssignmentLoader();

    it('deve carregar atribuição com role oficial mantido sem alteração', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'teacher@lingolive.com',
          role: 'TEACHER'
        })
      });

      const result = await loader.loadAssignment('teacher@lingolive.com');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.role).toBe('TEACHER');
      }
    });

    it('deve carregar atribuição e normalizar o e-mail e papéis canónicos (ex: SCHOOL_ADMIN mantido canónico)', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'SCHOOL_ADMIN@lingolive.com',
          role: 'SCHOOL_ADMIN' // Papel canónico preservado
        })
      });

      const result = await loader.loadAssignment('  School_Admin@LingoLive.com  ');
      expect(result.status).toBe('FOUND');
      
      // Valida normalização do email no documento do Firestore
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'email_permissions', 'school_admin@lingolive.com');
      
      if (result.status === 'FOUND') {
        expect(result.data.role).toBe('SCHOOL_ADMIN'); // Preservado papel canónico
      }
    });

    it('deve normalizar alias em português ("professor") para "TEACHER"', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'professor@escola.pt',
          role: 'professor'
        })
      });

      const result = await loader.loadAssignment('professor@escola.pt');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.role).toBe('TEACHER');
      }
    });

    it('deve aplicar o fallback seguro "LEARNER" para role desconhecido em documento existente', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'custom@escola.pt',
          role: 'unknown_custom_role'
        })
      });

      const result = await loader.loadAssignment('custom@escola.pt');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.role).toBe('LEARNER');
      }
    });

    it('Garantia de Segurança: roles maliciosos em documento existente não elevam privilégios (fallback "LEARNER")', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'hacker@escola.pt',
          role: 'adminXYZ'
        })
      });

      const result = await loader.loadAssignment('hacker@escola.pt');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.role).toBe('LEARNER');
      }
    });

    it('deve rejeitar e-mail ausente', async () => {
      const result = await loader.loadAssignment(null);
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('INVALID_INPUT');
      }
    });

    it('deve retornar NOT_FOUND se a permissão não for encontrada (NÃO inventa atribuição!)', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => false,
        data: () => null
      });

      const result = await loader.loadAssignment('unknown@test.com');
      expect(result.status).toBe('NOT_FOUND');
    });

    it('deve retornar ERROR se o documento existir mas for malformado (sem campo role)', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'corrupt@test.com'
          // role ausente
        })
      });

      const result = await loader.loadAssignment('corrupt@test.com');
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('MALFORMED_DOCUMENT');
      }
    });

    it('deve retornar ERROR quando ocorre erro de leitura no Firestore', async () => {
      mockGetDocFromServer.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await loader.loadAssignment('fail@test.com');
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
      }
    });

    // ==========================================
    // NORMALIZE USER ROLE (Função Canónica)
    // ==========================================
    describe('normalizeUserRole', () => {
      it('deve mapear corretamente os 13 papéis canónicos aprovados sem degradação (pass-through)', () => {
        expect(normalizeUserRole('SUPER_ADMIN')).toBe('SUPER_ADMIN');
        expect(normalizeUserRole('SCHOOL_OWNER')).toBe('SCHOOL_OWNER');
        expect(normalizeUserRole('SCHOOL_ADMIN')).toBe('SCHOOL_ADMIN');
        expect(normalizeUserRole('SCHOOL_MANAGER')).toBe('SCHOOL_MANAGER');
        expect(normalizeUserRole('TEACHER')).toBe('TEACHER');
        expect(normalizeUserRole('NATIVE_LANGUAGE_INSTRUCTOR')).toBe('NATIVE_LANGUAGE_INSTRUCTOR');
        expect(normalizeUserRole('PARENT_GUARDIAN')).toBe('PARENT_GUARDIAN');
        expect(normalizeUserRole('STUDENT')).toBe('STUDENT');
        expect(normalizeUserRole('LINGUISTIC_RESEARCHER')).toBe('LINGUISTIC_RESEARCHER');
        expect(normalizeUserRole('COMPANY_OWNER')).toBe('COMPANY_OWNER');
        expect(normalizeUserRole('COMPANY_ADMIN')).toBe('COMPANY_ADMIN');
        expect(normalizeUserRole('COMPANY_MANAGER')).toBe('COMPANY_MANAGER');
        expect(normalizeUserRole('BUSINESS_EMPLOYEE')).toBe('BUSINESS_EMPLOYEE');
      });

      it('deve preservar os papéis legados de transição', () => {
        expect(normalizeUserRole('ORG_ADMIN')).toBe('ORG_ADMIN');
        expect(normalizeUserRole('MANAGER')).toBe('MANAGER');
        expect(normalizeUserRole('NATIVE_TEACHER')).toBe('NATIVE_TEACHER');
        expect(normalizeUserRole('BUSINESS_USER')).toBe('BUSINESS_USER');
      });

      it('deve normalizar o papel legado LEARNER para o papel canónico STUDENT (4.1.2-B1)', () => {
        expect(normalizeUserRole('LEARNER')).toBe('STUDENT');
        expect(normalizeUserRole('learner')).toBe('STUDENT');
        expect(normalizeUserRole('  learner   ')).toBe('STUDENT');
        expect(normalizeUserRole('  LEARNER  ')).toBe('STUDENT');
      });

      it('deve normalizar o papel legado PARENT para o papel canónico PARENT_GUARDIAN (4.1.2-B2)', () => {
        expect(normalizeUserRole('PARENT')).toBe('PARENT_GUARDIAN');
        expect(normalizeUserRole('parent')).toBe('PARENT_GUARDIAN');
        expect(normalizeUserRole('  parent   ')).toBe('PARENT_GUARDIAN');
        expect(normalizeUserRole('  PARENT  ')).toBe('PARENT_GUARDIAN');
      });

      it('deve mapear aliases legados e variações para papéis correspondentes', () => {
        // Super Admin aliases
        expect(normalizeUserRole('PLATFORM_ADMIN')).toBe('SUPER_ADMIN');
        expect(normalizeUserRole('superadmin')).toBe('SUPER_ADMIN');
        expect(normalizeUserRole('SUPER_ADMINISTRATOR')).toBe('SUPER_ADMIN');

        // Org Admin aliases
        expect(normalizeUserRole('school_admin')).toBe('SCHOOL_ADMIN');
        expect(normalizeUserRole('school_owner')).toBe('SCHOOL_OWNER');
        expect(normalizeUserRole('administrador_escolar')).toBe('ORG_ADMIN');
        expect(normalizeUserRole('admin')).toBe('ORG_ADMIN');

        // Manager aliases
        expect(normalizeUserRole('COORDINATOR')).toBe('MANAGER');
        expect(normalizeUserRole('coordenador')).toBe('MANAGER');
        expect(normalizeUserRole('gestor')).toBe('MANAGER');
        expect(normalizeUserRole('school_manager')).toBe('SCHOOL_MANAGER');
        expect(normalizeUserRole('company_manager')).toBe('COMPANY_MANAGER');

        // Teacher aliases
        expect(normalizeUserRole('teacher')).toBe('TEACHER');
        expect(normalizeUserRole('Teacher')).toBe('TEACHER');
        expect(normalizeUserRole('professor')).toBe('TEACHER');
        expect(normalizeUserRole('educator')).toBe('TEACHER');

        // Native Teacher aliases
        expect(normalizeUserRole('native_teacher')).toBe('NATIVE_TEACHER');
        expect(normalizeUserRole('professor_nativo')).toBe('NATIVE_TEACHER');
        expect(normalizeUserRole('INSTRUTOR DE LÍNGUA NATIVA')).toBe('NATIVE_TEACHER');
        expect(normalizeUserRole('native_language_instructor')).toBe('NATIVE_LANGUAGE_INSTRUCTOR');

        // Parent aliases
        expect(normalizeUserRole('parent')).toBe('PARENT_GUARDIAN');
        expect(normalizeUserRole('parent_guardian')).toBe('PARENT_GUARDIAN');
        expect(normalizeUserRole('pai')).toBe('PARENT');
        expect(normalizeUserRole('pais')).toBe('PARENT');
        expect(normalizeUserRole('encarregado')).toBe('PARENT');

        // Business User aliases
        expect(normalizeUserRole('business')).toBe('BUSINESS_USER');
        expect(normalizeUserRole('corporate')).toBe('BUSINESS_USER');
        expect(normalizeUserRole('empresarial')).toBe('BUSINESS_USER');
        expect(normalizeUserRole('business_employee')).toBe('BUSINESS_EMPLOYEE');

        // Student / Learner aliases
        expect(normalizeUserRole('Student')).toBe('STUDENT');
        expect(normalizeUserRole('student')).toBe('STUDENT');
        expect(normalizeUserRole('aluno')).toBe('LEARNER');
        expect(normalizeUserRole('estudante')).toBe('LEARNER');
        expect(normalizeUserRole('GUEST')).toBe('LEARNER');
        expect(normalizeUserRole('guest')).toBe('LEARNER');
      });

      it('deve lidar com maiúsculas, minúsculas, mistura de caixa e espaços externos', () => {
        expect(normalizeUserRole('  TEACHER  ')).toBe('TEACHER');
        expect(normalizeUserRole('  learner   ')).toBe('STUDENT');
        expect(normalizeUserRole('  School_Admin  ')).toBe('SCHOOL_ADMIN');
        expect(normalizeUserRole('pRoFeSsOr')).toBe('TEACHER');
      });

      it('deve tratar entradas nulas, vazias, indefinidas ou malformadas de forma totalmente segura (sem elevação de privilégio)', () => {
        expect(normalizeUserRole('')).toBe('LEARNER');
        expect(normalizeUserRole('   ')).toBe('LEARNER');
        expect(normalizeUserRole(null)).toBe('LEARNER');
        expect(normalizeUserRole(undefined)).toBe('LEARNER');
        expect(normalizeUserRole(12345)).toBe('LEARNER');
        expect(normalizeUserRole({})).toBe('LEARNER');
      });

      it('Garantia de Segurança: Valores desconhecidos ou maliciosos nunca devem elevar privilégios', () => {
        expect(normalizeUserRole('unknown_role')).toBe('LEARNER');
        expect(normalizeUserRole('adminXYZ')).toBe('LEARNER');
        expect(normalizeUserRole('super')).toBe('LEARNER');
        expect(normalizeUserRole('root')).toBe('LEARNER');
        expect(normalizeUserRole('123')).toBe('LEARNER');
        expect(normalizeUserRole('hacker_role')).toBe('LEARNER');
        expect(normalizeUserRole('student_admin')).toBe('LEARNER');
      });
    });
  });

  // ==========================================
  // SUBSCRIPTION LOADER
  // ==========================================
  describe('SubscriptionLoader', () => {
    const loader = new SubscriptionLoader();

    it('deve carregar subscrição do caminho correto subscriptions/{uid}_sub e reter estado trialing bruto', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          status: 'trialing',
          planId: 'premium_trial'
        })
      });

      const result = await loader.loadSubscription('user-123');
      expect(result.status).toBe('FOUND');
      
      // Verifica caminho exato
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'subscriptions', 'user-123_sub');
      
      if (result.status === 'FOUND') {
        expect(result.data.status).toBe('trialing'); // Preservado bruto para validação posterior
      }
    });

    it('deve carregar e preservar estados desconhecidos de subscrição', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          status: 'unusual_payment_status',
          planId: 'legacy_tier'
        })
      });

      const result = await loader.loadSubscription('user-123');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.status).toBe('unusual_payment_status');
      }
    });

    it('deve retornar NOT_FOUND se a subscrição estiver ausente', async () => {
      mockGetDocFromServer.mockResolvedValueOnce({
        exists: () => false,
        data: () => null
      });

      const result = await loader.loadSubscription('user-404');
      expect(result.status).toBe('NOT_FOUND');
    });
  });
});
