import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: { facilityId?: string; role?: UserRole } = {}) {
    const where: any = {};
    if (query.facilityId) where.facilityId = query.facilityId;
    if (query.role) where.role = query.role;

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        title: true,
        facilityId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        title: true,
        facilityId: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        facility: true,
      },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User not found',
        error: { code: 'USER_NOT_FOUND', details: [] },
      });
    }

    return user;
  }

  async updateRole(
    targetUserId: string,
    newRole: UserRole,
    adminUser: { id: string; email: string; role: UserRole; facilityId?: string },
  ) {
    const targetUser = await this.findById(targetUserId);

    // Hospital Admin can only manage users in their own hospital
    if (
      adminUser.role === UserRole.HOSPITAL_ADMIN &&
      adminUser.facilityId !== targetUser.facilityId
    ) {
      throw new ForbiddenException(
        'Hospital Administrators can only manage staff in their assigned hospital',
      );
    }

    const previousRole = targetUser.role;
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        facilityId: true,
      },
    });

    await this.auditService.log({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: targetUserId,
      facilityId: targetUser.facilityId ?? undefined,
      details: {
        previousRole,
        newRole,
        changedUserEmail: targetUser.email,
      },
    });

    return updated;
  }
}
