import { prisma } from '@/lib/prisma';
import { SupabaseClient } from '@supabase/supabase-js';
import { Role, AccountStatus } from '@prisma/client';
import { LoggerService } from './LoggerService';

export interface EnrichedSession {
  userId: string;
  email: string | null;
  phone: string;
  role: Role | 'CUSTOMER';
  branchId: string | null;
  permissions: string[];
}

export class AuthService {
  /**
   * Defines the explicit permission matrix mapped to roles.
   */
  static generatePermissions(role: Role | 'CUSTOMER'): string[] {
    if (role === 'CUSTOMER') return []
    
    const permissions: string[] = [`ROLE_${role}`]
    
    switch (role) {
      case Role.ADMIN:
        permissions.push(
          'ORDER_VIEW', 'ORDER_UPDATE', 'ORDER_DELETE',
          'INVENTORY_VIEW', 'INVENTORY_EDIT',
          'PRICE_EDIT', 'REPORT_VIEW', 'USER_MANAGE', 'REFUND_PAYMENT'
        )
        break
      case Role.MANAGER:
        permissions.push(
          'ORDER_VIEW', 'ORDER_UPDATE', 
          'INVENTORY_VIEW', 'INVENTORY_EDIT',
          'PRICE_EDIT', 'REPORT_VIEW', 'REFUND_PAYMENT'
        )
        break
      case Role.SALESPERSON:
        permissions.push(
          'ORDER_VIEW', 'ORDER_UPDATE'
        )
        break
      case Role.CHEF:
        permissions.push(
          'ORDER_VIEW', 'ORDER_UPDATE_KITCHEN'
        )
        break
      case Role.DELIVERY:
        permissions.push(
          'ORDER_VIEW', 'ORDER_UPDATE_DELIVERY'
        )
        break
    }

    return permissions
  }

  // Permission Helpers
  static canViewOrders(permissions: string[]): boolean {
    return permissions.includes('ORDER_VIEW')
  }

  static canEditInventory(permissions: string[]): boolean {
    return permissions.includes('INVENTORY_EDIT')
  }

  static canAssignDriver(permissions: string[]): boolean {
    return permissions.includes('ORDER_UPDATE') || permissions.includes('ROLE_ADMIN')
  }

  static canRefundPayment(permissions: string[]): boolean {
    return permissions.includes('REFUND_PAYMENT')
  }

  static canManageUsers(permissions: string[]): boolean {
    return permissions.includes('USER_MANAGE')
  }

  /**
   * Resolves the identity from Supabase and enriches it with the application Role and Branch context.
   */
  static async resolveSession(supabase: SupabaseClient): Promise<EnrichedSession | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }

    const { user } = session;

    // Default public customer resolution
    let appRole: Role | 'CUSTOMER' = 'CUSTOMER';
    let branchId = null;
    let permissions: string[] = this.generatePermissions(appRole);

    try {
      // 1. Check if user is Staff
      const staffRecord = await prisma.user.findUnique({
        where: { id: user.id }
      });

      if (staffRecord) {
        if (staffRecord.status !== AccountStatus.ACTIVE) {
          throw new Error('AUTH_ACCOUNT_SUSPENDED');
        }
        
        appRole = staffRecord.role;
        branchId = staffRecord.branchId;
        permissions = this.generatePermissions(appRole);
        
        // Log staff activity
        await prisma.user.update({
          where: { id: user.id },
          data: { lastActivityAt: new Date() }
        });
      }

      return {
        userId: user.id,
        email: user.email || null,
        phone: user.phone || '',
        role: appRole,
        branchId,
        permissions
      };
    } catch (e: any) {
      LoggerService.error('Session enrichment failed', e, { userId: user.id });
      return null;
    }
  }
}
