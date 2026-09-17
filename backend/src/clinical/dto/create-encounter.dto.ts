import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { EncounterStatus, UrgencyLevel } from '@prisma/client';

export class CreateEncounterDto {
  @IsUUID('4', { message: 'patientId must be a valid UUID' })
  @IsNotEmpty()
  patientId: string;

  @IsUUID('4', { message: 'facilityId must be a valid UUID' })
  @IsNotEmpty()
  facilityId: string;

  @IsString()
  @IsNotEmpty()
  presentingComplaint: string;

  @IsOptional()
  @IsEnum(EncounterStatus)
  status?: EncounterStatus;

  @IsOptional()
  @IsEnum(UrgencyLevel)
  priority?: UrgencyLevel;
}
