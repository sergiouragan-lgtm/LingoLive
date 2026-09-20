import { getFirestore } from 'firebase-admin/firestore';
import { logSecurityEvent } from './security.event.logger';

export interface Role {
  roleId: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  status: 'active' | 'inactive';
}

export interface RoleAssignment {
  assignmentId: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
  expiresAt?: Date;
  status: 'active' | 'expired' | 'revoked';
}

export interface Permission {
  permissionId: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: string;
}

export interface AccessPolicy {
  policyId: string;
  name: string;
  rules: AccessRule[];
  createdAt: Date;
  status: 'active' | 'inactive';
}

export interface AccessRule {
  ruleId: string;
  condition: string;
  effect: 'allow' | 'deny';
  resources: string[];
  actions: string[];
  principals: string[];
}

export interface Attribute {
  attributeId: string;
  name: string;
  type: 'user' | 'resource' | 'environment';
  values: string[];
}

export interface AttributeBasedControl {
  controlId: string;
  name: string;
  attributes: string[];
  policy: string;
  status: 'active' | 'inactive';
}

export interface AccessAuditLog {
  logId: string;
  userId: string;
  resource: string;
  action: string;
  timestamp: Date;
  status: 'allowed' | 'denied';
  reason?: string;
  ipAddress?: string;
}

class AccessControlAuthorizationService {
  private db = getFirestore();

