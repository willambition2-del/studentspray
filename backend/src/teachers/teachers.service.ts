import { Injectable } from "@nestjs/common";
import type { AuthContext } from "../auth/types/auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type {
  CreateTeacherDto,
  ProfileQueryDto,
  UpdateTeacherDto,
} from "../profiles/dto/profile.dto";
import { ProfilesService } from "../profiles/profiles.service";
@Injectable()
export class TeachersService {
  constructor(private readonly p: ProfilesService) {}
  list(u: AuthenticatedUser, q: ProfileQueryDto) {
    return this.p.list("teacher", u, q);
  }
  get(u: AuthenticatedUser, id: string) {
    return this.p.get("teacher", u, id);
  }
  create(u: AuthenticatedUser, d: CreateTeacherDto, c: AuthContext) {
    return this.p.create(
      "teacher",
      u,
      d,
      { employeeNumber: d.employeeNumber, specialization: d.specialization },
      c,
    );
  }
  update(
    u: AuthenticatedUser,
    id: string,
    d: UpdateTeacherDto,
    c: AuthContext,
  ) {
    return this.p.update(
      "teacher",
      u,
      id,
      d,
      { employeeNumber: d.employeeNumber, specialization: d.specialization },
      c,
    );
  }
}
