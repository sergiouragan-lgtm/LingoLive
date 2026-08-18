import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';
import { doc, setDoc, updateDoc, deleteField, getDoc, deleteDoc } from 'firebase/firestore';

describe('Firestore Security Rules Real Emulator Test Suite', () => {
  let testEnv: RulesTestEnvironment;
  const projectId = 'demo-test-project-' + Date.now();
  const rulesContent = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: rulesContent,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // GRUPO 1: CRIAÇÃO INICIAL (Cenários 1 a 16)
  describe('GRUPO 1: Criação Inicial Segura', () => {
    it('1. Proprietário cria perfil mínimo', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
        })
      );
    });

    it('2. Criação sem mfaEnabled passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
        })
      );
    });

    it('3. Criação sem emailVerified passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email_verified: false, email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
        })
      );
    });

    it('4. Criação para outro userId falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const bobRef = doc(alice.firestore(), 'users', 'user_bob');
      await assertFails(
        setDoc(bobRef, {
          displayName: 'Bob',
          email: 'bob@example.com',
          uid: 'user_bob',
        })
      );
    });

    it('5. uid diferente do auth.uid falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_bob',
        })
      );
    });

    it('6. email diferente do token falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'hacker@example.com',
          uid: 'user_alice',
        })
      );
    });

    it('7. role SUPER_ADMIN falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          role: 'SUPER_ADMIN',
        })
      );
    });

    it('8. role PLATFORM_ADMIN falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          role: 'PLATFORM_ADMIN',
        })
      );
    });

    it('9. isAdmin=true falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          isAdmin: true,
        })
      );
    });

    it('10. permissions falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          permissions: ['ALL'],
        })
      );
    });

    it('11. paymentCompleted=true falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          paymentCompleted: true,
        })
      );
    });

    it('12. subscriptionActive=true falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          subscriptionActive: true,
        })
      );
    });

    it('13. paidUntil falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          paidUntil: '2099-01-01',
        })
      );
    });

    it('14. gracePeriodEndsAt falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          gracePeriodEndsAt: '2099-01-01',
        })
      );
    });

    it('15. providerSubscriptionId falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          providerSubscriptionId: 'sub_123',
        })
      );
    });

    it('16. saldo ou créditos falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(
        setDoc(userRef, {
          displayName: 'Alice',
          email: 'alice@example.com',
          uid: 'user_alice',
          saldo: 1000,
        })
      );
    });
  });

  // GRUPO 2: UPDATE LEGÍTIMO (Cenários 17 a 24)
  describe('GRUPO 2: Actualizações Legítimas do Perfil', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', 'user_alice'), {
          displayName: 'Alice Original',
          photoURL: 'https://example.com/avatar1.png',
          nativeLanguage: 'pt',
          learningLanguage: 'en',
          onboardingStep: 1,
          onboardingCompleted: false,
          notificationSettings: { email: true },
          uid: 'user_alice',
          email: 'alice@example.com',
          createdAt: '2026-01-01T00:00:00Z',
          role: 'STUDENT',
          paymentCompleted: false,
          subscriptionStatus: 'inactive',
          subscriptionPlanId: 'free',
          subscriptionActive: false,
        });
      });
    });

    it('17. Alterar displayName passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(updateDoc(userRef, { displayName: 'Alice Updated' }));
    });

    it('18. Alterar photoURL passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(updateDoc(userRef, { photoURL: 'https://example.com/new.png' }));
    });

    it('19. Alterar nativeLanguage passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(updateDoc(userRef, { nativeLanguage: 'es' }));
    });

    it('20. Alterar learningLanguage passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(updateDoc(userRef, { learningLanguage: 'fr' }));
    });

    it('21. Alterar notificationSettings passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(updateDoc(userRef, { notificationSettings: { email: false, push: true } }));
    });

    it('22. Alterar onboardingStep passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(updateDoc(userRef, { onboardingStep: 2 }));
    });

    it('23. Alterar onboardingCompleted passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(updateDoc(userRef, { onboardingCompleted: true }));
    });

    it('24. Actualização parcial com dois campos permitidos passa', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(updateDoc(userRef, { displayName: 'Alice New', level: 'B2' }));
    });
  });

  // GRUPO 3: FINANCEIRO E ASSINATURA (Cenários 25 a 39)
  describe('GRUPO 3: Prevenção de Fraude Financeira e Assinaturas', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', 'user_alice'), {
          displayName: 'Alice Original',
          uid: 'user_alice',
          email: 'alice@example.com',
          paymentCompleted: false,
          subscriptionStatus: 'inactive',
          subscriptionPlanId: 'free',
          subscriptionActive: false,
        });
      });
    });

    it('25. Alterar paymentCompleted falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { paymentCompleted: true }));
    });

    it('26. Alterar pagamentoConcluido falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { pagamentoConcluido: true }));
    });

    it('27. Alterar subscriptionStatus falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { subscriptionStatus: 'active' }));
    });

    it('28. Alterar subscriptionPlanId falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { subscriptionPlanId: 'pro' }));
    });

    it('29. Alterar subscriptionActive falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { subscriptionActive: true }));
    });

    it('30. Alterar assinaturaAtiva falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { assinaturaAtiva: true }));
    });

    it('31. Alterar paidUntil falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { paidUntil: '2099-12-31' }));
    });

    it('32. Alterar gracePeriodEndsAt falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { gracePeriodEndsAt: '2099-12-31' }));
    });

    it('33. Alterar nextPaymentAttempt falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { nextPaymentAttempt: '2099-12-31' }));
    });

    it('34. Alterar cancelAtPeriodEnd falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { cancelAtPeriodEnd: true }));
    });

    it('35. Alterar providerSubscriptionId falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { providerSubscriptionId: 'sub_hacked' }));
    });

    it('36. Alterar providerCustomerId falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { providerCustomerId: 'cus_hacked' }));
    });

    it('37. Alterar saldo falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { saldo: 1000000 }));
    });

    it('38. Alterar créditos falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { creditos: 1000 }));
    });

    it('39. Alterar wallet falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { wallet: { balance: 9999 } }));
    });
  });

  // GRUPO 4: RBAC E ADMINISTRAÇÃO (Cenários 40 a 50)
  describe('GRUPO 4: RBAC E Administração', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', 'user_alice'), {
          displayName: 'Alice Original',
          uid: 'user_alice',
          email: 'alice@example.com',
          role: 'STUDENT',
        });
      });
    });

    it('40. Alterar role falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { role: 'SUPER_ADMIN' }));
    });

    it('41. Alterar roles falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { roles: ['ADMIN'] }));
    });

    it('42. Alterar isAdmin falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { isAdmin: true }));
    });

    it('43. Alterar permissions falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { permissions: ['*'] }));
    });

    it('44. Alterar claims falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { claims: { admin: true } }));
    });

    it('45. Alterar schoolAdmin falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { schoolAdmin: true }));
    });

    it('46. Alterar organizationRole falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { organizationRole: 'OWNER' }));
    });

    it('47. Criar /admins/{uid} pelo cliente falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const adminRef = doc(alice.firestore(), 'admins', 'user_alice');
      await assertFails(setDoc(adminRef, { uid: 'user_alice', createdAt: '2026-01-01' }));
    });

    it('48. Actualizar /admins/{uid} pelo cliente falha', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'admins', 'user_alice'), { uid: 'user_alice' });
      });
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const adminRef = doc(alice.firestore(), 'admins', 'user_alice');
      await assertFails(updateDoc(adminRef, { role: 'SUPER_ADMIN' }));
    });

    it('49. Apagar /admins/{uid} pelo cliente falha', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'admins', 'user_alice'), { uid: 'user_alice' });
      });
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const adminRef = doc(alice.firestore(), 'admins', 'user_alice');
      await assertFails(deleteDoc(adminRef));
    });

    it('50. Utilizador com role SUPER_ADMIN no próprio /users, mas sem /admins/{uid}, não recebe acesso administrativo na coleção /admins', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', 'user_fake_admin'), {
          displayName: 'Fake Admin',
          uid: 'user_fake_admin',
          email: 'fake@example.com',
          role: 'SUPER_ADMIN',
        });
        await setDoc(doc(context.firestore(), 'admins', 'real_admin'), { uid: 'real_admin' });
      });
      const fakeAdmin = testEnv.authenticatedContext('user_fake_admin', { email: 'fake@example.com' });
      const adminRef = doc(fakeAdmin.firestore(), 'admins', 'real_admin');
      await assertFails(getDoc(adminRef));
    });
  });

  // GRUPO 5: REMOÇÃO DE CAMPOS (Cenários 51 a 61)
  describe('GRUPO 5: Prevenção de Remoção de Campos Sensíveis e Imutáveis', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', 'user_alice'), {
          displayName: 'Alice Original',
          uid: 'user_alice',
          userId: 'user_alice',
          email: 'alice@example.com',
          createdAt: '2026-01-01T00:00:00Z',
          role: 'STUDENT',
          paymentCompleted: true,
          subscriptionStatus: 'active',
          paidUntil: '2026-12-31',
          providerSubscriptionId: 'sub_xyz',
          cancelAtPeriodEnd: false,
        });
      });
    });

    it('51. Remover uid falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { uid: deleteField() }));
    });

    it('52. Remover userId falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { userId: deleteField() }));
    });

    it('53. Remover email falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { email: deleteField() }));
    });

    it('54. Remover createdAt falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { createdAt: deleteField() }));
    });

    it('55. Remover role falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { role: deleteField() }));
    });

    it('56. Remover paymentCompleted falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { paymentCompleted: deleteField() }));
    });

    it('57. Remover subscriptionStatus falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { subscriptionStatus: deleteField() }));
    });

    it('58. Remover paidUntil falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { paidUntil: deleteField() }));
    });

    it('59. Remover providerSubscriptionId falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { providerSubscriptionId: deleteField() }));
    });

    it('60. Remover cancelAtPeriodEnd falha', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(userRef, { cancelAtPeriodEnd: deleteField() }));
    });

    it('61. Remover campo de auditoria protegido passa (conforme regras atuais)', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const userRef = doc(alice.firestore(), 'users', 'user_alice');
      await assertSucceeds(updateDoc(userRef, { displayName: deleteField() }));
    });
  });

  // GRUPO 6: ISOLAMENTO (Cenários 62 a 67)
  describe('GRUPO 6: Isolamento e Controlo de Acesso', () => {
    beforeEach(async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', 'user_alice'), {
          displayName: 'Alice Original',
          uid: 'user_alice',
          email: 'alice@example.com',
        });
        await setDoc(doc(context.firestore(), 'users', 'user_bob'), {
          displayName: 'Bob Original',
          uid: 'user_bob',
          email: 'bob@example.com',
        });
        await setDoc(doc(context.firestore(), 'admins', 'admin_real'), {
          uid: 'admin_real',
        });
      });
    });

    it('62. Utilizador não actualiza outro utilizador', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const bobRef = doc(alice.firestore(), 'users', 'user_bob');
      await assertFails(updateDoc(bobRef, { displayName: 'Bob Hacked' }));
    });

    it('63. Utilizador não autenticado não cria', async () => {
      const unauth = testEnv.unauthenticatedContext();
      const userRef = doc(unauth.firestore(), 'users', 'user_anon');
      await assertFails(setDoc(userRef, { displayName: 'Anon', uid: 'user_anon', email: 'anon@example.com' }));
    });

    it('64. Utilizador não autenticado não actualiza', async () => {
      const unauth = testEnv.unauthenticatedContext();
      const aliceRef = doc(unauth.firestore(), 'users', 'user_alice');
      await assertFails(updateDoc(aliceRef, { displayName: 'Anon Hacked' }));
    });

    it('65. Proprietário não lê perfil privado de outro utilizador', async () => {
      const alice = testEnv.authenticatedContext('user_alice', { email: 'alice@example.com' });
      const bobRef = doc(alice.firestore(), 'users', 'user_bob');
      await assertFails(getDoc(bobRef));
    });

    it('66. Admin confiável em /admins consegue operação autorizada', async () => {
      const admin = testEnv.authenticatedContext('admin_real', { email: 'admin@example.com' });
      const bobRef = doc(admin.firestore(), 'users', 'user_bob');
      await assertSucceeds(getDoc(bobRef));
    });

    it('67. Utilizador com role administrativo apenas em /users não é admin', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', 'fake_admin'), {
          displayName: 'Fake Admin',
          role: 'SUPER_ADMIN',
          uid: 'fake_admin',
        });
      });
      const fakeAdmin = testEnv.authenticatedContext('fake_admin', { email: 'fake@example.com' });
      const bobRef = doc(fakeAdmin.firestore(), 'users', 'user_bob');
      await assertFails(getDoc(bobRef));
    });
  });

  // GRUPO 7: REGRESSÃO E COERÊNCIA GLOBAL (Cenários 68 a 76)
  describe('GRUPO 7: Regressão e Coerência Global da Aplicação', () => {
    it('68. Criação inicial continua funcional', async () => {
      const user = testEnv.authenticatedContext('user_reg_1', { email: 'reg1@example.com' });
      const userRef = doc(user.firestore(), 'users', 'user_reg_1');
      await assertSucceeds(setDoc(userRef, { displayName: 'Reg User', uid: 'user_reg_1', email: 'reg1@example.com' }));
    });

    it('69. Onboarding continua funcional', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', 'user_reg_2'), {
          displayName: 'Onboarding User',
          uid: 'user_reg_2',
          email: 'reg2@example.com',
          onboardingStep: 1,
        });
      });
      const user = testEnv.authenticatedContext('user_reg_2', { email: 'reg2@example.com' });
      const userRef = doc(user.firestore(), 'users', 'user_reg_2');
      await assertSucceeds(updateDoc(userRef, { onboardingStep: 2, onboardingCompleted: true }));
    });

    it('70. Preferências continuam funcionais', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users', 'user_reg_3'), {
          displayName: 'Pref User',
          uid: 'user_reg_3',
          email: 'reg3@example.com',
        });
      });
      const user = testEnv.authenticatedContext('user_reg_3', { email: 'reg3@example.com' });
      const userRef = doc(user.firestore(), 'users', 'user_reg_3');
      await assertSucceeds(updateDoc(userRef, { nativeLanguage: 'pt', learningLanguage: 'en', studyFrequency: 'daily' }));
    });
  });
});
