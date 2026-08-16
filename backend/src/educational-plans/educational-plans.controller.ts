import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
  CreateEducationalPlanDto,
  CreatePlanItemDto,
  EducationalPlanQueryDto,
  UpdateEducationalPlanDto,
  UpdatePlanItemDto,
} from './dto/educational-plan.dto';
import { EducationalPlansService } from './educational-plans.service';

@ApiTags('Educational Plans')
@ApiBearerAuth()
@Controller('educational-plans')
export class EducationalPlansController {
  constructor(private readonly service: EducationalPlansService) {}

  @Get()
  @RequirePermissions('educational_plans.read')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EducationalPlanQueryDto,
  ) {
    return this.service.list(user, query);
  }

  @Get(':id')
  @RequirePermissions('educational_plans.read')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.get(user, id);
  }

  @Post()
  @RequirePermissions('educational_plans.manage')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEducationalPlanDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.create(user, dto, authContext(req));
  }

  @Patch(':id')
  @RequirePermissions('educational_plans.manage')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEducationalPlanDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.update(user, id, dto, authContext(req));
  }

  @Post(':id/activate')
  @RequirePermissions('educational_plans.manage')
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: RequestWithId,
  ) {
    return this.service.activate(user, id, authContext(req));
  }

  @Post(':id/archive')
  @RequirePermissions('educational_plans.manage')
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: RequestWithId,
  ) {
    return this.service.archive(user, id, authContext(req));
  }

  @Post(':id/items')
  @RequirePermissions('educational_plans.manage')
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreatePlanItemDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.addItem(user, id, dto, authContext(req));
  }

  @Patch('items/:itemId')
  @RequirePermissions('educational_plans.manage')
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePlanItemDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.updateItem(user, itemId, dto, authContext(req));
  }

  @Delete('items/:itemId')
  @RequirePermissions('educational_plans.manage')
  deleteItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('itemId') itemId: string,
    @Req() req: RequestWithId,
  ) {
    return this.service.deleteItem(user, itemId, authContext(req));
  }
}
