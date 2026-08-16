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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { authContext } from '../auth/http-auth-context';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { RequestWithId } from '../common/types/request-with-id';
import {
  CreateStudentEvaluationDto,
  StudentEvaluationQueryDto,
  UpdateStudentEvaluationDto,
} from './dto/student-evaluation.dto';
import { StudentEvaluationsService } from './student-evaluations.service';

@ApiTags('Student Evaluations')
@ApiBearerAuth()
@Controller('student-evaluations')
export class StudentEvaluationsController {
  constructor(private readonly service: StudentEvaluationsService) {}

  @Post()
  @RequirePermissions('student_evaluations.write')
  @ApiOperation({ summary: 'Record a periodic student evaluation' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStudentEvaluationDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.create(user, dto, authContext(req));
  }

  @Get()
  @RequirePermissions('student_evaluations.read')
  @ApiOperation({ summary: 'List student periodic evaluations matching filters' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: StudentEvaluationQueryDto,
  ) {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('student_evaluations.read')
  @ApiOperation({ summary: 'Get details of a student evaluation' })
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('student_evaluations.write')
  @ApiOperation({ summary: 'Update a student evaluation' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStudentEvaluationDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.update(user, id, dto, authContext(req));
  }

  @Delete(':id')
  @RequirePermissions('student_evaluations.write')
  @ApiOperation({ summary: 'Delete a student evaluation' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: RequestWithId,
  ) {
    return this.service.remove(user, id, authContext(req));
  }
}
