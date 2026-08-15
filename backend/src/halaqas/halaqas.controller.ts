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
  CreateHalaqaDto,
  HalaqaQueryDto,
  UpdateHalaqaDto,
} from "./dto/halaqa.dto";
import { HalaqasService } from "./halaqas.service";
@ApiTags("Halaqas")
@ApiBearerAuth()
@Controller("halaqas")
export class HalaqasController {
  constructor(private readonly s: HalaqasService) {}
  @Get() @RequirePermissions("halaqas.read") list(
    @CurrentUser() u: AuthenticatedUser,
    @Query() q: HalaqaQueryDto,
  ) {
    return this.s.list(u, q);
  }
  @Get(":id") @RequirePermissions("halaqas.read") get(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.s.get(u, id);
  }
  @Post() @RequirePermissions("halaqas.manage") create(
    @CurrentUser() u: AuthenticatedUser,
    @Body() d: CreateHalaqaDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.create(u, d, authContext(r));
  }
  @Patch(":id") @RequirePermissions("halaqas.manage") update(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: UpdateHalaqaDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.update(u, id, d, authContext(r));
  }
  @Post(":id/archive") @RequirePermissions("halaqas.manage") archive(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.archive(u, id, false, authContext(r));
  }
  @Post(":id/restore") @RequirePermissions("halaqas.manage") restore(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.archive(u, id, true, authContext(r));
  }
  @Get(":id/students") @RequirePermissions("halaqas.read") students(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.s.students(u, id);
  }
  @Post(":id/students/:studentId")
  @RequirePermissions("halaqas.manage")
  addStudent(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Param("studentId") sid: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.addStudent(u, id, sid, authContext(r));
  }
  @Post(":id/students/:studentId/remove")
  @RequirePermissions("halaqas.manage")
  removeStudent(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Param("studentId") sid: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.removeStudent(u, id, sid, authContext(r));
  }
  @Get(":id/teachers") @RequirePermissions("halaqas.read") teachers(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.s.teachers(u, id);
  }
  @Post(":id/teachers/:teacherId")
  @RequirePermissions("halaqas.manage")
  assignTeacher(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Param("teacherId") tid: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.assignTeacher(u, id, tid, authContext(r));
  }
  @Post(":id/teachers/:teacherId/end")
  @RequirePermissions("halaqas.manage")
  endTeacher(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Param("teacherId") tid: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.endTeacher(u, id, tid, authContext(r));
  }
  @Get(":id/supervisors") @RequirePermissions("halaqas.read") supervisors(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.s.supervisors(u, id);
  }
  @Post(":id/supervisors/:supervisorId")
  @RequirePermissions("halaqas.manage")
  assignSupervisor(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Param("supervisorId") sid: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.assignSupervisor(u, id, sid, authContext(r));
  }
  @Post(":id/supervisors/:supervisorId/end")
  @RequirePermissions("halaqas.manage")
  endSupervisor(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Param("supervisorId") sid: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.endSupervisor(u, id, sid, authContext(r));
  }
}
