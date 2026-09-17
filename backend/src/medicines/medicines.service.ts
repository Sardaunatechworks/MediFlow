import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { SearchMedicineDto } from './dto/search-medicine.dto';

@Injectable()
export class MedicinesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMedicineDto) {
    return this.prisma.medicine.create({
      data: {
        genericName: dto.genericName,
        brandName: dto.brandName,
        strength: dto.strength,
        dosageForm: dto.dosageForm,
        packageSize: dto.packageSize,
        manufacturer: dto.manufacturer,
        status: dto.status,
      },
    });
  }

  async search(query: SearchMedicineDto) {
    const where: any = {};

    if (query.name) {
      where.OR = [
        { genericName: { contains: query.name, mode: 'insensitive' } },
        { brandName: { contains: query.name, mode: 'insensitive' } },
      ];
    }

    if (query.strength) {
      where.strength = { contains: query.strength, mode: 'insensitive' };
    }

    if (query.dosageForm) {
      where.dosageForm = { contains: query.dosageForm, mode: 'insensitive' };
    }

    return this.prisma.medicine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.medicine.findUnique({ where: { id } });
  }
}
