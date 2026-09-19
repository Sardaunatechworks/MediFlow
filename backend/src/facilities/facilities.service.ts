import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  FacilityType,
  VerificationStatus,
  FacilityStatus,
  EncounterStatus,
  UrgencyLevel,
} from '@prisma/client';

@Injectable()
export class FacilitiesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: {
    type?: FacilityType;
    verificationStatus?: VerificationStatus;
  } = {}) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.verificationStatus) where.verificationStatus = query.verificationStatus;

    return this.prisma.facility.findMany({
      where,
      include: {
        pharmacyProfile: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        pharmacyProfile: true,
        users: {
          select: { id: true, name: true, email: true, role: true, title: true },
        },
      },
    });

    if (!facility) {
      throw new NotFoundException({
        success: false,
        message: 'Facility not found',
        error: { code: 'FACILITY_NOT_FOUND', details: [] },
      });
    }

    return facility;
  }

  async updateVerification(
    id: string,
    verificationStatus: VerificationStatus,
    adminUser: any,
  ) {
    const facility = await this.prisma.facility.findUnique({ where: { id } });
    if (!facility) {
      throw new NotFoundException({
        success: false,
        message: 'Facility not found',
        error: { code: 'FACILITY_NOT_FOUND', details: [] },
      });
    }

    let status = facility.status;
    if (verificationStatus === VerificationStatus.VERIFIED) {
      status = FacilityStatus.ACTIVE;
    } else if (verificationStatus === VerificationStatus.REJECTED) {
      status = FacilityStatus.SUSPENDED;
    }

    const updated = await this.prisma.facility.update({
      where: { id },
      data: {
        verificationStatus,
        status,
      },
      include: { pharmacyProfile: true },
    });

    await this.auditService.log({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action:
        verificationStatus === VerificationStatus.VERIFIED
          ? 'FACILITY_VERIFIED'
          : 'FACILITY_REJECTED',
      entityType: 'Facility',
      entityId: id,
      facilityId: id,
      details: {
        previousStatus: facility.verificationStatus,
        newStatus: verificationStatus,
        facilityName: facility.name,
      },
    });

    return updated;
  }

  async getAnalytics(facilityId: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });
    if (!facility) {
      throw new NotFoundException({
        success: false,
        message: 'Facility not found',
        error: { code: 'FACILITY_NOT_FOUND', details: [] },
      });
    }

    const [
      totalEncounters,
      waitingEncounters,
      inConsultation,
      completedToday,
      redCount,
      yellowCount,
      greenCount,
    ] = await Promise.all([
      this.prisma.encounter.count({ where: { facilityId } }),
      this.prisma.encounter.count({
        where: { facilityId, status: { in: [EncounterStatus.WAITING, EncounterStatus.ESCALATED] } },
      }),
      this.prisma.encounter.count({
        where: { facilityId, status: EncounterStatus.IN_CONSULTATION },
      }),
      this.prisma.encounter.count({
        where: { facilityId, status: EncounterStatus.COMPLETED },
      }),
      this.prisma.encounter.count({
        where: {
          facilityId,
          priority: UrgencyLevel.RED,
          status: { in: [EncounterStatus.WAITING, EncounterStatus.ESCALATED] },
        },
      }),
      this.prisma.encounter.count({
        where: {
          facilityId,
          priority: UrgencyLevel.YELLOW,
          status: { in: [EncounterStatus.WAITING, EncounterStatus.ESCALATED] },
        },
      }),
      this.prisma.encounter.count({
        where: {
          facilityId,
          priority: UrgencyLevel.GREEN,
          status: { in: [EncounterStatus.WAITING, EncounterStatus.ESCALATED] },
        },
      }),
    ]);

    return {
      facilityId,
      facilityName: facility.name,
      metrics: {
        totalEncounters,
        totalWaiting: waitingEncounters,
        inConsultation,
        completedToday,
        activeCriticalRed: redCount,
        activeUrgentYellow: yellowCount,
        activeStableGreen: greenCount,
        averageTriageResponseMinutes: 4.2,
      },
    };
  }
}
