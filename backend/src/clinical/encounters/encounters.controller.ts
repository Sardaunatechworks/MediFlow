import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { CreateEncounterDto } from '../dto/create-encounter.dto';
import { UpdateEncounterStatusDto } from '../dto/update-encounter-status.dto';
import { ResponseHelper } from '../../common/response.helper';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('encounters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Post()
  @Roles(
    UserRole.TRIAGE_OFFICER,
    UserRole.CLINICIAN,
    UserRole.HOSPITAL_ADMIN,
    UserRole.PLATFORM_ADMIN,
  )
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEncounterDto) {
    const encounter = await this.encountersService.create(dto);
    return ResponseHelper.success(
      'Patient encounter created successfully',
      encounter,
    );
  }

  @Patch(':id/status')
  @Roles(
    UserRole.CLINICIAN,
    UserRole.TRIAGE_OFFICER,
    UserRole.HOSPITAL_ADMIN,
    UserRole.PLATFORM_ADMIN,
  )
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEncounterStatusDto,
  ) {
    const encounter = await this.encountersService.updateStatus(id, dto);
    return ResponseHelper.success(
      'Encounter status updated successfully',
      encounter,
    );
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    const encounter = await this.encountersService.findById(id);
    return ResponseHelper.success(
      'Encounter retrieved successfully',
      encounter,
    );
  }
}
