import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePharmacyProfileDto } from './dto/create-pharmacy-profile.dto';

@Injectable()
export class PharmacyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePharmacyProfileDto) {
    const facility = await this.prisma.facility.create({
      data: {
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        type: 'PHARMACY',
        pharmacyProfile: {
          create: {
            licenceNumber: dto.licenceNumber,
            operatingHours: dto.operatingHours,
            reservationEnabled: dto.reservationEnabled ?? true,
          },
        },
      },
      include: {
        pharmacyProfile: true,
      },
    });
    return facility;
  }

  async findById(id: string) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        pharmacyProfile: true,
      },
    });

    if (!facility) {
      throw new NotFoundException({
        success: false,
        message: 'Pharmacy not found',
        error: { code: 'PHARMACY_NOT_FOUND', details: [] },
      });
    }

    if (facility.type !== 'PHARMACY') {
      throw new NotFoundException({
        success: false,
        message: 'Facility is not a pharmacy',
        error: { code: 'NOT_A_PHARMACY', details: [] },
      });
    }

    return facility;
  }
}
