/**
 * LingoLIVE IA - CentralEntryController Unit Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  CentralEntryController,
  CentralEntrySnapshot,
  SessionEntryResolution,
  AccountEntryResolution,
  ProfileEntryResolution,
  AccessEntryResolution,
  SubscriptionEntryResolution,
  CentralEntryResolution,
  CentralEntryGate
} from './CentralEntryController';
import {
  SessionLoader,
  AccountLoader,
  IntelligentProfileLoader,
  AccessAssignmentLoader,
  SubscriptionLoader
} from './loaders';
import { SessionData, AccountData, AccessAssignmentData, SubscriptionData } from './loaders/types';
import { SmartProfile } from '../profile/types';

describe('CentralEntryController - Esqueleto do Controlador Central', () => {
  it('deve ser instanciado com as dependências padrão sem lançar exceções', () => {
    const controller = new CentralEntryController();
    expect(controller).toBeDefined();
    expect(controller.isReady()).toBe(true);
  });

  it('deve aceitar injeção de dependências personalizadas (mocks/fakes)', () => {
    const mockSessionLoader = {} as SessionLoader;
    const mockAccountLoader = {} as AccountLoader;
    const mockIntelligentProfileLoader = {} as IntelligentProfileLoader;
    const mockAccessAssignmentLoader = {} as AccessAssignmentLoader;
    const mockSubscriptionLoader = {} as SubscriptionLoader;

    const controller = new CentralEntryController({
      sessionLoader: mockSessionLoader,
      accountLoader: mockAccountLoader,
      intelligentProfileLoader: mockIntelligentProfileLoader,
      accessAssignmentLoader: mockAccessAssignmentLoader,
      subscriptionLoader: mockSubscriptionLoader
    });

    const deps = controller.getDependencies();

    expect(deps.sessionLoader).toBe(mockSessionLoader);
    expect(deps.accountLoader).toBe(mockAccountLoader);
    expect(deps.intelligentProfileLoader).toBe(mockIntelligentProfileLoader);
    expect(deps.accessAssignmentLoader).toBe(mockAccessAssignmentLoader);
    expect(deps.subscriptionLoader).toBe(mockSubscriptionLoader);
  });

  it('Garantia de Isenção de Side-Effects: o constructor não deve executar nenhum método dos loaders automaticamente', () => {
    const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
    const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
    const mockIntelligentProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
    const mockAccessAssignmentLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
    const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

    new CentralEntryController({
      sessionLoader: mockSessionLoader,
      accountLoader: mockAccountLoader,
      intelligentProfileLoader: mockIntelligentProfileLoader,
      accessAssignmentLoader: mockAccessAssignmentLoader,
      subscriptionLoader: mockSubscriptionLoader
    });

    expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
    expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
    expect(mockIntelligentProfileLoader.loadProfile).not.toHaveBeenCalled();
    expect(mockAccessAssignmentLoader.loadAssignment).not.toHaveBeenCalled();
    expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
  });

  it('deve confirmar que o controller está operacional e pronto (isReady === true)', () => {
    const controller = new CentralEntryController();
    expect(controller.isReady()).toBe(true);
  });

  describe('Primeiro Portão: SessionLoader (loadSession)', () => {
    it('deve delegar a execução ao SessionLoader e retornar status FOUND com os dados de sessão intactos', () => {
      const mockSessionData = {
        uid: 'usr_123456',
        email: 'aluno@lingolive.ia',
        emailVerified: true,
        providerId: 'password'
      };

      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firebase_auth' }
        })
      } as unknown as SessionLoader;

      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const fakeUser = { uid: 'usr_123456' } as any;
      const result = controller.loadSession(fakeUser);

      expect(mockSessionLoader.loadFromUser).toHaveBeenCalledTimes(1);
      expect(mockSessionLoader.loadFromUser).toHaveBeenCalledWith(fakeUser);
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data).toEqual(mockSessionData);
        expect(result.metadata.source).toBe('firebase_auth');
      }

      // Garantia de Isolamento: Outros loaders NÃO são executados
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('deve retornar NOT_FOUND quando o SessionLoader indica ausência de sessão ativa (user null)', () => {
      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({ status: 'NOT_FOUND' })
      } as unknown as SessionLoader;

      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = controller.loadSession(null);

      expect(mockSessionLoader.loadFromUser).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('NOT_FOUND');

      // Garantia de Interrupção no Primeiro Portão
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('deve preservar e retornar o estado ERROR sem acionar outros loaders quando o SessionLoader falha', () => {
      const mockError = {
        code: 'INVALID_INPUT' as const,
        message: 'O identificador único (UID) da sessão é inválido.'
      };

      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({
          status: 'ERROR',
          error: mockError
        })
      } as unknown as SessionLoader;

      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const invalidUser = { uid: '' } as any;
      const result = controller.loadSession(invalidUser);

      expect(mockSessionLoader.loadFromUser).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('INVALID_INPUT');
        expect(result.error.message).toBe('O identificador único (UID) da sessão é inválido.');
      }

      // Garantia de Isolamento
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('deve comprovar que a execução do SessionLoader ocorre somente via chamada explícita ao loadSession e não no constructor', () => {
      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({ status: 'NOT_FOUND' })
      } as unknown as SessionLoader;

      const controller = new CentralEntryController({ sessionLoader: mockSessionLoader });

      expect(mockSessionLoader.loadFromUser).toHaveBeenCalledTimes(0);

      controller.loadSession(null);

      expect(mockSessionLoader.loadFromUser).toHaveBeenCalledTimes(1);
    });
  });

  describe('Segundo Portão: AccountLoader (loadAccountForSession)', () => {
    it('deve delegar para o AccountLoader quando a sessão é FOUND e retornar AccountData intacta', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: {
          uid: 'usr_123456',
          email: 'aluno@lingolive.ia',
          emailVerified: true,
          providerId: 'password'
        },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firebase_auth' }
      };

      const mockAccountData = {
        id: 'usr_123456',
        email: 'aluno@lingolive.ia',
        roles: ['LEARNER']
      };

      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_users' }
        })
      } as unknown as AccountLoader;

      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.loadAccountForSession(sessionResult);

      expect(mockAccountLoader.loadAccount).toHaveBeenCalledTimes(1);
      expect(mockAccountLoader.loadAccount).toHaveBeenCalledWith('usr_123456');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data).toEqual(mockAccountData);
      }

      // Garantia: Nenhum outro loader executado
      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('não deve chamar AccountLoader quando o resultado da sessão for NOT_FOUND e deve retornar NOT_FOUND', async () => {
      const sessionResult = { status: 'NOT_FOUND' as const };

      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.loadAccountForSession(sessionResult);

      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(result.status).toBe('NOT_FOUND');

      // Garantia: Outros loaders também com 0 chamadas
      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('não deve chamar AccountLoader quando o resultado da sessão for ERROR e deve preservar o código e mensagem do erro', async () => {
      const sessionResult = {
        status: 'ERROR' as const,
        error: {
          code: 'INVALID_INPUT' as const,
          message: 'UID de sessão ausente.'
        }
      };

      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.loadAccountForSession(sessionResult);

      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('INVALID_INPUT');
        expect(result.error.message).toBe('UID de sessão ausente.');
      }

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('deve retornar NOT_FOUND quando a sessão é FOUND mas o AccountLoader retorna NOT_FOUND', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: {
          uid: 'usr_sem_conta',
          email: 'novo@lingolive.ia',
          emailVerified: true,
          providerId: 'password'
        },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firebase_auth' }
      };

      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as AccountLoader;

      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.loadAccountForSession(sessionResult);

      expect(mockAccountLoader.loadAccount).toHaveBeenCalledWith('usr_sem_conta');
      expect(result.status).toBe('NOT_FOUND');

      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('deve retornar ERROR quando a sessão é FOUND mas o AccountLoader retorna erro de leitura Firestore', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: {
          uid: 'usr_erro_firestore',
          email: 'erro@lingolive.ia',
          emailVerified: true,
          providerId: 'password'
        },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firebase_auth' }
      };

      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({
          status: 'ERROR',
          error: {
            code: 'FIRESTORE_READ_FAILED',
            message: 'Falha de permissão no Firestore.'
          }
        })
      } as unknown as AccountLoader;

      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;

      const controller = new CentralEntryController({
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader
      });

      const result = await controller.loadAccountForSession(sessionResult);

      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Falha de permissão no Firestore.');
      }

      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
    });

    it('deve extrair o UID exclusivamente de sessionResult.data.uid e passá-lo ao AccountLoader', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: {
          uid: 'user-entry-123',
          email: 'teste@lingolive.ia',
          emailVerified: false,
          providerId: 'google.com'
        },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firebase_auth' }
      };

      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: { id: 'user-entry-123', email: 'teste@lingolive.ia', roles: ['LEARNER'] },
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_users' }
        })
      } as unknown as AccountLoader;

      const controller = new CentralEntryController({ accountLoader: mockAccountLoader });

      await controller.loadAccountForSession(sessionResult);

      expect(mockAccountLoader.loadAccount).toHaveBeenCalledTimes(1);
      expect(mockAccountLoader.loadAccount).toHaveBeenCalledWith('user-entry-123');
    });

    it('deve comprovar que a chamada a loadAccountForSession não reexecuta o SessionLoader', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: {
          uid: 'usr_789',
          email: 'direto@lingolive.ia',
          emailVerified: true,
          providerId: 'password'
        },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firebase_auth' }
      };

      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as AccountLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader
      });

      await controller.loadAccountForSession(sessionResult);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).toHaveBeenCalledWith('usr_789');
    });
  });

  describe('Terceiro Portão: IntelligentProfileLoader (loadProfileForAccount)', () => {
    it('deve delegar para o IntelligentProfileLoader quando Session e Account são FOUND com IDs correspondentes', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: {
          uid: 'user-profile-001',
          email: 'aluno@lingolive.ia',
          emailVerified: true,
          providerId: 'password'
        },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firebase_auth' }
      };

      const accountResult = {
        status: 'FOUND' as const,
        data: {
          id: 'user-profile-001',
          email: 'aluno@lingolive.ia',
          roles: ['LEARNER']
        },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_users' }
      };

      const mockSmartProfile = {
        userId: 'user-profile-001',
        identity: { fullName: 'Aluno Teste' }
      } as any;

      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_intelligentProfiles' }
        })
      } as unknown as IntelligentProfileLoader;

      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockProfileLoader.loadProfile).toHaveBeenCalledTimes(1);
      expect(mockProfileLoader.loadProfile).toHaveBeenCalledWith('user-profile-001');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data).toEqual(mockSmartProfile);
      }

      // Garantia: Nenhum outro loader reexecutado ou acionado
      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('não deve chamar IntelligentProfileLoader se a sessão for NOT_FOUND e deve retornar NOT_FOUND', async () => {
      const sessionResult = { status: 'NOT_FOUND' as const };
      const accountResult = { status: 'FOUND' as const, data: { id: 'usr_1', email: 'a@b.c', roles: [] }, metadata: { loadedAt: '', source: '' } };

      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const controller = new CentralEntryController({ intelligentProfileLoader: mockProfileLoader });

      const result = await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(result.status).toBe('NOT_FOUND');
    });

    it('não deve chamar IntelligentProfileLoader se a sessão for ERROR e deve retornar o mesmo erro', async () => {
      const sessionResult = {
        status: 'ERROR' as const,
        error: { code: 'UNAUTHENTICATED' as const, message: 'Sessão inválida.' }
      };
      const accountResult = { status: 'FOUND' as const, data: { id: 'usr_1', email: 'a@b.c', roles: [] }, metadata: { loadedAt: '', source: '' } };

      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const controller = new CentralEntryController({ intelligentProfileLoader: mockProfileLoader });

      const result = await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('UNAUTHENTICATED');
        expect(result.error.message).toBe('Sessão inválida.');
      }
    });

    it('não deve chamar IntelligentProfileLoader se a conta for NOT_FOUND e deve retornar NOT_FOUND', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'usr_sem_conta', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = { status: 'NOT_FOUND' as const };

      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const controller = new CentralEntryController({ intelligentProfileLoader: mockProfileLoader });

      const result = await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(result.status).toBe('NOT_FOUND');
    });

    it('não deve chamar IntelligentProfileLoader se a conta for ERROR e deve retornar o mesmo erro da conta', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'usr_1', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'ERROR' as const,
        error: { code: 'FIRESTORE_READ_FAILED' as const, message: 'Erro na leitura da conta.' }
      };

      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const controller = new CentralEntryController({ intelligentProfileLoader: mockProfileLoader });

      const result = await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Erro na leitura da conta.');
      }
    });

    it('não deve chamar IntelligentProfileLoader e deve retornar ERROR seguro se os IDs da sessão e conta forem inconsistentes', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-A', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-B', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };

      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const controller = new CentralEntryController({ intelligentProfileLoader: mockProfileLoader });

      const result = await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('Os identificadores da sessão e da conta não correspondem.');
      }
    });

    it('deve retornar NOT_FOUND quando o IntelligentProfileLoader retornar NOT_FOUND sem buscar em profiles/{uid}', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-001', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-001', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };

      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as IntelligentProfileLoader;

      const controller = new CentralEntryController({ intelligentProfileLoader: mockProfileLoader });

      const result = await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockProfileLoader.loadProfile).toHaveBeenCalledWith('user-001');
      expect(result.status).toBe('NOT_FOUND');
    });

    it('deve retornar ERROR quando o IntelligentProfileLoader retornar ERROR', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-001', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-001', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };

      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Permissão negada.' }
        })
      } as unknown as IntelligentProfileLoader;

      const controller = new CentralEntryController({ intelligentProfileLoader: mockProfileLoader });

      const result = await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Permissão negada.');
      }
    });

    it('deve passar exatamente sessionResult.data.uid ao IntelligentProfileLoader', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'exact-uid-999', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'exact-uid-999', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };

      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as IntelligentProfileLoader;

      const controller = new CentralEntryController({ intelligentProfileLoader: mockProfileLoader });

      await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockProfileLoader.loadProfile).toHaveBeenCalledWith('exact-uid-999');
    });

    it('deve comprovar que chamadas a loadProfileForAccount não reexecutam SessionLoader nem AccountLoader', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-001', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-001', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };

      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as IntelligentProfileLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader
      });

      await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).toHaveBeenCalledTimes(1);
    });

    it('deve garantir que AccessAssignmentLoader e SubscriptionLoader não são chamados no terceiro portão', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-001', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-001', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };

      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      await controller.loadProfileForAccount(sessionResult, accountResult);

      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });
  });

  describe('Quarto Portão: AccessAssignmentLoader (loadAccessForIdentity)', () => {
    it('deve delegar para o AccessAssignmentLoader quando Session, Account e Profile são válidos e retornar AccessAssignmentData intacto', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-001', email: 'aluno@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firebase_auth' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-001', email: 'aluno@lingolive.ia', roles: ['LEARNER'] },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_users' }
      };
      const profileResult = {
        status: 'FOUND' as const,
        data: { userId: 'user-001', identity: { fullName: 'Aluno Teste' } } as any,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_intelligentProfiles' }
      };

      const mockAccessData = {
        email: 'aluno@lingolive.ia',
        role: 'LEARNER'
      };

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: mockAccessData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_email_permissions' }
        })
      } as unknown as AccessAssignmentLoader;

      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).toHaveBeenCalledTimes(1);
      expect(mockAccessLoader.loadAssignment).toHaveBeenCalledWith('aluno@lingolive.ia');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data).toEqual(mockAccessData);
      }

      // Garantia: Outros loaders com 0 chamadas adicionais
      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('deve permitir a consulta ao AccessAssignmentLoader quando Profile for NOT_FOUND', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-002', email: 'convidado@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-002', email: 'convidado@lingolive.ia', roles: ['LEARNER'] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessData = { email: 'convidado@lingolive.ia', role: 'TEACHER' };
      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: mockAccessData,
          metadata: { loadedAt: '', source: '' }
        })
      } as unknown as AccessAssignmentLoader;

      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).toHaveBeenCalledTimes(1);
      expect(mockAccessLoader.loadAssignment).toHaveBeenCalledWith('convidado@lingolive.ia');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data).toEqual(mockAccessData);
      }
    });

    it('não deve chamar AccessAssignmentLoader se Profile for ERROR e deve retornar o mesmo erro do perfil', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-003', email: 'erro@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-003', email: 'erro@lingolive.ia', roles: ['LEARNER'] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = {
        status: 'ERROR' as const,
        error: { code: 'FIRESTORE_READ_FAILED' as const, message: 'Falha ao ler perfil.' }
      };

      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Falha ao ler perfil.');
      }
    });

    it('não deve chamar AccessAssignmentLoader se Session for NOT_FOUND e deve retornar NOT_FOUND', async () => {
      const sessionResult = { status: 'NOT_FOUND' as const };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u1', email: 'a@b.c', roles: [] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(result.status).toBe('NOT_FOUND');
    });

    it('não deve chamar AccessAssignmentLoader se Session for ERROR e deve retornar o mesmo erro', async () => {
      const sessionResult = {
        status: 'ERROR' as const,
        error: { code: 'UNAUTHENTICATED' as const, message: 'Sessão inválida.' }
      };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u1', email: 'a@b.c', roles: [] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('UNAUTHENTICATED');
        expect(result.error.message).toBe('Sessão inválida.');
      }
    });

    it('não deve chamar AccessAssignmentLoader se Account for NOT_FOUND e deve retornar NOT_FOUND', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = { status: 'NOT_FOUND' as const };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(result.status).toBe('NOT_FOUND');
    });

    it('não deve chamar AccessAssignmentLoader se Account for ERROR e deve retornar o mesmo erro da conta', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'ERROR' as const,
        error: { code: 'FIRESTORE_READ_FAILED' as const, message: 'Erro na conta.' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Erro na conta.');
      }
    });

    it('não deve chamar AccessAssignmentLoader se o UID da sessão e da conta forem divergentes', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-A', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-B', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('Os identificadores da sessão e da conta não correspondem.');
      }
    });

    it('não deve chamar AccessAssignmentLoader e deve retornar erro seguro se o e-mail da sessão for nulo ou vazio', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: null, emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('INVALID_INPUT');
        expect(result.error.message).toBe('O e-mail autenticado da sessão é inválido ou ausente.');
      }
    });

    it('deve aceitar e-mails equivalentes ignorando maiúsculas/minúsculas e espaços laterais', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: ' Aluno@LingoLIVE.IA ', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'aluno@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({ status: 'FOUND', data: { email: 'aluno@lingolive.ia', role: 'LEARNER' }, metadata: { loadedAt: '', source: '' } })
      } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).toHaveBeenCalledTimes(1);
      expect(mockAccessLoader.loadAssignment).toHaveBeenCalledWith(' Aluno@LingoLIVE.IA ');
      expect(result.status).toBe('FOUND');
    });

    it('não deve chamar AccessAssignmentLoader se os e-mails da sessão e conta forem diferentes', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'user-a@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'user-b@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('O e-mail autenticado da sessão não corresponde ao e-mail da conta.');
      }
    });

    it('deve utilizar sessionResult.data.email como fonte canónica para consulta ao AccessAssignmentLoader', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'canonical-session@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'canonical-session@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockAccessLoader.loadAssignment).toHaveBeenCalledWith('canonical-session@lingolive.ia');
    });

    it('deve retornar NOT_FOUND quando o AccessAssignmentLoader indica ausência de atribuição sem fabricar LEARNER', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'sem-convite@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'sem-convite@lingolive.ia', roles: ['TEACHER'] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(result.status).toBe('NOT_FOUND');
    });

    it('deve retornar ERROR quando o AccessAssignmentLoader retorna erro', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'erro@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'erro@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Falha de leitura.' }
        })
      } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Falha de leitura.');
      }
    });

    it('deve preservar o role retornado pelo AccessAssignmentLoader sem renormalizar ou alterar no controller', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'admin@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'admin@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessData = { email: 'admin@lingolive.ia', role: 'ORG_ADMIN' };
      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: mockAccessData,
          metadata: { loadedAt: '', source: '' }
        })
      } as unknown as AccessAssignmentLoader;
      const controller = new CentralEntryController({ accessAssignmentLoader: mockAccessLoader });

      const result = await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.role).toBe('ORG_ADMIN');
      }
    });

    it('deve comprovar que chamadas a loadAccessForIdentity não reexecutam SessionLoader, AccountLoader nem IntelligentProfileLoader', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'teste@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'teste@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as AccessAssignmentLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader
      });

      await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).toHaveBeenCalledTimes(1);
    });

    it('deve comprovar que SubscriptionLoader não é chamado no quarto portão', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'teste@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'teste@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      await controller.loadAccessForIdentity(sessionResult, accountResult, profileResult);

      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });
  });

  describe('Quinto Portão: SubscriptionLoader (loadSubscriptionForIdentity)', () => {
    it('deve delegar para o SubscriptionLoader quando Session, Account, Profile e Access são válidos e retornar SubscriptionData intacto', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-sub-001', email: 'aluno@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firebase_auth' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-sub-001', email: 'aluno@lingolive.ia', roles: ['LEARNER'] },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_users' }
      };
      const profileResult = {
        status: 'FOUND' as const,
        data: { userId: 'user-sub-001', identity: { fullName: 'Aluno Sub' } } as any,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_intelligentProfiles' }
      };
      const accessResult = {
        status: 'FOUND' as const,
        data: { email: 'aluno@lingolive.ia', role: 'LEARNER' },
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_email_permissions' }
      };

      const mockSubscriptionData = {
        status: 'active',
        planId: 'pro_monthly',
        currentPeriodEnd: '2026-12-31T23:59:59.000Z',
        cancelAtPeriodEnd: false
      };

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: mockSubscriptionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
        })
      } as unknown as SubscriptionLoader;

      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledWith('user-sub-001');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data).toEqual(mockSubscriptionData);
      }

      // Garantia: Portões anteriores com 0 chamadas adicionais
      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
    });

    it('deve permitir a consulta ao SubscriptionLoader quando Profile for NOT_FOUND', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-sub-002', email: 'sem-perfil@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-sub-002', email: 'sem-perfil@lingolive.ia', roles: ['LEARNER'] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = {
        status: 'FOUND' as const,
        data: { email: 'sem-perfil@lingolive.ia', role: 'LEARNER' },
        metadata: { loadedAt: '', source: '' }
      };

      const mockSubscriptionData = { status: 'active', planId: 'basic' };
      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: mockSubscriptionData,
          metadata: { loadedAt: '', source: '' }
        })
      } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledWith('user-sub-002');
      expect(result.status).toBe('FOUND');
    });

    it('não deve chamar SubscriptionLoader se Profile for ERROR e deve retornar o mesmo erro do perfil', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = {
        status: 'ERROR' as const,
        error: { code: 'FIRESTORE_READ_FAILED' as const, message: 'Falha no perfil.' }
      };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Falha no perfil.');
      }
    });

    it('deve permitir a consulta ao SubscriptionLoader quando AccessAssignment for NOT_FOUND', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-b2c-001', email: 'b2c@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-b2c-001', email: 'b2c@lingolive.ia', roles: ['LEARNER'] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionData = { status: 'active', planId: 'individual_pro' };
      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: mockSubscriptionData,
          metadata: { loadedAt: '', source: '' }
        })
      } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledWith('user-b2c-001');
      expect(result.status).toBe('FOUND');
    });

    it('não deve chamar SubscriptionLoader se AccessAssignment for ERROR e deve retornar o mesmo erro', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = {
        status: 'ERROR' as const,
        error: { code: 'FIRESTORE_READ_FAILED' as const, message: 'Erro nas permissões.' }
      };

      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Erro nas permissões.');
      }
    });

    it('não deve alterar a consulta de subscrição nem o resultado quando AccessAssignment for FOUND com qualquer role', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'teacher@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'teacher@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = {
        status: 'FOUND' as const,
        data: { email: 'teacher@lingolive.ia', role: 'TEACHER' },
        metadata: { loadedAt: '', source: '' }
      };

      const mockSubscriptionData = { status: 'active', planId: 'teacher_plan' };
      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: mockSubscriptionData,
          metadata: { loadedAt: '', source: '' }
        })
      } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledWith('u1');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data).toEqual(mockSubscriptionData);
      }
    });

    it('não deve chamar SubscriptionLoader se Session for NOT_FOUND e deve retornar NOT_FOUND', async () => {
      const sessionResult = { status: 'NOT_FOUND' as const };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u1', email: 'a@b.c', roles: [] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
      expect(result.status).toBe('NOT_FOUND');
    });

    it('não deve chamar SubscriptionLoader se Session for ERROR e deve retornar o mesmo erro', async () => {
      const sessionResult = {
        status: 'ERROR' as const,
        error: { code: 'UNAUTHENTICATED' as const, message: 'Sessão inválida.' }
      };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u1', email: 'a@b.c', roles: [] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('UNAUTHENTICATED');
        expect(result.error.message).toBe('Sessão inválida.');
      }
    });

    it('não deve chamar SubscriptionLoader se Account for NOT_FOUND e deve retornar NOT_FOUND', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = { status: 'NOT_FOUND' as const };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
      expect(result.status).toBe('NOT_FOUND');
    });

    it('não deve chamar SubscriptionLoader se Account for ERROR e deve retornar o mesmo erro da conta', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'ERROR' as const,
        error: { code: 'FIRESTORE_READ_FAILED' as const, message: 'Erro na conta.' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Erro na conta.');
      }
    });

    it('não deve chamar SubscriptionLoader se o UID da sessão e da conta forem divergentes', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'user-A', email: 'a@b.c', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'user-B', email: 'a@b.c', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('UNKNOWN_ERROR');
        expect(result.error.message).toBe('Os identificadores da sessão e da conta não correspondem.');
      }
    });

    it('deve utilizar sessionResult.data.uid como fonte canónica para consulta ao SubscriptionLoader', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'subscription-user-123', email: 'canonical@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'subscription-user-123', email: 'canonical@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledWith('subscription-user-123');
    });

    it('deve preservar o status bruto "trialing" sem converter para ACTIVE ou TRIAL', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'trial@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'trial@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: { status: 'trialing', planId: 'trial_plan' },
          metadata: { loadedAt: '', source: '' }
        })
      } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.status).toBe('trialing');
      }
    });

    it('deve preservar o status bruto "active" sem transformações', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'active@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'active@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: { status: 'active', planId: 'premium' },
          metadata: { loadedAt: '', source: '' }
        })
      } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.status).toBe('active');
      }
    });

    it('deve retornar NOT_FOUND quando o SubscriptionLoader indica ausência de subscrição sem fabricar plano FREE, TRIAL ou ACTIVE', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'sem-sub@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'sem-sub@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(result.status).toBe('NOT_FOUND');
    });

    it('deve retornar ERROR quando o SubscriptionLoader retorna erro', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'erro@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'erro@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Falha de leitura.' }
        })
      } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(result.status).toBe('ERROR');
      if (result.status === 'ERROR') {
        expect(result.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(result.error.message).toBe('Falha de leitura.');
      }
    });

    it('deve ignorar quaisquer dados de subscrição presentes no SmartProfile e utilizar exclusivamente o SubscriptionLoader', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'teste@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'teste@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = {
        status: 'FOUND' as const,
        data: { userId: 'u1', subscription: { status: 'active', plan: 'fake_profile_plan' } } as any,
        metadata: { loadedAt: '', source: '' }
      };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: { status: 'past_due', planId: 'real_firestore_plan' },
          metadata: { loadedAt: '', source: '' }
        })
      } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledWith('u1');
      expect(result.status).toBe('FOUND');
      if (result.status === 'FOUND') {
        expect(result.data.status).toBe('past_due');
        expect(result.data.planId).toBe('real_firestore_plan');
      }
    });

    it('deve comprovar que AccountData e AccessAssignmentData não são utilizados como fonte de subscrição', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'teste@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'teste@lingolive.ia', roles: ['ADMIN'] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = {
        status: 'FOUND' as const,
        data: { email: 'teste@lingolive.ia', role: 'ADMIN' },
        metadata: { loadedAt: '', source: '' }
      };

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as SubscriptionLoader;
      const controller = new CentralEntryController({ subscriptionLoader: mockSubscriptionLoader });

      const result = await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledWith('u1');
      expect(result.status).toBe('NOT_FOUND');
    });

    it('deve comprovar que chamadas a loadSubscriptionForIdentity não reexecutam SessionLoader, AccountLoader, IntelligentProfileLoader nem AccessAssignmentLoader', async () => {
      const sessionResult = {
        status: 'FOUND' as const,
        data: { uid: 'u1', email: 'teste@lingolive.ia', emailVerified: true, providerId: 'password' },
        metadata: { loadedAt: '', source: '' }
      };
      const accountResult = {
        status: 'FOUND' as const,
        data: { id: 'u1', email: 'teste@lingolive.ia', roles: [] },
        metadata: { loadedAt: '', source: '' }
      };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };

      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({ status: 'NOT_FOUND' })
      } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      await controller.loadSubscriptionForIdentity(sessionResult, accountResult, profileResult, accessResult);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledTimes(1);
    });

    it('deve comprovar que a instanciação do CentralEntryController não executa nenhum loader automaticamente', () => {
      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });
  });

  describe('Agregação Pura dos Cinco Portões (createEntrySnapshot)', () => {
    it('deve agregar os cinco LoaderResults FOUND em um snapshot com todas as cinco propriedades', () => {
      const sessionResult = { status: 'FOUND' as const, data: { uid: 'u1', email: 'u1@test.com', emailVerified: true, providerId: 'password' }, metadata: { loadedAt: '', source: '' } };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u1', email: 'u1@test.com', roles: ['LEARNER'] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'FOUND' as const, data: { userId: 'u1' } as any, metadata: { loadedAt: '', source: '' } };
      const accessResult = { status: 'FOUND' as const, data: { email: 'u1@test.com', role: 'LEARNER' }, metadata: { loadedAt: '', source: '' } };
      const subscriptionResult = { status: 'FOUND' as const, data: { status: 'active', planId: 'pro' }, metadata: { loadedAt: '', source: '' } };

      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = controller.createEntrySnapshot(
        sessionResult,
        accountResult,
        profileResult,
        accessResult,
        subscriptionResult
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.session).toEqual(sessionResult);
      expect(snapshot.account).toEqual(accountResult);
      expect(snapshot.profile).toEqual(profileResult);
      expect(snapshot.access).toEqual(accessResult);
      expect(snapshot.subscription).toEqual(subscriptionResult);
    });

    it('deve garantir preservação referencial exata dos objetos de entrada no snapshot', () => {
      const sessionResult = { status: 'FOUND' as const, data: { uid: 'u2', email: 'u2@test.com', emailVerified: true, providerId: 'password' }, metadata: { loadedAt: '', source: '' } };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u2', email: 'u2@test.com', roles: [] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };
      const subscriptionResult = { status: 'FOUND' as const, data: { status: 'trialing', planId: 'trial' }, metadata: { loadedAt: '', source: '' } };

      const controller = new CentralEntryController();
      const snapshot = controller.createEntrySnapshot(
        sessionResult,
        accountResult,
        profileResult,
        accessResult,
        subscriptionResult
      );

      expect(snapshot.session).toBe(sessionResult);
      expect(snapshot.account).toBe(accountResult);
      expect(snapshot.profile).toBe(profileResult);
      expect(snapshot.access).toBe(accessResult);
      expect(snapshot.subscription).toBe(subscriptionResult);
    });

    it('deve preservar estado Profile NOT_FOUND no snapshot sem transformações', () => {
      const sessionResult = { status: 'FOUND' as const, data: { uid: 'u1', email: 'u1@test.com', emailVerified: true, providerId: 'password' }, metadata: { loadedAt: '', source: '' } };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u1', email: 'u1@test.com', roles: [] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'FOUND' as const, data: { email: 'u1@test.com', role: 'LEARNER' }, metadata: { loadedAt: '', source: '' } };
      const subscriptionResult = { status: 'NOT_FOUND' as const };

      const controller = new CentralEntryController();
      const snapshot = controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult);

      expect(snapshot.profile.status).toBe('NOT_FOUND');
    });

    it('deve preservar estado AccessAssignment NOT_FOUND no snapshot sem transformações', () => {
      const sessionResult = { status: 'FOUND' as const, data: { uid: 'u1', email: 'u1@test.com', emailVerified: true, providerId: 'password' }, metadata: { loadedAt: '', source: '' } };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u1', email: 'u1@test.com', roles: [] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };
      const subscriptionResult = { status: 'FOUND' as const, data: { status: 'active', planId: 'pro' }, metadata: { loadedAt: '', source: '' } };

      const controller = new CentralEntryController();
      const snapshot = controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult);

      expect(snapshot.access.status).toBe('NOT_FOUND');
    });

    it('deve preservar estado Subscription NOT_FOUND no snapshot sem transformações', () => {
      const sessionResult = { status: 'FOUND' as const, data: { uid: 'u1', email: 'u1@test.com', emailVerified: true, providerId: 'password' }, metadata: { loadedAt: '', source: '' } };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u1', email: 'u1@test.com', roles: [] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };
      const subscriptionResult = { status: 'NOT_FOUND' as const };

      const controller = new CentralEntryController();
      const snapshot = controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult);

      expect(snapshot.subscription.status).toBe('NOT_FOUND');
    });

    it('deve preservar estado ERROR de qualquer portão sem lançar exceção', () => {
      const sessionResult = { status: 'FOUND' as const, data: { uid: 'u1', email: 'u1@test.com', emailVerified: true, providerId: 'password' }, metadata: { loadedAt: '', source: '' } };
      const accountResult = { status: 'ERROR' as const, error: { code: 'FIRESTORE_READ_FAILED' as const, message: 'Erro ao carregar conta.' } };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };
      const subscriptionResult = { status: 'NOT_FOUND' as const };

      const controller = new CentralEntryController();
      expect(() => controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult)).not.toThrow();

      const snapshot = controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult);
      expect(snapshot.account.status).toBe('ERROR');
      if (snapshot.account.status === 'ERROR') {
        expect(snapshot.account.error.code).toBe('FIRESTORE_READ_FAILED');
        expect(snapshot.account.error.message).toBe('Erro ao carregar conta.');
      }
    });

    it('deve aceitar e representar corretamente uma combinação mista de resultados', () => {
      const sessionResult = { status: 'FOUND' as const, data: { uid: 'u-misto', email: 'misto@test.com', emailVerified: true, providerId: 'password' }, metadata: { loadedAt: '', source: '' } };
      const accountResult = { status: 'FOUND' as const, data: { id: 'u-misto', email: 'misto@test.com', roles: ['LEARNER'] }, metadata: { loadedAt: '', source: '' } };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };
      const subscriptionResult = { status: 'FOUND' as const, data: { status: 'trialing', planId: 'b2c_trial' }, metadata: { loadedAt: '', source: '' } };

      const controller = new CentralEntryController();
      const snapshot = controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult);

      expect(snapshot.session.status).toBe('FOUND');
      expect(snapshot.account.status).toBe('FOUND');
      expect(snapshot.profile.status).toBe('NOT_FOUND');
      expect(snapshot.access.status).toBe('NOT_FOUND');
      expect(snapshot.subscription.status).toBe('FOUND');
    });

    it('deve comprovar que createEntrySnapshot realiza zero chamadas aos loaders injetados', () => {
      const sessionResult = { status: 'NOT_FOUND' as const };
      const accountResult = { status: 'NOT_FOUND' as const };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };
      const subscriptionResult = { status: 'NOT_FOUND' as const };

      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('deve comprovar que createEntrySnapshot não executa os métodos dos portões anteriores do controller', () => {
      const controller = new CentralEntryController();

      const loadSessionSpy = vi.spyOn(controller, 'loadSession');
      const loadAccountSpy = vi.spyOn(controller, 'loadAccountForSession');
      const loadProfileSpy = vi.spyOn(controller, 'loadProfileForAccount');
      const loadAccessSpy = vi.spyOn(controller, 'loadAccessForIdentity');
      const loadSubscriptionSpy = vi.spyOn(controller, 'loadSubscriptionForIdentity');

      const sessionResult = { status: 'NOT_FOUND' as const };
      const accountResult = { status: 'NOT_FOUND' as const };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };
      const subscriptionResult = { status: 'NOT_FOUND' as const };

      controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult);

      expect(loadSessionSpy).not.toHaveBeenCalled();
      expect(loadAccountSpy).not.toHaveBeenCalled();
      expect(loadProfileSpy).not.toHaveBeenCalled();
      expect(loadAccessSpy).not.toHaveBeenCalled();
      expect(loadSubscriptionSpy).not.toHaveBeenCalled();
    });

    it('deve comprovar que o método createEntrySnapshot é estritamente síncrono e não retorna uma Promise', () => {
      const controller = new CentralEntryController();
      const sessionResult = { status: 'NOT_FOUND' as const };
      const accountResult = { status: 'NOT_FOUND' as const };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };
      const subscriptionResult = { status: 'NOT_FOUND' as const };

      const result = controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult);

      expect(result).not.toBeInstanceOf(Promise);
      expect(typeof (result as any).then).toBe('undefined');
    });

    it('deve comprovar que o snapshot possui exatamente e apenas as cinco chaves oficiais sem campos derivados', () => {
      const controller = new CentralEntryController();
      const sessionResult = { status: 'NOT_FOUND' as const };
      const accountResult = { status: 'NOT_FOUND' as const };
      const profileResult = { status: 'NOT_FOUND' as const };
      const accessResult = { status: 'NOT_FOUND' as const };
      const subscriptionResult = { status: 'NOT_FOUND' as const };

      const snapshot = controller.createEntrySnapshot(sessionResult, accountResult, profileResult, accessResult, subscriptionResult);
      const keys = Object.keys(snapshot).sort();

      expect(keys).toEqual(['access', 'account', 'profile', 'session', 'subscription'].sort());
      expect((snapshot as any).requiredView).toBeUndefined();
      expect((snapshot as any).route).toBeUndefined();
      expect((snapshot as any).dashboard).toBeUndefined();
      expect((snapshot as any).role).toBeUndefined();
      expect((snapshot as any).paymentRequired).toBeUndefined();
      expect((snapshot as any).onboardingRequired).toBeUndefined();
    });
  });

  describe('resolveSessionState', () => {
    const mockSessionData: SessionData = {
      uid: 'user-123',
      email: 'user@lingolive.ia',
      emailVerified: true,
      providerId: 'password'
    };

    const mockAccountData: AccountData = {
      id: 'user-123',
      email: 'user@lingolive.ia',
      roles: ['STUDENT']
    };

    const mockSmartProfile = {
      userId: 'user-123',
      updatedAt: new Date().toISOString()
    } as SmartProfile;

    const mockAccessAssignmentData: AccessAssignmentData = {
      email: 'user@lingolive.ia',
      role: 'STUDENT',
      status: 'ACTIVE',
      grantedAt: new Date().toISOString()
    };

    const mockSubscriptionData: SubscriptionData = {
      planId: 'pro_annual',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 86400000 * 30).toISOString(),
      cancelAtPeriodEnd: false
    };

    it('TEST 1 — deve retornar UNAUTHENTICATED quando snapshot.session.status for NOT_FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution).toEqual({
        status: 'UNAUTHENTICATED'
      });
    });

    it('TEST 2 — deve retornar SESSION_ERROR quando snapshot.session.status for ERROR preservando código e mensagem', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'FIRESTORE_READ_FAILED' as const,
        message: 'Falha ao carregar sessão da base de dados.'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'ERROR', error: errorObj },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution).toEqual({
        status: 'SESSION_ERROR',
        error: {
          code: 'FIRESTORE_READ_FAILED',
          message: 'Falha ao carregar sessão da base de dados.'
        }
      });
    });

    it('TEST 3 — deve retornar SESSION_READY quando snapshot.session.status for FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution).toEqual({
        status: 'SESSION_READY',
        session: mockSessionData
      });
    });

    it('TEST 4 — deve manter a preservação referencial exata de SessionData quando FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution.status).toBe('SESSION_READY');
      if (resolution.status === 'SESSION_READY') {
        expect(resolution.session).toBe(mockSessionData);
      }
    });

    it('TEST 5 — deve manter a preservação referencial exata do objeto error quando ERROR', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'NETWORK_ERROR' as const,
        message: 'Sem conexão de rede'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'ERROR', error: errorObj },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution.status).toBe('SESSION_ERROR');
      if (resolution.status === 'SESSION_ERROR') {
        expect(resolution.error).toBe(errorObj);
      }
    });

    it('TEST 6 — deve comprovar que account.status === ERROR NÃO altera a resolução SESSION_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro na conta' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution.status).toBe('SESSION_READY');
    });

    it('TEST 7 — deve comprovar que profile.status === ERROR NÃO altera a resolução SESSION_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro no perfil' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution.status).toBe('SESSION_READY');
    });

    it('TEST 8 — deve comprovar que access.status === ERROR NÃO altera a resolução SESSION_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro no acesso' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution.status).toBe('SESSION_READY');
    });

    it('TEST 9 — deve comprovar que subscription.status === ERROR NÃO altera a resolução SESSION_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro na subscrição' }
        }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution.status).toBe('SESSION_READY');
    });

    it('TEST 10 — deve comprovar que resultados FOUND em account, profile, access, subscription NÃO substituem session NOT_FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: {
          status: 'FOUND',
          data: mockSubscriptionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        }
      };

      const resolution = controller.resolveSessionState(snapshot);

      expect(resolution.status).toBe('UNAUTHENTICATED');
    });

    it('TEST 11 — deve comprovar zero chamadas a todos os cinco loaders ao executar resolveSessionState', () => {
      const mockSessionLoader = { loadFromUser: vi.fn() } as any;
      const mockAccountLoader = { loadAccount: vi.fn() } as any;
      const mockProfileLoader = { loadProfile: vi.fn() } as any;
      const mockAccessLoader = { loadAssignment: vi.fn() } as any;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as any;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      controller.resolveSessionState(snapshot);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('TEST 12 — deve comprovar zero reexecuções dos portões do controller ao resolver sessão', () => {
      const controller = new CentralEntryController();

      const loadSessionSpy = vi.spyOn(controller, 'loadSession');
      const loadAccountSpy = vi.spyOn(controller, 'loadAccountForSession');
      const loadProfileSpy = vi.spyOn(controller, 'loadProfileForAccount');
      const loadAccessSpy = vi.spyOn(controller, 'loadAccessForIdentity');
      const loadSubscriptionSpy = vi.spyOn(controller, 'loadSubscriptionForIdentity');

      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      controller.resolveSessionState(snapshot);

      expect(loadSessionSpy).not.toHaveBeenCalled();
      expect(loadAccountSpy).not.toHaveBeenCalled();
      expect(loadProfileSpy).not.toHaveBeenCalled();
      expect(loadAccessSpy).not.toHaveBeenCalled();
      expect(loadSubscriptionSpy).not.toHaveBeenCalled();
    });

    it('TEST 13 — deve comprovar que o método resolveSessionState é estritamente síncrono e não retorna Promise', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const result = controller.resolveSessionState(snapshot);

      expect(result).not.toBeInstanceOf(Promise);
      expect(typeof (result as any).then).toBe('undefined');
    });

    it('TEST 14 — deve comprovar que os únicos status do contrato de domínio de sessão são UNAUTHENTICATED, SESSION_ERROR e SESSION_READY sem nomes de UI', () => {
      const controller = new CentralEntryController();

      const resNotFound = controller.resolveSessionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      const resError = controller.resolveSessionState({
        session: { status: 'ERROR', error: { code: 'UNKNOWN_ERROR', message: 'err' } },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      const resFound = controller.resolveSessionState({
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      expect(['UNAUTHENTICATED', 'SESSION_ERROR', 'SESSION_READY']).toContain(resNotFound.status);
      expect(['UNAUTHENTICATED', 'SESSION_ERROR', 'SESSION_READY']).toContain(resError.status);
      expect(['UNAUTHENTICATED', 'SESSION_ERROR', 'SESSION_READY']).toContain(resFound.status);

      expect((resNotFound as any).view).toBeUndefined();
      expect((resNotFound as any).screen).toBeUndefined();
      expect((resNotFound as any).route).toBeUndefined();
      expect((resError as any).view).toBeUndefined();
      expect((resFound as any).view).toBeUndefined();
    });

    it('TEST 15 — deve comprovar que resolveSessionState não altera o snapshot recebido nem os objetos de resultado de loader', () => {
      const controller = new CentralEntryController();
      const sessionResult = {
        status: 'FOUND' as const,
        data: mockSessionData,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
      };
      const snapshot: CentralEntrySnapshot = {
        session: sessionResult,
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const snapshotCopyBefore = JSON.stringify(snapshot);

      controller.resolveSessionState(snapshot);

      const snapshotCopyAfter = JSON.stringify(snapshot);

      expect(snapshotCopyAfter).toBe(snapshotCopyBefore);
    });
  });

  describe('resolveAccountState', () => {
    const mockSessionData: SessionData = {
      uid: 'user-123',
      email: 'user@lingolive.ia',
      emailVerified: true,
      providerId: 'password'
    };

    const mockAccountData: AccountData = {
      id: 'user-123',
      email: 'user@lingolive.ia',
      roles: ['STUDENT']
    };

    const mockSmartProfile = {
      userId: 'user-123',
      updatedAt: new Date().toISOString()
    } as SmartProfile;

    const mockAccessAssignmentData: AccessAssignmentData = {
      email: 'user@lingolive.ia',
      role: 'STUDENT',
      status: 'ACTIVE',
      grantedAt: new Date().toISOString()
    };

    const mockSubscriptionData: SubscriptionData = {
      planId: 'pro_annual',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 86400000 * 30).toISOString(),
      cancelAtPeriodEnd: false
    };

    it('TEST 1 — deve retornar ACCOUNT_MISSING quando snapshot.account.status for NOT_FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution).toEqual({
        status: 'ACCOUNT_MISSING'
      });
    });

    it('TEST 2 — deve retornar ACCOUNT_ERROR quando snapshot.account.status for ERROR preservando código e mensagem', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'FIRESTORE_READ_FAILED' as const,
        message: 'Falha ao carregar conta da base de dados.'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'ERROR', error: errorObj },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution).toEqual({
        status: 'ACCOUNT_ERROR',
        error: {
          code: 'FIRESTORE_READ_FAILED',
          message: 'Falha ao carregar conta da base de dados.'
        }
      });
    });

    it('TEST 3 — deve retornar ACCOUNT_READY quando snapshot.account.status for FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution).toEqual({
        status: 'ACCOUNT_READY',
        account: mockAccountData
      });
    });

    it('TEST 4 — deve manter a preservação referencial exata de AccountData quando FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution.status).toBe('ACCOUNT_READY');
      if (resolution.status === 'ACCOUNT_READY') {
        expect(resolution.account).toBe(mockAccountData);
      }
    });

    it('TEST 5 — deve manter a preservação referencial exata do objeto error quando ERROR', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'MALFORMED_DOCUMENT' as const,
        message: 'Dados de conta incompletos'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'ERROR', error: errorObj },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution.status).toBe('ACCOUNT_ERROR');
      if (resolution.status === 'ACCOUNT_ERROR') {
        expect(resolution.error).toBe(errorObj);
      }
    });

    it('TEST 6 — deve comprovar que session.status === ERROR NÃO altera a resolução ACCOUNT_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'ERROR',
          error: { code: 'UNAUTHENTICATED', message: 'Erro de sessão' }
        },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution.status).toBe('ACCOUNT_READY');
    });

    it('TEST 7 — deve comprovar que profile.status === ERROR NÃO altera a resolução ACCOUNT_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro no perfil' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution.status).toBe('ACCOUNT_READY');
    });

    it('TEST 8 — deve comprovar que access.status === ERROR NÃO altera a resolução ACCOUNT_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro no acesso' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution.status).toBe('ACCOUNT_READY');
    });

    it('TEST 9 — deve comprovar que subscription.status === ERROR NÃO altera a resolução ACCOUNT_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro na subscrição' }
        }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution.status).toBe('ACCOUNT_READY');
    });

    it('TEST 10 — deve comprovar que resultados FOUND em session, profile, access, subscription NÃO substituem account NOT_FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: {
          status: 'FOUND',
          data: mockSubscriptionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        }
      };

      const resolution = controller.resolveAccountState(snapshot);

      expect(resolution.status).toBe('ACCOUNT_MISSING');
    });

    it('TEST 11 — deve comprovar que o campo interno AccountData.status (ex: SUSPENDED, ACTIVE) NÃO altera ACCOUNT_READY', () => {
      const controller = new CentralEntryController();

      const suspendedAccount: AccountData = {
        ...mockAccountData,
        status: 'SUSPENDED'
      };
      const activeAccount: AccountData = {
        ...mockAccountData,
        status: 'ACTIVE'
      };

      const snapshotSuspended: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: suspendedAccount,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const snapshotActive: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: activeAccount,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resSuspended = controller.resolveAccountState(snapshotSuspended);
      const resActive = controller.resolveAccountState(snapshotActive);

      expect(resSuspended.status).toBe('ACCOUNT_READY');
      expect(resActive.status).toBe('ACCOUNT_READY');
    });

    it('TEST 12 — deve comprovar que os papéis (roles) em AccountData NÃO influenciam nem alteram ACCOUNT_READY', () => {
      const controller = new CentralEntryController();

      const rolesList = [['LEARNER'], ['TEACHER'], ['SUPER_ADMIN'], ['ORG_ADMIN', 'MANAGER']];

      rolesList.forEach((roles) => {
        const accountWithRoles: AccountData = {
          ...mockAccountData,
          roles
        };
        const snapshot: CentralEntrySnapshot = {
          session: { status: 'NOT_FOUND' },
          account: {
            status: 'FOUND',
            data: accountWithRoles,
            metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
          },
          profile: { status: 'NOT_FOUND' },
          access: { status: 'NOT_FOUND' },
          subscription: { status: 'NOT_FOUND' }
        };

        const res = controller.resolveAccountState(snapshot);
        expect(res.status).toBe('ACCOUNT_READY');
      });
    });

    it('TEST 13 — deve comprovar zero chamadas a todos os cinco loaders ao executar resolveAccountState', () => {
      const mockSessionLoader = { loadFromUser: vi.fn() } as any;
      const mockAccountLoader = { loadAccount: vi.fn() } as any;
      const mockProfileLoader = { loadProfile: vi.fn() } as any;
      const mockAccessLoader = { loadAssignment: vi.fn() } as any;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as any;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      controller.resolveAccountState(snapshot);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('TEST 14 — deve comprovar zero reexecuções dos portões do controller ao resolver conta', () => {
      const controller = new CentralEntryController();

      const loadSessionSpy = vi.spyOn(controller, 'loadSession');
      const loadAccountSpy = vi.spyOn(controller, 'loadAccountForSession');
      const loadProfileSpy = vi.spyOn(controller, 'loadProfileForAccount');
      const loadAccessSpy = vi.spyOn(controller, 'loadAccessForIdentity');
      const loadSubscriptionSpy = vi.spyOn(controller, 'loadSubscriptionForIdentity');

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      controller.resolveAccountState(snapshot);

      expect(loadSessionSpy).not.toHaveBeenCalled();
      expect(loadAccountSpy).not.toHaveBeenCalled();
      expect(loadProfileSpy).not.toHaveBeenCalled();
      expect(loadAccessSpy).not.toHaveBeenCalled();
      expect(loadSubscriptionSpy).not.toHaveBeenCalled();
    });

    it('TEST 15 — deve comprovar que o método resolveAccountState é estritamente síncrono e não retorna Promise', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const result = controller.resolveAccountState(snapshot);

      expect(result).not.toBeInstanceOf(Promise);
      expect(typeof (result as any).then).toBe('undefined');
    });

    it('TEST 16 — deve comprovar que os únicos status do contrato de conta são ACCOUNT_MISSING, ACCOUNT_ERROR e ACCOUNT_READY sem nomes de UI', () => {
      const controller = new CentralEntryController();

      const resNotFound = controller.resolveAccountState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      const resError = controller.resolveAccountState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'ERROR', error: { code: 'UNKNOWN_ERROR', message: 'err' } },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      const resFound = controller.resolveAccountState({
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      expect(['ACCOUNT_MISSING', 'ACCOUNT_ERROR', 'ACCOUNT_READY']).toContain(resNotFound.status);
      expect(['ACCOUNT_MISSING', 'ACCOUNT_ERROR', 'ACCOUNT_READY']).toContain(resError.status);
      expect(['ACCOUNT_MISSING', 'ACCOUNT_ERROR', 'ACCOUNT_READY']).toContain(resFound.status);

      expect((resNotFound as any).view).toBeUndefined();
      expect((resNotFound as any).screen).toBeUndefined();
      expect((resNotFound as any).route).toBeUndefined();
      expect((resError as any).view).toBeUndefined();
      expect((resFound as any).view).toBeUndefined();
    });

    it('TEST 17 — deve comprovar que resolveAccountState não altera o snapshot recebido nem os objetos de resultado de loader', () => {
      const controller = new CentralEntryController();
      const accountResult = {
        status: 'FOUND' as const,
        data: mockAccountData,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: accountResult,
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const snapshotCopyBefore = JSON.stringify(snapshot);

      controller.resolveAccountState(snapshot);

      const snapshotCopyAfter = JSON.stringify(snapshot);

      expect(snapshotCopyAfter).toBe(snapshotCopyBefore);
    });

    it('TEST 18 — deve comprovar que resolveSessionState continua totalmente funcional e sem regressões', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resSession = controller.resolveSessionState(snapshot);
      expect(resSession).toEqual({
        status: 'SESSION_READY',
        session: mockSessionData
      });
    });
  });

  describe('resolveProfileState', () => {
    const mockSessionData: SessionData = {
      uid: 'user-123',
      email: 'user@lingolive.ia',
      emailVerified: true,
      providerId: 'password'
    };

    const mockAccountData: AccountData = {
      id: 'user-123',
      email: 'user@lingolive.ia',
      roles: ['STUDENT']
    };

    const mockSmartProfile = {
      userId: 'user-123',
      updatedAt: new Date().toISOString()
    } as SmartProfile;

    const mockAccessAssignmentData: AccessAssignmentData = {
      email: 'user@lingolive.ia',
      role: 'STUDENT',
      status: 'ACTIVE',
      grantedAt: new Date().toISOString()
    };

    const mockSubscriptionData: SubscriptionData = {
      planId: 'pro_annual',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 86400000 * 30).toISOString(),
      cancelAtPeriodEnd: false
    };

    it('TEST 1 — deve retornar PROFILE_MISSING quando snapshot.profile.status for NOT_FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution).toEqual({
        status: 'PROFILE_MISSING'
      });
    });

    it('TEST 2 — deve retornar PROFILE_ERROR quando snapshot.profile.status for ERROR preservando código e mensagem', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'FIRESTORE_READ_FAILED' as const,
        message: 'Falha ao carregar perfil inteligente no Firestore.'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'ERROR', error: errorObj },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution).toEqual({
        status: 'PROFILE_ERROR',
        error: {
          code: 'FIRESTORE_READ_FAILED',
          message: 'Falha ao carregar perfil inteligente no Firestore.'
        }
      });
    });

    it('TEST 3 — deve retornar PROFILE_READY quando snapshot.profile.status for FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution).toEqual({
        status: 'PROFILE_READY',
        profile: mockSmartProfile
      });
    });

    it('TEST 4 — deve manter a preservação referencial exata de SmartProfile quando FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_READY');
      if (resolution.status === 'PROFILE_READY') {
        expect(resolution.profile).toBe(mockSmartProfile);
      }
    });

    it('TEST 5 — deve manter a preservação referencial exata do objeto error quando ERROR', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'MALFORMED_DOCUMENT' as const,
        message: 'Perfil malformado'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'ERROR', error: errorObj },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_ERROR');
      if (resolution.status === 'PROFILE_ERROR') {
        expect(resolution.error).toBe(errorObj);
      }
    });

    it('TEST 6 — deve comprovar que session.status === ERROR NÃO altera a resolução PROFILE_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'ERROR',
          error: { code: 'UNAUTHENTICATED', message: 'Erro de sessão' }
        },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_READY');
    });

    it('TEST 7 — deve comprovar que account.status === ERROR NÃO altera a resolução PROFILE_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro de conta' }
        },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_READY');
    });

    it('TEST 8 — deve comprovar que access.status === ERROR NÃO altera a resolução PROFILE_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro de acesso' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_READY');
    });

    it('TEST 9 — deve comprovar que subscription.status === ERROR NÃO altera a resolução PROFILE_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro na subscrição' }
        }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_READY');
    });

    it('TEST 10 — deve comprovar que resultados FOUND em session, account, access, subscription NÃO substituem profile NOT_FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: {
          status: 'FOUND',
          data: mockSubscriptionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_MISSING');
    });

    it('TEST 11 — deve comprovar que campos internos do SmartProfile (identity, account, learning, subscription) NÃO alteram PROFILE_READY', () => {
      const controller = new CentralEntryController();

      const profileWithCustomDomains = {
        userId: 'user-123',
        updatedAt: new Date().toISOString(),
        identity: { name: 'João' },
        account: { roles: ['STUDENT'] },
        learning: { targetLanguage: 'EN', level: 'INTERMEDIATE' },
        subscription: { plan: 'pro' }
      } as unknown as SmartProfile;

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: profileWithCustomDomains,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_READY');
      if (resolution.status === 'PROFILE_READY') {
        expect(resolution.profile).toBe(profileWithCustomDomains);
      }
    });

    it('TEST 12 — deve comprovar que profile.data.subscription NÃO é usado como fonte de subscrição e a resolução permanece PROFILE_READY mesmo com subscription NOT_FOUND', () => {
      const controller = new CentralEntryController();

      const profileWithSub = {
        userId: 'user-123',
        updatedAt: new Date().toISOString(),
        subscription: { active: false, plan: 'none' }
      } as unknown as SmartProfile;

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: profileWithSub,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_READY');
    });

    it('TEST 13 — deve comprovar que userId do perfil NÃO é revalidado com session.uid dentro de resolveProfileState', () => {
      const controller = new CentralEntryController();

      const mismatchedProfile = {
        userId: 'different-uid-456',
        updatedAt: new Date().toISOString()
      } as SmartProfile;

      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: { ...mockSessionData, uid: 'user-123' },
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mismatchedProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveProfileState(snapshot);

      expect(resolution.status).toBe('PROFILE_READY');
      if (resolution.status === 'PROFILE_READY') {
        expect(resolution.profile.userId).toBe('different-uid-456');
      }
    });

    it('TEST 14 — deve comprovar zero chamadas a todos os cinco loaders ao executar resolveProfileState', () => {
      const mockSessionLoader = { loadFromUser: vi.fn() } as any;
      const mockAccountLoader = { loadAccount: vi.fn() } as any;
      const mockProfileLoader = { loadProfile: vi.fn() } as any;
      const mockAccessLoader = { loadAssignment: vi.fn() } as any;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as any;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      controller.resolveProfileState(snapshot);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('TEST 15 — deve comprovar zero reexecuções dos portões do controller ao resolver perfil', () => {
      const controller = new CentralEntryController();

      const loadSessionSpy = vi.spyOn(controller, 'loadSession');
      const loadAccountSpy = vi.spyOn(controller, 'loadAccountForSession');
      const loadProfileSpy = vi.spyOn(controller, 'loadProfileForAccount');
      const loadAccessSpy = vi.spyOn(controller, 'loadAccessForIdentity');
      const loadSubscriptionSpy = vi.spyOn(controller, 'loadSubscriptionForIdentity');

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      controller.resolveProfileState(snapshot);

      expect(loadSessionSpy).not.toHaveBeenCalled();
      expect(loadAccountSpy).not.toHaveBeenCalled();
      expect(loadProfileSpy).not.toHaveBeenCalled();
      expect(loadAccessSpy).not.toHaveBeenCalled();
      expect(loadSubscriptionSpy).not.toHaveBeenCalled();
    });

    it('TEST 16 — deve comprovar que o método resolveProfileState é estritamente síncrono e não retorna Promise', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const result = controller.resolveProfileState(snapshot);

      expect(result).not.toBeInstanceOf(Promise);
      expect(typeof (result as any).then).toBe('undefined');
    });

    it('TEST 17 — deve comprovar que os únicos status do contrato de perfil são PROFILE_MISSING, PROFILE_ERROR e PROFILE_READY sem nomes de UI', () => {
      const controller = new CentralEntryController();

      const resNotFound = controller.resolveProfileState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      const resError = controller.resolveProfileState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'ERROR', error: { code: 'UNKNOWN_ERROR', message: 'err' } },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      const resFound = controller.resolveProfileState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      expect(['PROFILE_MISSING', 'PROFILE_ERROR', 'PROFILE_READY']).toContain(resNotFound.status);
      expect(['PROFILE_MISSING', 'PROFILE_ERROR', 'PROFILE_READY']).toContain(resError.status);
      expect(['PROFILE_MISSING', 'PROFILE_ERROR', 'PROFILE_READY']).toContain(resFound.status);

      expect((resNotFound as any).view).toBeUndefined();
      expect((resNotFound as any).screen).toBeUndefined();
      expect((resNotFound as any).onboarding).toBeUndefined();
      expect((resError as any).view).toBeUndefined();
      expect((resFound as any).view).toBeUndefined();
    });

    it('TEST 18 — deve comprovar que resolveProfileState não altera o snapshot recebido nem os objetos de resultado de loader', () => {
      const controller = new CentralEntryController();
      const profileResult = {
        status: 'FOUND' as const,
        data: mockSmartProfile,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: profileResult,
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const snapshotCopyBefore = JSON.stringify(snapshot);

      controller.resolveProfileState(snapshot);

      const snapshotCopyAfter = JSON.stringify(snapshot);

      expect(snapshotCopyAfter).toBe(snapshotCopyBefore);
    });

    it('TEST 19 — deve comprovar que resolveSessionState e resolveAccountState continuam totalmente funcionais e sem regressões', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resSession = controller.resolveSessionState(snapshot);
      const resAccount = controller.resolveAccountState(snapshot);

      expect(resSession).toEqual({
        status: 'SESSION_READY',
        session: mockSessionData
      });

      expect(resAccount).toEqual({
        status: 'ACCOUNT_READY',
        account: mockAccountData
      });
    });
  });

  describe('resolveAccessState', () => {
    const mockSessionData: SessionData = {
      uid: 'user-123',
      email: 'user@lingolive.ia',
      emailVerified: true,
      providerId: 'password'
    };

    const mockAccountData: AccountData = {
      id: 'user-123',
      email: 'user@lingolive.ia',
      roles: ['STUDENT']
    };

    const mockSmartProfile = {
      userId: 'user-123',
      updatedAt: new Date().toISOString()
    } as SmartProfile;

    const mockAccessAssignmentData: AccessAssignmentData = {
      email: 'user@lingolive.ia',
      role: 'STUDENT',
      organizationId: 'org-456',
      status: 'ACTIVE',
      grantedAt: new Date().toISOString()
    };

    const mockSubscriptionData: SubscriptionData = {
      planId: 'pro_annual',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 86400000 * 30).toISOString(),
      cancelAtPeriodEnd: false
    };

    it('TEST 1 — deve retornar ACCESS_MISSING quando snapshot.access.status for NOT_FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution).toEqual({
        status: 'ACCESS_MISSING'
      });
    });

    it('TEST 2 — deve retornar ACCESS_ERROR quando snapshot.access.status for ERROR preservando código e mensagem', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'FIRESTORE_READ_FAILED' as const,
        message: 'Falha ao carregar permissões de email no Firestore.'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'ERROR', error: errorObj },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution).toEqual({
        status: 'ACCESS_ERROR',
        error: {
          code: 'FIRESTORE_READ_FAILED',
          message: 'Falha ao carregar permissões de email no Firestore.'
        }
      });
    });

    it('TEST 3 — deve retornar ACCESS_READY quando snapshot.access.status for FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution).toEqual({
        status: 'ACCESS_READY',
        access: mockAccessAssignmentData
      });
    });

    it('TEST 4 — deve manter a preservação referencial exata de AccessAssignmentData quando FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution.status).toBe('ACCESS_READY');
      if (resolution.status === 'ACCESS_READY') {
        expect(resolution.access).toBe(mockAccessAssignmentData);
      }
    });

    it('TEST 5 — deve manter a preservação referencial exata do objeto error quando ERROR', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'MALFORMED_DOCUMENT' as const,
        message: 'Documento de permissão malformado'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'ERROR', error: errorObj },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution.status).toBe('ACCESS_ERROR');
      if (resolution.status === 'ACCESS_ERROR') {
        expect(resolution.error).toBe(errorObj);
      }
    });

    it('TEST 6 — deve comprovar que session.status === ERROR NÃO altera a resolução ACCESS_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'ERROR',
          error: { code: 'UNAUTHENTICATED', message: 'Erro de sessão' }
        },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution.status).toBe('ACCESS_READY');
    });

    it('TEST 7 — deve comprovar que account.status === ERROR NÃO altera a resolução ACCESS_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro de conta' }
        },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution.status).toBe('ACCESS_READY');
    });

    it('TEST 8 — deve comprovar que profile.status === ERROR NÃO altera a resolução ACCESS_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro de perfil' }
        },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution.status).toBe('ACCESS_READY');
    });

    it('TEST 9 — deve comprovar que subscription.status === ERROR NÃO altera a resolução ACCESS_READY', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: {
          status: 'ERROR',
          error: { code: 'FIRESTORE_READ_FAILED', message: 'Erro na subscrição' }
        }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution.status).toBe('ACCESS_READY');
    });

    it('TEST 10 — deve comprovar que resultados FOUND em session, account, profile, subscription NÃO substituem access NOT_FOUND', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'FOUND',
          data: mockSubscriptionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution.status).toBe('ACCESS_MISSING');
    });

    it('TEST 11 — deve comprovar que diferentes valores de role (ex: LEARNER, TEACHER, SUPER_ADMIN) NÃO alteram ACCESS_READY e não são normalizados', () => {
      const controller = new CentralEntryController();
      const roles = ['LEARNER', 'TEACHER', 'SUPER_ADMIN', 'SCHOOL_ADMIN'];

      roles.forEach((r) => {
        const customAccess: AccessAssignmentData = {
          ...mockAccessAssignmentData,
          role: r
        };
        const snapshot: CentralEntrySnapshot = {
          session: { status: 'NOT_FOUND' },
          account: { status: 'NOT_FOUND' },
          profile: { status: 'NOT_FOUND' },
          access: {
            status: 'FOUND',
            data: customAccess,
            metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
          },
          subscription: { status: 'NOT_FOUND' }
        };

        const resolution = controller.resolveAccessState(snapshot);

        expect(resolution.status).toBe('ACCESS_READY');
        if (resolution.status === 'ACCESS_READY') {
          expect(resolution.access.role).toBe(r);
        }
      });
    });

    it('TEST 12 — deve comprovar que presença ou ausência de organizationId em AccessAssignmentData NÃO altera ACCESS_READY', () => {
      const controller = new CentralEntryController();

      const accessWithOrg: AccessAssignmentData = {
        ...mockAccessAssignmentData,
        organizationId: 'org-789'
      };
      const accessWithoutOrg: AccessAssignmentData = {
        email: 'user@lingolive.ia',
        role: 'STUDENT'
      };

      const snapshotWithOrg: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: accessWithOrg,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const snapshotWithoutOrg: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: accessWithoutOrg,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resWith = controller.resolveAccessState(snapshotWithOrg);
      const resWithout = controller.resolveAccessState(snapshotWithoutOrg);

      expect(resWith.status).toBe('ACCESS_READY');
      expect(resWithout.status).toBe('ACCESS_READY');
    });

    it('TEST 13 — deve comprovar que o campo interno status em AccessAssignmentData (ACTIVE, PENDING, INVITED) NÃO altera ACCESS_READY', () => {
      const controller = new CentralEntryController();
      const statuses = ['ACTIVE', 'PENDING', 'INVITED', 'INACTIVE'];

      statuses.forEach((s) => {
        const customAccess: AccessAssignmentData = {
          ...mockAccessAssignmentData,
          status: s
        };
        const snapshot: CentralEntrySnapshot = {
          session: { status: 'NOT_FOUND' },
          account: { status: 'NOT_FOUND' },
          profile: { status: 'NOT_FOUND' },
          access: {
            status: 'FOUND',
            data: customAccess,
            metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
          },
          subscription: { status: 'NOT_FOUND' }
        };

        const resolution = controller.resolveAccessState(snapshot);
        expect(resolution.status).toBe('ACCESS_READY');
      });
    });

    it('TEST 14 — deve comprovar que o campo grantedAt em AccessAssignmentData NÃO altera ACCESS_READY', () => {
      const controller = new CentralEntryController();
      const customAccess: AccessAssignmentData = {
        ...mockAccessAssignmentData,
        grantedAt: '2020-01-01T00:00:00.000Z'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: customAccess,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);
      expect(resolution.status).toBe('ACCESS_READY');
    });

    it('TEST 15 — deve comprovar que access.email NÃO é revalidado nem comparado com session.email ou account.email dentro de resolveAccessState', () => {
      const controller = new CentralEntryController();
      const customAccess: AccessAssignmentData = {
        email: 'other-email@different.com',
        role: 'TEACHER'
      };
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: { ...mockSessionData, email: 'session@lingolive.ia' },
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: {
          status: 'FOUND',
          data: { ...mockAccountData, email: 'account@lingolive.ia' },
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: customAccess,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveAccessState(snapshot);

      expect(resolution.status).toBe('ACCESS_READY');
      if (resolution.status === 'ACCESS_READY') {
        expect(resolution.access.email).toBe('other-email@different.com');
      }
    });

    it('TEST 16 — deve comprovar zero chamadas a todos os cinco loaders ao executar resolveAccessState', () => {
      const mockSessionLoader = { loadFromUser: vi.fn() } as any;
      const mockAccountLoader = { loadAccount: vi.fn() } as any;
      const mockProfileLoader = { loadProfile: vi.fn() } as any;
      const mockAccessLoader = { loadAssignment: vi.fn() } as any;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as any;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      controller.resolveAccessState(snapshot);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('TEST 17 — deve comprovar zero reexecuções dos portões do controller ao resolver acesso', () => {
      const controller = new CentralEntryController();

      const loadSessionSpy = vi.spyOn(controller, 'loadSession');
      const loadAccountSpy = vi.spyOn(controller, 'loadAccountForSession');
      const loadProfileSpy = vi.spyOn(controller, 'loadProfileForAccount');
      const loadAccessSpy = vi.spyOn(controller, 'loadAccessForIdentity');
      const loadSubscriptionSpy = vi.spyOn(controller, 'loadSubscriptionForIdentity');

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      controller.resolveAccessState(snapshot);

      expect(loadSessionSpy).not.toHaveBeenCalled();
      expect(loadAccountSpy).not.toHaveBeenCalled();
      expect(loadProfileSpy).not.toHaveBeenCalled();
      expect(loadAccessSpy).not.toHaveBeenCalled();
      expect(loadSubscriptionSpy).not.toHaveBeenCalled();
    });

    it('TEST 18 — deve comprovar que o método resolveAccessState é estritamente síncrono e não retorna Promise', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const result = controller.resolveAccessState(snapshot);

      expect(result).not.toBeInstanceOf(Promise);
      expect(typeof (result as any).then).toBe('undefined');
    });

    it('TEST 19 — deve comprovar que os únicos status do contrato de acesso são ACCESS_MISSING, ACCESS_ERROR e ACCESS_READY sem nomes de UI', () => {
      const controller = new CentralEntryController();

      const resNotFound = controller.resolveAccessState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      });

      const resError = controller.resolveAccessState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'ERROR', error: { code: 'UNKNOWN_ERROR', message: 'err' } },
        subscription: { status: 'NOT_FOUND' }
      });

      const resFound = controller.resolveAccessState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      });

      expect(['ACCESS_MISSING', 'ACCESS_ERROR', 'ACCESS_READY']).toContain(resNotFound.status);
      expect(['ACCESS_MISSING', 'ACCESS_ERROR', 'ACCESS_READY']).toContain(resError.status);
      expect(['ACCESS_MISSING', 'ACCESS_ERROR', 'ACCESS_READY']).toContain(resFound.status);

      expect((resNotFound as any).view).toBeUndefined();
      expect((resNotFound as any).screen).toBeUndefined();
      expect((resNotFound as any).permission).toBeUndefined();
      expect((resError as any).view).toBeUndefined();
      expect((resFound as any).view).toBeUndefined();
    });

    it('TEST 20 — deve comprovar que resolveAccessState não altera o snapshot recebido nem os objetos de resultado de loader', () => {
      const controller = new CentralEntryController();
      const accessResult = {
        status: 'FOUND' as const,
        data: mockAccessAssignmentData,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: accessResult,
        subscription: { status: 'NOT_FOUND' }
      };

      const snapshotCopyBefore = JSON.stringify(snapshot);

      controller.resolveAccessState(snapshot);

      const snapshotCopyAfter = JSON.stringify(snapshot);

      expect(snapshotCopyAfter).toBe(snapshotCopyBefore);
    });

    it('TEST 21 — deve comprovar que resolveSessionState, resolveAccountState e resolveProfileState continuam totalmente funcionais e sem regressões', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resSession = controller.resolveSessionState(snapshot);
      const resAccount = controller.resolveAccountState(snapshot);
      const resProfile = controller.resolveProfileState(snapshot);

      expect(resSession).toEqual({
        status: 'SESSION_READY',
        session: mockSessionData
      });

      expect(resAccount).toEqual({
        status: 'ACCOUNT_READY',
        account: mockAccountData
      });

      expect(resProfile).toEqual({
        status: 'PROFILE_READY',
        profile: mockSmartProfile
      });
    });
  });

  describe('Quinta Regra Pura de Resolução: Subscription (resolveSubscriptionState)', () => {
    const mockSessionData: SessionData = {
      uid: 'user-xyz-456',
      email: 'subscriber@lingolive.ia',
      emailVerified: true,
      providerId: 'google.com'
    };

    const mockAccountData: AccountData = {
      id: 'user-xyz-456',
      email: 'subscriber@lingolive.ia',
      roles: ['LEARNER'],
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    const mockSmartProfile = {
      userId: 'user-xyz-456',
      updatedAt: new Date().toISOString()
    } as SmartProfile;

    const mockAccessAssignmentData: AccessAssignmentData = {
      email: 'subscriber@lingolive.ia',
      role: 'LEARNER',
      organizationId: 'org-456',
      status: 'ACTIVE',
      grantedAt: new Date().toISOString()
    };

    const mockActiveSubscription: SubscriptionData = {
      planId: 'pro_annual',
      status: 'active',
      currentPeriodEnd: '2026-12-31T23:59:59.000Z',
      cancelAtPeriodEnd: false
    };

    it('TEST 1 — deve retornar SUBSCRIPTION_MISSING quando snapshot.subscription.status for NOT_FOUND (não fabrica FREE, TRIAL ou ACTIVE)', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSubscriptionState(snapshot);

      expect(resolution).toEqual({
        status: 'SUBSCRIPTION_MISSING'
      });
    });

    it('TEST 2 — deve retornar SUBSCRIPTION_ERROR quando snapshot.subscription.status for ERROR preservando código e mensagem originais', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'FIRESTORE_READ_FAILED' as const,
        message: 'Falha ao ler subscrições/{uid}_sub no Firestore.'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'ERROR', error: errorObj }
      };

      const resolution = controller.resolveSubscriptionState(snapshot);

      expect(resolution).toEqual({
        status: 'SUBSCRIPTION_ERROR',
        error: {
          code: 'FIRESTORE_READ_FAILED',
          message: 'Falha ao ler subscrições/{uid}_sub no Firestore.'
        }
      });
    });

    it('TEST 3 — deve retornar SUBSCRIPTION_ACTIVE quando status for "active"', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'FOUND',
          data: mockActiveSubscription,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
        }
      };

      const resolution = controller.resolveSubscriptionState(snapshot);

      expect(resolution).toEqual({
        status: 'SUBSCRIPTION_ACTIVE',
        subscription: mockActiveSubscription
      });
    });

    it('TEST 4 — deve retornar SUBSCRIPTION_ACTIVE para "trialing" e "trial"', () => {
      const controller = new CentralEntryController();
      const trialingSub: SubscriptionData = { planId: 'starter', status: 'trialing' };
      const trialSub: SubscriptionData = { planId: 'starter_trial', status: 'trial' };

      const resTrialing = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'FOUND',
          data: trialingSub,
          metadata: { loadedAt: '', source: 'firestore' }
        }
      });

      const resTrial = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'FOUND',
          data: trialSub,
          metadata: { loadedAt: '', source: 'firestore' }
        }
      });

      expect(resTrialing).toEqual({ status: 'SUBSCRIPTION_ACTIVE', subscription: trialingSub });
      expect(resTrial).toEqual({ status: 'SUBSCRIPTION_ACTIVE', subscription: trialSub });
    });

    it('TEST 5 — deve retornar SUBSCRIPTION_ACTIVE para "cancel_at_period_end", "in_grace_period" e "grace_period"', () => {
      const controller = new CentralEntryController();
      const cancelSub: SubscriptionData = { planId: 'pro', status: 'cancel_at_period_end', cancelAtPeriodEnd: true };
      const graceSub1: SubscriptionData = { planId: 'pro', status: 'in_grace_period' };
      const graceSub2: SubscriptionData = { planId: 'pro', status: 'grace_period' };

      const resCancel = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: cancelSub, metadata: { loadedAt: '', source: 'firestore' } }
      });

      const resGrace1 = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: graceSub1, metadata: { loadedAt: '', source: 'firestore' } }
      });

      const resGrace2 = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: graceSub2, metadata: { loadedAt: '', source: 'firestore' } }
      });

      expect(resCancel).toEqual({ status: 'SUBSCRIPTION_ACTIVE', subscription: cancelSub });
      expect(resGrace1).toEqual({ status: 'SUBSCRIPTION_ACTIVE', subscription: graceSub1 });
      expect(resGrace2).toEqual({ status: 'SUBSCRIPTION_ACTIVE', subscription: graceSub2 });
    });

    it('TEST 6 — deve retornar SUBSCRIPTION_INACTIVE com reason "CANCELLED" para "canceled" e "cancelled"', () => {
      const controller = new CentralEntryController();
      const sub1: SubscriptionData = { planId: 'pro', status: 'canceled' };
      const sub2: SubscriptionData = { planId: 'pro', status: 'cancelled' };

      const res1 = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: sub1, metadata: { loadedAt: '', source: 'firestore' } }
      });

      const res2 = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: sub2, metadata: { loadedAt: '', source: 'firestore' } }
      });

      expect(res1).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: sub1, reason: 'CANCELLED' });
      expect(res2).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: sub2, reason: 'CANCELLED' });
    });

    it('TEST 7 — deve retornar SUBSCRIPTION_INACTIVE com reason "EXPIRED" para "expired"', () => {
      const controller = new CentralEntryController();
      const sub: SubscriptionData = { planId: 'pro', status: 'expired' };

      const res = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: sub, metadata: { loadedAt: '', source: 'firestore' } }
      });

      expect(res).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: sub, reason: 'EXPIRED' });
    });

    it('TEST 8 — deve retornar SUBSCRIPTION_INACTIVE com reason "PAST_DUE" para "past_due"', () => {
      const controller = new CentralEntryController();
      const sub: SubscriptionData = { planId: 'pro', status: 'past_due' };

      const res = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: sub, metadata: { loadedAt: '', source: 'firestore' } }
      });

      expect(res).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: sub, reason: 'PAST_DUE' });
    });

    it('TEST 9 — deve retornar SUBSCRIPTION_INACTIVE com reason "UNPAID" para "unpaid"', () => {
      const controller = new CentralEntryController();
      const sub: SubscriptionData = { planId: 'pro', status: 'unpaid' };

      const res = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: sub, metadata: { loadedAt: '', source: 'firestore' } }
      });

      expect(res).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: sub, reason: 'UNPAID' });
    });

    it('TEST 10 — deve retornar SUBSCRIPTION_INACTIVE com reason "INCOMPLETE" e "INCOMPLETE_EXPIRED" respectivamente', () => {
      const controller = new CentralEntryController();
      const subInc: SubscriptionData = { planId: 'pro', status: 'incomplete' };
      const subIncExp: SubscriptionData = { planId: 'pro', status: 'incomplete_expired' };

      const resInc = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: subInc, metadata: { loadedAt: '', source: 'firestore' } }
      });

      const resIncExp = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: subIncExp, metadata: { loadedAt: '', source: 'firestore' } }
      });

      expect(resInc).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: subInc, reason: 'INCOMPLETE' });
      expect(resIncExp).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: subIncExp, reason: 'INCOMPLETE_EXPIRED' });
    });

    it('TEST 11 — deve retornar SUBSCRIPTION_INACTIVE com reason "PENDING" para "pending" e "pending_payment"', () => {
      const controller = new CentralEntryController();
      const subPend: SubscriptionData = { planId: 'pro', status: 'pending' };
      const subPendPay: SubscriptionData = { planId: 'pro', status: 'pending_payment' };

      const resPend = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: subPend, metadata: { loadedAt: '', source: 'firestore' } }
      });

      const resPendPay = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: subPendPay, metadata: { loadedAt: '', source: 'firestore' } }
      });

      expect(resPend).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: subPend, reason: 'PENDING' });
      expect(resPendPay).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: subPendPay, reason: 'PENDING' });
    });

    it('TEST 12 — deve retornar SUBSCRIPTION_INACTIVE para "failed", "paused", "suspended", "refunded" e "inactive"', () => {
      const controller = new CentralEntryController();
      const cases: [string, any][] = [
        ['failed', 'FAILED'],
        ['paused', 'PAUSED'],
        ['suspended', 'SUSPENDED'],
        ['refunded', 'REFUNDED'],
        ['inactive', 'INACTIVE']
      ];

      for (const [st, expectedReason] of cases) {
        const sub: SubscriptionData = { planId: 'pro', status: st };
        const res = controller.resolveSubscriptionState({
          session: { status: 'NOT_FOUND' },
          account: { status: 'NOT_FOUND' },
          profile: { status: 'NOT_FOUND' },
          access: { status: 'NOT_FOUND' },
          subscription: { status: 'FOUND', data: sub, metadata: { loadedAt: '', source: 'firestore' } }
        });
        expect(res).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: sub, reason: expectedReason });
      }
    });

    it('TEST 13 — deve retornar SUBSCRIPTION_UNKNOWN e JAMAIS conceder acesso para status desconhecido/não-reconhecido', () => {
      const controller = new CentralEntryController();
      const unknownStatuses = ['custom_hacked_status', 'vip_lifetime_bogus', 'super_plan', '', 'xyz123'];

      for (const unk of unknownStatuses) {
        const sub: SubscriptionData = { planId: 'pro', status: unk };
        const res = controller.resolveSubscriptionState({
          session: { status: 'NOT_FOUND' },
          account: { status: 'NOT_FOUND' },
          profile: { status: 'NOT_FOUND' },
          access: { status: 'NOT_FOUND' },
          subscription: { status: 'FOUND', data: sub, metadata: { loadedAt: '', source: 'firestore' } }
        });

        expect(res).toEqual({
          status: 'SUBSCRIPTION_UNKNOWN',
          subscription: sub,
          rawStatus: unk
        });
        expect(res.status).not.toBe('SUBSCRIPTION_ACTIVE');
      }
    });

    it('TEST 14 — deve realizar matching case-insensitive e com trim sem modificar o objeto SubscriptionData original', () => {
      const controller = new CentralEntryController();
      const subWithUpper: SubscriptionData = { planId: 'pro', status: '  ACTIVE  ' };
      const subCancelledMixed: SubscriptionData = { planId: 'pro', status: 'Cancelled ' };

      const resUpper = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: subWithUpper, metadata: { loadedAt: '', source: 'firestore' } }
      });

      const resMixed = controller.resolveSubscriptionState({
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'FOUND', data: subCancelledMixed, metadata: { loadedAt: '', source: 'firestore' } }
      });

      expect(resUpper).toEqual({ status: 'SUBSCRIPTION_ACTIVE', subscription: subWithUpper });
      expect(subWithUpper.status).toBe('  ACTIVE  '); // Objeto original intacto
      expect(resMixed).toEqual({ status: 'SUBSCRIPTION_INACTIVE', subscription: subCancelledMixed, reason: 'CANCELLED' });
      expect(subCancelledMixed.status).toBe('Cancelled '); // Objeto original intacto
    });

    it('TEST 15 — deve manter a preservação referencial exata de SubscriptionData no payload', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'FOUND',
          data: mockActiveSubscription,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
        }
      };

      const resolution = controller.resolveSubscriptionState(snapshot);

      expect(resolution.status).toBe('SUBSCRIPTION_ACTIVE');
      if (resolution.status === 'SUBSCRIPTION_ACTIVE') {
        expect(resolution.subscription).toBe(mockActiveSubscription);
      }
    });

    it('TEST 16 — deve manter a preservação referencial exata do objeto error quando ERROR', () => {
      const controller = new CentralEntryController();
      const errorObj = {
        code: 'MALFORMED_DOCUMENT' as const,
        message: 'Documento de subscrição inválido'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'ERROR', error: errorObj }
      };

      const resolution = controller.resolveSubscriptionState(snapshot);

      expect(resolution.status).toBe('SUBSCRIPTION_ERROR');
      if (resolution.status === 'SUBSCRIPTION_ERROR') {
        expect(resolution.error).toBe(errorObj);
      }
    });

    it('TEST 17 — deve comprovar que dados em SmartProfile ou IntelligentProfile NÃO são usados como fonte de subscrição', () => {
      const controller = new CentralEntryController();
      const profileWithCustomData = {
        ...mockSmartProfile,
        subscription: {
          plan: { value: 'pro_annual', confidence: 1, source: 'test', lastUpdated: '', validationStatus: 'valid', version: '1' },
          renewalDate: { value: '2026-12-31', confidence: 1, source: 'test', lastUpdated: '', validationStatus: 'valid', version: '1' }
        }
      } as unknown as SmartProfile;
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: {
          status: 'FOUND',
          data: profileWithCustomData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSubscriptionState(snapshot);
      expect(resolution.status).toBe('SUBSCRIPTION_MISSING');
    });

    it('TEST 18 — deve comprovar que AccountData (status, roles, tenantId) NÃO é usado como fonte de subscrição', () => {
      const controller = new CentralEntryController();
      const accountWithData: AccountData = {
        ...mockAccountData,
        status: 'ACTIVE',
        roles: ['SUPER_ADMIN', 'PREMIUM'],
        tenantId: 'tenant-123'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: {
          status: 'FOUND',
          data: accountWithData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSubscriptionState(snapshot);
      expect(resolution.status).toBe('SUBSCRIPTION_MISSING');
    });

    it('TEST 19 — deve comprovar que AccessAssignmentData (role, organizationId, status) NÃO é usado como fonte de subscrição', () => {
      const controller = new CentralEntryController();
      const accessWithData: AccessAssignmentData = {
        ...mockAccessAssignmentData,
        role: 'ORG_ADMIN',
        organizationId: 'enterprise-org',
        status: 'ACTIVE'
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: {
          status: 'FOUND',
          data: accessWithData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveSubscriptionState(snapshot);
      expect(resolution.status).toBe('SUBSCRIPTION_MISSING');
    });

    it('TEST 20 — deve comprovar que UID NÃO é revalidado nem comparado entre session.uid e account.id dentro de resolveSubscriptionState', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: { ...mockSessionData, uid: 'uid-AAA' },
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: {
          status: 'FOUND',
          data: { ...mockAccountData, id: 'uid-BBB' },
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'FOUND',
          data: mockActiveSubscription,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
        }
      };

      const resolution = controller.resolveSubscriptionState(snapshot);
      expect(resolution.status).toBe('SUBSCRIPTION_ACTIVE');
    });

    it('TEST 21 — deve comprovar zero chamadas a todos os cinco loaders ao executar resolveSubscriptionState', () => {
      const mockSessionLoader = { loadFromUser: vi.fn() } as any;
      const mockAccountLoader = { loadAccount: vi.fn() } as any;
      const mockProfileLoader = { loadProfile: vi.fn() } as any;
      const mockAccessLoader = { loadAssignment: vi.fn() } as any;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as any;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'FOUND',
          data: mockActiveSubscription,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
        }
      };

      controller.resolveSubscriptionState(snapshot);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('TEST 22 — deve comprovar zero reexecuções dos portões do controller ao resolver subscrição', () => {
      const controller = new CentralEntryController();

      const loadSessionSpy = vi.spyOn(controller, 'loadSession');
      const loadAccountSpy = vi.spyOn(controller, 'loadAccountForSession');
      const loadProfileSpy = vi.spyOn(controller, 'loadProfileForAccount');
      const loadAccessSpy = vi.spyOn(controller, 'loadAccessForIdentity');
      const loadSubscriptionSpy = vi.spyOn(controller, 'loadSubscriptionForIdentity');

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'FOUND',
          data: mockActiveSubscription,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
        }
      };

      controller.resolveSubscriptionState(snapshot);

      expect(loadSessionSpy).not.toHaveBeenCalled();
      expect(loadAccountSpy).not.toHaveBeenCalled();
      expect(loadProfileSpy).not.toHaveBeenCalled();
      expect(loadAccessSpy).not.toHaveBeenCalled();
      expect(loadSubscriptionSpy).not.toHaveBeenCalled();
    });

    it('TEST 23 — deve comprovar que o método resolveSubscriptionState é estritamente síncrono e não retorna Promise', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const result = controller.resolveSubscriptionState(snapshot);

      expect(result).not.toBeInstanceOf(Promise);
      expect(typeof (result as any).then).toBe('undefined');
    });

    it('TEST 24 — deve comprovar que resolveSubscriptionState não altera o snapshot recebido nem os objetos de resultado de loader', () => {
      const controller = new CentralEntryController();
      const subResult = {
        status: 'FOUND' as const,
        data: mockActiveSubscription,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
      };
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: subResult
      };

      const snapshotCopyBefore = JSON.stringify(snapshot);

      controller.resolveSubscriptionState(snapshot);

      const snapshotCopyAfter = JSON.stringify(snapshot);

      expect(snapshotCopyAfter).toBe(snapshotCopyBefore);
    });

    it('TEST 25 — deve comprovar determinismo puro: chamadas repetidas com o mesmo snapshot produzem exatamente o mesmo resultado', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'NOT_FOUND' },
        account: { status: 'NOT_FOUND' },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: {
          status: 'FOUND',
          data: mockActiveSubscription,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
        }
      };

      const res1 = controller.resolveSubscriptionState(snapshot);
      const res2 = controller.resolveSubscriptionState(snapshot);

      expect(res1).toEqual(res2);
    });

    it('TEST 26 — deve comprovar que resolveSessionState, resolveAccountState, resolveProfileState e resolveAccessState continuam totalmente funcionais e sem regressões', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        session: {
          status: 'FOUND',
          data: mockSessionData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
        },
        account: {
          status: 'FOUND',
          data: mockAccountData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        profile: {
          status: 'FOUND',
          data: mockSmartProfile,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        access: {
          status: 'FOUND',
          data: mockAccessAssignmentData,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'db' }
        },
        subscription: {
          status: 'FOUND',
          data: mockActiveSubscription,
          metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
        }
      };

      const resSession = controller.resolveSessionState(snapshot);
      const resAccount = controller.resolveAccountState(snapshot);
      const resProfile = controller.resolveProfileState(snapshot);
      const resAccess = controller.resolveAccessState(snapshot);
      const resSub = controller.resolveSubscriptionState(snapshot);

      expect(resSession).toEqual({
        status: 'SESSION_READY',
        session: mockSessionData
      });

      expect(resAccount).toEqual({
        status: 'ACCOUNT_READY',
        account: mockAccountData
      });

      expect(resProfile).toEqual({
        status: 'PROFILE_READY',
        profile: mockSmartProfile
      });

      expect(resAccess).toEqual({
        status: 'ACCESS_READY',
        access: mockAccessAssignmentData
      });

      expect(resSub).toEqual({
        status: 'SUBSCRIPTION_ACTIVE',
        subscription: mockActiveSubscription
      });
    });
  });

  describe('CentralEntryController - Regra Pura Central (resolveEntryState)', () => {
    const mockSessionData: SessionData = {
      uid: 'user_central_123',
      email: 'central@lingolive.test',
      emailVerified: true,
      providerId: 'password'
    };

    const mockAccountData: AccountData = {
      id: 'user_central_123',
      email: 'central@lingolive.test',
      roles: ['TEACHER'],
      status: 'ACTIVE',
      createdAt: '2026-08-07T00:00:00.000Z'
    };

    const mockSmartProfile = {
      userId: 'user_central_123',
      updatedAt: new Date().toISOString()
    } as SmartProfile;

    const mockAccessAssignmentData: AccessAssignmentData = {
      email: 'central@lingolive.test',
      role: 'TEACHER',
      organizationId: 'org_main',
      status: 'ACTIVE',
      grantedAt: new Date().toISOString()
    };

    const mockActiveSubscription: SubscriptionData = {
      planId: 'pro_annual',
      status: 'active',
      currentPeriodEnd: '2026-12-31T23:59:59.000Z',
      cancelAtPeriodEnd: false
    };

    const createValidSnapshot = (): CentralEntrySnapshot => ({
      session: {
        status: 'FOUND',
        data: mockSessionData,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'auth' }
      },
      account: {
        status: 'FOUND',
        data: mockAccountData,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_accounts' }
      },
      profile: {
        status: 'FOUND',
        data: mockSmartProfile,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_profiles' }
      },
      access: {
        status: 'FOUND',
        data: mockAccessAssignmentData,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_access' }
      },
      subscription: {
        status: 'FOUND',
        data: mockActiveSubscription,
        metadata: { loadedAt: '2026-08-07T00:00:00.000Z', source: 'firestore_subscriptions' }
      }
    });

    it('TEST 1 — deve retornar ENTRY_AUTHORIZED quando todos os 5 portões forem plenamente válidos e ativos', () => {
      const controller = new CentralEntryController();
      const snapshot = createValidSnapshot();

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'ENTRY_AUTHORIZED',
        session: mockSessionData,
        account: mockAccountData,
        profile: mockSmartProfile,
        access: mockAccessAssignmentData,
        subscription: mockActiveSubscription
      });
    });

    it('TEST 2 — deve manter preservação referencial exata de todos os dados no payload ENTRY_AUTHORIZED', () => {
      const controller = new CentralEntryController();
      const snapshot = createValidSnapshot();

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution.status).toBe('ENTRY_AUTHORIZED');
      if (resolution.status === 'ENTRY_AUTHORIZED') {
        expect(resolution.session).toBe(mockSessionData);
        expect(resolution.account).toBe(mockAccountData);
        expect(resolution.profile).toBe(mockSmartProfile);
        expect(resolution.access).toBe(mockAccessAssignmentData);
        expect(resolution.subscription).toBe(mockActiveSubscription);
      }
    });

    it('TEST 3 — Precedência de Session: deve bloquear em SESSION quando sessão for UNAUTHENTICATED mesmo se todos os outros dados forem válidos', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        session: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'SESSION',
        resolution: {
          status: 'UNAUTHENTICATED'
        }
      });
    });

    it('TEST 4 — Precedência de Session: deve bloquear em SESSION quando sessão for SESSION_ERROR preservando o erro original', () => {
      const controller = new CentralEntryController();
      const sessionError = {
        code: 'UNAUTHENTICATED' as const,
        message: 'Token expirado'
      };
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        session: { status: 'ERROR', error: sessionError }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'SESSION',
        resolution: {
          status: 'SESSION_ERROR',
          error: sessionError
        }
      });
      if (resolution.status === 'BLOCKED' && resolution.gate === 'SESSION' && resolution.resolution.status === 'SESSION_ERROR') {
        expect(resolution.resolution.error).toBe(sessionError);
      }
    });

    it('TEST 5 — Precedência de Account: deve bloquear em ACCOUNT quando conta for ACCOUNT_MISSING mesmo se Profile, Access e Subscription forem válidos', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        account: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'ACCOUNT',
        resolution: {
          status: 'ACCOUNT_MISSING'
        }
      });
    });

    it('TEST 6 — Precedência de Account: deve bloquear em ACCOUNT quando conta for ACCOUNT_ERROR preservando o objeto error', () => {
      const controller = new CentralEntryController();
      const accountError = {
        code: 'FIRESTORE_READ_FAILED' as const,
        message: 'Falha ao ler conta do Firestore'
      };
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        account: { status: 'ERROR', error: accountError }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'ACCOUNT',
        resolution: {
          status: 'ACCOUNT_ERROR',
          error: accountError
        }
      });
      if (resolution.status === 'BLOCKED' && resolution.gate === 'ACCOUNT' && resolution.resolution.status === 'ACCOUNT_ERROR') {
        expect(resolution.resolution.error).toBe(accountError);
      }
    });

    it('TEST 7 — Precedência de Profile: deve bloquear em PROFILE quando perfil for PROFILE_MISSING mesmo se Access e Subscription forem válidos', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        profile: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'PROFILE',
        resolution: {
          status: 'PROFILE_MISSING'
        }
      });
    });

    it('TEST 8 — Precedência de Profile: deve bloquear em PROFILE quando perfil for PROFILE_ERROR preservando o erro', () => {
      const controller = new CentralEntryController();
      const profileError = {
        code: 'MALFORMED_DOCUMENT' as const,
        message: 'Documento de perfil corrompido'
      };
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        profile: { status: 'ERROR', error: profileError }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'PROFILE',
        resolution: {
          status: 'PROFILE_ERROR',
          error: profileError
        }
      });
    });

    it('TEST 9 — Precedência de Access: deve bloquear em ACCESS quando access for ACCESS_MISSING mesmo se Subscription for ACTIVE', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        access: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'ACCESS',
        resolution: {
          status: 'ACCESS_MISSING'
        }
      });
    });

    it('TEST 10 — Precedência de Access: deve bloquear em ACCESS quando access for ACCESS_ERROR preservando o erro', () => {
      const controller = new CentralEntryController();
      const accessError = {
        code: 'FIRESTORE_READ_FAILED' as const,
        message: 'Permissão negada ao ler atribuição'
      };
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        access: { status: 'ERROR', error: accessError }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'ACCESS',
        resolution: {
          status: 'ACCESS_ERROR',
          error: accessError
        }
      });
    });

    it('TEST 11 — Portão de Subscription: deve bloquear em SUBSCRIPTION quando subscrição for SUBSCRIPTION_MISSING e jamais conceder acesso', () => {
      const controller = new CentralEntryController();
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'SUBSCRIPTION',
        resolution: {
          status: 'SUBSCRIPTION_MISSING'
        }
      });
      expect(resolution.status).not.toBe('ENTRY_AUTHORIZED');
    });

    it('TEST 12 — Portão de Subscription: deve bloquear em SUBSCRIPTION quando for SUBSCRIPTION_ERROR preservando o erro original', () => {
      const controller = new CentralEntryController();
      const subError = {
        code: 'NETWORK_ERROR' as const,
        message: 'Falha de rede ao verificar subscrição'
      };
      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        subscription: { status: 'ERROR', error: subError }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution).toEqual({
        status: 'BLOCKED',
        gate: 'SUBSCRIPTION',
        resolution: {
          status: 'SUBSCRIPTION_ERROR',
          error: subError
        }
      });
      expect(resolution.status).not.toBe('ENTRY_AUTHORIZED');
    });

    it('TEST 13 — Portão de Subscription: deve bloquear em SUBSCRIPTION para qualquer SUBSCRIPTION_INACTIVE preservando o reason específico', () => {
      const controller = new CentralEntryController();
      const inactiveStatuses = [
        { raw: 'canceled', expectedReason: 'CANCELLED' },
        { raw: 'expired', expectedReason: 'EXPIRED' },
        { raw: 'past_due', expectedReason: 'PAST_DUE' },
        { raw: 'unpaid', expectedReason: 'UNPAID' },
        { raw: 'incomplete', expectedReason: 'INCOMPLETE' },
        { raw: 'incomplete_expired', expectedReason: 'INCOMPLETE_EXPIRED' },
        { raw: 'pending', expectedReason: 'PENDING' },
        { raw: 'failed', expectedReason: 'FAILED' },
        { raw: 'paused', expectedReason: 'PAUSED' },
        { raw: 'suspended', expectedReason: 'SUSPENDED' },
        { raw: 'refunded', expectedReason: 'REFUNDED' },
        { raw: 'inactive', expectedReason: 'INACTIVE' }
      ];

      for (const item of inactiveStatuses) {
        const inactiveSub: SubscriptionData = { planId: 'pro', status: item.raw };
        const snapshot: CentralEntrySnapshot = {
          ...createValidSnapshot(),
          subscription: {
            status: 'FOUND',
            data: inactiveSub,
            metadata: { loadedAt: '', source: 'firestore' }
          }
        };

        const resolution = controller.resolveEntryState(snapshot);

        expect(resolution).toEqual({
          status: 'BLOCKED',
          gate: 'SUBSCRIPTION',
          resolution: {
            status: 'SUBSCRIPTION_INACTIVE',
            subscription: inactiveSub,
            reason: item.expectedReason
          }
        });
        expect(resolution.status).not.toBe('ENTRY_AUTHORIZED');
      }
    });

    it('TEST 14 — Portão de Subscription: deve bloquear em SUBSCRIPTION para status desconhecido (SUBSCRIPTION_UNKNOWN) e jamais conceder acesso por fallback', () => {
      const controller = new CentralEntryController();
      const unknownStatuses = ['vip_unlimited_unauthorized', 'hacked_free', 'custom_bogus', ''];

      for (const raw of unknownStatuses) {
        const unknownSub: SubscriptionData = { planId: 'pro', status: raw };
        const snapshot: CentralEntrySnapshot = {
          ...createValidSnapshot(),
          subscription: {
            status: 'FOUND',
            data: unknownSub,
            metadata: { loadedAt: '', source: 'firestore' }
          }
        };

        const resolution = controller.resolveEntryState(snapshot);

        expect(resolution).toEqual({
          status: 'BLOCKED',
          gate: 'SUBSCRIPTION',
          resolution: {
            status: 'SUBSCRIPTION_UNKNOWN',
            subscription: unknownSub,
            rawStatus: raw
          }
        });
        expect(resolution.status).not.toBe('ENTRY_AUTHORIZED');
      }
    });

    it('TEST 15 — deve conceder ENTRY_AUTHORIZED para todos os status ativos válidos (trialing, trial, cancel_at_period_end, in_grace_period, grace_period)', () => {
      const controller = new CentralEntryController();
      const validActiveStatuses = ['trialing', 'trial', 'cancel_at_period_end', 'in_grace_period', 'grace_period'];

      for (const st of validActiveStatuses) {
        const subData: SubscriptionData = { planId: 'pro', status: st };
        const snapshot: CentralEntrySnapshot = {
          ...createValidSnapshot(),
          subscription: {
            status: 'FOUND',
            data: subData,
            metadata: { loadedAt: '', source: 'firestore' }
          }
        };

        const resolution = controller.resolveEntryState(snapshot);

        expect(resolution).toEqual({
          status: 'ENTRY_AUTHORIZED',
          session: mockSessionData,
          account: mockAccountData,
          profile: mockSmartProfile,
          access: mockAccessAssignmentData,
          subscription: subData
        });
      }
    });

    it('TEST 16 — Zero I/O, zero efeitos colaterais e pura síncrona (não retorna Promise)', () => {
      const controller = new CentralEntryController();
      const snapshot = createValidSnapshot();

      const result = controller.resolveEntryState(snapshot);

      expect(typeof result).toBe('object');
      expect(typeof (result as any).then).toBe('undefined');
    });

    it('TEST 17 — Zero chamadas a todos os cinco loaders ao executar resolveEntryState', () => {
      const mockSessionLoader = { loadFromUser: vi.fn() } as unknown as SessionLoader;
      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const snapshot = createValidSnapshot();
      controller.resolveEntryState(snapshot);

      expect(mockSessionLoader.loadFromUser).not.toHaveBeenCalled();
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();
    });

    it('TEST 18 — Prova de Short-Circuiting: se Session falhar, não avalia Account, Profile, Access nem Subscription', () => {
      const controller = new CentralEntryController();
      const spySession = vi.spyOn(controller, 'resolveSessionState');
      const spyAccount = vi.spyOn(controller, 'resolveAccountState');
      const spyProfile = vi.spyOn(controller, 'resolveProfileState');
      const spyAccess = vi.spyOn(controller, 'resolveAccessState');
      const spySubscription = vi.spyOn(controller, 'resolveSubscriptionState');

      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        session: { status: 'NOT_FOUND' }
      };

      const res = controller.resolveEntryState(snapshot);

      expect(res.status).toBe('BLOCKED');
      if (res.status === 'BLOCKED') {
        expect(res.gate).toBe('SESSION');
      }
      expect(spySession).toHaveBeenCalledTimes(1);
      expect(spyAccount).not.toHaveBeenCalled();
      expect(spyProfile).not.toHaveBeenCalled();
      expect(spyAccess).not.toHaveBeenCalled();
      expect(spySubscription).not.toHaveBeenCalled();
    });

    it('TEST 19 — Prova de Short-Circuiting: se Account falhar, não avalia Profile, Access nem Subscription', () => {
      const controller = new CentralEntryController();
      const spySession = vi.spyOn(controller, 'resolveSessionState');
      const spyAccount = vi.spyOn(controller, 'resolveAccountState');
      const spyProfile = vi.spyOn(controller, 'resolveProfileState');
      const spyAccess = vi.spyOn(controller, 'resolveAccessState');
      const spySubscription = vi.spyOn(controller, 'resolveSubscriptionState');

      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        account: { status: 'NOT_FOUND' }
      };

      const res = controller.resolveEntryState(snapshot);

      expect(res.status).toBe('BLOCKED');
      if (res.status === 'BLOCKED') {
        expect(res.gate).toBe('ACCOUNT');
      }
      expect(spySession).toHaveBeenCalledTimes(1);
      expect(spyAccount).toHaveBeenCalledTimes(1);
      expect(spyProfile).not.toHaveBeenCalled();
      expect(spyAccess).not.toHaveBeenCalled();
      expect(spySubscription).not.toHaveBeenCalled();
    });

    it('TEST 20 — Prova de Short-Circuiting: se Profile falhar, não avalia Access nem Subscription', () => {
      const controller = new CentralEntryController();
      const spySession = vi.spyOn(controller, 'resolveSessionState');
      const spyAccount = vi.spyOn(controller, 'resolveAccountState');
      const spyProfile = vi.spyOn(controller, 'resolveProfileState');
      const spyAccess = vi.spyOn(controller, 'resolveAccessState');
      const spySubscription = vi.spyOn(controller, 'resolveSubscriptionState');

      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        profile: { status: 'NOT_FOUND' }
      };

      const res = controller.resolveEntryState(snapshot);

      expect(res.status).toBe('BLOCKED');
      if (res.status === 'BLOCKED') {
        expect(res.gate).toBe('PROFILE');
      }
      expect(spySession).toHaveBeenCalledTimes(1);
      expect(spyAccount).toHaveBeenCalledTimes(1);
      expect(spyProfile).toHaveBeenCalledTimes(1);
      expect(spyAccess).not.toHaveBeenCalled();
      expect(spySubscription).not.toHaveBeenCalled();
    });

    it('TEST 21 — Prova de Short-Circuiting: se Access falhar, não avalia Subscription', () => {
      const controller = new CentralEntryController();
      const spySession = vi.spyOn(controller, 'resolveSessionState');
      const spyAccount = vi.spyOn(controller, 'resolveAccountState');
      const spyProfile = vi.spyOn(controller, 'resolveProfileState');
      const spyAccess = vi.spyOn(controller, 'resolveAccessState');
      const spySubscription = vi.spyOn(controller, 'resolveSubscriptionState');

      const snapshot: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        access: { status: 'NOT_FOUND' }
      };

      const res = controller.resolveEntryState(snapshot);

      expect(res.status).toBe('BLOCKED');
      if (res.status === 'BLOCKED') {
        expect(res.gate).toBe('ACCESS');
      }
      expect(spySession).toHaveBeenCalledTimes(1);
      expect(spyAccount).toHaveBeenCalledTimes(1);
      expect(spyProfile).toHaveBeenCalledTimes(1);
      expect(spyAccess).toHaveBeenCalledTimes(1);
      expect(spySubscription).not.toHaveBeenCalled();
    });

    it('TEST 22 — Matriz de Cenários Contraditórios: subscrição ativa nunca ultrapassa falhas de portões anteriores', () => {
      const controller = new CentralEntryController();

      // Caso A: Session NOT_FOUND, todos os outros perfeitos + sub ACTIVE
      const resA = controller.resolveEntryState({
        ...createValidSnapshot(),
        session: { status: 'NOT_FOUND' }
      });
      expect(resA).toEqual({
        status: 'BLOCKED',
        gate: 'SESSION',
        resolution: { status: 'UNAUTHENTICATED' }
      });

      // Caso B: Account ERROR, Profile/Access/Sub perfeitos
      const resB = controller.resolveEntryState({
        ...createValidSnapshot(),
        account: { status: 'ERROR', error: { code: 'FIRESTORE_READ_FAILED', message: 'sem permissao' } }
      });
      expect(resB).toEqual({
        status: 'BLOCKED',
        gate: 'ACCOUNT',
        resolution: { status: 'ACCOUNT_ERROR', error: { code: 'FIRESTORE_READ_FAILED', message: 'sem permissao' } }
      });

      // Caso C: Profile NOT_FOUND, Access/Sub perfeitos
      const resC = controller.resolveEntryState({
        ...createValidSnapshot(),
        profile: { status: 'NOT_FOUND' }
      });
      expect(resC).toEqual({
        status: 'BLOCKED',
        gate: 'PROFILE',
        resolution: { status: 'PROFILE_MISSING' }
      });

      // Caso D: Access ERROR, Sub perfeito
      const resD = controller.resolveEntryState({
        ...createValidSnapshot(),
        access: { status: 'ERROR', error: { code: 'UNKNOWN_ERROR', message: 'falha access' } }
      });
      expect(resD).toEqual({
        status: 'BLOCKED',
        gate: 'ACCESS',
        resolution: { status: 'ACCESS_ERROR', error: { code: 'UNKNOWN_ERROR', message: 'falha access' } }
      });
    });

    it('TEST 23 — Imutabilidade: resolveEntryState não altera o snapshot recebido nem os dados internos', () => {
      const controller = new CentralEntryController();
      const snapshot = createValidSnapshot();
      const snapshotCopyBefore = JSON.stringify(snapshot);

      controller.resolveEntryState(snapshot);

      const snapshotCopyAfter = JSON.stringify(snapshot);
      expect(snapshotCopyAfter).toBe(snapshotCopyBefore);
    });

    it('TEST 24 — Determinismo Puro: chamadas repetidas com snapshot equivalente produzem exatamente a mesma resolução', () => {
      const controller = new CentralEntryController();
      const snapshot = createValidSnapshot();

      const res1 = controller.resolveEntryState(snapshot);
      const res2 = controller.resolveEntryState(snapshot);

      expect(res1).toEqual(res2);
    });

    it('TEST 25 — Alterar dados de um portão posterior não altera o resultado bloqueado por um portão anterior', () => {
      const controller = new CentralEntryController();

      const snapshotBase: CentralEntrySnapshot = {
        ...createValidSnapshot(),
        session: { status: 'NOT_FOUND' }
      };

      const resWithActiveSub = controller.resolveEntryState(snapshotBase);

      const snapshotWithInactiveSub: CentralEntrySnapshot = {
        ...snapshotBase,
        subscription: {
          status: 'FOUND',
          data: { planId: 'pro', status: 'canceled' },
          metadata: { loadedAt: '', source: 'firestore' }
        }
      };
      const resWithInactiveSub = controller.resolveEntryState(snapshotWithInactiveSub);

      const snapshotWithMissingSub: CentralEntrySnapshot = {
        ...snapshotBase,
        subscription: { status: 'NOT_FOUND' }
      };
      const resWithMissingSub = controller.resolveEntryState(snapshotWithMissingSub);

      expect(resWithActiveSub).toEqual(resWithInactiveSub);
      expect(resWithActiveSub).toEqual(resWithMissingSub);
      expect(resWithActiveSub).toEqual({
        status: 'BLOCKED',
        gate: 'SESSION',
        resolution: { status: 'UNAUTHENTICATED' }
      });
    });
  });

  describe('Orquestração Assíncrona Completa: resolveCurrentEntry', () => {
    const validSessionData: SessionData = {
      uid: 'usr_valid_123',
      email: 'aluno@lingolive.ia',
      emailVerified: true,
      providerId: 'password'
    };

    const validAccountData: AccountData = {
      id: 'usr_valid_123',
      email: 'aluno@lingolive.ia',
      roles: ['Student'],
      createdAt: '2026-08-01T00:00:00.000Z'
    };

    const validProfileData: SmartProfile = {
      identity: {
        userId: { value: 'usr_valid_123', confidence: 1, source: 'firestore', lastUpdated: '', validationStatus: 'valid', version: '1' }
      }
    } as unknown as SmartProfile;

    const validAccessData: AccessAssignmentData = {
      email: 'aluno@lingolive.ia',
      role: 'Student',
      status: 'active',
      grantedAt: '2026-08-01T00:00:00.000Z'
    };

    const validSubscriptionData: SubscriptionData = {
      planId: 'plan_pro_annual',
      status: 'active',
      currentPeriodEnd: '2027-08-01T00:00:00.000Z'
    };

    it('Cenário Feliz Completo: Todos os 5 carregadores respondem com dados válidos -> ENTRY_AUTHORIZED', async () => {
      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({
          status: 'FOUND',
          data: validSessionData,
          metadata: { loadedAt: '2026-08-16T00:00:00.000Z', source: 'firebase_auth' }
        })
      } as unknown as SessionLoader;

      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validAccountData,
          metadata: { loadedAt: '2026-08-16T00:00:00.000Z', source: 'firestore' }
        })
      } as unknown as AccountLoader;

      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validProfileData,
          metadata: { loadedAt: '2026-08-16T00:00:00.000Z', source: 'firestore' }
        })
      } as unknown as IntelligentProfileLoader;

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validAccessData,
          metadata: { loadedAt: '2026-08-16T00:00:00.000Z', source: 'firestore' }
        })
      } as unknown as AccessAssignmentLoader;

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validSubscriptionData,
          metadata: { loadedAt: '2026-08-16T00:00:00.000Z', source: 'firestore' }
        })
      } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const fakeUser = { uid: 'usr_valid_123' } as any;
      const result = await controller.resolveCurrentEntry(fakeUser);

      expect(mockSessionLoader.loadFromUser).toHaveBeenCalledWith(fakeUser);
      expect(mockAccountLoader.loadAccount).toHaveBeenCalledWith('usr_valid_123');
      expect(mockProfileLoader.loadProfile).toHaveBeenCalledWith('usr_valid_123');
      expect(mockAccessLoader.loadAssignment).toHaveBeenCalledWith('aluno@lingolive.ia');
      expect(mockSubscriptionLoader.loadSubscription).toHaveBeenCalledWith('usr_valid_123');

      expect(result).toEqual({
        status: 'ENTRY_AUTHORIZED',
        session: validSessionData,
        account: validAccountData,
        profile: validProfileData,
        access: validAccessData,
        subscription: validSubscriptionData
      });
    });

    it('Sessão Inexistente (user null): Interrompe no portão SESSION sem acionar os loaders do Firestore', async () => {
      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({
          status: 'NOT_FOUND'
        })
      } as unknown as SessionLoader;

      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.resolveCurrentEntry(null);

      expect(mockSessionLoader.loadFromUser).toHaveBeenCalledWith(null);
      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();

      expect(result).toEqual({
        status: 'BLOCKED',
        gate: 'SESSION',
        resolution: {
          status: 'UNAUTHENTICATED'
        }
      });
    });

    it('Erro na Sessão: Bloqueia no portão SESSION com SESSION_ERROR e não aciona Firestore', async () => {
      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({
          status: 'ERROR',
          error: {
            code: 'FIREBASE_AUTH_UNAVAILABLE',
            message: 'Auth backend unreachable'
          }
        })
      } as unknown as SessionLoader;

      const mockAccountLoader = { loadAccount: vi.fn() } as unknown as AccountLoader;
      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const fakeUser = { uid: 'err_usr' } as any;
      const result = await controller.resolveCurrentEntry(fakeUser);

      expect(mockAccountLoader.loadAccount).not.toHaveBeenCalled();
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();

      expect(result).toEqual({
        status: 'BLOCKED',
        gate: 'SESSION',
        resolution: {
          status: 'SESSION_ERROR',
          error: {
            code: 'FIREBASE_AUTH_UNAVAILABLE',
            message: 'Auth backend unreachable'
          }
        }
      });
    });

    it('Conta Inexistente (ACCOUNT_MISSING): Bloqueia no portão ACCOUNT e não carrega Profile, Access ou Sub', async () => {
      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({
          status: 'FOUND',
          data: validSessionData,
          metadata: { loadedAt: '', source: 'firebase_auth' }
        })
      } as unknown as SessionLoader;

      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({
          status: 'NOT_FOUND'
        })
      } as unknown as AccountLoader;

      const mockProfileLoader = { loadProfile: vi.fn() } as unknown as IntelligentProfileLoader;
      const mockAccessLoader = { loadAssignment: vi.fn() } as unknown as AccessAssignmentLoader;
      const mockSubscriptionLoader = { loadSubscription: vi.fn() } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.resolveCurrentEntry({ uid: 'usr_valid_123' } as any);

      expect(mockAccountLoader.loadAccount).toHaveBeenCalledWith('usr_valid_123');
      expect(mockProfileLoader.loadProfile).not.toHaveBeenCalled();
      expect(mockAccessLoader.loadAssignment).not.toHaveBeenCalled();
      expect(mockSubscriptionLoader.loadSubscription).not.toHaveBeenCalled();

      expect(result).toEqual({
        status: 'BLOCKED',
        gate: 'ACCOUNT',
        resolution: {
          status: 'ACCOUNT_MISSING'
        }
      });
    });

    it('Perfil Inexistente (PROFILE_MISSING): Bloqueia no portão PROFILE', async () => {
      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({
          status: 'FOUND',
          data: validSessionData,
          metadata: { loadedAt: '', source: 'firebase_auth' }
        })
      } as unknown as SessionLoader;

      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validAccountData,
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as AccountLoader;

      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({
          status: 'NOT_FOUND'
        })
      } as unknown as IntelligentProfileLoader;

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validAccessData,
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as AccessAssignmentLoader;

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validSubscriptionData,
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.resolveCurrentEntry({ uid: 'usr_valid_123' } as any);

      expect(result).toEqual({
        status: 'BLOCKED',
        gate: 'PROFILE',
        resolution: {
          status: 'PROFILE_MISSING'
        }
      });
    });

    it('Permissão/Acesso Inexistente (ACCESS_MISSING): Bloqueia no portão ACCESS', async () => {
      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({
          status: 'FOUND',
          data: validSessionData,
          metadata: { loadedAt: '', source: 'firebase_auth' }
        })
      } as unknown as SessionLoader;

      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validAccountData,
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as AccountLoader;

      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validProfileData,
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as IntelligentProfileLoader;

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({
          status: 'NOT_FOUND'
        })
      } as unknown as AccessAssignmentLoader;

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validSubscriptionData,
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.resolveCurrentEntry({ uid: 'usr_valid_123' } as any);

      expect(result).toEqual({
        status: 'BLOCKED',
        gate: 'ACCESS',
        resolution: {
          status: 'ACCESS_MISSING'
        }
      });
    });

    it('Subscrição Inativa (Canceled): Bloqueia no portão SUBSCRIPTION com SUBSCRIPTION_INACTIVE', async () => {
      const mockSessionLoader = {
        loadFromUser: vi.fn().mockReturnValue({
          status: 'FOUND',
          data: validSessionData,
          metadata: { loadedAt: '', source: 'firebase_auth' }
        })
      } as unknown as SessionLoader;

      const mockAccountLoader = {
        loadAccount: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validAccountData,
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as AccountLoader;

      const mockProfileLoader = {
        loadProfile: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validProfileData,
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as IntelligentProfileLoader;

      const mockAccessLoader = {
        loadAssignment: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: validAccessData,
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as AccessAssignmentLoader;

      const mockSubscriptionLoader = {
        loadSubscription: vi.fn().mockResolvedValue({
          status: 'FOUND',
          data: {
            planId: 'plan_pro_annual',
            status: 'canceled'
          },
          metadata: { loadedAt: '', source: 'firestore' }
        })
      } as unknown as SubscriptionLoader;

      const controller = new CentralEntryController({
        sessionLoader: mockSessionLoader,
        accountLoader: mockAccountLoader,
        intelligentProfileLoader: mockProfileLoader,
        accessAssignmentLoader: mockAccessLoader,
        subscriptionLoader: mockSubscriptionLoader
      });

      const result = await controller.resolveCurrentEntry({ uid: 'usr_valid_123' } as any);

      expect(result).toEqual({
        status: 'BLOCKED',
        gate: 'SUBSCRIPTION',
        resolution: {
          status: 'SUBSCRIPTION_INACTIVE',
          subscription: {
            planId: 'plan_pro_annual',
            status: 'canceled'
          },
          reason: 'CANCELLED'
        }
      });
    });
  });
});


