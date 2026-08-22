import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  EvaluationStatus,
  RecommendationPriority,
  RecommendationStatus,
  VisitStatus,
  VisitType,
} from '../../generated/prisma/client';

export class FieldVisitQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VisitStatus })
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @ApiPropertyOptional({ enum: VisitType })
  @IsOptional()
  @IsEnum(VisitType)
  visitType?: VisitType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  halaqaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class CreateFieldVisitDto {
  @ApiProperty()
  @IsUUID()
  halaqaId!: string;

  @ApiProperty()
  @IsUUID()
  teacherId!: string;

  @ApiPropertyOptional({ enum: VisitType, default: VisitType.ROUTINE })
  @IsOptional()
  @IsEnum(VisitType)
  visitType?: VisitType;

  @ApiPropertyOptional({ example: '2026-08-16' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  generalNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientMutationId?: string;
}

export class UpdateFieldVisitStatusDto {
  @ApiProperty({ enum: VisitStatus })
  @IsEnum(VisitStatus)
  status!: VisitStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  generalNotes?: string;
}

export class SaveCriterionEvaluationDto {
  @ApiProperty()
  @IsUUID()
  criterionId!: string;

  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  notApplicable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SaveFieldVisitEvaluationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ type: [SaveCriterionEvaluationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCriterionEvaluationDto)
  criteria!: SaveCriterionEvaluationDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  strengths?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  improvementAreas?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ enum: EvaluationStatus, default: EvaluationStatus.DRAFT })
  @IsOptional()
  @IsEnum(EvaluationStatus)
  status?: EvaluationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientMutationId?: string;
}

export class CreateRecommendationDto {
  @ApiProperty()
  @IsUUID()
  halaqaId!: string;

  @ApiProperty()
  @IsUUID()
  teacherId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  visitId?: string;

  @ApiProperty({ example: 'تفعيل المراجعة الصغرى اليومية قبل الحفظ الجديد' })
  @IsString()
  title!: string;

  @ApiProperty({ example: 'توجيه المعلم لتدريب الطلاب على المراجعة التراكمية اليومية لتقليل الأخطاء' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ example: 'الجانب التعليمي' })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiPropertyOptional({ enum: RecommendationPriority, default: RecommendationPriority.MEDIUM })
  @IsOptional()
  @IsEnum(RecommendationPriority)
  priority?: RecommendationPriority;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientMutationId?: string;
}

export class UpdateRecommendationDto {
  @ApiPropertyOptional({ enum: RecommendationStatus })
  @IsOptional()
  @IsEnum(RecommendationStatus)
  status?: RecommendationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RecommendationPriority })
  @IsOptional()
  @IsEnum(RecommendationPriority)
  priority?: RecommendationPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CreateRecommendationFollowUpDto {
  @ApiProperty({ enum: RecommendationStatus })
  @IsEnum(RecommendationStatus)
  status!: RecommendationStatus;

  @ApiProperty({ example: 'تم التحقق من تطبيق المعلم للمراجعة اليومية بشكل ممتاز' })
  @IsString()
  notes!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientMutationId?: string;
}

export class RecommendationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RecommendationStatus })
  @IsOptional()
  @IsEnum(RecommendationStatus)
  status?: RecommendationStatus;

  @ApiPropertyOptional({ enum: RecommendationPriority })
  @IsOptional()
  @IsEnum(RecommendationPriority)
  priority?: RecommendationPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  halaqaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isOverdue?: boolean;
}
