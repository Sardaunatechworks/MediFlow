import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let prisma: any;
  let auditService: any;

  const mockClinician = {
    id: 'user-doc-001',
    email: 'dr.auwal@nationalhospital.gov.ng',
    name: 'Dr. Auwal',
    role: 'CLINICIAN',
  };

  const mockEncounter = {
    id: 'enc-001',
    patientId: 'pt-001',
    facilityId: 'f1',
  };

  const mockMedicine = {
    id: 'med-001',
    genericName: 'Artemether-Lumefantrine',
  };

  beforeEach(async () => {
    prisma = {
      encounter: { findUnique: jest.fn() },
      medicine: { findUnique: jest.fn() },
      prescription: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
  });

  it('should successfully create a prescription linked to clinical encounter and log audit event', async () => {
    prisma.encounter.findUnique.mockResolvedValue(mockEncounter);
    prisma.medicine.findUnique.mockResolvedValue(mockMedicine);
    prisma.prescription.create.mockResolvedValue({
      id: 'px-001',
      encounterId: 'enc-001',
      patientId: 'pt-001',
      clinicianId: mockClinician.id,
      items: [{ id: 'item-001', medicineId: 'med-001', quantity: 24 }],
    });

    const result = await service.create(
      {
        encounterId: 'enc-001',
        patientId: 'pt-001',
        diagnosisNotes: 'Malaria presentation',
        items: [
          {
            medicineId: 'med-001',
            quantity: 24,
            instructions: 'Take 4 tablets twice daily',
          },
        ],
      },
      mockClinician,
    );

    expect(result.id).toBe('px-001');
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PRESCRIPTION_CREATED',
        entityType: 'Prescription',
      }),
    );
  });

  it('should reject prescription if encounter patient does not match', async () => {
    prisma.encounter.findUnique.mockResolvedValue(mockEncounter);

    await expect(
      service.create(
        {
          encounterId: 'enc-001',
          patientId: 'different-patient-id',
          items: [{ medicineId: 'med-001', quantity: 10, instructions: 'daily' }],
        },
        mockClinician,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject prescription if medicine does not exist in catalog', async () => {
    prisma.encounter.findUnique.mockResolvedValue(mockEncounter);
    prisma.medicine.findUnique.mockResolvedValue(null);

    await expect(
      service.create(
        {
          encounterId: 'enc-001',
          patientId: 'pt-001',
          items: [{ medicineId: 'non-existent-med', quantity: 10, instructions: 'daily' }],
        },
        mockClinician,
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
