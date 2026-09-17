import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { EncounterStatus } from '@prisma/client';
import { ResponseHelper } from '../../common/response.helper';

@Controller('facilities')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get(':id/queue')
  async getFacilityQueue(
    @Param('id') facilityId: string,
    @Query('status') status?: EncounterStatus,
  ) {
    const queueData = await this.queueService.getFacilityQueue(
      facilityId,
      status,
    );
    return ResponseHelper.success(
      'Facility queue retrieved successfully',
      queueData,
    );
  }
}
