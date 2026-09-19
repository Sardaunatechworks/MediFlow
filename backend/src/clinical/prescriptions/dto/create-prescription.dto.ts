import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrescriptionItemDto {
  @IsString()
  @IsNotEmpty({ message: 'medicineId is required' })
  medicineId: string;

  @IsInt({ message: 'quantity must be an integer' })
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;

  @IsString()
  @IsNotEmpty({ message: 'instructions are required' })
  instructions: string;

  @IsOptional()
  @IsString()
  dosageFrequency?: string;
}

export class CreatePrescriptionDto {
  @IsString()
  @IsNotEmpty({ message: 'encounterId is required' })
  encounterId: string;

  @IsString()
  @IsNotEmpty({ message: 'patientId is required' })
  patientId: string;

  @IsOptional()
  @IsString()
  diagnosisNotes?: string;

  @IsArray({ message: 'items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}
