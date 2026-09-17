import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['FULFILLED', 'EXPIRED'],
};

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReservationDto) {
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
        prescriptionId: dto.prescriptionId,
        prescriptionItemId: dto.prescriptionItemId,
        facilityId: dto.facilityId,
        medicineId: dto.medicineId,
        patientId: dto.patientId,
        status: 'PENDING',
        requestedAt,
        expiresAt,
      },
      include: {
        facility: { include: { pharmacyProfile: true } },
        medicine: true,
      },
    });

    // Business Rule: Do NOT deduct inventory on PENDING creation — only on FULFILLED
    return reservation;
  }

  async updateStatus(id: string, dto: UpdateReservationDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
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
}
