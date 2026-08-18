/**
 * LingoLIVE IA - Contratos de Entrada, Sessão e Resolução de Roteamento
 * 
 * Este ficheiro define os contratos e tipos TypeScript para o futuro Controlador Central de Entrada (Central Entry Controller).
 * Todos os tipos estão estruturados para separar rigorosamente os domínios homologados dos legados,
 * garantindo compatibilidade temporária controlada para evitar regressão nos componentes do sistema.
 */

/**
 * Papéis oficiais homologados para a plataforma.
 * Contrato canónico expandido na Etapa 4 (com compatibilidade temporária para valores legados em transição).
 */
export type OfficialUserRole =
  // Roles canónicos estáveis e novos
  | 'SUPER_ADMIN'
  | 'SCHOOL_OWNER'
  | 'SCHOOL_ADMIN'
  | 'SCHOOL_MANAGER'
  | 'TEACHER'
  | 'NATIVE_LANGUAGE_INSTRUCTOR'
  | 'PARENT_GUARDIAN'
  | 'STUDENT'
  | 'LINGUISTIC_RESEARCHER'
  | 'COMPANY_OWNER'
  | 'COMPANY_ADMIN'
  | 'COMPANY_MANAGER'
  | 'BUSINESS_EMPLOYEE'
  // Roles antigos mantidos temporariamente por compatibilidade durante a migração da Etapa 4
  | 'ORG_ADMIN'
  | 'MANAGER'
  | 'LEARNER'
  | 'PARENT'
  | 'NATIVE_TEACHER'
  | 'BUSINESS_USER';

/**
 * Papéis legados mantidos temporariamente para compatibilidade com fluxos antigos do sistema.
 * @legacy
 */
export type LegacyUserRole =
  | 'PLATFORM_ADMIN'
  | 'SCHOOL_OWNER'
  | 'SCHOOL_ADMIN'
  | 'COORDINATOR'
  | 'STUDENT'
  | 'GUEST'
  | 'PROFESSOR NATIVO'
  | 'INSTRUTOR DE LÍNGUA NATIVA';

/**
 * União para compatibilidade temporária de papéis de utilizador.
 * Utilizada para interoperabilidade com componentes e repositórios antigos que ainda não foram migrados.
 */
export type CompatibleUserRole = OfficialUserRole | LegacyUserRole;

/**
 * @deprecated Use CompatibleUserRole para interoperabilidade ou preferencialmente OfficialUserRole para novos fluxos.
 * Mantido temporariamente apenas para evitar regressões nos componentes legados.
 */
export type UserRole = CompatibleUserRole;

/**
 * Faixas etárias oficiais homologadas.
 * O futuro controlador dependerá de AgeGroup.
 */
export type AgeGroup = 'CHILD' | 'TEEN' | 'ADULT';

/**
 * Faixas etárias legadas usadas pela interface atual do utilizador.
 * @legacy
 */
export type LegacyAgeGroup = 'Infancy' | 'Kids' | 'PreTeens' | 'Teens';

/**
 * União para compatibilidade temporária de faixas etárias.
 */
export type CompatibleAgeGroup = AgeGroup | LegacyAgeGroup;

/**
 * Estados possíveis de uma conta de utilizador no Firestore.
 */
export type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

/**
 * Estados do fluxo de Onboarding inicial.
 */
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

/**
 * Estados do Perfil Inteligente (IntelligentProfile) do utilizador.
 */
export type IntelligentProfileStatus = 'DRAFT' | 'COMPLETED' | 'ACTIVE' | 'ARCHIVED';

/**
 * Estados de necessidade/resolução da avaliação diagnóstica inicial de nível.
 */
export type AssessmentStatus = 'NOT_REQUIRED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

/**
 * Estados de subscrição/pagamento do utilizador.
 */
export type SubscriptionStatus = 'NONE' | 'PENDING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

/**
 * Estados de resolução do ciclo de vida do Controlador Central de Entrada.
 */
