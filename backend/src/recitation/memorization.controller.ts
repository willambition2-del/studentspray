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
  CreateMemorizationRecordDto,
  RecitationQueryDto,
} from './dto/recitation.dto';
import { RecitationService } from './recitation.service';

@ApiTags('Memorization')
@ApiBearerAuth()
@Controller('memorization')
export class MemorizationController {
  constructor(private readonly service: RecitationService) {}

  @Post()
  @RequirePermissions('memorization.write')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMemorizationRecordDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.createMemorization(user, dto, authContext(req));
  }

  @Get()
  @RequirePermissions('memorization.read')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecitationQueryDto,
  ) {
    return this.service.listMemorization(user, query);
  }
}
