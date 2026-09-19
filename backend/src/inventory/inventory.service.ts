import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async addInventory(facilityId: string, dto: UpdateInventoryDto, user?: any) {
    // Verify facility exists and is a pharmacy
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException({
        success: false,
        message: 'Pharmacy not found',
        error: { code: 'PHARMACY_NOT_FOUND', details: [] },
      });
    }

    if (facility.type !== 'PHARMACY') {
      throw new BadRequestException({
        success: false,
        message: 'Facility is not a pharmacy',
        error: { code: 'NOT_A_PHARMACY', details: [] },
      });
    }

    if (!dto.medicineId) {
      throw new BadRequestException({
        success: false,
        message: 'medicineId is required',
        error: { code: 'MEDICINE_ID_REQUIRED', details: [] },
      });
    }

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

    const inventory = await this.prisma.pharmacyInventory.upsert({
      where: {
        facilityId_medicineId: {
          facilityId,
          medicineId: dto.medicineId,
        },
      },
      update: {
        quantity: dto.quantity ?? 0,
        status: dto.status ?? 'AVAILABLE',
        price: dto.price,
        updatedBy: user?.name || dto.updatedBy,
        lastUpdatedAt: new Date(),
      },
      create: {
        facilityId,
        medicineId: dto.medicineId,
        quantity: dto.quantity ?? 0,
        status: dto.status ?? 'AVAILABLE',
        price: dto.price,
        updatedBy: user?.name || dto.updatedBy,
      },
      include: {
        medicine: true,
        facility: true,
      },
    });

    await this.auditService.log({
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      action: 'INVENTORY_UPDATED',
      entityType: 'PharmacyInventory',
      entityId: inventory.id,
      facilityId,
      details: {
        medicineName: medicine.genericName,
        quantity: inventory.quantity,
        status: inventory.status,
      },
    });

    return inventory;
  }

  async updateInventory(
    facilityId: string,
    medicineId: string,
    dto: UpdateInventoryDto,
    user?: any,
  ) {
    const existing = await this.prisma.pharmacyInventory.findUnique({
      where: {
        facilityId_medicineId: {
          facilityId,
          medicineId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException({
        success: false,
        message: 'Inventory record not found',
        error: { code: 'INVENTORY_NOT_FOUND', details: [] },
      });
    }

    const updated = await this.prisma.pharmacyInventory.update({
      where: {
        facilityId_medicineId: {
          facilityId,
          medicineId,
        },
      },
      data: {
        quantity: dto.quantity !== undefined ? dto.quantity : undefined,
        status: dto.status,
        price: dto.price,
        updatedBy: user?.name || dto.updatedBy,
        lastUpdatedAt: new Date(),
      },
      include: {
        medicine: true,
        facility: true,
      },
    });

    await this.auditService.log({
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      action: 'INVENTORY_UPDATED',
      entityType: 'PharmacyInventory',
      entityId: updated.id,
      facilityId,
      details: {
        medicineName: updated.medicine.genericName,
        quantity: updated.quantity,
        status: updated.status,
      },
    });

    return updated;
  }

  async listInventory(facilityId: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException({
        success: false,
        message: 'Pharmacy not found',
        error: { code: 'PHARMACY_NOT_FOUND', details: [] },
      });
    }

    return this.prisma.pharmacyInventory.findMany({
      where: { facilityId },
      include: {
        medicine: true,
      },
      orderBy: { lastUpdatedAt: 'desc' },
    });
  }
}
