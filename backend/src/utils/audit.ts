import { prisma } from '../config/database';

export async function logAuditEvent(params: {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metaJson?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metaJson: params.metaJson ?? undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

