import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API, PostgreSQL, and Redis readiness' })
  @ApiResponse({ status: 200, description: 'All required services are available' })
  @ApiResponse({ status: 503, description: 'A required dependency is unavailable' })
  async getHealth(@Res({ passthrough: true }) response: Response) {
    const result = await this.health.check();
    if (result.status === 'error') response.status(HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
