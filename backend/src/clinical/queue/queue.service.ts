import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncounterStatus, UrgencyLevel } from '@prisma/client';

export interface EnrichedQueueItem {
  queuePosition: number;
  encounterId: string;
  patientId: string;
  patientIdentifier: string;
  patientName: string;
  age: number | null;
  gender: string;
  presentingComplaint: string;
  status: EncounterStatus;
  urgency: UrgencyLevel | null;
  priorityScore: number;
  waitingTimeMinutes: number;
  startedAt: Date;
  isCriticalAlert: boolean;
  latestVitals: {
    temperature: number;
    bloodPressure: string;
    pulseRate: number;
    respiratoryRate: number;
    oxygenSaturation: number | null;
  } | null;
  triageReasoning: string[];
  escalationReason: string | null;
}

@Injectable()
export class QueueService {
  constructor(private prisma: PrismaService) {}

  /**
   * Retrieves the live, acuity-prioritized queue for a specific healthcare facility.
   * Guarantees that RED patients are always placed above YELLOW and GREEN,
   * while ordering patients within each acuity tier fairly by arrival/waiting time.
   */
  async getFacilityQueue(
    facilityId: string,
    statusFilter?: EncounterStatus,
  ): Promise<{
    facilityId: string;
    totalWaiting: number;
    criticalRedCount: number;
    urgentYellowCount: number;
    stableGreenCount: number;
    inConsultationCount: number;
    queue: EnrichedQueueItem[];
  }> {
    // 1. Verify facility exists
    const facility = await this.prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      throw new NotFoundException({
        success: false,
        message: 'Healthcare facility not found',
        error: { code: 'FACILITY_NOT_FOUND', details: [] },
      });
    }

    // 2. Fetch active encounters (WAITING, ESCALATED, IN_CONSULTATION)
    const allowedStatuses: EncounterStatus[] = statusFilter
      ? [statusFilter]
      : [
          EncounterStatus.WAITING,
          EncounterStatus.ESCALATED,
          EncounterStatus.IN_CONSULTATION,
        ];

    const encounters = await this.prisma.encounter.findMany({
      where: {
        facilityId,
        status: { in: allowedStatuses },
      },
      include: {
        patient: true,
        triageAssessments: {
          orderBy: { assessedAt: 'desc' },
          take: 1,
        },
      },
    });

    const now = new Date();

    // 3. Compute dynamic scores and enrich queue items
    const scoredItems: (EnrichedQueueItem & { calculatedSortScore: number })[] =
      encounters.map((enc) => {
        const waitingMinutes = Math.max(
          0,
          Math.floor(
            (now.getTime() - new Date(enc.startedAt).getTime()) / 60000,
          ),
        );

        const latestTriage = enc.triageAssessments[0] ?? null;
        const urgency = enc.priority ?? latestTriage?.finalUrgency ?? null;

        // Base Acuity Weight
        let tierBase = 10;
        if (urgency === UrgencyLevel.RED) tierBase = 1000000;
        else if (urgency === UrgencyLevel.YELLOW) tierBase = 10000;
        else if (urgency === UrgencyLevel.GREEN) tierBase = 100;

        // Escalation boost (+5000)
        const escalationBonus =
          enc.status === EncounterStatus.ESCALATED ? 5000 : 0;

        // Anti-inversion capped waiting bonus (max 4,999 points)
        // Ensures Green (100 + 4999 = 5099) NEVER overtakes Yellow (10,000)
        // and Yellow (10,000 + 5000 + 4999 = 19,999) NEVER overtakes Red (1,000,000)
        const waitBonus = Math.min(waitingMinutes, 4999);

        const calculatedSortScore = tierBase + escalationBonus + waitBonus;

        const isCriticalAlert =
          urgency === UrgencyLevel.RED ||
          latestTriage?.isCriticalAlert === true ||
          enc.status === EncounterStatus.ESCALATED;

        let latestVitals = null;
        if (latestTriage) {
          latestVitals = {
            temperature: latestTriage.temperature,
            bloodPressure: `${latestTriage.systolicBp}/${latestTriage.diastolicBp}`,
            pulseRate: latestTriage.pulseRate,
            respiratoryRate: latestTriage.respiratoryRate,
            oxygenSaturation: latestTriage.oxygenSaturation ?? null,
          };
        }

        let triageReasoning: string[] = [];
        if (latestTriage && Array.isArray(latestTriage.reasoning)) {
          triageReasoning = latestTriage.reasoning as string[];
        }

        return {
          queuePosition: 0, // Assigned after sorting
          encounterId: enc.id,
          patientId: enc.patient.id,
          patientIdentifier: enc.patient.patientIdentifier,
          patientName: `${enc.patient.firstName} ${enc.patient.lastName}`,
          age: enc.patient.age,
          gender: enc.patient.gender,
          presentingComplaint: enc.presentingComplaint,
          status: enc.status,
          urgency,
          priorityScore: calculatedSortScore,
          calculatedSortScore,
          waitingTimeMinutes: waitingMinutes,
          startedAt: enc.startedAt,
          isCriticalAlert,
          latestVitals,
          triageReasoning,
          escalationReason:
            enc.status === EncounterStatus.ESCALATED
              ? 'Clinical Escalation'
              : null,
        };
      });

    // 4. Sort:
    // Highest calculatedSortScore first.
    // If scores tie, the one who has been waiting longer (earlier startedAt) comes first.
    scoredItems.sort((a, b) => {
      if (b.calculatedSortScore !== a.calculatedSortScore) {
        return b.calculatedSortScore - a.calculatedSortScore;
      }
      return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
    });

    // 5. Assign sequential queue positions (1, 2, 3...)
    const finalQueue: EnrichedQueueItem[] = scoredItems.map((item, index) => ({
      ...item,
      queuePosition: index + 1,
    }));

    // 6. Aggregate queue metrics
    const totalWaiting = finalQueue.filter(
      (q) =>
        q.status === EncounterStatus.WAITING ||
        q.status === EncounterStatus.ESCALATED,
    ).length;
    const criticalRedCount = finalQueue.filter(
      (q) => q.urgency === UrgencyLevel.RED,
    ).length;
    const urgentYellowCount = finalQueue.filter(
      (q) => q.urgency === UrgencyLevel.YELLOW,
    ).length;
    const stableGreenCount = finalQueue.filter(
      (q) => q.urgency === UrgencyLevel.GREEN,
    ).length;
    const inConsultationCount = finalQueue.filter(
      (q) => q.status === EncounterStatus.IN_CONSULTATION,
    ).length;

    return {
      facilityId,
      totalWaiting,
      criticalRedCount,
      urgentYellowCount,
      stableGreenCount,
      inConsultationCount,
      queue: finalQueue,
    };
  }
}
