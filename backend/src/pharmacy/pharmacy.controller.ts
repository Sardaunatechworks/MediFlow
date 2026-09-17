import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { CreatePharmacyProfileDto } from './dto/create-pharmacy-profile.dto';
import { ResponseHelper } from '../common/response.helper';

@Controller('pharmacies')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  // TODO: Auth guard — requires PLATFORM_ADMIN or HOSPITAL_ADMIN role
  @Post()
  async create(@Body() dto: CreatePharmacyProfileDto) {
    const pharmacy = await this.pharmacyService.create(dto);
    return ResponseHelper.success('Pharmacy registered successfully', pharmacy);
  }

  // TODO: Auth guard — requires authenticated user role
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pharmacy = await this.pharmacyService.findById(id);
    return ResponseHelper.success('Pharmacy retrieved successfully', pharmacy);
  }
}
