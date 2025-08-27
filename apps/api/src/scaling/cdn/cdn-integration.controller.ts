import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/rbac.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { CDNIntegrationService, CDNProvider, CDNZone, CacheRule, CDNMetrics } from './cdn-integration.service';

@ApiTags('CDN Integration')
@Controller('cdn')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CDNIntegrationController {
  constructor(private readonly cdnService: CDNIntegrationService) {}

  @Post('providers')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create a new CDN provider' })
  @ApiResponse({ status: 201, description: 'CDN provider created successfully' })
  async createProvider(
    @Body() body: { name: string; type: CDNProvider['type']; config: Record<string, any> },
  ): Promise<CDNProvider> {
    return this.cdnService.createCDNProvider(body.name, body.type, body.config);
  }

  @Post('zones')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create a new CDN zone' })
  @ApiResponse({ status: 201, description: 'CDN zone created successfully' })
  async createZone(
    @Body() body: { providerId: string; domain: string; origin: string; ssl?: CDNZone['ssl'] },
  ): Promise<CDNZone> {
    return this.cdnService.createCDNZone(body.providerId, body.domain, body.origin, body.ssl);
  }

  @Post('zones/:zoneId/cache-rules')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Add a cache rule to a CDN zone' })
  @ApiResponse({ status: 201, description: 'Cache rule added successfully' })
  async addCacheRule(
    @Param('zoneId') zoneId: string,
    @Body() body: { pattern: string; ttl: number; headers?: Record<string, string>; bypass?: boolean },
  ): Promise<CacheRule> {
    return this.cdnService.addCacheRule(
      zoneId,
      body.pattern,
      body.ttl,
      body.headers,
      body.bypass,
    );
  }

  @Post('zones/:zoneId/purge')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Purge cache for a CDN zone' })
  @ApiResponse({ status: 200, description: 'Cache purged successfully' })
  async purgeCache(
    @Param('zoneId') zoneId: string,
    @Body() body: { patterns?: string[] },
  ): Promise<void> {
    return this.cdnService.purgeCache(zoneId, body.patterns);
  }

  @Get('zones/:zoneId/metrics')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get CDN metrics for a zone' })
  @ApiResponse({ status: 200, description: 'CDN metrics retrieved successfully' })
  async getMetrics(
    @Param('zoneId') zoneId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ): Promise<CDNMetrics> {
    const timeRange = {
      start: new Date(start),
      end: new Date(end),
    };
    return this.cdnService.getCDNMetrics(zoneId, timeRange);
  }

  @Post('zones/:zoneId/optimize')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Optimize performance for a CDN zone' })
  @ApiResponse({ status: 200, description: 'Performance optimized successfully' })
  async optimizePerformance(@Param('zoneId') zoneId: string): Promise<void> {
    return this.cdnService.optimizePerformance(zoneId);
  }

  @Post('zones/:zoneId/security')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Enable security features for a CDN zone' })
  @ApiResponse({ status: 200, description: 'Security features enabled successfully' })
  async enableSecurityFeatures(
    @Param('zoneId') zoneId: string,
    @Body() body: { features: string[] },
  ): Promise<void> {
    return this.cdnService.enableSecurityFeatures(zoneId, body.features);
  }
}
