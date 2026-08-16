import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ExamResultStatus, ExamStatus, ExamType } from '../../generated/prisma/client';

export class ExamCriterionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'حفظ وتسميع الآيات' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'إتقان الحفظ بدون تردد' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 40.0 })
  @IsNumber()
  @Min(0)
  @Max(1000)
  maxScore!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateExamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  halaqaId?: string;

  @ApiProperty({ example: 'اختبار الفصل الأول - الحفظ المتقن' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'اختبار تجويد وحفظ سورة البقرة' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'منهج الحفظ والمراجعة المكثف' })
  @IsOptional()
  @IsString()
  curriculum?: string;

  @ApiPropertyOptional({ enum: ExamType, default: ExamType.MONTHLY })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional({ example: '2026-08-20' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: 100.0 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxScore?: number;

  @ApiPropertyOptional({ example: 60.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  passScore?: number;

  @ApiPropertyOptional({ enum: ExamStatus, default: ExamStatus.DRAFT })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional({ type: [ExamCriterionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamCriterionDto)
  criteria?: ExamCriterionDto[];
}

export class UpdateExamDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  halaqaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  curriculum?: string;

  @ApiPropertyOptional({ enum: ExamType })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  passScore?: number;

  @ApiPropertyOptional({ enum: ExamStatus })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional({ type: [ExamCriterionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamCriterionDto)
  criteria?: ExamCriterionDto[];
}

export class ExamQueryDto {
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
  academicYearId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  termId?: string;

  @ApiPropertyOptional({ enum: ExamType })
  @IsOptional()
  @IsEnum(ExamType)
  examType?: ExamType;

  @ApiPropertyOptional({ enum: ExamStatus })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class StudentGradeItemDto {
  @ApiProperty({ example: 'uuid-student' })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ example: 85.5 })
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiPropertyOptional({ enum: ExamResultStatus, default: ExamResultStatus.ENTERED })
  @IsOptional()
  @IsEnum(ExamResultStatus)
  status?: ExamResultStatus;

  @ApiPropertyOptional({ example: 'أداء متميز في التجويد' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: { 'criterion-uuid-1': 35, 'criterion-uuid-2': 50 } })
  @IsOptional()
  criterionScores?: Record<string, number>;
}

export class BulkGradeExamDto {
  @ApiProperty({ type: [StudentGradeItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentGradeItemDto)
  results!: StudentGradeItemDto[];
}

export class UpdateExamResultDto {
  @ApiProperty({ example: 90.0 })
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiPropertyOptional({ enum: ExamResultStatus })
  @IsOptional()
  @IsEnum(ExamResultStatus)
  status?: ExamResultStatus;

  @ApiPropertyOptional({ example: 'تصحيح خطأ في حساب المعيار الثاني' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'إعادة تصحيح ورقة الإجابة' })
  @IsOptional()
  @IsString()
  correctionReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  criterionScores?: Record<string, number>;
}

export class PublishExamDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isPublished!: boolean;
}
