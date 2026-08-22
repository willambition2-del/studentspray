import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'Text message content' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text: string;

  @ApiPropertyOptional({ description: 'Message type (TEXT, IMAGE, FILE)' })
  @IsOptional()
  type?: any;

  @ApiPropertyOptional({ description: 'Attachment metadata (url, fileName, fileSize)' })
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Client message UUID for idempotency' })
  @IsUUID()
  @IsOptional()
  clientMessageId?: string;
}

export class MarkReadDto {
  @ApiPropertyOptional({ description: 'Last read message ID' })
  @IsUUID()
  @IsOptional()
  messageId?: string;
}

export class CreateParentChannelDto {
  @ApiProperty({ description: 'Student ID for parent-teacher channel' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;
}
