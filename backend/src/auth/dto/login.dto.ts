import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'demo-quran-forum' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  forumSlug!: string;

  @ApiProperty({ description: 'Username, email, or phone' })
  @IsString()
  @MinLength(2)
  @MaxLength(254)
  identifier!: string;

  @ApiProperty({ writeOnly: true })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
