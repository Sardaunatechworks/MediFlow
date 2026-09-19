import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { ResponseHelper } from '../common/response.helper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FacilityType, VerificationStatus, UserRole } from '@prisma/client';

@Controller('facilities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacilitiesController {
  constructor(private facilitiesService: FacilitiesService) {}

  @Public()
  @Get()
  async getFacilities(
    @Query('type') type?: FacilityType,
    @Query('verificationStatus') verificationStatus?: VerificationStatus,
  ) {
    const facilities = await this.facilitiesService.findAll({
      type,
      verificationStatus,
    });
    return ResponseHelper.success('Facilities retrieved successfully', facilities);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const facility = await this.facilitiesService.findById(id);
    return ResponseHelper.success('Facility retrieved successfully', facility);
  }

  @Patch(':id/verification')
  @Roles(UserRole.PLATFORM_ADMIN)
  async updateVerification(
    @Param('id') id: string,
    @Body('verificationStatus') verificationStatus: VerificationStatus,
    @CurrentUser() adminUser: any,
  ) {
    const updated = await this.facilitiesService.updateVerification(
      id,
      verificationStatus,
      adminUser,
    );
    return ResponseHelper.success('Facility verification status updated', updated);
  }

  @Get(':id/analytics')
  @Roles(UserRole.HOSPITAL_ADMIN, UserRole.PLATFORM_ADMIN)
  async getAnalytics(@Param('id') id: string) {
    const analytics = await this.facilitiesService.getAnalytics(id);
    return ResponseHelper.success('Facility analytics retrieved', analytics);
  }
}
