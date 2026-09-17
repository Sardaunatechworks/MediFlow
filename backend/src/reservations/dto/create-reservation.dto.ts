import { IsString, IsOptional, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  prescriptionId: string;

  @IsString()
  @IsNotEmpty()
  prescriptionItemId: string;

  @IsString()
  @IsNotEmpty()
  facilityId: string;

  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @IsString()
  @IsNotEmpty()
  patientId: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
