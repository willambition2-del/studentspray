import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ReportFilterDto } from './dto/report-query.dto';
import { ReportsService } from './services/reports.service';

@ApiTags('Reports and Print Center')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(
    @Inject(ReportsService) private readonly reportsService: ReportsService,
  ) {}

  @Get('dashboard-summary')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get high-level dashboard metrics and KPI summary' })
  async getDashboardSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getDashboardSummary(user);
  }

  @Get('students/export')
  @RequirePermissions('reports.export')
  @ApiOperation({ summary: 'Export students list as UTF-8 CSV' })
  async exportStudentsCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportFilterDto,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.exportStudentsCsv(user, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="students-report.csv"');
    return res.send(csvContent);
  }

  @Get('students/:id')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get comprehensive student performance report' })
  async getStudentReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reportsService.getStudentReport(user, id);
  }

  @Get('students/:id/pdf')
  @RequirePermissions('reports.export')
  @ApiOperation({ summary: 'Download official student performance PDF' })
  async getStudentReportPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportsService.getStudentReportPdf(user, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="student-report-${id}.pdf"`);
    return res.send(pdfBuffer);
  }

  @Get('halaqas/:id')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get comprehensive halaqa performance report' })
  async getHalaqaReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ReportFilterDto,
  ) {
    return this.reportsService.getHalaqaReport(user, id, query);
  }

  @Get('halaqas/:id/pdf')
  @RequirePermissions('reports.export')
  @ApiOperation({ summary: 'Download official halaqa performance PDF' })
  async getHalaqaReportPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.reportsService.getHalaqaReportPdf(user, id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="halaqa-report-${id}.pdf"`);
    return res.send(pdfBuffer);
  }

  @Get('attendance')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get attendance report with filters' })
  async getAttendanceReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportFilterDto,
  ) {
    return this.reportsService.getAttendanceReport(user, query);
  }

  @Get('attendance/export')
  @RequirePermissions('reports.export')
  @ApiOperation({ summary: 'Export attendance report as UTF-8 CSV' })
  async exportAttendanceCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportFilterDto,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.exportAttendanceCsv(user, query);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
    return res.send(csvContent);
  }

  @Get('exams/:id')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get exam results report and score metrics' })
  async getExamReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reportsService.getExamReport(user, id);
  }

  @Get('teachers/:id')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get teacher supervisory performance report' })
  async getTeacherReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reportsService.getTeacherReport(user, id);
  }

  @Get('supervisors/:id')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get supervisor performance report' })
  async getSupervisorReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reportsService.getSupervisorReport(user, id);
  }

  @Get('administrative')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get administrative requests, tasks, and alerts report' })
  async getAdministrativeReport(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportFilterDto,
  ) {
    return this.reportsService.getAdministrativeReport(user, query);
  }
}
