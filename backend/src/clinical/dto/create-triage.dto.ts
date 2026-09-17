import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsObject,
  IsArray,
} from 'class-validator';

export class RedFlagsDto {
  severeRespiratoryDistress?: boolean;
  alteredMentalStatus?: boolean;
  severeBleeding?: boolean;
  anaphylaxis?: boolean;
  severeChestPain?: boolean;
  seizureActive?: boolean;
  strokeSigns?: boolean;
  shockSigns?: boolean;
}

export class CreateTriageDto {
  @IsNumber(
    {},
    { message: 'temperature must be a valid number in degrees Celsius' },
  )
  @Min(25, { message: 'temperature must be at least 25°C' })
  @Max(45, { message: 'temperature cannot exceed 45°C' })
  temperature: number;

  @IsNumber({}, { message: 'systolicBp must be a valid number' })
  @Min(40, { message: 'systolicBp must be at least 40 mmHg' })
  @Max(300, { message: 'systolicBp cannot exceed 300 mmHg' })
  systolicBp: number;

  @IsNumber({}, { message: 'diastolicBp must be a valid number' })
  @Min(20, { message: 'diastolicBp must be at least 20 mmHg' })
  @Max(200, { message: 'diastolicBp cannot exceed 200 mmHg' })
  diastolicBp: number;

  @IsNumber({}, { message: 'pulseRate must be a valid number' })
  @Min(20, { message: 'pulseRate must be at least 20 bpm' })
  @Max(250, { message: 'pulseRate cannot exceed 250 bpm' })
  pulseRate: number;

  @IsNumber({}, { message: 'respiratoryRate must be a valid number' })
  @Min(4, { message: 'respiratoryRate must be at least 4 breaths/min' })
  @Max(80, { message: 'respiratoryRate cannot exceed 80 breaths/min' })
  respiratoryRate: number;

  @IsOptional()
  @IsNumber(
    {},
    { message: 'oxygenSaturation must be a valid number percentage' },
  )
  @Min(50, { message: 'oxygenSaturation must be at least 50%' })
  @Max(100, { message: 'oxygenSaturation cannot exceed 100%' })
  oxygenSaturation?: number;

  @IsOptional()
  @IsObject()
  redFlags?: Record<string, boolean>;

  @IsOptional()
  @IsArray()
  symptoms?: string[];

  @IsOptional()
  @IsString()
  assessedBy?: string;
}
