import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  AdminAlertSeverity,
  AdminAlertStatus,
  AdminAlertType,
  AdminDecisionStatus,
  AdminDecisionType,
  AdminPriority,
  AdminRequestStatus,
  AdminRequestType,
  AdminTaskStatus,
} from '../generated/prisma/client';
import { AdministrativeRequestsService } from './administrative-requests.service';
import { AdministrativeDecisionsService } from './administrative-decisions.service';
import { AdministrativeAlertsService } from './administrative-alerts.service';
import { AdministrativeTasksService } from './administrative-tasks.service';
import {
  AddTaskFollowUpDto,
  CreateAdminAlertDto,
  CreateAdminDecisionDto,
  CreateAdminRequestDto,
  CreateAdminTaskDto,
  ResolveAdminAlertDto,
  ReviewAdminRequestDto,
  UpdateAdminDecisionDto,
  UpdateAdminRequestDto,
  UpdateAdminTaskDto,
} from './dto/administrative.dto';

@ApiTags('Administrative Workflows')
@ApiBearerAuth()
@Controller()
export class AdministrativeController {
  constructor(
    @Inject(AdministrativeRequestsService)
    private readonly requestsService: AdministrativeRequestsService,
    @Inject(AdministrativeDecisionsService)
    private readonly decisionsService: AdministrativeDecisionsService,
    @Inject(AdministrativeAlertsService)
    private readonly alertsService: AdministrativeAlertsService,
    @Inject(AdministrativeTasksService)
    private readonly tasksService: AdministrativeTasksService,
  ) {}

  // =========================================================================
  // 1. ADMINISTRATIVE REQUESTS
  // =========================================================================

