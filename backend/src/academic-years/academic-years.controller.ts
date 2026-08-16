import {
  Body,
  Controller,
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
  AcademicYearQueryDto,
  CreateAcademicYearDto,
  CreateTermDto,
  UpdateAcademicYearDto,
  UpdateTermDto,
} from './dto/academic-year.dto';
import { AcademicYearsService } from './academic-years.service';

@ApiTags('Academic Years')
@ApiBearerAuth()
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly service: AcademicYearsService) {}

  @Get()
  @RequirePermissions('academic_years.read')
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AcademicYearQueryDto,
  ) {
    return this.service.list(user, query);
  }

  @Get(':id')
  @RequirePermissions('academic_years.read')
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.get(user, id);
  }

  @Post()
  @RequirePermissions('academic_years.manage')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAcademicYearDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.create(user, dto, authContext(req));
  }

  @Patch(':id')
  @RequirePermissions('academic_years.manage')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAcademicYearDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.update(user, id, dto, authContext(req));
  }

  @Post(':id/activate')
  @RequirePermissions('academic_years.manage')
  activate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: RequestWithId,
  ) {
    return this.service.activate(user, id, authContext(req));
  }

  @Post(':id/terms')
  @RequirePermissions('academic_years.manage')
  addTerm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateTermDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.addTerm(user, id, dto, authContext(req));
  }

  @Patch('terms/:termId')
  @RequirePermissions('academic_years.manage')
  updateTerm(
    @CurrentUser() user: AuthenticatedUser,
    @Param('termId') termId: string,
    @Body() dto: UpdateTermDto,
    @Req() req: RequestWithId,
  ) {
    return this.service.updateTerm(user, termId, dto, authContext(req));
  }
}
