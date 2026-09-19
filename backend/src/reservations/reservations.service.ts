import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['FULFILLED', 'EXPIRED'],
};

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateReservationDto, user?: any) {
    // Validate facility exists
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });
    if (!facility) {
      throw new NotFoundException({
        success: false,
        message: 'Pharmacy not found',
        error: { code: 'PHARMACY_NOT_FOUND', details: [] },
      });
    }

    // Validate medicine exists
    const medicine = await this.prisma.medicine.findUnique({
      where: { id: dto.medicineId },
    });
    if (!medicine) {
      throw new NotFoundException({
        success: false,
        message: 'Medicine not found',
        error: { code: 'MEDICINE_NOT_FOUND', details: [] },
      });
    }

    const requestedAt = new Date();
    const expiresAt = dto.expiresAt
      ? new Date(dto.expiresAt)
      : new Date(requestedAt.getTime() + 2 * 60 * 60 * 1000);

    const reservation = await this.prisma.reservation.create({
      data: {
        prescriptionId: dto.prescriptionId ?? null,
        prescriptionItemId: dto.prescriptionItemId ?? null,
        facilityId: dto.facilityId,
        medicineId: dto.medicineId,
        patientId: dto.patientId,
        status: ReservationStatus.PENDING,
        requestedAt,
        expiresAt,
      },
      include: {
        facility: { include: { pharmacyProfile: true } },
        medicine: true,
        patient: true,
      },
    });

    await this.auditService.log({
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      action: 'RESERVATION_CREATED',
      entityType: 'Reservation',
      entityId: reservation.id,
      facilityId: dto.facilityId,
      details: {
        medicineName: medicine.genericName,
        pharmacyName: facility.name,
        patientId: dto.patientId,
      },
    });

    return reservation;
  }

  async updateStatus(id: string, dto: UpdateReservationDto, user?: any) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { facility: true, medicine: true },
    });

    if (!reservation) {
      throw new NotFoundException({
        success: false,
        message: 'Reservation not found',
        error: { code: 'RESERVATION_NOT_FOUND', details: [] },
      });
    }

    const currentStatus = reservation.status;
    const nextStatus = dto.status;

    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(nextStatus)) {
      throw new BadRequestException({
        success: false,
        message: `Invalid status transition from ${currentStatus} to ${nextStatus}`,
        error: { code: 'INVALID_STATUS_TRANSITION', details: [] },
      });
    }

    // If transitioning to FULFILLED, deduct inventory
    if (nextStatus === ReservationStatus.FULFILLED) {
      const inventory = await this.prisma.pharmacyInventory.findUnique({
        where: {
          facilityId_medicineId: {
            facilityId: reservation.facilityId,
            medicineId: reservation.medicineId,
          },
        },
      });

      if (inventory) {
        const newQuantity = Math.max(0, inventory.quantity - 1);
        let newStatus = inventory.status;
        if (newQuantity === 0) {
          newStatus = 'OUT_OF_STOCK';
        } else if (newQuantity <= 5) {
          newStatus = 'LOW_STOCK';
        }

        await this.prisma.pharmacyInventory.update({
          where: {
            facilityId_medicineId: {
              facilityId: reservation.facilityId,
              medicineId: reservation.medicineId,
            },
          },
          data: {
            quantity: newQuantity,
            status: newStatus,
            lastUpdatedAt: new Date(),
          },
        });
      }
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        facility: { include: { pharmacyProfile: true } },
        medicine: true,
        patient: true,
      },
    });

    const actionMap: Record<string, string> = {
      CONFIRMED: 'RESERVATION_CONFIRMED',
      REJECTED: 'RESERVATION_REJECTED',
      FULFILLED: 'RESERVATION_FULFILLED',
      CANCELLED: 'RESERVATION_CANCELLED',
    };

    await this.auditService.log({
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      action: actionMap[nextStatus] || 'RESERVATION_STATUS_UPDATED',
      entityType: 'Reservation',
      entityId: id,
      facilityId: reservation.facilityId,
      details: {
        previousStatus: currentStatus,
        newStatus: nextStatus,
        medicineName: reservation.medicine.genericName,
      },
    });

    return updated;
  }

  async findById(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        facility: { include: { pharmacyProfile: true } },
        medicine: true,
        patient: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException({
        success: false,
        message: 'Reservation not found',
        error: { code: 'RESERVATION_NOT_FOUND', details: [] },
      });
    }

    return reservation;
  }

  async findAll(query: {
    facilityId?: string;
    patientId?: string;
    status?: ReservationStatus;
  } = {}) {
    const where: any = {};
    if (query.facilityId) where.facilityId = query.facilityId;
    if (query.patientId) where.patientId = query.patientId;
    if (query.status) where.status = query.status;

    return this.prisma.reservation.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        facility: { include: { pharmacyProfile: true } },
        medicine: true,
        patient: true,
      },
    });
  }
}
