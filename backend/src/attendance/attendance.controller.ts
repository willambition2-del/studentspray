import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
  AttendanceQueryDto,
  CreateAttendanceSessionDto,
  UpdateAttendanceRecordsDto,
} from './dto/attendance.dto';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance')
@ApiBearerAuth()
@Controller()
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('halaqas/:halaqaId/attendance/sessions')
  @RequirePermissions('attendance.write')
  createOrUpdateSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('halaqaId') halaqaId: string,
    @Body() dto: CreateAttendanceSessionDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.createOrUpdateSession(user, halaqaId, dto, authContext(req));
  }

  @Put('attendance/sessions/:sessionId/records')
  @RequirePermissions('attendance.write')
  updateSessionRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateAttendanceRecordsDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.updateSessionRecords(user, sessionId, dto, authContext(req));
  }

  @Get('halaqas/:halaqaId/attendance')
  @RequirePermissions('attendance.read')
  getHalaqaAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('halaqaId') halaqaId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.service.getHalaqaAttendance(user, halaqaId, query);
  }

  @Get('students/:studentId/attendance')
  @RequirePermissions('attendance.read')
  getStudentAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.service.getStudentAttendance(user, studentId, query);
  }

  @Get('halaqas/:halaqaId/attendance/summary')
  @RequirePermissions('attendance.read')
  getHalaqaSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('halaqaId') halaqaId: string,
  ) {
    return this.service.getHalaqaSummary(user, halaqaId);
  }
}
