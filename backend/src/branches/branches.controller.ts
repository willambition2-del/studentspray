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
import { BranchesService } from "./branches.service";
import {
  BranchQueryDto,
  CreateBranchDto,
  UpdateBranchDto,
} from "./dto/branch.dto";
@ApiTags("Branches")
@ApiBearerAuth()
@Controller("branches")
export class BranchesController {
  constructor(private readonly service: BranchesService) {}
  @Get() @RequirePermissions("branches.read") list(
    @CurrentUser() u: AuthenticatedUser,
    @Query() q: BranchQueryDto,
  ) {
    return this.service.list(u, q);
  }
  @Get(":id") @RequirePermissions("branches.read") get(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.service.get(u, id);
  }
  @Post() @RequirePermissions("branches.manage") create(
    @CurrentUser() u: AuthenticatedUser,
    @Body() d: CreateBranchDto,
    @Req() r: RequestWithId,
  ) {
    return this.service.create(u, d, authContext(r));
  }
  @Patch(":id") @RequirePermissions("branches.manage") update(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: UpdateBranchDto,
    @Req() r: RequestWithId,
  ) {
    return this.service.update(u, id, d, authContext(r));
  }
  @Post(":id/archive") @RequirePermissions("branches.manage") archive(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.service.archive(u, id, false, authContext(r));
  }
  @Post(":id/restore") @RequirePermissions("branches.manage") restore(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.service.archive(u, id, true, authContext(r));
  }
}
