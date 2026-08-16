import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  ShelfContentType,
  ShelfVisibility,
} from '../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateShelfSectionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsEnum(ShelfVisibility)
  @IsOptional()
  visibility?: ShelfVisibility;
}

export class UpdateShelfSectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(ShelfVisibility)
  @IsOptional()
  visibility?: ShelfVisibility;
}

export class CreateShelfItemDto {
  @IsUUID()
  sectionId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(ShelfContentType)
  @IsOptional()
  type?: ShelfContentType;

  @IsString()
  @IsOptional()
  attachmentName?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  fileType?: string;

  @IsString()
  @IsOptional()
  fileSize?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsEnum(ShelfVisibility)
  @IsOptional()
  targetAudience?: ShelfVisibility;
}

export class UpdateShelfItemDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(ShelfContentType)
  @IsOptional()
  type?: ShelfContentType;

  @IsString()
  @IsOptional()
  attachmentName?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  fileType?: string;

  @IsString()
  @IsOptional()
  fileSize?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsEnum(ShelfVisibility)
  @IsOptional()
  targetAudience?: ShelfVisibility;
}

export class SetPublisherRuleDto {
  @IsUUID()
  sectionId: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsBoolean()
  @IsOptional()
  canCreate?: boolean;

  @IsBoolean()
  @IsOptional()
  canPublish?: boolean;
}

export class ShelfItemQueryDto extends PaginationQueryDto {
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsEnum(ShelfContentType)
  @IsOptional()
  type?: ShelfContentType;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;
}
