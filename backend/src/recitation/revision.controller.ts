import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { authContext } from '../auth/http-auth-context';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { RequestWithId } from '../common/types/request-with-id';
import {
  CreateRevisionRecordDto,
  RecitationQueryDto,
} from './dto/recitation.dto';
import { RecitationService } from './recitation.service';

@ApiTags('Revision')
@ApiBearerAuth()
@Controller('revision')
export class RevisionController {
  constructor(private readonly service: RecitationService) {}

  @Post()
  @RequirePermissions('revision.write')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRevisionRecordDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.createRevision(user, dto, authContext(req));
  }

  @Get()
  @RequirePermissions('revision.read')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecitationQueryDto,
  ) {
    return this.service.listRevision(user, query);
  }
}
