import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UrgencyLevel } from '@prisma/client';

export class OverrideTriageDto {
  @IsEnum(UrgencyLevel, {
    message: 'newUrgency must be one of: RED, YELLOW, GREEN',
  })
  @IsNotEmpty()
  newUrgency: UrgencyLevel;

  @IsString()
  @IsNotEmpty({
    message: 'overrideReason is mandatory when changing clinical urgency',
  })
  @MinLength(5, {
    message:
      'overrideReason must be at least 5 characters with clinical justification',
  })
  overrideReason: string;

  @IsString()
  @IsNotEmpty({ message: 'overriddenBy (clinician identifier) is required' })
  overriddenBy: string;
}
