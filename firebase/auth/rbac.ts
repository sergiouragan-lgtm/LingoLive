export type EnterpriseRole =
  | 'SUPER_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'SCHOOL_OWNER'
  | 'SCHOOL_ADMIN'
  | 'COORDINATOR'
  | 'TEACHER'
  | 'NATIVE_TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'CORPORATE_MANAGER'
  | 'EMPLOYEE'
  | 'SCHOOL_MANAGER'
  | 'SCHOOL_COORDINATOR'
  | 'CONTENT_CREATOR'
  | 'MARKETPLACE_SELLER'
  | 'AMBASSADOR'
  | 'MODERATOR'
  | 'SUPPORT_AGENT'
  | 'GUEST';

export interface UserPermission {
  action: string;
  resource: string;
}

// Full RBAC matrix defining permission rules for every enterprise role
export const ROLE_PERMISSIONS: Record<EnterpriseRole, string[]> = {
  SUPER_ADMIN: ['*'], // Full platform access override
  PLATFORM_ADMIN: [
    'users:read', 'users:write', 'profiles:read', 'profiles:write',
    'schools:read', 'schools:write', 'teachers:read', 'teachers:write',
    'students:read', 'students:write', 'companies:read', 'companies:write',
    'subscriptions:read', 'payments:read', 'courses:write', 'assessments:write',
    'marketplace:write', 'audit:read', 'system:write'
  ],
  SCHOOL_OWNER: [
    'school:read', 'school:write', 'teachers:write', 'students:write',
    'billing:read', 'billing:write', 'reports:read'
  ],
  SCHOOL_ADMIN: [
    'school:read', 'teachers:write', 'students:write', 'reports:read'
  ],
  SCHOOL_MANAGER: [
    'school:read', 'teachers:read', 'students:read', 'reports:read'
  ],
  SCHOOL_COORDINATOR: [
    'school:read', 'teachers:read', 'students:read', 'lessons:write', 'reports:read'
  ],
  COORDINATOR: [
    'school:read', 'teachers:read', 'students:read', 'lessons:write'
  ],
  TEACHER: [
    'school:read', 'students:read', 'lessons:write', 'assessments:read',
    'classroom:write', 'grades:write'
  ],
  NATIVE_TEACHER: [
    'school:read', 'students:read', 'lessons:write', 'assessments:read',
    'classroom:write', 'grades:write', 'accent_coaching:write'
  ],
  STUDENT: [
    'lessons:read', 'assessments:read', 'assessments:write', 'marketplace:read',
    'marketplace:purchase', 'gamification:read', 'tutor:write'
  ],
  PARENT: [
    'student_progress:read', 'billing:read', 'billing:write', 'notifications:write'
  ],
  CORPORATE_MANAGER: [
    'company:read', 'company:write', 'employees:write', 'reports:read',
    'billing:read', 'billing:write'
  ],
  EMPLOYEE: [
    'lessons:read', 'assessments:read', 'assessments:write', 'marketplace:read',
    'gamification:read', 'tutor:write'
  ],
  CONTENT_CREATOR: [
    'courses:read', 'courses:write', 'lessons:write', 'questionBank:write'
  ],
  MARKETPLACE_SELLER: [
    'marketplace:read', 'marketplace:write', 'billing:read'
  ],
  AMBASSADOR: [
    'ambassador:read', 'ambassador:write', 'referrals:read', 'marketing:read'
  ],
  MODERATOR: [
    'marketplace:read', 'marketplace:write', 'forums:read', 'forums:write', 'users:read'
  ],
  SUPPORT_AGENT: [
    'users:read', 'profiles:read', 'billing:read', 'tickets:write'
  ],
  GUEST: [
    'lessons:preview', 'marketplace:preview'
  ]
};

/**
 * Validates whether a given role holds the necessary permissions to execute an action.
 */
export function hasPermission(
  userRole: EnterpriseRole,
  requiredPermission: string
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  if (permissions.includes('*')) return true;
  return permissions.includes(requiredPermission);
}

/**
 * Validates tenant-level scoping rules to ensure total tenant/school isolation.
 */
export function validateTenantScoping(
  userTenantId: string,
  resourceTenantId: string,
  userRole: EnterpriseRole
): boolean {
  if (userRole === 'SUPER_ADMIN' || userRole === 'PLATFORM_ADMIN') return true;
  return userTenantId === resourceTenantId;
}
