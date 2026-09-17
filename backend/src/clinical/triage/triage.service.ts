import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TriageEngineService } from './triage-engine.service';
import { CreateTriageDto } from '../dto/create-triage.dto';
import { OverrideTriageDto } from '../dto/override-triage.dto';
import { UrgencyLevel, EncounterStatus } from '@prisma/client';

@Injectable()
export class TriageService {
  constructor(
    private prisma: PrismaService,
    private triageEngine: TriageEngineService,
  ) {}

  async assessEncounter(encounterId: string, dto: CreateTriageDto) {
    // 1. Verify encounter exists
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      include: { patient: true, facility: true },
    });

    if (!encounter) {
      throw new NotFoundException({
        success: false,
        message: 'Encounter not found',
        error: { code: 'ENCOUNTER_NOT_FOUND', details: [] },
      });
    }

    // 2. Evaluate using the clinical triage engine
    const evalResult = this.triageEngine.evaluate(dto);

    // 3. Persist TriageAssessment record
    const assessment = await this.prisma.triageAssessment.create({
      data: {
        encounterId,
        assessedBy: dto.assessedBy ?? 'Triage Officer',
        temperature: dto.temperature,
        systolicBp: dto.systolicBp,
        diastolicBp: dto.diastolicBp,
        pulseRate: dto.pulseRate,
        respiratoryRate: dto.respiratoryRate,
        oxygenSaturation: dto.oxygenSaturation ?? null,
        redFlags: dto.redFlags ?? {},
        symptoms: dto.symptoms ?? [],
        recommendedUrgency: evalResult.recommendedUrgency,
        reasoning: evalResult.reasoning,
        finalUrgency: evalResult.recommendedUrgency,
        isCriticalAlert: evalResult.isCriticalAlert,
      },
    });

    // 4. Update encounter priority and priority score
    await this.prisma.encounter.update({
      where: { id: encounterId },
      data: {
        priority: evalResult.recommendedUrgency,
        priorityScore: evalResult.priorityScore,
        // If critical alert and currently waiting, mark as escalated or keep waiting with alert
        status: evalResult.isCriticalAlert
          ? EncounterStatus.ESCALATED
          : encounter.status,
      },
    });

    // 5. Log queue event
    await this.prisma.queueEvent.create({
      data: {
        encounterId,
        eventType: evalResult.isCriticalAlert
          ? 'CRITICAL_TRIAGE_ALERT'
          : 'TRIAGE_ASSESSED',
        details: {
          recommendedUrgency: evalResult.recommendedUrgency,
          reasoning: evalResult.reasoning,
          isCriticalAlert: evalResult.isCriticalAlert,
          vitals: {
            temperature: dto.temperature,
            bloodPressure: `${dto.systolicBp}/${dto.diastolicBp}`,
            pulseRate: dto.pulseRate,
            respiratoryRate: dto.respiratoryRate,
            oxygenSaturation: dto.oxygenSaturation,
          },
        },
      },
    });

    return {
      assessment,
      evaluation: evalResult,
    };
  }

  async overrideUrgency(triageAssessmentId: string, dto: OverrideTriageDto) {
    const assessment = await this.prisma.triageAssessment.findUnique({
      where: { id: triageAssessmentId },
      include: { encounter: true },
    });

    if (!assessment) {
      throw new NotFoundException({
        success: false,
        message: 'Triage assessment not found',
        error: { code: 'TRIAGE_ASSESSMENT_NOT_FOUND', details: [] },
      });
    }

    const previousUrgency = assessment.finalUrgency;
    const newUrgency = dto.newUrgency;

    // Calculate updated base score
    let updatedScore = 100;
    if (newUrgency === UrgencyLevel.RED) updatedScore = 1000000;
    else if (newUrgency === UrgencyLevel.YELLOW) updatedScore = 10000;

    // 1. Create clinical override record
    const override = await this.prisma.clinicalOverride.create({
      data: {
        triageAssessmentId,
        overriddenBy: dto.overriddenBy,
        previousUrgency,
        newUrgency,
        overrideReason: dto.overrideReason,
      },
    });

    // 2. Update triage assessment finalUrgency
    const updatedAssessment = await this.prisma.triageAssessment.update({
      where: { id: triageAssessmentId },
      data: {
        finalUrgency: newUrgency,
        isCriticalAlert: newUrgency === UrgencyLevel.RED,
      },
    });

    // 3. Update encounter priority
    await this.prisma.encounter.update({
      where: { id: assessment.encounterId },
      data: {
        priority: newUrgency,
        priorityScore: updatedScore,
      },
    });

    // 4. Log queue event for override
    await this.prisma.queueEvent.create({
      data: {
        encounterId: assessment.encounterId,
        eventType: 'CLINICAL_OVERRIDE',
        details: {
          previousUrgency,
          newUrgency,
          overrideReason: dto.overrideReason,
          overriddenBy: dto.overriddenBy,
        },
      },
    });

    return {
      override,
      assessment: updatedAssessment,
      message: `Urgency classification successfully overridden from ${previousUrgency} to ${newUrgency}`,
    };
  }

  async getById(id: string) {
    const assessment = await this.prisma.triageAssessment.findUnique({
      where: { id },
      include: {
        encounter: {
          include: { patient: true },
        },
        overrides: {
          orderBy: { overriddenAt: 'desc' },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException({
        success: false,
        message: 'Triage assessment not found',
        error: { code: 'TRIAGE_ASSESSMENT_NOT_FOUND', details: [] },
      });
    }

    return assessment;
  }
}
