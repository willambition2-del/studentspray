import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStudentProposalDto {
  @ApiProperty({ description: 'Title of activity or initiative proposal', example: 'اقتراح تنظيم مسابقة حفظ وتسميع سريعة' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Detailed proposal description', example: 'نقترح إقامة مسابقة تنافسية بين الطلاب نهاية كل أسبوع لتشجيع الإتقان.' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class CreateHomeworkSubmissionDto {
  @ApiProperty({ description: 'Task or assignment title', example: 'تسجيل قراءة سورة الملك' })
  @IsString()
  @IsNotEmpty()
  taskTitle!: string;

  @ApiProperty({ description: 'Student homework notes or answer', example: 'تم تسجيل المقطع الصوتي ومراجعة الآيات مع التجويد.' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: 'Attachment or audio recording URL' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
