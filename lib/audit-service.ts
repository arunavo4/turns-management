import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';
import { getSession } from '@/lib/auth-helpers';

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
      // Check database connection
      if (!db) {
        console.error('Database connection not available for audit logging');
        return;
      }
      
      // Get session from request if available
      let session = null;
      
      if (request && 'headers' in request) {
        try {
          session = await getSession(request as any);
        } catch (error) {
          console.warn('Could not get session for audit log:', error);
        }
      }
      
      // Use system user as fallback
      if (!session?.user) {
        session = {
          user: {
            id: null, // No user ID for system actions
            email: 'system@localhost',
            role: 'ADMIN'
          }
        };
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
      const auditLogData = {
        tableName: entry.tableName,
        recordId: entry.recordId,
        action: entry.action as any,
        userId: session.user.id,
        userEmail: session.user.email || '',
        userRole: session.user.role as any,
        oldValues: entry.oldValues || null,
        newValues: entry.newValues || null,
        changedFields: entry.changedFields || null,
        propertyId: entry.propertyId || null,
        turnId: entry.turnId || null,
        vendorId: entry.vendorId || null,
        context: entry.context || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: entry.metadata || null,
      };
      
      await db.insert(auditLogs).values(auditLogData).returning();
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