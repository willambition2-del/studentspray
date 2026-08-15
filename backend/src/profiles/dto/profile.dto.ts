import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";
export class ProfileQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
}
export class CreateProfileAccountDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[\p{L}\p{N}._-]{3,50}$/u)
  username!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(150) displayName!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsPhoneNumber() phone?: string;
  @ApiProperty() @IsUUID() branchId!: string;
  @ApiProperty({ writeOnly: true })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  temporaryPassword!: string;
}
export class UpdateProfileAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  displayName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsPhoneNumber() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() branchId?: string;
}
export class CreateStudentDto extends CreateProfileAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  studentNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() enrollmentDate?: string;
}
export class UpdateStudentDto extends UpdateProfileAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  studentNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() enrollmentDate?: string;
}
export class CreateParentDto extends CreateProfileAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;
}
export class UpdateParentDto extends UpdateProfileAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;
}
export class CreateTeacherDto extends CreateProfileAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialization?: string;
}
export class UpdateTeacherDto extends UpdateProfileAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialization?: string;
}
export class CreateSupervisorDto extends CreateProfileAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;
}
export class UpdateSupervisorDto extends UpdateProfileAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeNumber?: string;
}
