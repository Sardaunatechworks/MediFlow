import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { ResponseHelper } from '../../common/response.helper';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePatientDto) {
    const patient = await this.patientsService.create(dto);
    return ResponseHelper.success('Patient registered successfully', patient);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const patient = await this.patientsService.findById(id);
    return ResponseHelper.success('Patient retrieved successfully', patient);
  }
}
