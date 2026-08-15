import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { authContext } from "../auth/http-auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type { RequestWithId } from "../common/types/request-with-id";
import { UpdateForumDto } from "./dto/update-forum.dto";
import { ForumsService } from "./forums.service";

@ApiTags("Forums")
@ApiBearerAuth()
@Controller("forums")
export class ForumsController {
  constructor(private readonly forums: ForumsService) {}
  @Get("current")
  @ApiOperation({ summary: "Get the authenticated forum" })
  current(@CurrentUser() user: AuthenticatedUser) {
    return this.forums.current(user);
  }
  @Patch("current")
  @RequirePermissions("settings.manage")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateForumDto,
    @Req() req: RequestWithId,
  ) {
    return this.forums.update(user, dto, authContext(req));
  }
}
