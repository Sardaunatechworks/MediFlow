import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEncounterDto } from '../dto/create-encounter.dto';
import { UpdateEncounterStatusDto } from '../dto/update-encounter-status.dto';
import { EncounterStatus } from '@prisma/client';

@Injectable()
export class EncountersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEncounterDto) {
    // 1. Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException({
        success: false,
        message: 'Patient not found',
        error: { code: 'PATIENT_NOT_FOUND', details: [] },
      });
    }

    // 2. Verify facility exists
    const facility = await this.prisma.facility.findUnique({
      where: { id: dto.facilityId },
    });
    if (!facility) {
      throw new NotFoundException({
        success: false,
        message: 'Healthcare facility not found',
        error: { code: 'FACILITY_NOT_FOUND', details: [] },
      });
    }

    // 3. Create encounter
    const encounter = await this.prisma.encounter.create({
      data: {
        patientId: dto.patientId,
        facilityId: dto.facilityId,
        presentingComplaint: dto.presentingComplaint,
        status: dto.status ?? EncounterStatus.WAITING,
        priority: dto.priority,
        priorityScore:
          dto.priority === 'RED'
            ? 1000000
            : dto.priority === 'YELLOW'
              ? 10000
              : dto.priority === 'GREEN'
                ? 100
                : 0,
        startedAt: new Date(),
      },
      include: {
        patient: true,
        facility: true,
      },
    });

    // 4. Log QueueEvent
    await this.prisma.queueEvent.create({
      data: {
        encounterId: encounter.id,
        eventType: 'ENCOUNTER_CREATED',
        details: {
          presentingComplaint: dto.presentingComplaint,
          facilityId: dto.facilityId,
          patientIdentifier: patient.patientIdentifier,
        },
      },
    });

    return encounter;
  }

  async updateStatus(id: string, dto: UpdateEncounterStatusDto) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!encounter) {
      throw new NotFoundException({
        success: false,
        message: 'Encounter not found',
        error: { code: 'ENCOUNTER_NOT_FOUND', details: [] },
      });
    }

    const previousStatus = encounter.status;
    const newStatus = dto.status;

    let endedAt = encounter.endedAt;
    if (
      newStatus === EncounterStatus.COMPLETED ||
      newStatus === EncounterStatus.CANCELLED
    ) {
      endedAt = new Date();
    }

    let updatedPriorityScore = encounter.priorityScore;
    if (
      newStatus === EncounterStatus.ESCALATED &&
      previousStatus !== EncounterStatus.ESCALATED
    ) {
      updatedPriorityScore += 5000;
    }

    const updated = await this.prisma.encounter.update({
      where: { id },
      data: {
        status: newStatus,
        endedAt,
        priorityScore: updatedPriorityScore,
      },
      include: {
        patient: true,
        triageAssessments: {
          orderBy: { assessedAt: 'desc' },
          include: { overrides: true },
        },
      },
    });

    // Log QueueEvent
    await this.prisma.queueEvent.create({
      data: {
        encounterId: id,
        eventType:
          newStatus === EncounterStatus.ESCALATED
            ? 'CLINICAL_ESCALATION'
            : 'STATUS_CHANGED',
        details: {
          previousStatus,
          newStatus,
          reason: dto.reason ?? null,
          updatedBy: dto.updatedBy ?? null,
        },
      },
    });

    return updated;
  }

  async findById(id: string) {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id },
      include: {
        patient: true,
        facility: true,
        triageAssessments: {
          orderBy: { assessedAt: 'desc' },
          include: { overrides: true },
        },
        queueEvents: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!encounter) {
      throw new NotFoundException({
        success: false,
        message: 'Encounter not found',
        error: { code: 'ENCOUNTER_NOT_FOUND', details: [] },
      });
    }

    return encounter;
  }
}
