import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { AwardType } from '../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateAwardDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  iconKey?: string;

  @IsEnum(AwardType)
  @IsOptional()
  type?: AwardType;

  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;
}

export class UpdateAwardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  iconKey?: string;

  @IsEnum(AwardType)
  @IsOptional()
  type?: AwardType;

  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class GrantAwardDto {
  @IsUUID()
  awardId: string;

  @IsUUID()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsUUID()
  @IsOptional()
  activityId?: string;

  @IsUUID()
  @IsOptional()
  competitionId?: string;
}

export class AwardQueryDto extends PaginationQueryDto {
  @IsEnum(AwardType)
  @IsOptional()
  type?: AwardType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
