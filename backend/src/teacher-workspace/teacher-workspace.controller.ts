import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { TeacherWorkspaceService } from './teacher-workspace.service';

@ApiTags('Teacher Workspace')
@ApiBearerAuth()
@Controller('teacher/me')
export class TeacherWorkspaceController {
  constructor(private readonly service: TeacherWorkspaceService) {}

  @Get('halaqas')
  @RequirePermissions('halaqas.read')
  getMyHalaqas(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getMyHalaqas(user);
  }

  @Get('halaqas/:halaqaId/today')
  @RequirePermissions('halaqas.read')
  getHalaqaTodayWorkspace(
    @CurrentUser() user: AuthenticatedUser,
    @Param('halaqaId') halaqaId: string,
  ) {
    return this.service.getHalaqaTodayWorkspace(user, halaqaId);
  }
}
