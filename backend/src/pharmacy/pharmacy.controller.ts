import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { CreatePharmacyProfileDto } from './dto/create-pharmacy-profile.dto';
import { ResponseHelper } from '../common/response.helper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('pharmacies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.HOSPITAL_ADMIN)
  async create(@Body() dto: CreatePharmacyProfileDto) {
    const pharmacy = await this.pharmacyService.create(dto);
    return ResponseHelper.success('Pharmacy registered successfully', pharmacy);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pharmacy = await this.pharmacyService.findById(id);
    return ResponseHelper.success('Pharmacy retrieved successfully', pharmacy);
  }
}