export type EntryFlowResolutionStatus =
  | 'IDLE'
  | 'LOADING_AUTH'
  | 'LOADING_ACCOUNT'
  | 'LOADING_PROFILE'
  | 'LOADING_ASSIGNMENTS'
  | 'LOADING_SUBSCRIPTION'
  | 'RESOLVING_DESTINATION'
  | 'RESOLVED'
  | 'RECOVERABLE_ERROR'
  | 'ACCESS_DENIED';

/**
 * Destinos de roteamento finais calculados pelo sistema após validações.
 */
export type EntryDestination =
  | 'PUBLIC'
  | 'LOGIN'
  | 'EMAIL_VERIFICATION'
  | 'ACCOUNT_RECOVERY'
  | 'ACCOUNT_SUSPENDED'
  | 'WELCOME'
  | 'ONBOARDING'
  | 'ASSESSMENT'
  | 'PLAN_SELECTION'
  | 'PAYMENT_RECOVERY'
  | 'CHILD_DASHBOARD'
  | 'TEEN_DASHBOARD'
  | 'ADULT_DASHBOARD'
  | 'PARENT_DASHBOARD'
  | 'TEACHER_DASHBOARD'
  | 'NATIVE_TEACHER_DASHBOARD'
  | 'MANAGER_DASHBOARD'
  | 'ORG_ADMIN_DASHBOARD'
  | 'SUPER_ADMIN_DASHBOARD'
  | 'BUSINESS_DASHBOARD';

/**
 * Códigos de erros recuperáveis do fluxo de entrada (sem expor detalhes sensíveis de infraestrutura).
 */
export type EntryFlowErrorCode =
  | 'AUTH_INITIALIZATION_FAILED'
  | 'FIRESTORE_FETCH_FAILED'
  | 'PROFILE_FETCH_FAILED'
  | 'SUBSCRIPTION_CHECK_FAILED'
  | 'NETWORK_DISCONNECTED'
  | 'UNKNOWN_ERROR';

/**
 * Resultado estruturado e ultra-seguro do fluxo de resolução de entrada (EntryFlowResult).
 * Implementado como uma união discriminada (discriminated union) baseada no campo 'status'.
 * Isto garante que estados inválidos (ex: carregar sem dados ou resolvido sem destino) sejam impossíveis em tempo de compilação.
 */
export type EntryFlowResult =
  | {
      status: 'IDLE';
    }
  | {
      status:
        | 'LOADING_AUTH'
        | 'LOADING_ACCOUNT'
        | 'LOADING_PROFILE'
        | 'LOADING_ASSIGNMENTS'
        | 'LOADING_SUBSCRIPTION'
        | 'RESOLVING_DESTINATION';
    }
  | {
      status: 'RESOLVED';
      destination: EntryDestination;
      sessionData: {
        uid: string;
        email: string;
        emailVerified: boolean;
        role: OfficialUserRole; // Controlador dependerá estritamente de OfficialUserRole
        accountStatus: AccountStatus;
        onboardingStatus: OnboardingStatus;
        profileStatus: IntelligentProfileStatus;
        assessmentStatus: AssessmentStatus;
        subscriptionStatus: SubscriptionStatus;
        ageGroup: AgeGroup; // Controlador dependerá estritamente de AgeGroup ('CHILD' | 'TEEN' | 'ADULT')
        organizationId?: string;
      };
    }
  | {
      status: 'RECOVERABLE_ERROR';
      code: EntryFlowErrorCode;
      message: string; // Mensagem amigável para exibição ao utilizador
    }
  | {
      status: 'ACCESS_DENIED';
      reason: 'SUSPENDED' | 'UNVERIFIED_EMAIL' | 'ORGANIZATION_MISMATCH' | 'ROLE_TAMPERED' | 'NO_ACCOUNT';
      message: string; // Mensagem amigável explicando o motivo seguro da recusa
    };
