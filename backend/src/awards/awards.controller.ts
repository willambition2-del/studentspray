import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AwardsService } from './awards.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  AwardQueryDto,
  CreateAwardDto,
  GrantAwardDto,
  UpdateAwardDto,
} from './dto/award.dto';

@Controller('awards')
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Post()
  @RequirePermissions('awards.manage')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAwardDto,
  ) {
    return this.awardsService.create(user, dto);
  }

  @Get()
  @RequirePermissions('awards.read')
  async findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AwardQueryDto,
  ) {
    return this.awardsService.findAll(user, query);
  }

  @Get(':id')
  @RequirePermissions('awards.read')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.awardsService.findOne(user, id);
  }

  @Patch(':id')
  @RequirePermissions('awards.manage')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAwardDto,
  ) {
    return this.awardsService.update(user, id, dto);
  }

  @Post('grant')
  @RequirePermissions('awards.manage')
  async grantAward(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GrantAwardDto,
  ) {
    return this.awardsService.grantAward(user, dto);
  }

  @Get('students/:studentId')
  @RequirePermissions('awards.read')
  async getStudentAwards(@Param('studentId') studentId: string) {
    return this.awardsService.getStudentAwards(studentId);
  }
}
