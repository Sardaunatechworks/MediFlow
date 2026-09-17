import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { MedicineStatus } from '@prisma/client';

export class CreateMedicineDto {
  @IsString()
  @IsNotEmpty()
  genericName: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsString()
  @IsNotEmpty()
  strength: string;

  @IsString()
  @IsNotEmpty()
  dosageForm: string;

  @IsOptional()
  @IsString()
  packageSize?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsEnum(MedicineStatus)
  status?: MedicineStatus;
}
