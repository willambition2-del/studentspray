import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  ActivityStatus,
  ActivityType,
  ParticipantAttendanceStatus,
  ParticipantNominationStatus,
} from '../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ActivityType)
  @IsOptional()
  type?: ActivityType;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsUUID()
  @IsOptional()
  halaqaId?: string;
}

export class UpdateActivityDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ActivityType)
  @IsOptional()
  type?: ActivityType;

  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;

  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @IsDateString()
  @IsOptional()
  endsAt?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsUUID()
  @IsOptional()
  halaqaId?: string;
}

export class NominateParticipantDto {
  @IsUUID()
  studentId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateParticipantStatusDto {
  @IsEnum(ParticipantNominationStatus)
  @IsOptional()
  nominationStatus?: ParticipantNominationStatus;

  @IsEnum(ParticipantAttendanceStatus)
  @IsOptional()
  attendanceStatus?: ParticipantAttendanceStatus;

  @IsString()
  @IsOptional()
  parentApprovalStatus?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ActivityQueryDto extends PaginationQueryDto {
  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;

  @IsEnum(ActivityType)
  @IsOptional()
  type?: ActivityType;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsUUID()
  @IsOptional()
  halaqaId?: string;
}
