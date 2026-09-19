import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

export interface CreateAuditLogDto {
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  facilityId?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: dto.userId ?? null,
          userEmail: dto.userEmail ?? null,
          userRole: dto.userRole ?? null,
          action: dto.action,
          entityType: dto.entityType,
          entityId: dto.entityId ?? null,
          details: dto.details ?? {},
          ipAddress: dto.ipAddress ?? null,
          facilityId: dto.facilityId ?? null,
        },
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
      return null;
    }
  }

  async findAll(query: {
    action?: string;
    entityType?: string;
    facilityId?: string;
    limit?: number;
  } = {}) {
    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.facilityId) where.facilityId = query.facilityId;

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
      include: {
        facility: {
          select: { id: true, name: true, type: true },
        },
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
