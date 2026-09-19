import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionStatus, PrescriptionItemStatus } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreatePrescriptionDto, clinicianUser: any) {
    // 1. Verify encounter exists
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: dto.encounterId },
      include: { patient: true },
    });

    if (!encounter) {
      throw new NotFoundException({
        success: false,
        message: 'Clinical encounter not found',
        error: { code: 'ENCOUNTER_NOT_FOUND', details: [] },
      });
    }

    // 2. Verify patient matches encounter
    if (encounter.patientId !== dto.patientId) {
      throw new BadRequestException({
        success: false,
        message: 'Patient ID does not match the encounter patient',
        error: { code: 'PATIENT_ENCOUNTER_MISMATCH', details: [] },
      });
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException({
        success: false,
        message: 'Prescription must contain at least one medication item',
        error: { code: 'EMPTY_PRESCRIPTION_ITEMS', details: [] },
      });
    }

    // 3. Verify all medicines exist
    for (const item of dto.items) {
      const med = await this.prisma.medicine.findUnique({
        where: { id: item.medicineId },
      });
      if (!med) {
        throw new NotFoundException({
          success: false,
          message: `Medicine with ID ${item.medicineId} not found in national formulary`,
          error: { code: 'MEDICINE_NOT_FOUND', details: [{ medicineId: item.medicineId }] },
        });
      }
    }

    // 4. Create prescription with items in a transaction
    const prescription = await this.prisma.prescription.create({
      data: {
        encounterId: dto.encounterId,
        patientId: dto.patientId,
        clinicianId: clinicianUser.id,
        diagnosisNotes: dto.diagnosisNotes,
        status: PrescriptionStatus.ISSUED,
        issuedAt: new Date(),
        items: {
          create: dto.items.map((item) => ({
            medicineId: item.medicineId,
            quantity: item.quantity,
            instructions: item.instructions,
            dosageFrequency: item.dosageFrequency ?? null,
            status: PrescriptionItemStatus.PENDING,
          })),
        },
      },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
        patient: true,
        clinician: {
          select: { id: true, name: true, email: true, title: true },
        },
        encounter: true,
      },
    });

    // 5. Audit log event
    await this.auditService.log({
      userId: clinicianUser.id,
      userEmail: clinicianUser.email,
      userRole: clinicianUser.role,
      action: 'PRESCRIPTION_CREATED',
      entityType: 'Prescription',
      entityId: prescription.id,
      facilityId: encounter.facilityId,
      details: {
        encounterId: dto.encounterId,
        patientId: dto.patientId,
        itemsCount: dto.items.length,
      },
    });

    return prescription;
  }

  async findById(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            medicine: true,
            reservations: {
              include: {
                facility: {
                  include: {
                    pharmacyProfile: true,
                  },
                },
              },
            },
          },
        },
        patient: true,
        clinician: {
          select: { id: true, name: true, email: true, title: true },
        },
        encounter: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException({
        success: false,
        message: 'Prescription not found',
        error: { code: 'PRESCRIPTION_NOT_FOUND', details: [] },
      });
    }

    return prescription;
  }

  async findByPatientId(patientId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId },
      orderBy: { issuedAt: 'desc' },
      include: {
        items: {
          include: {
            medicine: true,
            reservations: {
              include: {
                facility: true,
              },
            },
          },
        },
        clinician: {
          select: { id: true, name: true, email: true, title: true },
        },
      },
    });
  }

  async findByEncounterId(encounterId: string) {
    return this.prisma.prescription.findMany({
      where: { encounterId },
      orderBy: { issuedAt: 'desc' },
      include: {
        items: {
          include: {
            medicine: true,
            reservations: {
              include: {
                facility: true,
              },
            },
          },
        },
        clinician: {
          select: { id: true, name: true, email: true, title: true },
        },
      },
    });
  }
}
