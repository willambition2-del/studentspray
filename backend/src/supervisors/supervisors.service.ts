import { Injectable } from "@nestjs/common";
import type { AuthContext } from "../auth/types/auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type {
  CreateSupervisorDto,
  ProfileQueryDto,
  UpdateSupervisorDto,
} from "../profiles/dto/profile.dto";
import { ProfilesService } from "../profiles/profiles.service";
@Injectable()
export class SupervisorsService {
  constructor(private readonly p: ProfilesService) {}
  list(u: AuthenticatedUser, q: ProfileQueryDto) {
    return this.p.list("supervisor", u, q);
  }
  get(u: AuthenticatedUser, id: string) {
    return this.p.get("supervisor", u, id);
  }
  create(u: AuthenticatedUser, d: CreateSupervisorDto, c: AuthContext) {
    return this.p.create(
      "supervisor",
      u,
      d,
      { employeeNumber: d.employeeNumber },
      c,
    );
  }
  update(
    u: AuthenticatedUser,
    id: string,
    d: UpdateSupervisorDto,
    c: AuthContext,
  ) {
    return this.p.update(
      "supervisor",
      u,
      id,
      d,
      { employeeNumber: d.employeeNumber },
      c,
    );
  }
}
