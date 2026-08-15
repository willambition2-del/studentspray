import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { PrismaService } from "../database/prisma.service";
@ApiTags("Permissions")
@ApiBearerAuth()
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly p: PrismaService) {}
  @Get() @RequirePermissions("roles.read") list() {
    return this.p.permission.findMany({ orderBy: { code: "asc" } });
  }
}
