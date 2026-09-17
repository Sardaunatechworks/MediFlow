import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsEmail,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  age?: number;

  @IsEnum(Gender, {
    message: 'gender must be one of: MALE, FEMALE, OTHER',
  })
  gender: Gender;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  patientIdentifier?: string;
}
