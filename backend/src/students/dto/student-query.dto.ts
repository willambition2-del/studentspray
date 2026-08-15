import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { ProfileQueryDto } from "../../profiles/dto/profile.dto";
export class StudentQueryDto extends ProfileQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() halaqaId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
export class TransferStudentDto {
  @ApiPropertyOptional() @IsUUID() halaqaId!: string;
}
