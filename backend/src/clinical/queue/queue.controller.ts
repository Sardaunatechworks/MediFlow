import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { QueueService } from './queue.service';
import { EncounterStatus } from '@prisma/client';
import { ResponseHelper } from '../../common/response.helper';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('facilities')
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Public()
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
