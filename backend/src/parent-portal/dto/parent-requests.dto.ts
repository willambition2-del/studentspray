import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AdminPriority } from '../../generated/prisma/client';

export enum ParentRequestCategory {
  EDUCATIONAL_SUPPORT = 'EDUCATIONAL_SUPPORT',
  MEETING_REQUEST = 'MEETING_REQUEST',
  GENERAL_INQUIRY = 'GENERAL_INQUIRY',
  DATA_UPDATE = 'DATA_UPDATE',
}

export class CreateParentRequestDto {
  @ApiProperty({ description: 'Target student / child ID' })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ description: 'Subject of the request', example: 'طلب موعد لقاء تربوي مع المعلم' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({ description: 'Detailed request message', example: 'نود التنسيق مع معلم الحلقة لمناقشة خطة مراجعة الأجزاء الأولى.' })
  @IsString()
  @IsNotEmpty()
  details!: string;

  @ApiPropertyOptional({ enum: ParentRequestCategory, default: ParentRequestCategory.GENERAL_INQUIRY })
  @IsOptional()
  @IsEnum(ParentRequestCategory)
  requestType?: ParentRequestCategory;

  @ApiPropertyOptional({ enum: AdminPriority, default: AdminPriority.NORMAL })
  @IsOptional()
  @IsEnum(AdminPriority)
  priority?: AdminPriority;

  @ApiPropertyOptional({ description: 'Preferred meeting date', example: '2026-08-25' })
  @IsOptional()
  @IsDateString()
  meetingDate?: string;
}
