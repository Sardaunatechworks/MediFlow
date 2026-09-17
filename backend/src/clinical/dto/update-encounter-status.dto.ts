import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EncounterStatus } from '@prisma/client';

export class UpdateEncounterStatusDto {
  @IsEnum(EncounterStatus, {
    message:
      'status must be one of: WAITING, IN_CONSULTATION, ESCALATED, COMPLETED, CANCELLED',
  })
  @IsNotEmpty()
  status: EncounterStatus;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}
