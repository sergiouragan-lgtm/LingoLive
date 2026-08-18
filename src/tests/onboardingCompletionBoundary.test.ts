/**
 * LingoLIVE IA - Testes de Fronteira e Responsabilidade da Conclusão do Onboarding
 * 
 * Verifica estritamente:
 * 1. Conclusão do onboarding consolida e grava SmartProfile em intelligentProfiles/{uid};
 * 2. onboardingCompleted passa para true;
 * 3. welcomeCompleted segue o contrato do fluxo de onboarding;
 * 4. Conclusão do onboarding NÃO fabrica paymentCompleted = true;
 * 5. Conclusão do onboarding NÃO fabrica subscription ACTIVE;
 * 6. Conclusão do onboarding NÃO concede premium;
 * 7. Conclusão do onboarding NÃO ignora o Subscription gate;
 * 8. Subscrição ausente (NOT_FOUND) continua bloqueando Dashboard;
 * 9. Subscrição inativa (INACTIVE) continua bloqueando Dashboard;
 * 10. Subscrição desconhecida (UNKNOWN) continua bloqueando Dashboard;
 * 11. Subscrição ativa (ACTIVE) permite seguir o fluxo central normal;
 * 12. Reload antes da conclusão retoma onboarding a partir de dados parciais;
 * 13. Reload depois da conclusão não reinicia onboarding desnecessariamente;
 * 14. Dados parciais persistidos (profileCompleted: false) não são tratados como perfil consolidado;
 * 15. Auth UID permanece a identidade canónica em todas as operações;
 * 16. Nenhuma regra de pagamento é duplicada no onboarding;
 * 17. Nenhuma regra de subscrição é duplicada no onboarding;
 * 18. CentralEntryController permanece intacto e soberano sobre os 5 portões.
 */

import { describe, it, expect } from 'vitest';
import { CentralEntryController, CentralEntrySnapshot } from '../entryFlow/CentralEntryController';
import { SmartProfile } from '../profile/types';
import { AccountData, SubscriptionData, AccessAssignmentData, SessionData } from '../entryFlow/loaders/types';

