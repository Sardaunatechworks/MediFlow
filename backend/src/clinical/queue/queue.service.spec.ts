import { QueueService } from './queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EncounterStatus, UrgencyLevel } from '@prisma/client';

describe('QueueService', () => {
  let service: QueueService;
  let prismaMock: any;

  const mockFacilityId = 'facility-123';

  beforeEach(() => {
    prismaMock = {
      facility: {
        findUnique: jest.fn().mockResolvedValue({
          id: mockFacilityId,
          name: 'National Hospital Abuja',
        }),
      },
      encounter: {
        findMany: jest.fn(),
      },
    };

    service = new QueueService(prismaMock as unknown as PrismaService);
  });

  it('should strictly prioritize RED above YELLOW and GREEN regardless of wait time', async () => {
    const now = new Date();
    // Patient A arrived 3 hours ago (180 mins ago) - GREEN
    const patientAStartedAt = new Date(now.getTime() - 180 * 60000);
    // Patient B arrived 1 hour ago (60 mins ago) - YELLOW
    const patientBStartedAt = new Date(now.getTime() - 60 * 60000);
    // Patient C arrived 5 minutes ago - RED
    const patientCStartedAt = new Date(now.getTime() - 5 * 60000);

    prismaMock.encounter.findMany.mockResolvedValue([
      {
        id: 'enc-a',
        facilityId: mockFacilityId,
        status: EncounterStatus.WAITING,
        priority: UrgencyLevel.GREEN,
        startedAt: patientAStartedAt,
        presentingComplaint: 'Mild headache and sore throat',
        patient: {
          id: 'p-a',
          patientIdentifier: 'MF-PT-000001',
          firstName: 'Fatima',
          lastName: 'Bello',
          age: 28,
          gender: 'FEMALE',
        },
        triageAssessments: [
          {
            finalUrgency: UrgencyLevel.GREEN,
            temperature: 36.7,
            systolicBp: 118,
            diastolicBp: 78,
            pulseRate: 72,
            respiratoryRate: 16,
            oxygenSaturation: 99,
            reasoning: ['All vitals normal'],
            isCriticalAlert: false,
          },
        ],
      },
      {
        id: 'enc-b',
        facilityId: mockFacilityId,
        status: EncounterStatus.WAITING,
        priority: UrgencyLevel.YELLOW,
        startedAt: patientBStartedAt,
        presentingComplaint: 'High fever and persistent vomiting',
        patient: {
          id: 'p-b',
          patientIdentifier: 'MF-PT-000002',
          firstName: 'Emeka',
          lastName: 'Okonkwo',
          age: 35,
          gender: 'MALE',
        },
        triageAssessments: [
          {
            finalUrgency: UrgencyLevel.YELLOW,
            temperature: 39.4,
            systolicBp: 130,
            diastolicBp: 85,
            pulseRate: 104,
            respiratoryRate: 22,
            oxygenSaturation: 93,
            reasoning: ['High fever', 'Moderate hypoxemia'],
            isCriticalAlert: false,
          },
        ],
      },
      {
        id: 'enc-c',
        facilityId: mockFacilityId,
        status: EncounterStatus.WAITING,
        priority: UrgencyLevel.RED,
        startedAt: patientCStartedAt,
        presentingComplaint: 'Severe chest pain and dyspnea',
        patient: {
          id: 'p-c',
          patientIdentifier: 'MF-PT-000003',
          firstName: 'Musa',
          lastName: 'Danladi',
          age: 62,
          gender: 'MALE',
        },
        triageAssessments: [
          {
            finalUrgency: UrgencyLevel.RED,
            temperature: 37.1,
            systolicBp: 82,
            diastolicBp: 50,
            pulseRate: 136,
            respiratoryRate: 34,
            oxygenSaturation: 84,
            reasoning: ['Severe hypoxemia < 90%', 'Shock'],
            isCriticalAlert: true,
          },
        ],
      },
    ]);

    const result = await service.getFacilityQueue(mockFacilityId);

    expect(result.totalWaiting).toBe(3);
    expect(result.criticalRedCount).toBe(1);
    expect(result.urgentYellowCount).toBe(1);
    expect(result.stableGreenCount).toBe(1);

    // Strict Anti-Inversion Assertions:
    // Rank 1: Patient C (RED) despite arriving last!
    expect(result.queue[0].patientIdentifier).toBe('MF-PT-000003');
    expect(result.queue[0].urgency).toBe(UrgencyLevel.RED);
    expect(result.queue[0].queuePosition).toBe(1);
    expect(result.queue[0].isCriticalAlert).toBe(true);

    // Rank 2: Patient B (YELLOW)
    expect(result.queue[1].patientIdentifier).toBe('MF-PT-000002');
    expect(result.queue[1].urgency).toBe(UrgencyLevel.YELLOW);
    expect(result.queue[1].queuePosition).toBe(2);

    // Rank 3: Patient A (GREEN) despite waiting 180 minutes!
    expect(result.queue[2].patientIdentifier).toBe('MF-PT-000001');
    expect(result.queue[2].urgency).toBe(UrgencyLevel.GREEN);
    expect(result.queue[2].queuePosition).toBe(3);
  });

  it('should prioritize within the same urgency tier by waiting time', async () => {
    const now = new Date();
    const earlierYellow = new Date(now.getTime() - 40 * 60000);
    const laterYellow = new Date(now.getTime() - 10 * 60000);

    prismaMock.encounter.findMany.mockResolvedValue([
      {
        id: 'y-later',
        facilityId: mockFacilityId,
        status: EncounterStatus.WAITING,
        priority: UrgencyLevel.YELLOW,
        startedAt: laterYellow,
        presentingComplaint: 'Moderate abdominal pain',
        patient: {
          id: 'p-2',
          patientIdentifier: 'MF-PT-000005',
          firstName: 'Zainab',
          lastName: 'Ahmed',
          age: 24,
          gender: 'FEMALE',
        },
        triageAssessments: [],
      },
      {
        id: 'y-earlier',
        facilityId: mockFacilityId,
        status: EncounterStatus.WAITING,
        priority: UrgencyLevel.YELLOW,
        startedAt: earlierYellow,
        presentingComplaint: 'High fever',
        patient: {
          id: 'p-1',
          patientIdentifier: 'MF-PT-000004',
          firstName: 'Yusuf',
          lastName: 'Ibrahim',
          age: 41,
          gender: 'MALE',
        },
        triageAssessments: [],
      },
    ]);

    const result = await service.getFacilityQueue(mockFacilityId);

    expect(result.queue[0].patientIdentifier).toBe('MF-PT-000004'); // Waiting longer
    expect(result.queue[1].patientIdentifier).toBe('MF-PT-000005');
  });

  it('should give escalation status higher priority within its tier', async () => {
    const now = new Date();
    const commonTime = new Date(now.getTime() - 20 * 60000);

    prismaMock.encounter.findMany.mockResolvedValue([
      {
        id: 'y-normal',
        facilityId: mockFacilityId,
        status: EncounterStatus.WAITING,
        priority: UrgencyLevel.YELLOW,
        startedAt: commonTime,
        presentingComplaint: 'Moderate pain',
        patient: {
          id: 'p-norm',
          patientIdentifier: 'MF-PT-000006',
          firstName: 'Ali',
          lastName: 'Sani',
          age: 30,
          gender: 'MALE',
        },
        triageAssessments: [],
      },
      {
        id: 'y-escalated',
        facilityId: mockFacilityId,
        status: EncounterStatus.ESCALATED,
        priority: UrgencyLevel.YELLOW,
        startedAt: commonTime,
        presentingComplaint: 'Deteriorating pain',
        patient: {
          id: 'p-esc',
          patientIdentifier: 'MF-PT-000007',
          firstName: 'Chidinma',
          lastName: 'Nnamdi',
          age: 29,
          gender: 'FEMALE',
        },
        triageAssessments: [],
      },
    ]);

    const result = await service.getFacilityQueue(mockFacilityId);

    // Escalated patient gets +5000 score bonus within tier
    expect(result.queue[0].patientIdentifier).toBe('MF-PT-000007');
    expect(result.queue[0].status).toBe(EncounterStatus.ESCALATED);
  });
});
