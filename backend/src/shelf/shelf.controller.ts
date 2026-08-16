import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ShelfService } from './shelf.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import {
  CreateShelfItemDto,
  CreateShelfSectionDto,
  SetPublisherRuleDto,
  ShelfItemQueryDto,
  UpdateShelfItemDto,
  UpdateShelfSectionDto,
} from './dto/shelf.dto';

@Controller('shelf')
export class ShelfController {
  constructor(private readonly shelfService: ShelfService) {}

  // Sections
  @Get('sections')
  @RequirePermissions('shelf.read')
  async getSections(@CurrentUser() user: AuthenticatedUser) {
    return this.shelfService.getSections(user);
  }

  @Post('sections')
  @RequirePermissions('shelf.manage')
  async createSection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShelfSectionDto,
  ) {
    return this.shelfService.createSection(user, dto);
  }

  @Patch('sections/:id')
  @RequirePermissions('shelf.manage')
  async updateSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateShelfSectionDto,
  ) {
    return this.shelfService.updateSection(user, id, dto);
  }

  // Publisher Rules
  @Post('permissions')
  @RequirePermissions('shelf.permissions.manage')
  async setPublisherRule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetPublisherRuleDto,
  ) {
    return this.shelfService.setPublisherRule(user, dto);
  }

  @Delete('permissions/:id')
  @RequirePermissions('shelf.permissions.manage')
  async removePublisherRule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.shelfService.removePublisherRule(user, id);
  }

  // Items / Posts
  @Get('items')
  @RequirePermissions('shelf.read')
  async findAllItems(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ShelfItemQueryDto,
  ) {
    return this.shelfService.findAllItems(user, query);
  }

  @Get('items/:id')
  @RequirePermissions('shelf.read')
  async findOneItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.shelfService.findOneItem(user, id);
  }

  @Post('items')
  @RequirePermissions('shelf.publish')
  async createItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateShelfItemDto,
  ) {
    return this.shelfService.createItem(user, dto);
  }

  @Patch('items/:id')
  @RequirePermissions('shelf.publish')
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateShelfItemDto,
  ) {
    return this.shelfService.updateItem(user, id, dto);
  }

  @Delete('items/:id')
  @RequirePermissions('shelf.manage')
  async deleteItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.shelfService.deleteItem(user, id);
  }
}