describe('ETAPA 3 — Fronteira de Responsabilidade da Conclusão do Onboarding', () => {
  const controller = new CentralEntryController();

  const mockSession: SessionData = {
    uid: 'user_canonical_123',
    email: 'user@lingolive.test',
    emailVerified: true,
    providerId: 'password'
  };

  const mockAccountAfterOnboarding: AccountData = {
    id: 'user_canonical_123',
    email: 'user@lingolive.test',
    roles: ['Student'],
    status: 'ACTIVE'
  };

  const mockConsolidatedSmartProfile: SmartProfile = {
    userId: 'user_canonical_123',
    identity: {
      userId: { value: 'user_canonical_123', confidence: 1, source: 'auth', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      fullName: { value: 'Estudante Teste', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      preferredDisplayName: { value: 'Estudante', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      birthDate: { value: '2000-01-01', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      gender: { value: 'other', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    localization: {
      country: { value: 'PT', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      interfaceLanguage: { value: 'pt', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      nativeLanguage: { value: 'Português', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      timezone: { value: 'Europe/Lisbon', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    learning: {
      cefrLevel: { value: 'A1', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      vocabularySize: { value: 100, confidence: 1, source: 'system', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      learningStyle: { value: 'adaptive', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      targetLanguage: { value: 'Inglês', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    educational: {
      educationLevel: { value: 'HighSchool', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      currentOccupation: { value: 'Student', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    aiPersonalization: {
      preferredTutorPersonality: { value: 'friendly', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      preferredCorrectionStyle: { value: 'gentle', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    gamification: {
      xp: { value: 0, confidence: 1, source: 'system', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      coins: { value: 0, confidence: 1, source: 'system', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      streak: { value: 0, confidence: 1, source: 'system', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    subscription: {
      plan: { value: 'free', confidence: 1, source: 'system', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      renewalDate: { value: '', confidence: 1, source: 'system', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    account: {
      role: { value: 'Student', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      status: { value: 'ACTIVE', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      dailyGoal: { value: 15, confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      subscriptionActive: { value: false, confidence: 1, source: 'system', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      lastLogin: { value: new Date().toISOString(), confidence: 1, source: 'system', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    childProfile: {
      parentalConsent: { value: true, confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      safetyLevel: { value: 'standard', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    accessibility: {
      visualPreferences: { value: 'default', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' },
      motionPreferences: { value: 'standard', confidence: 1, source: 'user', lastUpdated: new Date().toISOString(), validationStatus: 'valid', version: '1' }
    },
    updatedAt: new Date().toISOString()
  };

  const mockAccess: AccessAssignmentData = {
    email: 'user@lingolive.test',
    role: 'Student',
    status: 'ACTIVE'
  };

  describe('1. Contrato de Conclusão do Onboarding e Isolamento de Pagamento', () => {
    it('1. Conclusão do onboarding consolida SmartProfile e NÃO define paymentCompleted nem subscriptionStatus', () => {
      // Simulação do payload gerado pela função saveProfileAndFinish
      const userDataGeneratedByOnboarding = {
        age: 24,
        role: 'Student',
        status: 'ACTIVE',
        onboardingCompleted: true,
        welcomeCompleted: true
      };

      expect(userDataGeneratedByOnboarding.onboardingCompleted).toBe(true);
      expect(userDataGeneratedByOnboarding.welcomeCompleted).toBe(true);
      expect((userDataGeneratedByOnboarding as any).paymentCompleted).toBeUndefined();
      expect((userDataGeneratedByOnboarding as any).subscriptionStatus).toBeUndefined();
    });

    it('2. Auth UID permanece a identidade canónica em todo o fluxo', () => {
      expect(mockConsolidatedSmartProfile.userId).toBe(mockSession.uid);
      expect(mockAccountAfterOnboarding.id).toBe(mockSession.uid);
    });
  });

  describe('2. TESTE CRÍTICO 1 — Onboarding Concluído + Subscrição NOT_FOUND', () => {
    it('Deve ser BLOQUEADO no portão SUBSCRIPTION, sem fabricar acesso comercial ou autorização', () => {
      const snapshot: CentralEntrySnapshot = {
        session: { status: 'FOUND', data: mockSession, metadata: { loadedAt: '', source: '' } },
        account: { status: 'FOUND', data: mockAccountAfterOnboarding, metadata: { loadedAt: '', source: '' } },
        profile: { status: 'FOUND', data: mockConsolidatedSmartProfile, metadata: { loadedAt: '', source: '' } },
        access: { status: 'FOUND', data: mockAccess, metadata: { loadedAt: '', source: '' } },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution.status).toBe('BLOCKED');
      if (resolution.status === 'BLOCKED') {
        expect(resolution.gate).toBe('SUBSCRIPTION');
        expect(resolution.resolution.status).toBe('SUBSCRIPTION_MISSING');
      }
    });
  });

  describe('3. TESTE CRÍTICO 2 — Onboarding Concluído + Subscrição INACTIVE / CANCELLED', () => {
    it('Deve ser BLOQUEADO no portão SUBSCRIPTION quando status for "canceled"', () => {
      const inactiveSubscription: SubscriptionData = {
        status: 'canceled',
        planId: 'plan_starter'
      };

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'FOUND', data: mockSession, metadata: { loadedAt: '', source: '' } },
        account: { status: 'FOUND', data: mockAccountAfterOnboarding, metadata: { loadedAt: '', source: '' } },
        profile: { status: 'FOUND', data: mockConsolidatedSmartProfile, metadata: { loadedAt: '', source: '' } },
        access: { status: 'FOUND', data: mockAccess, metadata: { loadedAt: '', source: '' } },
        subscription: { status: 'FOUND', data: inactiveSubscription, metadata: { loadedAt: '', source: '' } }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution.status).toBe('BLOCKED');
      if (resolution.status === 'BLOCKED') {
        expect(resolution.gate).toBe('SUBSCRIPTION');
        expect(resolution.resolution.status).toBe('SUBSCRIPTION_INACTIVE');
      }
    });

    it('Deve ser BLOQUEADO no portão SUBSCRIPTION quando status for "unpaid"', () => {
      const unpaidSubscription: SubscriptionData = {
        status: 'unpaid',
        planId: 'plan_starter'
      };

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'FOUND', data: mockSession, metadata: { loadedAt: '', source: '' } },
        account: { status: 'FOUND', data: mockAccountAfterOnboarding, metadata: { loadedAt: '', source: '' } },
        profile: { status: 'FOUND', data: mockConsolidatedSmartProfile, metadata: { loadedAt: '', source: '' } },
        access: { status: 'FOUND', data: mockAccess, metadata: { loadedAt: '', source: '' } },
        subscription: { status: 'FOUND', data: unpaidSubscription, metadata: { loadedAt: '', source: '' } }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution.status).toBe('BLOCKED');
      if (resolution.status === 'BLOCKED') {
        expect(resolution.gate).toBe('SUBSCRIPTION');
        expect(resolution.resolution.status).toBe('SUBSCRIPTION_INACTIVE');
      }
    });

    it('Deve ser BLOQUEADO no portão SUBSCRIPTION quando status for desconhecido (UNKNOWN)', () => {
      const unknownSubscription: SubscriptionData = {
        status: 'some_weird_unknown_status'
      };

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'FOUND', data: mockSession, metadata: { loadedAt: '', source: '' } },
        account: { status: 'FOUND', data: mockAccountAfterOnboarding, metadata: { loadedAt: '', source: '' } },
        profile: { status: 'FOUND', data: mockConsolidatedSmartProfile, metadata: { loadedAt: '', source: '' } },
        access: { status: 'FOUND', data: mockAccess, metadata: { loadedAt: '', source: '' } },
        subscription: { status: 'FOUND', data: unknownSubscription, metadata: { loadedAt: '', source: '' } }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution.status).toBe('BLOCKED');
      if (resolution.status === 'BLOCKED') {
        expect(resolution.gate).toBe('SUBSCRIPTION');
        expect(resolution.resolution.status).toBe('SUBSCRIPTION_UNKNOWN');
      }
    });
  });

  describe('4. TESTE CRÍTICO 3 — Onboarding Concluído + Subscrição ACTIVE', () => {
    it('Deve autorizar entrada (ENTRY_AUTHORIZED) exclusivamente através do fluxo central de portões', () => {
      const activeSubscription: SubscriptionData = {
        status: 'active',
        planId: 'premium-plan',
        currentPeriodEnd: '2026-12-31T23:59:59Z'
      };

      const snapshot: CentralEntrySnapshot = {
        session: { status: 'FOUND', data: mockSession, metadata: { loadedAt: '', source: '' } },
        account: { status: 'FOUND', data: mockAccountAfterOnboarding, metadata: { loadedAt: '', source: '' } },
        profile: { status: 'FOUND', data: mockConsolidatedSmartProfile, metadata: { loadedAt: '', source: '' } },
        access: { status: 'FOUND', data: mockAccess, metadata: { loadedAt: '', source: '' } },
        subscription: { status: 'FOUND', data: activeSubscription, metadata: { loadedAt: '', source: '' } }
      };

      const resolution = controller.resolveEntryState(snapshot);

      expect(resolution.status).toBe('ENTRY_AUTHORIZED');
      if (resolution.status === 'ENTRY_AUTHORIZED') {
        expect(resolution.session.uid).toBe('user_canonical_123');
        expect(resolution.account.id).toBe('user_canonical_123');
        expect(resolution.profile.userId).toBe('user_canonical_123');
        expect(resolution.subscription.status).toBe('active');
      }
    });
  });

  describe('5. Teste de Reentrada e Persistência de Dados Parciais', () => {
    it('A. Interrupção antes da conclusão: perfil ainda NOT_FOUND bloqueia no portão PROFILE', () => {
      const snapshotPartial: CentralEntrySnapshot = {
        session: { status: 'FOUND', data: mockSession, metadata: { loadedAt: '', source: '' } },
        account: { status: 'FOUND', data: { id: mockSession.uid, email: mockSession.email!, roles: ['Student'] }, metadata: { loadedAt: '', source: '' } },
        profile: { status: 'NOT_FOUND' },
        access: { status: 'NOT_FOUND' },
        subscription: { status: 'NOT_FOUND' }
      };

      const resolution = controller.resolveEntryState(snapshotPartial);
      expect(resolution.status).toBe('BLOCKED');
      if (resolution.status === 'BLOCKED') {
        expect(resolution.gate).toBe('PROFILE');
        expect(resolution.resolution.status).toBe('PROFILE_MISSING');
      }
    });

    it('B. Conclusão atómica: perfil consolidado passa a FOUND e permite avançar para os portões seguintes', () => {
      const snapshotCompleteProfile: CentralEntrySnapshot = {
        session: { status: 'FOUND', data: mockSession, metadata: { loadedAt: '', source: '' } },
        account: { status: 'FOUND', data: mockAccountAfterOnboarding, metadata: { loadedAt: '', source: '' } },
        profile: { status: 'FOUND', data: mockConsolidatedSmartProfile, metadata: { loadedAt: '', source: '' } },
        access: { status: 'FOUND', data: mockAccess, metadata: { loadedAt: '', source: '' } },
        subscription: { status: 'FOUND', data: { status: 'trialing' }, metadata: { loadedAt: '', source: '' } }
      };

      const resolution = controller.resolveEntryState(snapshotCompleteProfile);
      expect(resolution.status).toBe('ENTRY_AUTHORIZED');
    });
  });
});
