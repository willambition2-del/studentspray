import { Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ProfilesService } from "./profiles.service";
@Global()
@Module({ imports: [AuthModule], providers: [ProfilesService], exports: [ProfilesService] })
export class ProfilesModule {}
