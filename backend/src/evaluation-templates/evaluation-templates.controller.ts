import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { authContext } from '../auth/http-auth-context';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { RequestWithId } from '../common/types/request-with-id';
import {
  CreateEvaluationTemplateDto,
  EvaluationTemplateQueryDto,
  UpdateEvaluationTemplateDto,
} from './dto/evaluation-template.dto';
import { EvaluationTemplatesService } from './evaluation-templates.service';

@ApiTags('Evaluation Templates')
@ApiBearerAuth()
@Controller('evaluation-templates')
export class EvaluationTemplatesController {
  constructor(private readonly service: EvaluationTemplatesService) {}

  @Get()
  @RequirePermissions('evaluation_templates.read')
  @ApiOperation({ summary: 'List all evaluation templates' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EvaluationTemplateQueryDto,
  ) {
    return this.service.list(user, query);
  }

  @Get('active')
  @RequirePermissions('evaluation_templates.read')
  @ApiOperation({ summary: 'Get active default evaluation template' })
  getActive(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getActiveTemplate(user);
  }

  @Get(':id')
  @RequirePermissions('evaluation_templates.read')
  @ApiOperation({ summary: 'Get evaluation template detail by ID' })
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.getById(user, id);
  }

  @Post()
  @RequirePermissions('evaluation_templates.manage')
  @ApiOperation({ summary: 'Create new evaluation template with axes and criteria' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEvaluationTemplateDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.create(user, dto, authContext(req));
  }

  @Put(':id')
  @RequirePermissions('evaluation_templates.manage')
  @ApiOperation({ summary: 'Update evaluation template (bumps version if evaluations exist)' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEvaluationTemplateDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.update(user, id, dto, authContext(req));
  }

  @Patch(':id')
  @RequirePermissions('evaluation_templates.manage')
  @ApiOperation({ summary: 'Patch evaluation template' })
  patch(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateEvaluationTemplateDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.update(user, id, dto, authContext(req));
  }

  @Post(':id/activate')
  @RequirePermissions('evaluation_templates.manage')
  @ApiOperation({ summary: 'Activate template as default' })
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: RequestWithId,
  ) {
    return this.service.activate(user, id, authContext(req));
  }

  @Delete(':id')
  @RequirePermissions('evaluation_templates.manage')
  @ApiOperation({ summary: 'Soft-delete evaluation template' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: RequestWithId,
  ) {
    return this.service.remove(user, id, authContext(req));
  }
}
