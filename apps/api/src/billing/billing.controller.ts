import { Controller, Get, Post, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService, UsageMetrics, SeatInfo, BillingPeriod } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('usage')
  @ApiOperation({ summary: 'Get current usage metrics' })
  @ApiResponse({ status: 200, description: 'Usage metrics retrieved successfully' })
  async getUsage(
    @CurrentUser() user: User,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ): Promise<UsageMetrics> {
    const period = start && end ? {
      start: new Date(start),
      end: new Date(end),
    } : undefined;

    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    return this.billingService.getUsage(orgId, period);
  }

  @Get('seats')
  @ApiOperation({ summary: 'Get seat information' })
  @ApiResponse({ status: 200, description: 'Seat information retrieved successfully' })
  async getSeats(@CurrentUser() user: User): Promise<SeatInfo> {
    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    return this.billingService.getSeats(orgId);
  }

  @Get('period')
  @ApiOperation({ summary: 'Get billing period information' })
  @ApiResponse({ status: 200, description: 'Billing period information retrieved successfully' })
  async getBillingPeriod(
    @CurrentUser() user: User,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ): Promise<BillingPeriod> {
    const period = start && end ? {
      start: new Date(start),
      end: new Date(end),
    } : undefined;

    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    return this.billingService.getBillingPeriod(orgId, period);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get usage history' })
  @ApiResponse({ status: 200, description: 'Usage history retrieved successfully' })
  async getUsageHistory(
    @CurrentUser() user: User,
    @Query('days') days?: number,
  ): Promise<Array<{ date: string; usage: UsageMetrics }>> {
    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    return this.billingService.getUsageHistory(orgId, days || 30);
  }

  @Get('limits')
  @ApiOperation({ summary: 'Check usage limits' })
  @ApiResponse({ status: 200, description: 'Usage limits checked successfully' })
  async checkUsageLimits(@CurrentUser() user: User) {
    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    return this.billingService.checkUsageLimits(orgId);
  }

  @Post('record/message')
  @ApiOperation({ summary: 'Record message usage' })
  @ApiResponse({ status: 201, description: 'Message usage recorded successfully' })
  async recordMessageUsage(
    @CurrentUser() user: User,
    @Body() body: {
      messageCount: number;
      tokenCount: number;
      toolCallCount?: number;
    },
  ): Promise<void> {
    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    await this.billingService.recordMessageUsage(
      orgId,
      body.messageCount,
      body.tokenCount,
      body.toolCallCount || 0,
    );
  }

  @Post('record/conversation')
  @ApiOperation({ summary: 'Record conversation usage' })
  @ApiResponse({ status: 201, description: 'Conversation usage recorded successfully' })
  async recordConversationUsage(
    @CurrentUser() user: User,
    @Body() body: { conversationCount?: number },
  ): Promise<void> {
    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    await this.billingService.recordConversationUsage(orgId, body.conversationCount || 1);
  }

  @Post('record/api')
  @ApiOperation({ summary: 'Record API usage' })
  @ApiResponse({ status: 201, description: 'API usage recorded successfully' })
  async recordApiUsage(
    @CurrentUser() user: User,
    @Body() body: { apiCallCount?: number },
  ): Promise<void> {
    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    await this.billingService.recordApiUsage(orgId, body.apiCallCount || 1);
  }

  @Post('record/storage')
  @ApiOperation({ summary: 'Record storage usage' })
  @ApiResponse({ status: 201, description: 'Storage usage recorded successfully' })
  async recordStorageUsage(
    @CurrentUser() user: User,
    @Body() body: { storageGB: number },
  ): Promise<void> {
    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    await this.billingService.recordStorageUsage(orgId, body.storageGB);
  }

  @Get('analytics/daily')
  @ApiOperation({ summary: 'Get daily usage analytics' })
  @ApiResponse({ status: 200, description: 'Daily analytics retrieved successfully' })
  async getDailyAnalytics(
    @CurrentUser() user: User,
    @Query('days') days?: number,
  ) {
    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    const history = await this.billingService.getUsageHistory(orgId, days || 30);
    
    // Calculate daily averages and trends
    const totalUsage = history.reduce((acc, day) => ({
      messages: acc.messages + day.usage.messages,
      tokens: acc.tokens + day.usage.tokens,
      toolCalls: acc.toolCalls + day.usage.toolCalls,
      conversations: acc.conversations + day.usage.conversations,
      apiCalls: acc.apiCalls + day.usage.apiCalls,
      storageGB: acc.storageGB + day.usage.storageGB,
    }), {
      messages: 0,
      tokens: 0,
      toolCalls: 0,
      conversations: 0,
      apiCalls: 0,
      storageGB: 0,
    });

    const daysCount = history.length || 1;
    const averages = {
      messages: Math.round(totalUsage.messages / daysCount),
      tokens: Math.round(totalUsage.tokens / daysCount),
      toolCalls: Math.round(totalUsage.toolCalls / daysCount),
      conversations: Math.round(totalUsage.conversations / daysCount),
      apiCalls: Math.round(totalUsage.apiCalls / daysCount),
      storageGB: Math.round(totalUsage.storageGB / daysCount * 100) / 100,
    };

    return {
      period: { days: daysCount },
      totals: totalUsage,
      averages,
      history,
    };
  }

  @Get('analytics/costs')
  @ApiOperation({ summary: 'Get cost analytics' })
  @ApiResponse({ status: 200, description: 'Cost analytics retrieved successfully' })
  async getCostAnalytics(
    @CurrentUser() user: User,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const period = start && end ? {
      start: new Date(start),
      end: new Date(end),
    } : undefined;

    // TODO: Get orgId from user context
    const orgId = 'demo-org-id';
    const billingPeriod = await this.billingService.getBillingPeriod(orgId, period);
    
    return {
      period: {
        startDate: billingPeriod.startDate,
        endDate: billingPeriod.endDate,
      },
      costs: billingPeriod.cost,
      usage: billingPeriod.usage,
      breakdown: {
        messages: {
          count: billingPeriod.usage.messages,
          cost: billingPeriod.cost.messages,
          percentage: (billingPeriod.cost.messages / billingPeriod.cost.total) * 100,
        },
        tokens: {
          count: billingPeriod.usage.tokens,
          cost: billingPeriod.cost.tokens,
          percentage: (billingPeriod.cost.tokens / billingPeriod.cost.total) * 100,
        },
        toolCalls: {
          count: billingPeriod.usage.toolCalls,
          cost: billingPeriod.cost.toolCalls,
          percentage: (billingPeriod.cost.toolCalls / billingPeriod.cost.total) * 100,
        },
        conversations: {
          count: billingPeriod.usage.conversations,
          cost: billingPeriod.cost.conversations,
          percentage: (billingPeriod.cost.conversations / billingPeriod.cost.total) * 100,
        },
        apiCalls: {
          count: billingPeriod.usage.apiCalls,
          cost: billingPeriod.cost.apiCalls,
          percentage: (billingPeriod.cost.apiCalls / billingPeriod.cost.total) * 100,
        },
        storage: {
          count: billingPeriod.usage.storageGB,
          cost: billingPeriod.cost.storage,
          percentage: (billingPeriod.cost.storage / billingPeriod.cost.total) * 100,
        },
        seats: {
          cost: billingPeriod.cost.seats,
          percentage: (billingPeriod.cost.seats / billingPeriod.cost.total) * 100,
        },
      },
    };
  }
}
