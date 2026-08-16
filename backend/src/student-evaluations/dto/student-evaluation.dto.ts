import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { StudentEvaluationRating } from '../../generated/prisma/client';

export class CreateStudentEvaluationDto {
  @ApiProperty({ example: 'uuid-student' })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ example: 'uuid-halaqa' })
  @IsUUID()
  @IsNotEmpty()
  halaqaId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiProperty({ example: '2026-08-20' })
  @IsDateString()
  @IsNotEmpty()
  evaluationDate!: string;

  @ApiPropertyOptional({ example: 'التقييم الشهري الأول' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ example: 95.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  behaviorScore?: number;

  @ApiPropertyOptional({ example: 90.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discipline?: number;

  @ApiPropertyOptional({ example: 100.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  participation?: number;

  @ApiPropertyOptional({ example: 95.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore?: number;

  @ApiPropertyOptional({ enum: StudentEvaluationRating, default: StudentEvaluationRating.EXCELLENT })
  @IsOptional()
  @IsEnum(StudentEvaluationRating)
  rating?: StudentEvaluationRating;

  @ApiPropertyOptional({ example: 'طالب متميز ومتفوق وحريص على الحفظ' })
  @IsOptional()
  @IsString()
  teacherNotes?: string;

  @ApiPropertyOptional({ example: 'تكريم وتحفيز مباشر' })
  @IsOptional()
  @IsString()
  actionLabel?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateStudentEvaluationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  evaluationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  behaviorScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discipline?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  participation?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  overallScore?: number;

  @ApiPropertyOptional({ enum: StudentEvaluationRating })
  @IsOptional()
  @IsEnum(StudentEvaluationRating)
  rating?: StudentEvaluationRating;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teacherNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class StudentEvaluationQueryDto {
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

  @ApiPropertyOptional({ enum: StudentEvaluationRating })
  @IsOptional()
  @IsEnum(StudentEvaluationRating)
  rating?: StudentEvaluationRating;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;
}
