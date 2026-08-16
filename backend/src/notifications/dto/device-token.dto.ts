import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { DevicePlatform } from '../../generated/prisma/client';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token: string;

  @IsEnum(DevicePlatform)
  @IsOptional()
  platform?: DevicePlatform;

  @IsString()
  @IsOptional()
  @MaxLength(128)
  deviceId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(32)
  appVersion?: string;
}
