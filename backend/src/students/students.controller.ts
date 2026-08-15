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
  CreateStudentDto,
  UpdateStudentDto,
} from "../profiles/dto/profile.dto";
import { StudentQueryDto, TransferStudentDto } from "./dto/student-query.dto";
import { StudentsService } from "./students.service";
@ApiTags("Students")
@ApiBearerAuth()
@Controller("students")
export class StudentsController {
  constructor(private readonly s: StudentsService) {}
  @Get() @RequirePermissions("students.read") list(
    @CurrentUser() u: AuthenticatedUser,
    @Query() q: StudentQueryDto,
  ) {
    return this.s.list(u, q);
  }
  @Get(":id") @RequirePermissions("students.read") get(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.s.get(u, id);
  }
  @Post() @RequirePermissions("students.manage") create(
    @CurrentUser() u: AuthenticatedUser,
    @Body() d: CreateStudentDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.create(u, d, authContext(r));
  }
  @Patch(":id") @RequirePermissions("students.manage") update(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: UpdateStudentDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.update(u, id, d, authContext(r));
  }
  @Post(":id/archive") @RequirePermissions("students.manage") archive(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.archive(u, id, false, authContext(r));
  }
  @Post(":id/restore") @RequirePermissions("students.manage") restore(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Req() r: RequestWithId,
  ) {
    return this.s.archive(u, id, true, authContext(r));
  }
  @Post(":id/transfer-halaqa") @RequirePermissions("students.manage") transfer(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() d: TransferStudentDto,
    @Req() r: RequestWithId,
  ) {
    return this.s.transfer(u, id, d.halaqaId, authContext(r));
  }
}
