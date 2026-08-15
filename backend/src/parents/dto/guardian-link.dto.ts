import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional } from "class-validator";
export enum GuardianRelationshipDto {
  FATHER = "FATHER",
  MOTHER = "MOTHER",
  BROTHER = "BROTHER",
  UNCLE = "UNCLE",
  GUARDIAN = "GUARDIAN",
  OTHER = "OTHER",
}
export class GuardianLinkDto {
  @ApiProperty({ enum: GuardianRelationshipDto })
  @IsEnum(GuardianRelationshipDto)
  relationship!: GuardianRelationshipDto;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  canReceiveNotifications?: boolean;
}
export class UpdateGuardianLinkDto {
  @ApiPropertyOptional({ enum: GuardianRelationshipDto })
  @IsOptional()
  @IsEnum(GuardianRelationshipDto)
  relationship?: GuardianRelationshipDto;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canReceiveNotifications?: boolean;
}
