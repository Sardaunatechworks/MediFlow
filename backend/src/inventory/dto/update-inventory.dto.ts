import { IsInt, IsOptional, IsEnum, IsNumber, IsString, Min } from 'class-validator';
import { InventoryStatus } from '@prisma/client';

export class UpdateInventoryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  medicineId?: string;
}
