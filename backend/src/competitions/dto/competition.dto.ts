import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CompetitionCategory,
  CompetitionStatus,
} from '../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateCompetitionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CompetitionCategory)
  @IsOptional()
  category?: CompetitionCategory;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxScore?: number;

  @IsOptional()
  criteria?: unknown;

  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class UpdateCompetitionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CompetitionCategory)
  @IsOptional()
  category?: CompetitionCategory;

  @IsEnum(CompetitionStatus)
  @IsOptional()
  status?: CompetitionStatus;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxScore?: number;

  @IsOptional()
  criteria?: unknown;

  @IsUUID()
  @IsOptional()
  branchId?: string;
}

export class RegisterCompetitionParticipantDto {
  @IsUUID()
  studentId: string;
}

export class RecordStudentResultDto {
  @IsUUID()
  studentId: string;

  @IsNumber()
  @Min(0)
  score: number;

  @IsOptional()
  @IsNumber()
  rank?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BulkRecordResultsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordStudentResultDto)
  results: RecordStudentResultDto[];
}

export class CompetitionQueryDto extends PaginationQueryDto {
  @IsEnum(CompetitionStatus)
  @IsOptional()
  status?: CompetitionStatus;

  @IsEnum(CompetitionCategory)
  @IsOptional()
  category?: CompetitionCategory;

  @IsUUID()
  @IsOptional()
  branchId?: string;
}
