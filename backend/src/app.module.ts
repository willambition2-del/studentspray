import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { environmentValidationSchema } from './config/environment';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validationSchema: environmentValidationSchema }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    HealthModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor }],
})
export class AppModule {}
