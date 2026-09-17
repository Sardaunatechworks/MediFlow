import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { MedicinesService } from './medicines.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { SearchMedicineDto } from './dto/search-medicine.dto';
import { ResponseHelper } from '../common/response.helper';

@Controller('medicines')
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  // TODO: Auth guard — requires ADMIN or PHARMACY_ADMIN role
  @Post()
  async create(@Body() dto: CreateMedicineDto) {
    const medicine = await this.medicinesService.create(dto);
    return ResponseHelper.success('Medicine created successfully', medicine);
  }

  // TODO: Auth guard — requires PATIENT, CLINICIAN, PHARMACY_STAFF role
  @Get('search')
  async search(@Query() query: SearchMedicineDto) {
    const medicines = await this.medicinesService.search(query);
    return ResponseHelper.success('Medicines retrieved successfully', medicines);
  }
}
