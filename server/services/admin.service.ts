import { getFirestore } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logSecurityEvent } from './security.event.logger';

export interface AdminUser {
  uid: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions: string[];
  createdAt: Date;
  lastLogin?: Date;
  status: 'active' | 'inactive' | 'suspended';
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  userRole: 'student' | 'teacher' | 'parent' | 'school_admin';
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'inactive' | 'suspended';
  subscription?: {
    tier: string;
    status: string;
    startDate: Date;
  };
  metadata?: Record<string, any>;
}

export interface RolePermission {
  role: string;
  permissions: string[];
  description: string;
}

class AdminService {
  private db: Firestore;
  private auth: ReturnType<typeof getAuth>;

  constructor() {
    this.db = getFirestore();
    this.auth = getAuth();
  }

  public async createAdminUser(
    email: string,
    password: string,
    role: 'admin' | 'moderator' | 'support'
  ): Promise<AdminUser> {
    try {
      const userRecord = await this.auth.createUser({
        email,
        password,
        emailVerified: true,
      });

      const permissions = this.getPermissionsForRole(role);

      const adminUser: AdminUser = {
        uid: userRecord.uid,
        email,
        role,
        permissions,
        createdAt: new Date(),
        status: 'active',
      };

      await this.db
        .collection('admin_users')
        .doc(userRecord.uid)
        .set(adminUser);

      await this.auth.setCustomUserClaims(userRecord.uid, { role, isAdmin: true });

      logSecurityEvent(
        'ADMIN_USER_CREATED' as any,
        'warning' as any,
        `Admin user created with role ${role}`,
        { email, role },
        { userId: userRecord.uid }
      );

      return adminUser;
    } catch (error: any) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  }

  public async suspendUser(userId: string, reason: string): Promise<void> {
    try {
      await this.db
        .collection('users')
        .doc(userId)
        .update({
          status: 'suspended',
          suspendedAt: new Date(),
          suspensionReason: reason,
        });

      await this.auth.updateUser(userId, { disabled: true });

      logSecurityEvent(
        'USER_SUSPENDED' as any,
        'warning' as any,
        `User suspended by admin`,
        { userId, reason },
        {}
      );
    } catch (error: any) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  public async reactivateUser(userId: string): Promise<void> {
    try {
      await this.db
        .collection('users')
        .doc(userId)
        .update({
          status: 'active',
          suspendedAt: null,
          suspensionReason: null,
        });

      await this.auth.updateUser(userId, { disabled: false });

      logSecurityEvent(
        'USER_REACTIVATED' as any,
        'info' as any,
        `User reactivated by admin`,
        { userId },
        {}
      );
    } catch (error: any) {
      console.error('Error reactivating user:', error);
      throw error;
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    try {
      await this.auth.deleteUser(userId);
      await this.db.collection('users').doc(userId).delete();

      logSecurityEvent(
        'USER_DELETED' as any,
        'warning' as any,
        `User deleted by admin`,
        { userId },
        {}
      );
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  public async updateUserRole(userId: string, newRole: string): Promise<void> {
    try {
      await this.db
        .collection('users')
        .doc(userId)
        .update({ userRole: newRole });

      await this.auth.setCustomUserClaims(userId, { userRole: newRole });

      logSecurityEvent(
        'USER_ROLE_CHANGED' as any,
        'info' as any,
        `User role changed to ${newRole}`,
        { userId, newRole },
        {}
      );
    } catch (error: any) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  public async listUsers(limit: number = 100, offset: number = 0): Promise<UserAccount[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .limit(limit)
        .offset(offset)
        .get();

      return snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastActivity: doc.data().lastActivity?.toDate?.() || new Date(),
      } as UserAccount));
    } catch (error: any) {
      console.error('Error listing users:', error);
      return [];
    }
  }

  public async searchUsers(query: string, limit: number = 50): Promise<UserAccount[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .where('email', '>=', query)
        .where('email', '<=', query + '')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        lastActivity: doc.data().lastActivity?.toDate?.() || new Date(),
      } as UserAccount));
    } catch (error: any) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  public async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    newUsersThisMonth: number;
    byRole: Record<string, number>;
  }> {
    try {
      const allUsers = await this.db.collection('users').get();
      const docs = allUsers.docs;

      const totalUsers = docs.length;
      const activeUsers = docs.filter((d) => d.data().status === 'active').length;
      const suspendedUsers = docs.filter((d) => d.data().status === 'suspended').length;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const newUsersThisMonth = docs.filter((d) => {
        const createdAt = d.data().createdAt?.toDate?.() || new Date();
        return createdAt > thirtyDaysAgo;
      }).length;

      const byRole: Record<string, number> = {};
      docs.forEach((doc) => {
        const role = doc.data().userRole || 'unknown';
        byRole[role] = (byRole[role] || 0) + 1;
      });

      return {
        totalUsers,
        activeUsers,
        suspendedUsers,
        newUsersThisMonth,
        byRole,
      };
    } catch (error: any) {
      console.error('Error getting user stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        newUsersThisMonth: 0,
        byRole: {},
      };
    }
  }

  public async getAdminActivityLog(limit: number = 100): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('admin_activity_logs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      }));
    } catch (error: any) {
      console.error('Error fetching admin activity log:', error);
      return [];
    }
  }

  public async logAdminAction(
    adminId: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await this.db
        .collection('admin_activity_logs')
        .add({
          adminId,
          action,
          details,
          timestamp: new Date(),
          ipAddress: details.ipAddress,
        });
    } catch (error: any) {
      console.error('Error logging admin action:', error);
    }
  }

  private getPermissionsForRole(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      super_admin: [
        'manage_admins',
        'manage_users',
        'view_all_data',
        'manage_subscriptions',
        'view_finances',
        'system_settings',
        'view_logs',
      ],
      admin: [
        'manage_users',
        'view_user_data',
        'manage_subscriptions',
        'view_finances',
        'view_logs',
      ],
      moderator: [
        'manage_users',
        'view_user_data',
        'view_logs',
      ],
      support: [
        'view_user_data',
        'view_logs',
      ],
    };

    return rolePermissions[role] || [];
  }
}

export const adminService = new AdminService();