  async createRole(
    name: string,
    description: string,
    permissions: string[]
  ): Promise<Role> {
    try {
      const roleId = `role_${Date.now()}`;

      const role: Role = {
        roleId,
        name,
        description,
        permissions,
        createdAt: new Date(),
        status: 'active',
      };

      await this.db.collection('roles').doc(roleId).set(role);

      logSecurityEvent('ROLE_CREATED' as any, 'info' as any, 'Role created', {
        roleId,
        name,
        permissionCount: permissions.length,
      });

      return role;
    } catch (error) {
      logSecurityEvent('ROLE_CREATION_FAILED' as any, 'error' as any, 'Failed to create role', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    expiresAt?: Date
  ): Promise<RoleAssignment> {
    try {
      const assignmentId = `assignment_${Date.now()}`;

      const assignment: RoleAssignment = {
        assignmentId,
        userId,
        roleId,
        assignedAt: new Date(),
        assignedBy,
        expiresAt,
        status: 'active',
      };

      await this.db.collection('role_assignments').doc(assignmentId).set(assignment);

      logSecurityEvent('ROLE_ASSIGNED' as any, 'info' as any, 'Role assigned to user', {
        assignmentId,
        userId,
        roleId,
        assignedBy,
      });

      return assignment;
    } catch (error) {
      logSecurityEvent('ROLE_ASSIGNMENT_FAILED' as any, 'error' as any, 'Failed to assign role', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async definePermission(
    name: string,
    resource: string,
    action: string,
    description: string,
    category: string
  ): Promise<Permission> {
    try {
      const permissionId = `perm_${Date.now()}`;

      const permission: Permission = {
        permissionId,
        name,
        resource,
        action,
        description,
        category,
      };

      await this.db.collection('permissions').doc(permissionId).set(permission);

      logSecurityEvent('PERMISSION_DEFINED' as any, 'info' as any, 'Permission defined', {
        permissionId,
        name,
        resource,
        action,
      });

      return permission;
    } catch (error) {
      logSecurityEvent('PERMISSION_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define permission', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createAccessPolicy(
    name: string,
    rules: AccessRule[]
  ): Promise<AccessPolicy> {
    try {
      const policyId = `policy_${Date.now()}`;

      const policy: AccessPolicy = {
        policyId,
        name,
        rules,
        createdAt: new Date(),
        status: 'active',
      };

      await this.db.collection('access_policies').doc(policyId).set(policy);

      logSecurityEvent('ACCESS_POLICY_CREATED' as any, 'info' as any, 'Access policy created', {
        policyId,
        name,
        ruleCount: rules.length,
      });

      return policy;
    } catch (error) {
      logSecurityEvent('ACCESS_POLICY_CREATION_FAILED' as any, 'error' as any, 'Failed to create access policy', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async defineAttribute(
    name: string,
    type: 'user' | 'resource' | 'environment',
    values: string[]
  ): Promise<Attribute> {
    try {
      const attributeId = `attr_${Date.now()}`;

      const attribute: Attribute = {
        attributeId,
        name,
        type,
        values,
      };

      await this.db.collection('attributes').doc(attributeId).set(attribute);

      logSecurityEvent('ATTRIBUTE_DEFINED' as any, 'info' as any, 'Attribute defined', {
        attributeId,
        name,
        type,
      });

      return attribute;
    } catch (error) {
      logSecurityEvent('ATTRIBUTE_DEFINITION_FAILED' as any, 'error' as any, 'Failed to define attribute', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async createAttributeBasedControl(
    name: string,
    attributes: string[],
    policy: string
  ): Promise<AttributeBasedControl> {
    try {
      const controlId = `abac_${Date.now()}`;

      const control: AttributeBasedControl = {
        controlId,
        name,
        attributes,
        policy,
        status: 'active',
      };

      await this.db.collection('attribute_based_controls').doc(controlId).set(control);

      logSecurityEvent('ATTRIBUTE_BASED_CONTROL_CREATED' as any, 'info' as any, 'Attribute-based control created', {
        controlId,
        name,
        attributeCount: attributes.length,
      });

      return control;
    } catch (error) {
      logSecurityEvent('ATTRIBUTE_BASED_CONTROL_CREATION_FAILED' as any, 'error' as any, 'Failed to create attribute-based control', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async logAccessAttempt(
    userId: string,
    resource: string,
    action: string,
    status: 'allowed' | 'denied',
    ipAddress?: string,
    reason?: string
  ): Promise<AccessAuditLog> {
    try {
      const logId = `accesslog_${Date.now()}`;

      const log: AccessAuditLog = {
        logId,
        userId,
        resource,
        action,
        timestamp: new Date(),
        status,
        ipAddress,
        reason,
      };

      await this.db.collection('access_audit_logs').doc(logId).set(log);

      if (status === 'denied') {
        logSecurityEvent('ACCESS_DENIED' as any, 'warn' as any, 'Access denied', {
          logId,
          userId,
          resource,
          action,
          reason,
        });
      }

      return log;
    } catch (error) {
      logSecurityEvent('ACCESS_LOGGING_FAILED' as any, 'error' as any, 'Failed to log access attempt', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async revokeRole(
    assignmentId: string
  ): Promise<RoleAssignment> {
    try {
      const assignmentDoc = await this.db.collection('role_assignments').doc(assignmentId).get();
      const assignment = assignmentDoc.data() as RoleAssignment;

      if (!assignment) throw new Error('Assignment not found');

      const revokedAssignment: RoleAssignment = {
        ...assignment,
        status: 'revoked',
      };

      await assignmentDoc.ref.update(revokedAssignment);

      logSecurityEvent('ROLE_REVOKED' as any, 'info' as any, 'Role revoked', {
        assignmentId,
        userId: assignment.userId,
        roleId: assignment.roleId,
      });

      return revokedAssignment;
    } catch (error) {
      logSecurityEvent('ROLE_REVOCATION_FAILED' as any, 'error' as any, 'Failed to revoke role', {
        assignmentId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getUserPermissions(
    userId: string
  ): Promise<string[]> {
    try {
      const assignmentsSnapshot = await this.db.collection('role_assignments')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .get();

      const assignments = assignmentsSnapshot.docs.map((doc) => doc.data() as RoleAssignment);
      const roleIds = assignments.map((a) => a.roleId);

      const permissions = new Set<string>();

      for (const roleId of roleIds) {
        const roleDoc = await this.db.collection('roles').doc(roleId).get();
        const role = roleDoc.data() as Role;
        if (role) {
          role.permissions.forEach((perm) => permissions.add(perm));
        }
      }

      logSecurityEvent('USER_PERMISSIONS_RETRIEVED' as any, 'info' as any, 'User permissions retrieved', {
        userId,
        permissionCount: permissions.size,
      });

      return Array.from(permissions);
    } catch (error) {
      logSecurityEvent('USER_PERMISSIONS_RETRIEVAL_FAILED' as any, 'error' as any, 'Failed to retrieve user permissions', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const accessControlAuthorizationService = new AccessControlAuthorizationService();
