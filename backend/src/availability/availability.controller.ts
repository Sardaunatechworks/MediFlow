import { Controller, Get, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { ResponseHelper } from '../common/response.helper';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // TODO: Auth guard — requires PATIENT, CLINICIAN or authenticated role
  @Get('search')
  async search(
    @Query('medicineId') medicineId?: string,
    @Query('strength') strength?: string,
    @Query('dosageForm') dosageForm?: string,
  ) {
    const results = await this.availabilityService.search(
      medicineId,
      strength,
      dosageForm,
    );

    if (results.length === 0) {
      return ResponseHelper.success(
        'The prescribed medicine is currently unavailable at participating pharmacies.',
        [],
      );
    }

    return ResponseHelper.success(
      'Availability search completed',
      results,
    );
  }
}
