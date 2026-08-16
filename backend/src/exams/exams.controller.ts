import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  BulkGradeExamDto,
  CreateExamDto,
  ExamQueryDto,
  PublishExamDto,
  UpdateExamDto,
  UpdateExamResultDto,
} from './dto/exam.dto';
import { ExamsService } from './exams.service';

@ApiTags('Exams & Grades')
@ApiBearerAuth()
@Controller('exams')
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  @Post()
  @RequirePermissions('exams.manage')
  @ApiOperation({ summary: 'Create a new exam' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExamDto,
    @Req() req: RequestWithId,
  ) {
    return this.exams.create(user, dto, authContext(req));
  }

  @Get()
  @RequirePermissions('exams.read')
  @ApiOperation({ summary: 'List exams matching filters' })
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ExamQueryDto) {
    return this.exams.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('exams.read')
  @ApiOperation({ summary: 'Get exam details with criteria' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.exams.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('exams.manage')
  @ApiOperation({ summary: 'Update exam details and criteria' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateExamDto,
    @Req() req: RequestWithId,
  ) {
    return this.exams.update(user, id, dto, authContext(req));
  }

  @Delete(':id')
  @RequirePermissions('exams.manage')
  @ApiOperation({ summary: 'Archive / soft delete exam' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: RequestWithId,
  ) {
    return this.exams.remove(user, id, authContext(req));
  }

  @Patch(':id/publish')
  @RequirePermissions('grades.publish')
  @ApiOperation({ summary: 'Publish or unpublish exam results' })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PublishExamDto,
    @Req() req: RequestWithId,
  ) {
    return this.exams.publish(user, id, dto, authContext(req));
  }

  @Get(':id/results')
  @RequirePermissions('grades.read')
  @ApiOperation({ summary: 'Get results of an exam' })
  getResults(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.exams.getResults(user, id);
  }

  @Put(':id/results')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('grades.write')
  @ApiOperation({ summary: 'Bulk grade students for an exam' })
  bulkGrade(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BulkGradeExamDto,
    @Req() req: RequestWithId,
  ) {
    return this.exams.bulkGrade(user, id, dto, authContext(req));
  }

  @Patch(':id/results/:resultId')
  @RequirePermissions('grades.write')
  @ApiOperation({ summary: 'Correct a single student grade with audit trail' })
  updateSingleResult(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('resultId') resultId: string,
    @Body() dto: UpdateExamResultDto,
    @Req() req: RequestWithId,
  ) {
    return this.exams.updateSingleResult(user, id, resultId, dto, authContext(req));
  }
}
