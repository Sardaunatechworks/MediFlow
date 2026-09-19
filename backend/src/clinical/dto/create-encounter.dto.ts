import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { EncounterStatus, UrgencyLevel } from '@prisma/client';

export class CreateEncounterDto {
  @IsString()
  @IsNotEmpty({ message: 'patientId is required' })
  patientId: string;

  @IsString()
  @IsNotEmpty({ message: 'facilityId is required' })
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
