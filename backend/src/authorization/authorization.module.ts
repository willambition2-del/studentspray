import { Global, Module } from '@nestjs/common';
import { AccessScopeService } from './access-scope.service';
import { AuthorizationService } from './authorization.service';

@Global()
@Module({
  providers: [AuthorizationService, AccessScopeService],
  exports: [AuthorizationService, AccessScopeService],
})
export class AuthorizationModule {}
