/**
 * LingoLIVE IA - CentralEntryController
 * 
 * Controlador Central de Entrada (Entry Flow) do ecossistema LingoLIVE IA.
 * Responsável por receber por injeção de dependências e futuramente orquestrar os
 * cinco carregadores seguros de dados (SessionLoader, AccountLoader,
 * IntelligentProfileLoader, AccessAssignmentLoader, SubscriptionLoader).
 * 
 * MANTÉM-SE ISOLADO DA CAMADA DE UI E DE REACT.
 */

import {
  SessionLoader,
  AccountLoader,
  IntelligentProfileLoader,
  AccessAssignmentLoader,
  SubscriptionLoader
} from './loaders';
import { LoaderResult, SessionData, AccountData, AccessAssignmentData, SubscriptionData, LoaderErrorCode } from './loaders/types';
import { SmartProfile } from '../profile/types';
import { User as FirebaseAuthUser } from 'firebase/auth';

export interface CentralEntryControllerDependencies {
  sessionLoader?: SessionLoader;
  accountLoader?: AccountLoader;
  intelligentProfileLoader?: IntelligentProfileLoader;
  accessAssignmentLoader?: AccessAssignmentLoader;
  subscriptionLoader?: SubscriptionLoader;
}

export type SessionEntryResolution =
  | {
      status: 'UNAUTHENTICATED';
    }
  | {
      status: 'SESSION_ERROR';
      error: {
        code: LoaderErrorCode;
        message: string;
      };
    }
  | {
      status: 'SESSION_READY';
      session: SessionData;
    };

export type AccountEntryResolution =
  | {
      status: 'ACCOUNT_MISSING';
    }
  | {
      status: 'ACCOUNT_ERROR';
      error: {
        code: LoaderErrorCode;
        message: string;
      };
    }
  | {
      status: 'ACCOUNT_READY';
      account: AccountData;
    };

export type ProfileEntryResolution =
  | {
      status: 'PROFILE_MISSING';
    }
  | {
      status: 'PROFILE_ERROR';
      error: {
        code: LoaderErrorCode;
        message: string;
      };
    }
  | {
      status: 'PROFILE_READY';
      profile: SmartProfile;
    };

export type AccessEntryResolution =
  | {
      status: 'ACCESS_MISSING';
    }
  | {
      status: 'ACCESS_ERROR';
      error: {
        code: LoaderErrorCode;
        message: string;
      };
    }
  | {
      status: 'ACCESS_READY';
      access: AccessAssignmentData;
    };

export type SubscriptionInactiveReason =
  | 'CANCELLED'
  | 'EXPIRED'
  | 'PAST_DUE'
  | 'UNPAID'
  | 'INCOMPLETE'
  | 'INCOMPLETE_EXPIRED'
  | 'PENDING'
  | 'FAILED'
  | 'PAUSED'
  | 'SUSPENDED'
  | 'REFUNDED'
  | 'INACTIVE';

export type SubscriptionEntryResolution =
  | {
      status: 'SUBSCRIPTION_MISSING';
    }
  | {
      status: 'SUBSCRIPTION_ERROR';
      error: {
        code: LoaderErrorCode;
        message: string;
      };
    }
  | {
      status: 'SUBSCRIPTION_ACTIVE';
      subscription: SubscriptionData;
    }
  | {
      status: 'SUBSCRIPTION_INACTIVE';
      subscription: SubscriptionData;
      reason: SubscriptionInactiveReason;
    }
  | {
      status: 'SUBSCRIPTION_UNKNOWN';
      subscription: SubscriptionData;
      rawStatus: string;
    };

export type CentralEntryGate = 'SESSION' | 'ACCOUNT' | 'PROFILE' | 'ACCESS' | 'SUBSCRIPTION';

