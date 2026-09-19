import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ResponseHelper } from '../../common/response.helper';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  /**
   * Only CLINICIAN can issue prescriptions.
   * Enforces system rule: "Clinical module retains sole authority over prescription issuance."
   */
  @Post()
  @Roles(UserRole.CLINICIAN)
  async createPrescription(
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() clinician: any,
  ) {
    const prescription = await this.prescriptionsService.create(dto, clinician);
    return ResponseHelper.success('Prescription created successfully', prescription);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const prescription = await this.prescriptionsService.findById(id);
    return ResponseHelper.success('Prescription retrieved successfully', prescription);
  }

  @Get('patient/:patientId')
  async getByPatientId(
    @Param('patientId') patientId: string,
    @CurrentUser() user: any,
  ) {
    // If patient is querying, they can only query their own prescriptions
    if (user.role === UserRole.PATIENT && user.patientId && user.patientId !== patientId) {
      throw new ForbiddenException('Patients can only view their own prescriptions');
    }

    const prescriptions = await this.prescriptionsService.findByPatientId(patientId);
    return ResponseHelper.success('Patient prescriptions retrieved', prescriptions);
  }

  @Get('encounter/:encounterId')
  @Roles(UserRole.CLINICIAN, UserRole.HOSPITAL_ADMIN)
  async getByEncounterId(@Param('encounterId') encounterId: string) {
    const prescriptions = await this.prescriptionsService.findByEncounterId(encounterId);
    return ResponseHelper.success('Encounter prescriptions retrieved', prescriptions);
  }
}
