import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { authContext } from "../auth/http-auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type { RequestWithId } from "../common/types/request-with-id";
import {
  CreateRoleDto,
  RoleQueryDto,
  SetRolePermissionsDto,
  UpdateRoleDto,
} from "./dto/role.dto";
import { RolesService } from "./roles.service";
@ApiTags("Roles")
@ApiBearerAuth()
@Controller("roles")
export class RolesController {
  constructor(private readonly s: RolesService) {}
  @Get() @RequirePermissions("roles.read") list(
    @CurrentUser() u: AuthenticatedUser,
    @Query() q: RoleQueryDto,
  ) {
    return this.s.list(u, q);
  }
  @Get(":id") @RequirePermissions("roles.read") get(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.s.get(u, id);
  }
  @Post() @RequirePermissions("roles.manage") create(
    @CurrentUser() u: AuthenticatedUser,
    @Body() d: CreateRoleDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.create(u, d, authContext(r));
  }
  @Patch(":id") @RequirePermissions("roles.manage") update(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: UpdateRoleDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.update(u, id, d, authContext(r));
  }
  @Put(":id/permissions") @RequirePermissions("roles.manage") permissions(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: SetRolePermissionsDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.permissions(u, id, d, authContext(r));
  }
}