export type CentralEntryResolution =
  | {
      status: 'BLOCKED';
      gate: 'SESSION';
      resolution: SessionEntryResolution;
    }
  | {
      status: 'BLOCKED';
      gate: 'ACCOUNT';
      resolution: AccountEntryResolution;
    }
  | {
      status: 'BLOCKED';
      gate: 'PROFILE';
      resolution: ProfileEntryResolution;
    }
  | {
      status: 'BLOCKED';
      gate: 'ACCESS';
      resolution: AccessEntryResolution;
    }
  | {
      status: 'BLOCKED';
      gate: 'SUBSCRIPTION';
      resolution: SubscriptionEntryResolution;
    }
  | {
      status: 'ENTRY_AUTHORIZED';
      session: SessionData;
      account: AccountData;
      profile: SmartProfile;
      access: AccessAssignmentData;
      subscription: SubscriptionData;
    };

export interface CentralEntrySnapshot {
  session: LoaderResult<SessionData>;
  account: LoaderResult<AccountData>;
  profile: LoaderResult<SmartProfile>;
  access: LoaderResult<AccessAssignmentData>;
  subscription: LoaderResult<SubscriptionData>;
}

export class CentralEntryController {
  private readonly sessionLoader: SessionLoader;
  private readonly accountLoader: AccountLoader;
  private readonly intelligentProfileLoader: IntelligentProfileLoader;
  private readonly accessAssignmentLoader: AccessAssignmentLoader;
  private readonly subscriptionLoader: SubscriptionLoader;

  constructor(dependencies: CentralEntryControllerDependencies = {}) {
    this.sessionLoader = dependencies.sessionLoader ?? new SessionLoader();
    this.accountLoader = dependencies.accountLoader ?? new AccountLoader();
    this.intelligentProfileLoader = dependencies.intelligentProfileLoader ?? new IntelligentProfileLoader();
    this.accessAssignmentLoader = dependencies.accessAssignmentLoader ?? new AccessAssignmentLoader();
    this.subscriptionLoader = dependencies.subscriptionLoader ?? new SubscriptionLoader();
  }

  /**
   * Confirma que o controller e todos os seus componentes dependentes estão prontos para orquestração.
   */
  isReady(): boolean {
    return Boolean(
      this.sessionLoader &&
      this.accountLoader &&
      this.intelligentProfileLoader &&
      this.accessAssignmentLoader &&
      this.subscriptionLoader
    );
  }

  /**
   * Retorna as instâncias dos carregadores de dados injetados.
   */
  getDependencies(): Required<CentralEntryControllerDependencies> {
    return {
      sessionLoader: this.sessionLoader,
      accountLoader: this.accountLoader,
      intelligentProfileLoader: this.intelligentProfileLoader,
      accessAssignmentLoader: this.accessAssignmentLoader,
      subscriptionLoader: this.subscriptionLoader
    };
  }

  /**
   * Primeiro Portão de Entrada: Executa a validação e carregamento da sessão de autenticação.
   * Delega exclusivamente para o SessionLoader injetado sem acionar outros carregadores.
   */
  loadSession(user: FirebaseAuthUser | null = null): LoaderResult<SessionData> {
    return this.sessionLoader.loadFromUser(user);
  }

  /**
   * Segundo Portão de Entrada: Carrega os dados da conta do utilizador a partir da sessão resolvida.
   * Recebe o resultado do primeiro portão (loadSession).
   * Se a sessão estiver FOUND, consulta users/{uid} através do AccountLoader injetado.
   * Se a sessão estiver NOT_FOUND ou ERROR, interrompe e preserva o estado sem consultar o Firestore.
   */
  async loadAccountForSession(
    sessionResult: LoaderResult<SessionData>
  ): Promise<LoaderResult<AccountData>> {
    if (sessionResult.status === 'NOT_FOUND') {
      return {
        status: 'NOT_FOUND'
      };
    }

    if (sessionResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: sessionResult.error
      };
    }

