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
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { authContext } from "../auth/http-auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type { RequestWithId } from "../common/types/request-with-id";
import {
  CreateParentDto,
  ProfileQueryDto,
  UpdateParentDto,
} from "../profiles/dto/profile.dto";
import {
  GuardianLinkDto,
  UpdateGuardianLinkDto,
} from "./dto/guardian-link.dto";
import { ParentsService } from "./parents.service";
@ApiTags("Parents")
@ApiBearerAuth()
@Controller("parents")
export class ParentsController {
  constructor(private readonly s: ParentsService) {}
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
    @Body() d: CreateParentDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.create(u, d, authContext(r));
  }
  @Patch(":id") @RequirePermissions("users.manage") update(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: UpdateParentDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.update(u, id, d, authContext(r));
  }
  @Get(":id/students") @RequirePermissions("users.read") students(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.s.students(u, id);
  }
  @Post(":id/students/:studentId")
  @RequirePermissions("users.manage", "students.manage")
  link(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Param("studentId") sid: string,
    @Body() d: GuardianLinkDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.link(u, id, sid, d, authContext(r));
  }
  @Patch(":id/students/:studentId")
  @RequirePermissions("users.manage", "students.manage")
  updateLink(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Param("studentId") sid: string,
    @Body() d: UpdateGuardianLinkDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.updateLink(u, id, sid, d, authContext(r));
  }
  @Delete(":id/students/:studentId")
  @RequirePermissions("users.manage", "students.manage")
  unlink(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Param("studentId") sid: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.unlink(u, id, sid, authContext(r));
  }
}
