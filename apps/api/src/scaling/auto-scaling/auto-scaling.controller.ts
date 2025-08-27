import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/rbac.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { AutoScalingService, ScalingPolicy, ScalingEvent, ScalingMetrics } from './auto-scaling.service';

@ApiTags('Auto Scaling')
@Controller('scaling')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AutoScalingController {
  constructor(private readonly scalingService: AutoScalingService) {}

  @Post('policies')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create a new scaling policy' })
  @ApiResponse({ status: 201, description: 'Scaling policy created successfully' })
  async createPolicy(
    @Body() body: {
      name: string;
      resourceType: ScalingPolicy['resourceType'];
      metric: ScalingPolicy['metric'];
      threshold: number;
      operator: ScalingPolicy['operator'];
      action: ScalingPolicy['action'];
      cooldown: number;
      minInstances: number;
      maxInstances: number;
    },
  ): Promise<ScalingPolicy> {
    return this.scalingService.createScalingPolicy(
      body.name,
      body.resourceType,
      body.metric,
      body.threshold,
      body.operator,
      body.action,
      body.cooldown,
      body.minInstances,
      body.maxInstances,
    );
  }

  @Post('evaluate/:resourceType')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Evaluate scaling policies for a resource type' })
  @ApiResponse({ status: 200, description: 'Scaling policies evaluated successfully' })
  async evaluatePolicies(
    @Param('resourceType') resourceType: string,
    @Body() metrics: ScalingMetrics,
  ): Promise<ScalingEvent[]> {
    return this.scalingService.evaluateScalingPolicies(resourceType, metrics);
  }

  @Post('events/:eventId/execute')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Execute a scaling event' })
  @ApiResponse({ status: 200, description: 'Scaling event executed successfully' })
  async executeEvent(@Param('eventId') eventId: string): Promise<void> {
    return this.scalingService.executeScalingEvent(eventId);
  }

  @Get('policies/:resourceType')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get active scaling policies for a resource type' })
  @ApiResponse({ status: 200, description: 'Scaling policies retrieved successfully' })
  async getPolicies(@Param('resourceType') resourceType: string): Promise<ScalingPolicy[]> {
    return this.scalingService.getActivePolicies(resourceType);
  }

  @Get('metrics/:resourceType')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get scaling metrics for a resource type' })
  @ApiResponse({ status: 200, description: 'Scaling metrics retrieved successfully' })
  async getMetrics(@Param('resourceType') resourceType: string): Promise<ScalingMetrics> {
    return this.scalingService.getScalingMetrics(resourceType);
  }

  @Put('policies/:policyId/status')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update scaling policy status' })
  @ApiResponse({ status: 200, description: 'Policy status updated successfully' })
  async updatePolicyStatus(
    @Param('policyId') policyId: string,
    @Body() body: { status: ScalingPolicy['status'] },
  ): Promise<void> {
    return this.scalingService.updatePolicyStatus(policyId, body.status);
  }
}
