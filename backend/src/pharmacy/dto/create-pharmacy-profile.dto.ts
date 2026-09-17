import { IsString, IsOptional, IsBoolean, IsEmail, IsNotEmpty } from 'class-validator';

export class CreatePharmacyProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  licenceNumber?: string;

  @IsOptional()
  @IsString()
  operatingHours?: string;

  @IsOptional()
  @IsBoolean()
  reservationEnabled?: boolean;
}
