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
  AssignUserRoleDto,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from "./dto/user.dto";
import { UsersService } from "./users.service";
@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly s: UsersService) {}
  @Get() @RequirePermissions("users.read") list(
    @CurrentUser() u: AuthenticatedUser,
    @Query() q: UserQueryDto,
  ) {
    return this.s.list(u, q);
  }
  @Get(":id") @RequirePermissions("users.read") get(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.s.get(u, id);
  }
  @Post() @RequirePermissions("users.manage") create(
    @CurrentUser() u: AuthenticatedUser,
    @Body() d: CreateUserDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.create(u, d, authContext(r));
  }
  @Patch(":id") @RequirePermissions("users.manage") update(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: UpdateUserDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.update(u, id, d, authContext(r));
  }
  @Put(":id/role") @RequirePermissions("users.manage") role(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: AssignUserRoleDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.assignRole(u, id, d, authContext(r));
  }
  @Post(":id/activate") @RequirePermissions("users.manage") activate(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.setActive(u, id, true, authContext(r));
  }
  @Post(":id/suspend") @RequirePermissions("users.manage") suspend(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.setActive(u, id, false, authContext(r));
  }
  @Post(":id/force-password-change") @RequirePermissions("users.manage") force(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.forcePasswordChange(u, id, authContext(r));
  }
  @Post(":id/revoke-sessions") @RequirePermissions("users.manage") revoke(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.revokeSessions(u, id, authContext(r));
  }
}
