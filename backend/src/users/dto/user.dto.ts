import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

export enum ProfileType {
  STUDENT = "STUDENT",
  PARENT = "PARENT",
  TEACHER = "TEACHER",
  TECHNICAL_SUPERVISOR = "TECHNICAL_SUPERVISOR",
}
export class UserQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?:
    "active" | "suspended" | "archived";
}
export class CreateUserDto {
  @ApiProperty({ example: "ahmed.manager" })
  @IsString()
  @Matches(/^[\p{L}\p{N}._-]{3,50}$/u)
  username!: string;
  @ApiProperty({ example: "أحمد محمد" })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  displayName!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
  @ApiPropertyOptional() @IsOptional() @IsPhoneNumber() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
  @ApiProperty() @IsUUID() roleId!: string;
  @ApiProperty({ format: "password", writeOnly: true })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  temporaryPassword!: string;
  @ApiPropertyOptional({ enum: ProfileType })
  @IsOptional()
  @IsEnum(ProfileType)
  profileType?: ProfileType;
}
export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[\p{L}\p{N}._-]{3,50}$/u)
  username?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  displayName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
  @ApiPropertyOptional() @IsOptional() @IsPhoneNumber() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
}
export class AssignUserRoleDto {
  @ApiProperty() @IsUUID() roleId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
}
