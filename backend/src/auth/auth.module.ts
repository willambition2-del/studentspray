import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { BootstrapGeneralManagerService } from './bootstrap-general-manager.service';
import { AuthAuditService } from './auth-audit.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { RoleGuard } from './guards/role.guard';
import { WebOriginGuard } from './guards/web-origin.guard';
import { MobileAuthController } from './mobile-auth.controller';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { WebAuthController } from './web-auth.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, WebAuthController, MobileAuthController],
  providers: [
    AuthService,
    AuthAuditService,
    PasswordService,
    TokenService,
    BootstrapGeneralManagerService,
    WebOriginGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
  exports: [AuthService, PasswordService, TokenService, BootstrapGeneralManagerService],
})
export class AuthModule {}
