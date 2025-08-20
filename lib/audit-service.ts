import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'EXPORT' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'ASSIGN' 
  | 'COMPLETE';

interface AuditLogEntry {
  tableName: string;
  recordId: string;
  action: AuditAction;
  oldValues?: any;
  newValues?: any;
  changedFields?: string[];
  propertyId?: string;
  turnId?: string;
  vendorId?: string;
  context?: string;
  metadata?: Record<string, any>;
}

class AuditService {
  private static instance: AuditService;

  private constructor() {}

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async log(entry: AuditLogEntry, request?: Request) {
    try {
      // Get current user from session
      const session = await auth();
      
      if (!session?.user) {
        console.warn('Audit log attempted without authenticated user');
        return;
      }

      // Extract IP and user agent from request if available
      let ipAddress: string | undefined;
      let userAgent: string | undefined;
      
      if (request) {
        ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   undefined;
        userAgent = request.headers.get('user-agent') || undefined;
      }

      // Create audit log entry
      await db.insert(auditLogs).values({
        tableName: entry.tableName,
        recordId: entry.recordId,
        action: entry.action as any,
        userId: session.user.id,
        userEmail: session.user.email || '',
        userRole: session.user.role as any,
        oldValues: entry.oldValues,
        newValues: entry.newValues,
        changedFields: entry.changedFields,
        propertyId: entry.propertyId,
        turnId: entry.turnId,
        vendorId: entry.vendorId,
        context: entry.context,
        ipAddress,
        userAgent,
        metadata: entry.metadata,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main operation
    }
  }

  // Helper method to calculate changed fields
  calculateChangedFields(oldValues: any, newValues: any): string[] {
    if (!oldValues || !newValues) return [];
    
    const changedFields: string[] = [];
    const allKeys = new Set([
      ...Object.keys(oldValues),
      ...Object.keys(newValues)
    ]);
    
    for (const key of allKeys) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changedFields.push(key);
      }
    }
    
    return changedFields;
  }

  // Convenience methods for common actions
  async logCreate(tableName: string, recordId: string, data: any, context?: string) {
    await this.log({
      tableName,
      recordId,
      action: 'CREATE',
      newValues: data,
      context,
    });
  }

  async logUpdate(
    tableName: string, 
    recordId: string, 
    oldData: any, 
    newData: any, 
    context?: string
  ) {
    const changedFields = this.calculateChangedFields(oldData, newData);
    
    await this.log({
      tableName,
      recordId,
      action: 'UPDATE',
      oldValues: oldData,
      newValues: newData,
      changedFields,
      context,
    });
  }

  async logDelete(tableName: string, recordId: string, data: any, context?: string) {
    await this.log({
      tableName,
      recordId,
      action: 'DELETE',
      oldValues: data,
      context,
    });
  }

  async logView(tableName: string, recordId: string, context?: string) {
    await this.log({
      tableName,
      recordId,
      action: 'VIEW',
      context,
    });
  }

  async logExport(tableName: string, metadata: Record<string, any>, context?: string) {
    await this.log({
      tableName,
      recordId: 'EXPORT',
      action: 'EXPORT',
      metadata,
      context,
    });
  }
}

export const auditService = AuditService.getInstance();