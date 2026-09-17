import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { CreateEncounterDto } from '../dto/create-encounter.dto';
import { UpdateEncounterStatusDto } from '../dto/update-encounter-status.dto';
import { ResponseHelper } from '../../common/response.helper';

@Controller('encounters')
export class EncountersController {
  constructor(private readonly encountersService: EncountersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEncounterDto) {
    const encounter = await this.encountersService.create(dto);
    return ResponseHelper.success(
      'Patient encounter created successfully',
      encounter,
    );
  }

  @Patch(':id/status')
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

  @Get(':id')
  async findById(@Param('id') id: string) {
    const encounter = await this.encountersService.findById(id);
    return ResponseHelper.success(
      'Encounter retrieved successfully',
      encounter,
    );
  }
}
