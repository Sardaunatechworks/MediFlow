import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePatientDto } from '../dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePatientDto) {
    let identifier = dto.patientIdentifier;
    if (!identifier) {
      identifier = `MF-PT-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // Check if identifier already exists
    const existing = await this.prisma.patient.findUnique({
      where: { patientIdentifier: identifier },
    });
    if (existing) {
      identifier = `MF-PT-${Date.now().toString(36).toUpperCase()}`;
    }

    let calculatedAge = dto.age;
    if (dto.dateOfBirth && !calculatedAge) {
      const birthDate = new Date(dto.dateOfBirth);
      const today = new Date();
      calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
    }

    const patient = await this.prisma.patient.create({
      data: {
        patientIdentifier: identifier,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        age: calculatedAge,
        gender: dto.gender,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
      },
    });

    return patient;
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        encounters: {
          include: {
            triageAssessments: {
              orderBy: { assessedAt: 'desc' },
            },
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException({
        success: false,
        message: 'Patient not found',
        error: { code: 'PATIENT_NOT_FOUND', details: [] },
      });
    }

    return patient;
  }

  async findByIdentifier(identifier: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { patientIdentifier: identifier },
      include: {
        encounters: {
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException({
        success: false,
        message: 'Patient not found',
        error: { code: 'PATIENT_NOT_FOUND', details: [] },
      });
    }

    return patient;
  }
}
