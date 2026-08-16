import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  EducationalPlanStatus,
  EducationalPlanType,
  PlanItemStatus,
  PlanItemType,
  TargetType,
} from '../../generated/prisma/client';

export class EducationalPlanQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  halaqaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ enum: EducationalPlanStatus })
  @IsOptional()
  @IsEnum(EducationalPlanStatus)
  status?: EducationalPlanStatus;

  @ApiPropertyOptional({ enum: EducationalPlanType })
  @IsOptional()
  @IsEnum(EducationalPlanType)
  type?: EducationalPlanType;
}

export class CreateEducationalPlanDto {
  @ApiProperty({ example: 'خطة حفظ جزء عم وتبارك' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ enum: EducationalPlanType, default: EducationalPlanType.HIFZ })
  @IsOptional()
  @IsEnum(EducationalPlanType)
  type?: EducationalPlanType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  halaqaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: EducationalPlanStatus, default: EducationalPlanStatus.DRAFT })
  @IsOptional()
  @IsEnum(EducationalPlanStatus)
  status?: EducationalPlanStatus;
}

export class UpdateEducationalPlanDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ enum: EducationalPlanType })
  @IsOptional()
  @IsEnum(EducationalPlanType)
  type?: EducationalPlanType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  halaqaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: EducationalPlanStatus })
  @IsOptional()
  @IsEnum(EducationalPlanStatus)
  status?: EducationalPlanStatus;
}

export class CreatePlanItemDto {
  @ApiPropertyOptional({ enum: PlanItemType, default: PlanItemType.MEMORIZATION })
  @IsOptional()
  @IsEnum(PlanItemType)
  type?: PlanItemType;

  @ApiPropertyOptional({ enum: TargetType, default: TargetType.VERSES })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  surahNumber?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  fromAyah?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(1)
  toAyah?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  pageFrom?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  pageTo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  juzNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePlanItemDto {
  @ApiPropertyOptional({ enum: PlanItemType })
  @IsOptional()
  @IsEnum(PlanItemType)
  type?: PlanItemType;

  @ApiPropertyOptional({ enum: TargetType })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  surahNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  fromAyah?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  toAyah?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  pageFrom?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  pageTo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  juzNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({ enum: PlanItemStatus })
  @IsOptional()
  @IsEnum(PlanItemStatus)
  status?: PlanItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
