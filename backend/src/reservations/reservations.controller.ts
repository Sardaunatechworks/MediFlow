import { Controller, Post, Patch, Get, Body, Param } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ResponseHelper } from '../common/response.helper';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // TODO: Auth guard — requires PATIENT or CLINICIAN role
  @Post()
  async create(@Body() dto: CreateReservationDto) {
    const reservation = await this.reservationsService.create(dto);
    return ResponseHelper.success('Reservation created successfully', reservation);
  }

  // TODO: Auth guard — requires PHARMACY_STAFF, PHARMACY_ADMIN or PATIENT role
  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
  ) {
    const reservation = await this.reservationsService.updateStatus(id, dto);
    return ResponseHelper.success('Reservation updated successfully', reservation);
  }

  // TODO: Auth guard — requires authenticated role
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const reservation = await this.reservationsService.findById(id);
    return ResponseHelper.success('Reservation retrieved successfully', reservation);
  }
}
