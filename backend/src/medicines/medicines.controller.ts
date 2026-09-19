import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MedicinesService } from './medicines.service';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { SearchMedicineDto } from './dto/search-medicine.dto';
import { ResponseHelper } from '../common/response.helper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('medicines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicinesController {
  constructor(private readonly medicinesService: MedicinesService) {}

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.PHARMACY_ADMIN)
  async create(@Body() dto: CreateMedicineDto) {
    const medicine = await this.medicinesService.create(dto);
    return ResponseHelper.success('Medicine created successfully', medicine);
  }

  @Public()
  @Get('search')
  async search(@Query() query: SearchMedicineDto) {
    const medicines = await this.medicinesService.search(query);
    return ResponseHelper.success('Medicines retrieved successfully', medicines);
  }
}
