export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  SCHOOL_OWNER = 'SCHOOL_OWNER',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  COORDINATOR = 'COORDINATOR',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
  B2C_USER = 'B2C_USER',
  GUEST = 'GUEST',
}

export enum Permission {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  EXPORT = 'EXPORT',
  MANAGE = 'MANAGE',
  APPROVE = 'APPROVE',
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.PLATFORM_ADMIN]: [Permission.READ, Permission.UPDATE, Permission.MANAGE, Permission.EXPORT],
  [Role.SCHOOL_OWNER]: [Permission.READ, Permission.UPDATE, Permission.MANAGE, Permission.APPROVE],
  [Role.SCHOOL_ADMIN]: [Permission.READ, Permission.UPDATE, Permission.MANAGE],
  [Role.COORDINATOR]: [Permission.READ, Permission.UPDATE, Permission.APPROVE],
  [Role.TEACHER]: [Permission.READ, Permission.UPDATE],
  [Role.PARENT]: [Permission.READ],
  [Role.STUDENT]: [Permission.READ],
  [Role.B2C_USER]: [Permission.READ, Permission.CREATE, Permission.UPDATE],
  [Role.GUEST]: [Permission.READ],
};
