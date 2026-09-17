import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReservationStatus } from '@prisma/client';

export class UpdateReservationDto {
  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status: ReservationStatus;
}
