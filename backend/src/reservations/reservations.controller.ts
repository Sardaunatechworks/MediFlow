import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ResponseHelper } from '../common/response.helper';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, ReservationStatus } from '@prisma/client';

@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Roles(UserRole.PATIENT, UserRole.CLINICIAN, UserRole.PLATFORM_ADMIN)
  async create(@Body() dto: CreateReservationDto, @CurrentUser() user: any) {
    const reservation = await this.reservationsService.create(dto, user);
    return ResponseHelper.success('Reservation created successfully', reservation);
  }

  @Patch(':id')
  @Roles(
    UserRole.PHARMACY_STAFF,
    UserRole.PHARMACY_ADMIN,
    UserRole.PATIENT,
    UserRole.PLATFORM_ADMIN,
  )
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: any,
  ) {
    const reservation = await this.reservationsService.updateStatus(id, dto, user);
    return ResponseHelper.success('Reservation updated successfully', reservation);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const reservation = await this.reservationsService.findById(id);
    return ResponseHelper.success('Reservation retrieved successfully', reservation);
  }

  @Get()
  async findAll(
    @Query('facilityId') facilityId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: ReservationStatus,
  ) {
    const reservations = await this.reservationsService.findAll({
      facilityId,
      patientId,
      status,
    });
    return ResponseHelper.success('Reservations retrieved successfully', reservations);
  }
}
