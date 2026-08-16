import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AdminAlertSeverity,
  AdminAlertStatus,
  AdminAlertType,
  AdminDecisionStatus,
  AdminDecisionType,
  AdminPriority,
  AdminRequestStatus,
  AdminRequestType,
  AdminTaskStatus,
  DecisionTargetType,
} from '../../generated/prisma/client';

// ==========================================
// 1. REQUESTS DTOS
// ==========================================
export class CreateAdminRequestDto {
  @ApiProperty({ enum: AdminRequestType, default: AdminRequestType.GENERAL })
  @IsEnum(AdminRequestType)
  @IsNotEmpty()
  type: AdminRequestType;

  @ApiProperty({ description: 'Request title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Detailed description / reasoning' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Optional target branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Related entity type e.g. STUDENT, TEACHER, HALAQA' })
  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @ApiPropertyOptional({ description: 'Related entity UUID / ID' })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional({ enum: AdminPriority, default: AdminPriority.NORMAL })
  @IsEnum(AdminPriority)
  @IsOptional()
  priority?: AdminPriority;

  @ApiPropertyOptional({ description: 'Whether to submit immediately upon creation' })
  @IsBoolean()
  @IsOptional()
  submitNow?: boolean;
}

export class UpdateAdminRequestDto {
  @ApiPropertyOptional({ description: 'Request title' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: AdminPriority })
  @IsEnum(AdminPriority)
  @IsOptional()
  priority?: AdminPriority;
}

export class ReviewAdminRequestDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED', 'RETURNED'] })
  @IsString()
  @IsNotEmpty()
  action: 'APPROVED' | 'REJECTED' | 'RETURNED';

  @ApiPropertyOptional({ description: 'Review note / comment' })
  @IsString()
  @IsOptional()
  comment?: string;
}

// ==========================================
// 2. DECISIONS DTOS
// ==========================================
export class DecisionAudienceDto {
  @ApiProperty({ enum: DecisionTargetType })
  @IsEnum(DecisionTargetType)
  @IsNotEmpty()
  targetType: DecisionTargetType;

  @ApiPropertyOptional({ description: 'Target ID (branch, role, halaqa, or user UUID)' })
  @IsString()
  @IsOptional()
  targetId?: string;
}

export class CreateAdminDecisionDto {
  @ApiProperty({ description: 'Decision title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Decision official text / content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: AdminDecisionType, default: AdminDecisionType.GENERAL_DIRECTIVE })
  @IsEnum(AdminDecisionType)
  @IsNotEmpty()
  type: AdminDecisionType;

  @ApiPropertyOptional({ description: 'Optional target branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Effective start date' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective end date' })
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;

  @ApiPropertyOptional({ description: 'Related administrative request ID' })
  @IsUUID()
  @IsOptional()
  relatedRequestId?: string;

  @ApiPropertyOptional({ type: [DecisionAudienceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DecisionAudienceDto)
  @IsOptional()
  audiences?: DecisionAudienceDto[];

  @ApiPropertyOptional({ description: 'Whether to issue immediately' })
  @IsBoolean()
  @IsOptional()
  issueNow?: boolean;
}

export class UpdateAdminDecisionDto {
  @ApiPropertyOptional({ description: 'Decision title' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Decision content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ enum: AdminDecisionStatus })
  @IsEnum(AdminDecisionStatus)
  @IsOptional()
  status?: AdminDecisionStatus;

  @ApiPropertyOptional({ description: 'Effective start date' })
  @IsDateString()
  @IsOptional()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Effective end date' })
  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;
}

// ==========================================
// 3. ALERTS DTOS
// ==========================================
export class CreateAdminAlertDto {
  @ApiProperty({ enum: AdminAlertType, default: AdminAlertType.CUSTOM })
  @IsEnum(AdminAlertType)
  @IsNotEmpty()
  type: AdminAlertType;

  @ApiProperty({ enum: AdminAlertSeverity, default: AdminAlertSeverity.INFO })
  @IsEnum(AdminAlertSeverity)
  @IsNotEmpty()
  severity: AdminAlertSeverity;

  @ApiProperty({ description: 'Alert title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Alert message body' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Optional target branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Related entity type' })
  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @ApiPropertyOptional({ description: 'Related entity ID' })
  @IsString()
  @IsOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Assigned User ID for resolution' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Due timestamp' })
  @IsDateString()
  @IsOptional()
  dueAt?: string;
}

export class ResolveAdminAlertDto {
  @ApiPropertyOptional({ description: 'Resolution or dismissal note' })
  @IsString()
  @IsOptional()
  resolutionNote?: string;

  @ApiPropertyOptional({ enum: [AdminAlertStatus.RESOLVED, AdminAlertStatus.DISMISSED], default: AdminAlertStatus.RESOLVED })
  @IsEnum(AdminAlertStatus)
  @IsOptional()
  status?: AdminAlertStatus;
}

// ==========================================
// 4. TASKS DTOS
// ==========================================
export class CreateAdminTaskDto {
  @ApiProperty({ description: 'Task title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Task detailed instructions' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Assigned User ID' })
  @IsUUID()
  @IsNotEmpty()
  assignedToId: string;

  @ApiPropertyOptional({ description: 'Optional target branch ID' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Related Decision ID' })
  @IsUUID()
  @IsOptional()
  relatedDecisionId?: string;

  @ApiPropertyOptional({ description: 'Related Request ID' })
  @IsUUID()
  @IsOptional()
  relatedRequestId?: string;

  @ApiPropertyOptional({ description: 'Related Alert ID' })
  @IsUUID()
  @IsOptional()
  relatedAlertId?: string;

  @ApiPropertyOptional({ enum: AdminPriority, default: AdminPriority.NORMAL })
  @IsEnum(AdminPriority)
  @IsOptional()
  priority?: AdminPriority;

  @ApiPropertyOptional({ description: 'Due date timestamp' })
  @IsDateString()
  @IsOptional()
  dueAt?: string;
}

export class UpdateAdminTaskDto {
  @ApiPropertyOptional({ enum: AdminTaskStatus })
  @IsEnum(AdminTaskStatus)
  @IsOptional()
  status?: AdminTaskStatus;

  @ApiPropertyOptional({ enum: AdminPriority })
  @IsEnum(AdminPriority)
  @IsOptional()
  priority?: AdminPriority;

  @ApiPropertyOptional({ description: 'Due date timestamp' })
  @IsDateString()
  @IsOptional()
  dueAt?: string;
}

export class AddTaskFollowUpDto {
  @ApiPropertyOptional({ enum: AdminTaskStatus })
  @IsEnum(AdminTaskStatus)
  @IsOptional()
  status?: AdminTaskStatus;

  @ApiProperty({ description: 'Progress note / follow-up log' })
  @IsString()
  @IsNotEmpty()
  note: string;
}
