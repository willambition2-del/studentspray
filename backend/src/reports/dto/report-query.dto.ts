import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ReportFilterDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Branch UUID filter' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Halaqa UUID filter' })
  @IsUUID()
  @IsOptional()
  halaqaId?: string;

  @ApiPropertyOptional({ description: 'Student UUID filter' })
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({ description: 'Teacher User UUID filter' })
  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @ApiPropertyOptional({ description: 'Supervisor User UUID filter' })
  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  @ApiPropertyOptional({ description: 'Academic Year UUID filter' })
  @IsUUID()
  @IsOptional()
  academicYearId?: string;

  @ApiPropertyOptional({ description: 'Term UUID filter' })
  @IsUUID()
  @IsOptional()
  termId?: string;

  @ApiPropertyOptional({ description: 'Date range start (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date range end (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Status filter' })
  @IsString()
  @IsOptional()
  status?: string;
}
