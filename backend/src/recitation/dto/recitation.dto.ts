import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { RecitationRating } from '../../generated/prisma/client';

export class RecitationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  halaqaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: RecitationRating })
  @IsOptional()
  @IsEnum(RecitationRating)
  rating?: RecitationRating;
}

export class CreateMemorizationRecordDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty()
  @IsUUID()
  halaqaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planItemId?: string;

  @ApiProperty({ example: '2026-08-16' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(114)
  surahNumber!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  fromAyah!: number;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  toAyah!: number;

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

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  evaluationScore?: number;

  @ApiPropertyOptional({ enum: RecitationRating, default: RecitationRating.EXCELLENT })
  @IsOptional()
  @IsEnum(RecitationRating)
  rating?: RecitationRating;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  mistakesCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientMutationId?: string;
}

export class CreateRevisionRecordDto {
  @ApiProperty()
  @IsUUID()
  studentId!: string;

  @ApiProperty()
  @IsUUID()
  halaqaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  planItemId?: string;

  @ApiProperty({ example: '2026-08-16' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(114)
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
  @Max(30)
  juzNumber?: number;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  evaluationScore?: number;

  @ApiPropertyOptional({ enum: RecitationRating, default: RecitationRating.EXCELLENT })
  @IsOptional()
  @IsEnum(RecitationRating)
  rating?: RecitationRating;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  mistakesCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientMutationId?: string;
}