  @Post('admin-requests')
  @RequirePermissions('admin_requests.create')
  @ApiOperation({ summary: 'Create a new administrative request' })
  async createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdminRequestDto,
  ) {
    return this.requestsService.create(user, dto);
  }

  @Get('admin-requests')
  @RequirePermissions('admin_requests.read')
  @ApiOperation({ summary: 'List administrative requests (scoped)' })
  async listRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
    @Query('status') status?: AdminRequestStatus,
    @Query('type') type?: AdminRequestType,
    @Query('priority') priority?: AdminPriority,
    @Query('branchId') branchId?: string,
    @Query('myOnly') myOnly?: boolean,
  ) {
    return this.requestsService.findAll(user, {
      ...query,
      status,
      type,
      priority,
      branchId,
      myOnly,
    });
  }

  @Get('admin-requests/my')
  @RequirePermissions('admin_requests.read')
  @ApiOperation({ summary: 'List current user own administrative requests' })
  async listMyRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.requestsService.findAll(user, { ...query, myOnly: true });
  }

  @Get('admin-requests/:id')
  @RequirePermissions('admin_requests.read')
  @ApiOperation({ summary: 'Get administrative request details' })
  async getRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requestsService.findOne(user, id);
  }

  @Patch('admin-requests/:id')
  @RequirePermissions('admin_requests.create')
  @ApiOperation({ summary: 'Update a draft administrative request' })
  async updateRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminRequestDto,
  ) {
    return this.requestsService.update(user, id, dto);
  }

  @Post('admin-requests/:id/submit')
  @RequirePermissions('admin_requests.create')
  @ApiOperation({ summary: 'Submit a draft administrative request for review' })
  async submitRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requestsService.submit(user, id);
  }

  @Post('admin-requests/:id/review')
  @RequirePermissions('admin_requests.review')
  @ApiOperation({ summary: 'Approve, reject, or return an administrative request' })
  async reviewRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewAdminRequestDto,
  ) {
    return this.requestsService.review(user, id, dto);
  }

  @Post('admin-requests/:id/cancel')
  @RequirePermissions('admin_requests.create')
  @ApiOperation({ summary: 'Cancel a pending administrative request' })
  async cancelRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.requestsService.cancel(user, id);
  }

  // =========================================================================
  // 2. ADMINISTRATIVE DECISIONS
  // =========================================================================

  @Post('admin-decisions')
  @RequirePermissions('admin_decisions.manage')
  @ApiOperation({ summary: 'Create a new administrative decision' })
  async createDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdminDecisionDto,
  ) {
    return this.decisionsService.create(user, dto);
  }

  @Get('admin-decisions')
  @RequirePermissions('admin_decisions.read')
  @ApiOperation({ summary: 'List administrative decisions' })
  async listDecisions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
    @Query('status') status?: AdminDecisionStatus,
    @Query('type') type?: AdminDecisionType,
    @Query('branchId') branchId?: string,
  ) {
    return this.decisionsService.findAll(user, { ...query, status, type, branchId });
  }

  @Get('admin-decisions/:id')
  @RequirePermissions('admin_decisions.read')
  @ApiOperation({ summary: 'Get administrative decision details' })
  async getDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.decisionsService.findOne(user, id);
  }

  @Patch('admin-decisions/:id')
  @RequirePermissions('admin_decisions.manage')
  @ApiOperation({ summary: 'Update an administrative decision' })
  async updateDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDecisionDto,
  ) {
    return this.decisionsService.update(user, id, dto);
  }

  @Post('admin-decisions/:id/issue')
  @RequirePermissions('admin_decisions.manage')
  @ApiOperation({ summary: 'Issue / Activate an administrative decision' })
  async issueDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.decisionsService.issue(user, id);
  }

  @Post('admin-decisions/:id/cancel')
  @RequirePermissions('admin_decisions.manage')
  @ApiOperation({ summary: 'Cancel an administrative decision' })
  async cancelDecision(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.decisionsService.cancel(user, id);
  }

  // =========================================================================
  // 3. ADMINISTRATIVE ALERTS
  // =========================================================================

  @Post('admin-alerts')
  @RequirePermissions('admin_alerts.manage')
  @ApiOperation({ summary: 'Create an administrative alert' })
  async createAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdminAlertDto,
  ) {
    return this.alertsService.create(user, dto);
  }

  @Get('admin-alerts')
  @RequirePermissions('admin_alerts.read')
  @ApiOperation({ summary: 'List administrative alerts' })
  async listAlerts(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
    @Query('status') status?: AdminAlertStatus,
    @Query('severity') severity?: AdminAlertSeverity,
    @Query('type') type?: AdminAlertType,
    @Query('branchId') branchId?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.alertsService.findAll(user, {
      ...query,
      status,
      severity,
      type,
      branchId,
      assignedToId,
    });
  }

  @Get('admin-alerts/:id')
  @RequirePermissions('admin_alerts.read')
  @ApiOperation({ summary: 'Get administrative alert details' })
  async getAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.alertsService.findOne(user, id);
  }

  @Post('admin-alerts/:id/acknowledge')
  @RequirePermissions('admin_alerts.read')
  @ApiOperation({ summary: 'Acknowledge an assigned administrative alert' })
  async acknowledgeAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.alertsService.acknowledge(user, id);
  }

  @Post('admin-alerts/:id/resolve')
  @RequirePermissions('admin_alerts.manage')
  @ApiOperation({ summary: 'Resolve or dismiss an administrative alert' })
  async resolveAlert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveAdminAlertDto,
  ) {
    return this.alertsService.resolve(user, id, dto);
  }

  // =========================================================================
  // 4. ADMINISTRATIVE TASKS
  // =========================================================================

  @Post('admin-tasks')
  @RequirePermissions('admin_tasks.manage')
  @ApiOperation({ summary: 'Assign a new administrative task' })
  async createTask(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAdminTaskDto,
  ) {
    return this.tasksService.create(user, dto);
  }

  @Get('admin-tasks')
  @RequirePermissions('admin_tasks.read')
  @ApiOperation({ summary: 'List administrative tasks' })
  async listTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
    @Query('status') status?: AdminTaskStatus,
    @Query('priority') priority?: AdminPriority,
    @Query('branchId') branchId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('myOnly') myOnly?: boolean,
  ) {
    return this.tasksService.findAll(user, {
      ...query,
      status,
      priority,
      branchId,
      assignedToId,
      myOnly,
    });
  }

  @Get('admin-tasks/my')
  @RequirePermissions('admin_tasks.read')
  @ApiOperation({ summary: 'List administrative tasks assigned to current user' })
  async listMyTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.tasksService.findAll(user, { ...query, myOnly: true });
  }

  @Get('admin-tasks/:id')
  @RequirePermissions('admin_tasks.read')
  @ApiOperation({ summary: 'Get administrative task details and follow-ups' })
  async getTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.findOne(user, id);
  }

  @Patch('admin-tasks/:id')
  @RequirePermissions('admin_tasks.read')
  @ApiOperation({ summary: 'Update administrative task status or priority' })
  async updateTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminTaskDto,
  ) {
    return this.tasksService.update(user, id, dto);
  }

  @Post('admin-tasks/:id/follow-ups')
  @RequirePermissions('admin_tasks.read')
  @ApiOperation({ summary: 'Add a follow-up log or progress update to a task' })
  async addTaskFollowUp(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTaskFollowUpDto,
  ) {
    return this.tasksService.addFollowUp(user, id, dto);
  }

  @Post('admin-tasks/check-overdue')
  @RequirePermissions('admin_tasks.manage')
  @ApiOperation({ summary: 'Trigger overdue check on open tasks and generate alerts' })
  async checkOverdueTasks(@CurrentUser() user: AuthenticatedUser) {
    return this.tasksService.checkOverdue(user);
  }
}
