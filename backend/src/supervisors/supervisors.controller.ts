import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
  CreateSupervisorDto,
  ProfileQueryDto,
  UpdateSupervisorDto,
} from "../profiles/dto/profile.dto";
import { SupervisorsService } from "./supervisors.service";
@ApiTags("Technical Supervisors")
@ApiBearerAuth()
@Controller("supervisors")
export class SupervisorsController {
  constructor(private readonly s: SupervisorsService) {}
  @Get() @RequirePermissions("users.read") list(
    @CurrentUser() u: AuthenticatedUser,
    @Query() q: ProfileQueryDto,
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
    @Body() d: CreateSupervisorDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.create(u, d, authContext(r));
  }
  @Patch(":id") @RequirePermissions("users.manage") update(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: UpdateSupervisorDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.update(u, id, d, authContext(r));
  }
}
