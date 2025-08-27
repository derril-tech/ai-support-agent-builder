import { Injectable, TooManyRequestsException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BillingUsage } from '../database/entities/billing-usage.entity';
import { Organizations } from '../database/entities/organizations.entity';

export interface PlanLimits {
  messages: { monthly: number; daily: number };
  tokens: { monthly: number; daily: number };
  toolCalls: { monthly: number; daily: number };
  conversations: { monthly: number; daily: number };
  apiCalls: { monthly: number; daily: number };
  storageGB: { monthly: number; daily: number };
  seats: { total: number };
  channels: string[];
  tools: string[];
  environments: string[];
  features: string[];
  monthlyUsdCap: number;
}

export interface PlanUsage {
  messages: { monthly: number; daily: number };
  tokens: { monthly: number; daily: number };
  toolCalls: { monthly: number; daily: number };
  conversations: { monthly: number; daily: number };
  apiCalls: { monthly: number; daily: number };
  storageGB: { monthly: number; daily: number };
  seats: { used: number; total: number };
  cost: { monthly: number; daily: number };
}

export interface PlanEnforcementResult {
  allowed: boolean;
  reason?: string;
  limits: PlanLimits;
  usage: PlanUsage;
  remaining: {
    messages: { monthly: number; daily: number };
    tokens: { monthly: number; daily: number };
    toolCalls: { monthly: number; daily: number };
    conversations: { monthly: number; daily: number };
    apiCalls: { monthly: number; daily: number };
    storageGB: { monthly: number; daily: number };
    seats: { available: number };
  };
}

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  // Define plan tiers
  private readonly plans = {
    free: {
      messages: { monthly: 1000, daily: 50 },
      tokens: { monthly: 100000, daily: 5000 },
      toolCalls: { monthly: 100, daily: 10 },
      conversations: { monthly: 100, daily: 10 },
      apiCalls: { monthly: 1000, daily: 50 },
      storageGB: { monthly: 1, daily: 0.1 },
      seats: { total: 2 },
      channels: ['web'],
      tools: ['search_knowledge'],
      environments: ['development'],
      features: ['basic_analytics'],
      monthlyUsdCap: 0,
    },
    starter: {
      messages: { monthly: 10000, daily: 500 },
      tokens: { monthly: 1000000, daily: 50000 },
      toolCalls: { monthly: 1000, daily: 100 },
      conversations: { monthly: 1000, daily: 100 },
      apiCalls: { monthly: 10000, daily: 500 },
      storageGB: { monthly: 10, daily: 1 },
      seats: { total: 5 },
      channels: ['web', 'slack', 'email'],
      tools: ['search_knowledge', 'create_ticket', 'escalate'],
      environments: ['development', 'staging'],
      features: ['basic_analytics', 'handoff', 'evaluations'],
      monthlyUsdCap: 50,
    },
    professional: {
      messages: { monthly: 100000, daily: 5000 },
      tokens: { monthly: 10000000, daily: 500000 },
      toolCalls: { monthly: 10000, daily: 1000 },
      conversations: { monthly: 10000, daily: 1000 },
      apiCalls: { monthly: 100000, daily: 5000 },
      storageGB: { monthly: 100, daily: 10 },
      seats: { total: 20 },
      channels: ['web', 'slack', 'email', 'whatsapp', 'voice'],
      tools: ['search_knowledge', 'create_ticket', 'escalate', 'stripe', 'zendesk', 'intercom'],
      environments: ['development', 'staging', 'production'],
      features: ['advanced_analytics', 'handoff', 'evaluations', 'custom_branding', 'priority_support'],
      monthlyUsdCap: 500,
    },
    enterprise: {
      messages: { monthly: 1000000, daily: 50000 },
      tokens: { monthly: 100000000, daily: 5000000 },
      toolCalls: { monthly: 100000, daily: 10000 },
      conversations: { monthly: 100000, daily: 10000 },
      apiCalls: { monthly: 1000000, daily: 50000 },
      storageGB: { monthly: 1000, daily: 100 },
      seats: { total: 100 },
      channels: ['web', 'slack', 'email', 'whatsapp', 'voice', 'teams', 'custom'],
      tools: ['search_knowledge', 'create_ticket', 'escalate', 'stripe', 'zendesk', 'intercom', 'salesforce', 'hubspot', 'custom'],
      environments: ['development', 'staging', 'production', 'custom'],
      features: ['advanced_analytics', 'handoff', 'evaluations', 'custom_branding', 'priority_support', 'sso', 'scim', 'custom_integrations'],
      monthlyUsdCap: 5000,
    },
  };

  constructor(
    @InjectRepository(BillingUsage)
    private billingUsageRepo: Repository<BillingUsage>,
    @InjectRepository(Organizations)
    private organizationsRepo: Repository<Organizations>,
  ) {}

  async getPlanLimits(orgId: string): Promise<PlanLimits> {
    try {
      const org = await this.organizationsRepo.findOne({
        where: { id: orgId },
      });

      // Default to free plan if no plan is specified
      const planName = org?.settings?.plan || 'free';
      return this.plans[planName] || this.plans.free;
    } catch (error) {
      this.logger.error(`Error getting plan limits for org ${orgId}:`, error);
      return this.plans.free;
    }
  }

  async getCurrentUsage(orgId: string): Promise<PlanUsage> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get monthly usage
      const monthlyUsage = await this.getUsageForPeriod(orgId, startOfMonth, now);
      
      // Get daily usage
      const dailyUsage = await this.getUsageForPeriod(orgId, startOfDay, now);

      // Get seat usage
      const seatUsage = await this.getSeatUsage(orgId);

      return {
        messages: { monthly: monthlyUsage.messages, daily: dailyUsage.messages },
        tokens: { monthly: monthlyUsage.tokens, daily: dailyUsage.tokens },
        toolCalls: { monthly: monthlyUsage.toolCalls, daily: dailyUsage.toolCalls },
        conversations: { monthly: monthlyUsage.conversations, daily: dailyUsage.conversations },
        apiCalls: { monthly: monthlyUsage.apiCalls, daily: dailyUsage.apiCalls },
        storageGB: { monthly: monthlyUsage.storageGB, daily: dailyUsage.storageGB },
        seats: { used: seatUsage.used, total: seatUsage.total },
        cost: { monthly: monthlyUsage.cost, daily: dailyUsage.cost },
      };
    } catch (error) {
      this.logger.error(`Error getting current usage for org ${orgId}:`, error);
      return {
        messages: { monthly: 0, daily: 0 },
        tokens: { monthly: 0, daily: 0 },
        toolCalls: { monthly: 0, daily: 0 },
        conversations: { monthly: 0, daily: 0 },
        apiCalls: { monthly: 0, daily: 0 },
        storageGB: { monthly: 0, daily: 0 },
        seats: { used: 0, total: 0 },
        cost: { monthly: 0, daily: 0 },
      };
    }
  }

  async enforcePlan(
    orgId: string,
    action: string,
    context?: {
      channel?: string;
      environment?: string;
      tool?: string;
      feature?: string;
      resourceCount?: number;
    },
  ): Promise<PlanEnforcementResult> {
    const limits = await this.getPlanLimits(orgId);
    const usage = await this.getCurrentUsage(orgId);

    // Check feature access
    if (context?.feature && !limits.features.includes(context.feature)) {
      throw new ForbiddenException(`Feature '${context.feature}' not available in current plan`);
    }

    // Check channel access
    if (context?.channel && !limits.channels.includes(context.channel)) {
      throw new ForbiddenException(`Channel '${context.channel}' not available in current plan`);
    }

    // Check environment access
    if (context?.environment && !limits.environments.includes(context.environment)) {
      throw new ForbiddenException(`Environment '${context.environment}' not available in current plan`);
    }

    // Check tool access
    if (context?.tool && !limits.tools.includes(context.tool)) {
      throw new ForbiddenException(`Tool '${context.tool}' not available in current plan`);
    }

    // Check usage limits based on action
    const resourceCount = context?.resourceCount || 1;
    let allowed = true;
    let reason: string | undefined;

    switch (action) {
      case 'send_message':
        if (usage.messages.monthly + resourceCount > limits.messages.monthly) {
          allowed = false;
          reason = 'Monthly message limit exceeded';
        } else if (usage.messages.daily + resourceCount > limits.messages.daily) {
          allowed = false;
          reason = 'Daily message limit exceeded';
        }
        break;

      case 'use_tokens':
        if (usage.tokens.monthly + resourceCount > limits.tokens.monthly) {
          allowed = false;
          reason = 'Monthly token limit exceeded';
        } else if (usage.tokens.daily + resourceCount > limits.tokens.daily) {
          allowed = false;
          reason = 'Daily token limit exceeded';
        }
        break;

      case 'use_tool':
        if (usage.toolCalls.monthly + resourceCount > limits.toolCalls.monthly) {
          allowed = false;
          reason = 'Monthly tool call limit exceeded';
        } else if (usage.toolCalls.daily + resourceCount > limits.toolCalls.daily) {
          allowed = false;
          reason = 'Daily tool call limit exceeded';
        }
        break;

      case 'create_conversation':
        if (usage.conversations.monthly + resourceCount > limits.conversations.monthly) {
          allowed = false;
          reason = 'Monthly conversation limit exceeded';
        } else if (usage.conversations.daily + resourceCount > limits.conversations.daily) {
          allowed = false;
          reason = 'Daily conversation limit exceeded';
        }
        break;

      case 'api_call':
        if (usage.apiCalls.monthly + resourceCount > limits.apiCalls.monthly) {
          allowed = false;
          reason = 'Monthly API call limit exceeded';
        } else if (usage.apiCalls.daily + resourceCount > limits.apiCalls.daily) {
          allowed = false;
          reason = 'Daily API call limit exceeded';
        }
        break;

      case 'use_storage':
        if (usage.storageGB.monthly + resourceCount > limits.storageGB.monthly) {
          allowed = false;
          reason = 'Monthly storage limit exceeded';
        } else if (usage.storageGB.daily + resourceCount > limits.storageGB.daily) {
          allowed = false;
          reason = 'Daily storage limit exceeded';
        }
        break;

      case 'add_seat':
        if (usage.seats.used + resourceCount > limits.seats.total) {
          allowed = false;
          reason = 'Seat limit exceeded';
        }
        break;

      default:
        // For unknown actions, allow by default
        break;
    }

    // Check cost limits
    if (usage.cost.monthly > limits.monthlyUsdCap) {
      allowed = false;
      reason = 'Monthly cost limit exceeded';
    }

    const remaining = {
      messages: {
        monthly: Math.max(0, limits.messages.monthly - usage.messages.monthly),
        daily: Math.max(0, limits.messages.daily - usage.messages.daily),
      },
      tokens: {
        monthly: Math.max(0, limits.tokens.monthly - usage.tokens.monthly),
        daily: Math.max(0, limits.tokens.daily - usage.tokens.daily),
      },
      toolCalls: {
        monthly: Math.max(0, limits.toolCalls.monthly - usage.toolCalls.monthly),
        daily: Math.max(0, limits.toolCalls.daily - usage.toolCalls.daily),
      },
      conversations: {
        monthly: Math.max(0, limits.conversations.monthly - usage.conversations.monthly),
        daily: Math.max(0, limits.conversations.daily - usage.conversations.daily),
      },
      apiCalls: {
        monthly: Math.max(0, limits.apiCalls.monthly - usage.apiCalls.monthly),
        daily: Math.max(0, limits.apiCalls.daily - usage.apiCalls.daily),
      },
      storageGB: {
        monthly: Math.max(0, limits.storageGB.monthly - usage.storageGB.monthly),
        daily: Math.max(0, limits.storageGB.daily - usage.storageGB.daily),
      },
      seats: {
        available: Math.max(0, limits.seats.total - usage.seats.used),
      },
    };

    if (!allowed) {
      throw new TooManyRequestsException(reason);
    }

    return {
      allowed,
      reason,
      limits,
      usage,
      remaining,
    };
  }

  async checkPlanUpgrade(orgId: string, targetPlan: string): Promise<{
    canUpgrade: boolean;
    reason?: string;
    currentPlan: string;
    targetPlan: string;
    costDifference: number;
  }> {
    const currentPlan = await this.getCurrentPlan(orgId);
    const currentUsage = await this.getCurrentUsage(orgId);
    const targetLimits = this.plans[targetPlan];

    if (!targetLimits) {
      return {
        canUpgrade: false,
        reason: 'Invalid plan specified',
        currentPlan,
        targetPlan,
        costDifference: 0,
      };
    }

    // Check if current usage fits within target plan limits
    const canFit = 
      currentUsage.messages.monthly <= targetLimits.messages.monthly &&
      currentUsage.tokens.monthly <= targetLimits.tokens.monthly &&
      currentUsage.toolCalls.monthly <= targetLimits.toolCalls.monthly &&
      currentUsage.conversations.monthly <= targetLimits.conversations.monthly &&
      currentUsage.apiCalls.monthly <= targetLimits.apiCalls.monthly &&
      currentUsage.storageGB.monthly <= targetLimits.storageGB.monthly &&
      currentUsage.seats.used <= targetLimits.seats.total;

    const costDifference = targetLimits.monthlyUsdCap - this.plans[currentPlan]?.monthlyUsdCap || 0;

    return {
      canUpgrade: canFit,
      reason: canFit ? undefined : 'Current usage exceeds target plan limits',
      currentPlan,
      targetPlan,
      costDifference,
    };
  }

  private async getCurrentPlan(orgId: string): Promise<string> {
    try {
      const org = await this.organizationsRepo.findOne({
        where: { id: orgId },
      });
      return org?.settings?.plan || 'free';
    } catch (error) {
      this.logger.error(`Error getting current plan for org ${orgId}:`, error);
      return 'free';
    }
  }

  private async getUsageForPeriod(orgId: string, startDate: Date, endDate: Date): Promise<{
    messages: number;
    tokens: number;
    toolCalls: number;
    conversations: number;
    apiCalls: number;
    storageGB: number;
    cost: number;
  }> {
    try {
      const usageRecords = await this.billingUsageRepo.find({
        where: {
          organizationId: orgId,
          date: Between(startDate, endDate),
        },
      });

      const usage = {
        messages: 0,
        tokens: 0,
        toolCalls: 0,
        conversations: 0,
        apiCalls: 0,
        storageGB: 0,
        cost: 0,
      };

      usageRecords.forEach(record => {
        const value = Number(record.value);
        switch (record.metric) {
          case 'messages':
            usage.messages += value;
            break;
          case 'tokens':
            usage.tokens += value;
            break;
          case 'tool_calls':
            usage.toolCalls += value;
            break;
          case 'conversations':
            usage.conversations += value;
            break;
          case 'api_calls':
            usage.apiCalls += value;
            break;
          case 'storage_gb':
            usage.storageGB += value;
            break;
        }
        usage.cost += Number(record.cost) || 0;
      });

      return usage;
    } catch (error) {
      this.logger.error(`Error getting usage for period for org ${orgId}:`, error);
      return {
        messages: 0,
        tokens: 0,
        toolCalls: 0,
        conversations: 0,
        apiCalls: 0,
        storageGB: 0,
        cost: 0,
      };
    }
  }

  private async getSeatUsage(orgId: string): Promise<{ used: number; total: number }> {
    // This would typically query the memberships table
    // For now, return stub data
    return { used: 3, total: 10 };
  }
}