    const uid = sessionResult.data.uid;
    return this.accountLoader.loadAccount(uid);
  }

  /**
   * Terceiro Portão de Entrada: Carrega o Perfil Inteligente a partir da sessão e conta resolvidas.
   * Recebe o resultado da sessão (primeiro portão) e da conta (segundo portão).
   * Se Session = FOUND e Account = FOUND com IDs correspondentes, consulta intelligentProfiles/{uid}.
   * Se Session ou Account estiverem NOT_FOUND ou ERROR, interrompe sem consultar o Firestore.
   */
  async loadProfileForAccount(
    sessionResult: LoaderResult<SessionData>,
    accountResult: LoaderResult<AccountData>
  ): Promise<LoaderResult<SmartProfile>> {
    if (sessionResult.status === 'NOT_FOUND') {
      return {
        status: 'NOT_FOUND'
      };
    }

    if (sessionResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: sessionResult.error
      };
    }

    if (accountResult.status === 'NOT_FOUND') {
      return {
        status: 'NOT_FOUND'
      };
    }

    if (accountResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: accountResult.error
      };
    }

    if (sessionResult.data.uid !== accountResult.data.id) {
      return {
        status: 'ERROR',
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Os identificadores da sessão e da conta não correspondem.'
        }
      };
    }

    return this.intelligentProfileLoader.loadProfile(sessionResult.data.uid);
  }

  /**
   * Quarto Portão de Entrada: Carrega a atribuição de acesso oficial em email_permissions/{email_normalizado}.
   * Recebe os resultados resolvidos da sessão (primeiro portão), conta (segundo portão) e perfil (terceiro portão).
   * Profile = NOT_FOUND ou Profile = FOUND não bloqueiam a consulta de permissão.
   * Se Session ou Account forem NOT_FOUND/ERROR, ou Profile for ERROR, ou e-mails/UIDs forem divergentes,
   * interrompe a execução sem consultar o Firestore.
   */
  async loadAccessForIdentity(
    sessionResult: LoaderResult<SessionData>,
    accountResult: LoaderResult<AccountData>,
    profileResult: LoaderResult<SmartProfile>
  ): Promise<LoaderResult<AccessAssignmentData>> {
    if (sessionResult.status === 'NOT_FOUND') {
      return {
        status: 'NOT_FOUND'
      };
    }

    if (sessionResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: sessionResult.error
      };
    }

    if (accountResult.status === 'NOT_FOUND') {
      return {
        status: 'NOT_FOUND'
      };
    }

    if (accountResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: accountResult.error
      };
    }

    if (profileResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: profileResult.error
      };
    }

    if (sessionResult.data.uid !== accountResult.data.id) {
      return {
        status: 'ERROR',
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Os identificadores da sessão e da conta não correspondem.'
        }
      };
    }

    const sessionEmail = sessionResult.data.email;
    if (!sessionEmail || typeof sessionEmail !== 'string' || sessionEmail.trim() === '') {
      return {
        status: 'ERROR',
        error: {
          code: 'INVALID_INPUT',
          message: 'O e-mail autenticado da sessão é inválido ou ausente.'
        }
      };
    }

    const accountEmail = accountResult.data.email;
    if (!accountEmail || typeof accountEmail !== 'string' || sessionEmail.trim().toLowerCase() !== accountEmail.trim().toLowerCase()) {
      return {
        status: 'ERROR',
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'O e-mail autenticado da sessão não corresponde ao e-mail da conta.'
        }
      };
    }

    return this.accessAssignmentLoader.loadAssignment(sessionEmail);
  }

  /**
   * Quinto Portão de Entrada: Carrega o estado bruto de subscrição diretamente de subscriptions/{uid}_sub.
   * Recebe os resultados resolvidos da sessão (1º portão), conta (2º portão), perfil (3º portão) e acesso (4º portão).
   * Profile = NOT_FOUND ou AccessAssignment = NOT_FOUND não bloqueiam a consulta de subscrição.
   * Se Session ou Account forem NOT_FOUND/ERROR, ou Profile/AccessAssignment forem ERROR, ou UIDs forem divergentes,
   * interrompe a execução sem consultar o Firestore.
   */
  async loadSubscriptionForIdentity(
    sessionResult: LoaderResult<SessionData>,
    accountResult: LoaderResult<AccountData>,
    profileResult: LoaderResult<SmartProfile>,
    accessResult: LoaderResult<AccessAssignmentData>
  ): Promise<LoaderResult<SubscriptionData>> {
    if (sessionResult.status === 'NOT_FOUND') {
      return {
        status: 'NOT_FOUND'
      };
    }

    if (sessionResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: sessionResult.error
      };
    }

    if (accountResult.status === 'NOT_FOUND') {
      return {
        status: 'NOT_FOUND'
      };
    }

    if (accountResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: accountResult.error
      };
    }

    if (profileResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: profileResult.error
      };
    }

    if (accessResult.status === 'ERROR') {
      return {
        status: 'ERROR',
        error: accessResult.error
      };
    }

    if (sessionResult.data.uid !== accountResult.data.id) {
      return {
        status: 'ERROR',
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'Os identificadores da sessão e da conta não correspondem.'
        }
      };
    }

    return this.subscriptionLoader.loadSubscription(sessionResult.data.uid);
  }

  /**
   * Agrega os cinco resultados dos portões de entrada em um snapshot puro sem execuções adicionais ou transformações.
   */
  createEntrySnapshot(
    sessionResult: LoaderResult<SessionData>,
    accountResult: LoaderResult<AccountData>,
    profileResult: LoaderResult<SmartProfile>,
    accessResult: LoaderResult<AccessAssignmentData>,
    subscriptionResult: LoaderResult<SubscriptionData>
  ): CentralEntrySnapshot {
    return {
      session: sessionResult,
      account: accountResult,
      profile: profileResult,
      access: accessResult,
      subscription: subscriptionResult
    };
  }

  /**
   * Interpreta o resultado da sessão dentro do snapshot de entrada de forma pura e síncrona.
   * Analisa estritamente apenas snapshot.session sem ler ou ser influenciado pelos demais campos.
   */
  resolveSessionState(snapshot: CentralEntrySnapshot): SessionEntryResolution {
    if (snapshot.session.status === 'NOT_FOUND') {
      return {
        status: 'UNAUTHENTICATED'
      };
    }

    if (snapshot.session.status === 'ERROR') {
      return {
        status: 'SESSION_ERROR',
        error: snapshot.session.error
      };
    }

    return {
      status: 'SESSION_READY',
      session: snapshot.session.data
    };
  }

  /**
   * Interpreta o resultado de Account dentro do snapshot de entrada de forma pura e síncrona.
   * Analisa estritamente apenas snapshot.account sem ler ou ser influenciado pelos demais campos.
   */
  resolveAccountState(snapshot: CentralEntrySnapshot): AccountEntryResolution {
    if (snapshot.account.status === 'NOT_FOUND') {
      return {
        status: 'ACCOUNT_MISSING'
      };
    }

    if (snapshot.account.status === 'ERROR') {
      return {
        status: 'ACCOUNT_ERROR',
        error: snapshot.account.error
      };
    }

    return {
      status: 'ACCOUNT_READY',
      account: snapshot.account.data
    };
  }

  /**
   * Interpreta o resultado de Profile dentro do snapshot de entrada de forma pura e síncrona.
   * Analisa estritamente apenas snapshot.profile sem ler ou ser influenciado pelos demais campos.
   */
  resolveProfileState(snapshot: CentralEntrySnapshot): ProfileEntryResolution {
    if (snapshot.profile.status === 'NOT_FOUND') {
      return {
        status: 'PROFILE_MISSING'
      };
    }

    if (snapshot.profile.status === 'ERROR') {
      return {
        status: 'PROFILE_ERROR',
        error: snapshot.profile.error
      };
    }

    return {
      status: 'PROFILE_READY',
      profile: snapshot.profile.data
    };
  }

  /**
   * Interpreta o resultado de Access dentro do snapshot de entrada de forma pura e síncrona.
   * Analisa estritamente apenas snapshot.access sem ler ou ser influenciado pelos demais campos.
   */
  resolveAccessState(snapshot: CentralEntrySnapshot): AccessEntryResolution {
    if (snapshot.access.status === 'NOT_FOUND') {
      return {
        status: 'ACCESS_MISSING'
      };
    }

    if (snapshot.access.status === 'ERROR') {
      return {
        status: 'ACCESS_ERROR',
        error: snapshot.access.error
      };
    }

    return {
      status: 'ACCESS_READY',
      access: snapshot.access.data
    };
  }

  /**
   * Interpreta o resultado de Subscription dentro do snapshot de entrada de forma pura e síncrona.
   * Analisa estritamente apenas snapshot.subscription sem ler ou ser influenciado pelos demais campos.
   * Diferencia com rigor comercial:
   * - SUBSCRIPTION_MISSING quando NOT_FOUND
   * - SUBSCRIPTION_ERROR quando ERROR (preserva payload)
   * - SUBSCRIPTION_ACTIVE quando o status autoriza acesso (active, trialing, trial, cancel_at_period_end, in_grace_period, grace_period)
   * - SUBSCRIPTION_INACTIVE com reason discriminada para estados conhecidos sem acesso ativo (canceled, expired, past_due, unpaid, etc.)
   * - SUBSCRIPTION_UNKNOWN com fallback ultra-seguro (nunca concede acesso acidental)
   */
  resolveSubscriptionState(snapshot: CentralEntrySnapshot): SubscriptionEntryResolution {
    if (snapshot.subscription.status === 'NOT_FOUND') {
      return {
        status: 'SUBSCRIPTION_MISSING'
      };
    }

    if (snapshot.subscription.status === 'ERROR') {
      return {
        status: 'SUBSCRIPTION_ERROR',
        error: snapshot.subscription.error
      };
    }

    const rawStatus = snapshot.subscription.data.status;
    const normalized = typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : '';

    // 1. Estados que autorizam acesso comercial ativo ou em período de teste/graça
    if (
      normalized === 'active' ||
      normalized === 'trialing' ||
      normalized === 'trial' ||
      normalized === 'cancel_at_period_end' ||
      normalized === 'in_grace_period' ||
      normalized === 'grace_period'
    ) {
      return {
        status: 'SUBSCRIPTION_ACTIVE',
        subscription: snapshot.subscription.data
      };
    }

    // 2. Estados comerciais conhecidos que NÃO autorizam acesso
    if (normalized === 'canceled' || normalized === 'cancelled') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'CANCELLED'
      };
    }

    if (normalized === 'expired') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'EXPIRED'
      };
    }

    if (normalized === 'past_due') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'PAST_DUE'
      };
    }

    if (normalized === 'unpaid') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'UNPAID'
      };
    }

    if (normalized === 'incomplete') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'INCOMPLETE'
      };
    }

    if (normalized === 'incomplete_expired') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'INCOMPLETE_EXPIRED'
      };
    }

    if (normalized === 'pending' || normalized === 'pending_payment') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'PENDING'
      };
    }

    if (normalized === 'failed') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'FAILED'
      };
    }

    if (normalized === 'paused') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'PAUSED'
      };
    }

    if (normalized === 'suspended') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'SUSPENDED'
      };
    }

    if (normalized === 'refunded') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'REFUNDED'
      };
    }

    if (normalized === 'inactive') {
      return {
        status: 'SUBSCRIPTION_INACTIVE',
        subscription: snapshot.subscription.data,
        reason: 'INACTIVE'
      };
    }

    // 3. Fallback ultra-seguro para qualquer estado desconhecido / não mapeado
    return {
      status: 'SUBSCRIPTION_UNKNOWN',
      subscription: snapshot.subscription.data,
      rawStatus: String(rawStatus ?? '')
    };
  }

  /**
   * Resolução Central Pura do Estado de Entrada (resolveEntryState).
   * Combina deterministicamente as cinco regras puras existentes respeitando a ordem
   * de precedência estrita dos 5 portões arquiteturais:
   * 1. Session (resolveSessionState)
   * 2. Account (resolveAccountState)
   * 3. Profile (resolveProfileState)
   * 4. Access (resolveAccessState)
   * 5. Subscription (resolveSubscriptionState)
   *
   * Regras de Pureza e Segurança:
   * - Pura, síncrona e determinística (zero I/O, zero efeitos colaterais).
   * - Curto-circuito seguro no primeiro portão bloqueador.
   * - Nenhuma duplicação de regras internas dos portões.
   * - Nenhum fallback permissivo para subscrições inativas, ausentes, com erro ou desconhecidas.
   * - Preserva integralmente a resolução do portão que motivou o bloqueio.
   */
  resolveEntryState(snapshot: CentralEntrySnapshot): CentralEntryResolution {
    // 1. Portão 1: Session
    const sessionRes = this.resolveSessionState(snapshot);
    if (sessionRes.status !== 'SESSION_READY') {
      return {
        status: 'BLOCKED',
        gate: 'SESSION',
        resolution: sessionRes
      };
    }

    // 2. Portão 2: Account
    const accountRes = this.resolveAccountState(snapshot);
    if (accountRes.status !== 'ACCOUNT_READY') {
      return {
        status: 'BLOCKED',
        gate: 'ACCOUNT',
        resolution: accountRes
      };
    }

    // 3. Portão 3: Profile
    const profileRes = this.resolveProfileState(snapshot);
    if (profileRes.status !== 'PROFILE_READY') {
      return {
        status: 'BLOCKED',
        gate: 'PROFILE',
        resolution: profileRes
      };
    }

    // 4. Portão 4: Access
    const accessRes = this.resolveAccessState(snapshot);
    if (accessRes.status !== 'ACCESS_READY') {
      return {
        status: 'BLOCKED',
        gate: 'ACCESS',
        resolution: accessRes
      };
    }

    // 5. Portão 5: Subscription
    const subscriptionRes = this.resolveSubscriptionState(snapshot);
    if (subscriptionRes.status !== 'SUBSCRIPTION_ACTIVE') {
      return {
        status: 'BLOCKED',
        gate: 'SUBSCRIPTION',
        resolution: subscriptionRes
      };
    }

    // Todos os 5 portões permitiram entrada de forma segura
    return {
      status: 'ENTRY_AUTHORIZED',
      session: sessionRes.session,
      account: accountRes.account,
      profile: profileRes.profile,
      access: accessRes.access,
      subscription: subscriptionRes.subscription
    };
  }

  /**
   * Orquestrador Assíncrono Central de Entrada (resolveCurrentEntry).
   * Executa sequencialmente o SessionLoader, extrai o UID canónico e executa
   * os carregadores de Account, IntelligentProfile, AccessAssignment e Subscription
   * apenas quando a identidade for válida. Constrói o CentralEntrySnapshot e delega
   * a decisão final do estado exclusivamente para this.resolveEntryState(snapshot).
   */
  async resolveCurrentEntry(
    user: FirebaseAuthUser | null = null
  ): Promise<CentralEntryResolution> {
    const sessionResult = this.loadSession(user);

    const accountResult = await this.loadAccountForSession(sessionResult);
    const profileResult = await this.loadProfileForAccount(sessionResult, accountResult);
    const accessResult = await this.loadAccessForIdentity(sessionResult, accountResult, profileResult);
    const subscriptionResult = await this.loadSubscriptionForIdentity(
      sessionResult,
      accountResult,
      profileResult,
      accessResult
    );

    const snapshot = this.createEntrySnapshot(
      sessionResult,
      accountResult,
      profileResult,
      accessResult,
      subscriptionResult
    );

    return this.resolveEntryState(snapshot);
  }
}
