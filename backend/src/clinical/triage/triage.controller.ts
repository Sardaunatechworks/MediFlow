import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TriageService } from './triage.service';
import { CreateTriageDto } from '../dto/create-triage.dto';
import { OverrideTriageDto } from '../dto/override-triage.dto';
import { ResponseHelper } from '../../common/response.helper';

@Controller()
export class TriageController {
  constructor(private readonly triageService: TriageService) {}

  @Post('encounters/:id/triage')
  @HttpCode(HttpStatus.CREATED)
  async assessEncounter(
    @Param('id') encounterId: string,
    @Body() dto: CreateTriageDto,
  ) {
    const result = await this.triageService.assessEncounter(encounterId, dto);
    return ResponseHelper.success(
      'Triage assessment completed and encounter prioritized',
      result,
    );
  }

  @Post('triage/:id/override')
  @HttpCode(HttpStatus.OK)
  async overrideUrgency(
    @Param('id') triageId: string,
    @Body() dto: OverrideTriageDto,
  ) {
    const result = await this.triageService.overrideUrgency(triageId, dto);
    return ResponseHelper.success(
      'Clinical urgency successfully overridden',
      result,
    );
  }

  @Get('triage/:id')
  async getById(@Param('id') id: string) {
    const result = await this.triageService.getById(id);
    return ResponseHelper.success('Triage assessment retrieved', result);
  }
}
