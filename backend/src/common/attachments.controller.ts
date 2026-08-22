import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { existsSync, mkdirSync, createReadStream } from 'fs';
// @ts-ignore
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AttachmentsService } from './attachments.service';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

@ApiTags('Attachments')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload file attachment (Images, PDFs, Documents)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req: any, _file: any, cb: any) => {
          if (!existsSync(UPLOAD_DIR)) {
            mkdirSync(UPLOAD_DIR, { recursive: true });
          }
          cb(null, UPLOAD_DIR);
        },
        filename: (_req: any, file: any, cb: any) => {
          const ext = extname(file.originalname).toLowerCase();
          const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (_req: any, file: any, cb: any) => {
        const ext = extname(file.originalname).toLowerCase();
        const mime = file.mimetype?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_MIME_TYPES.has(mime)) {
          return cb(new Error('نوع الملف غير مسموح به'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB
      },
    }),
  )
  uploadFile(
    @UploadedFile() file: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new NotFoundException('No file provided');
    }

    this.attachmentsService.registerUpload({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedById: user.id,
      forumId: user.forumId,
      createdAt: new Date(),
    });

    return {
      url: `/api/v1/attachments/file/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  @Get('file/:filename')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download or view uploaded attachment with resource-level authorization' })
  async getFile(
    @Param('filename') filename: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const resolvedPath = join(UPLOAD_DIR, safeFilename);

    // Prevent path traversal
    if (!resolvedPath.startsWith(UPLOAD_DIR) || !existsSync(resolvedPath)) {
      throw new NotFoundException('Attachment file not found');
    }

    // Authorize resource access
    await this.attachmentsService.authorizeAttachmentAccess(safeFilename, user);

    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    const stream = createReadStream(resolvedPath);
    stream.pipe(res);
  }
}
