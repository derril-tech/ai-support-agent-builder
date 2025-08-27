import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BillingUsage } from '../database/entities/billing-usage.entity';
import { Memberships } from '../database/entities/memberships.entity';
import { Conversations } from '../database/entities/conversations.entity';
import { Messages } from '../database/entities/messages.entity';

export interface UsageMetrics {
  messages: number;
  tokens: number;
  toolCalls: number;
  conversations: number;
  apiCalls: number;
  storageGB: number;
}

export interface SeatInfo {
  total: number;
  used: number;
  available: number;
  activeUsers: number;
  inactiveUsers: number;
}

export interface BillingPeriod {
  startDate: Date;
  endDate: Date;
  usage: UsageMetrics;
  cost: {
    messages: number;
    tokens: number;
    toolCalls: number;
    conversations: number;
    apiCalls: number;
    storage: number;
    seats: number;
    total: number;
  };
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(BillingUsage)
    private billingUsageRepo: Repository<BillingUsage>,
    @InjectRepository(Memberships)
    private membershipsRepo: Repository<Memberships>,
    @InjectRepository(Conversations)
    private conversationsRepo: Repository<Conversations>,
    @InjectRepository(Messages)
    private messagesRepo: Repository<Messages>,
  ) {}

  async getUsage(orgId: string, period?: { start: Date; end: Date }): Promise<UsageMetrics> {
    const startDate = period?.start || new Date(new Date().setDate(1)); // First day of current month
    const endDate = period?.end || new Date();

    try {
      // Get usage from billing_usage table
      const usageRecords = await this.billingUsageRepo.find({
        where: {
          organizationId: orgId,
          date: Between(startDate, endDate),
        },
      });

      // Aggregate usage metrics
      const usage: UsageMetrics = {
        messages: 0,
        tokens: 0,
        toolCalls: 0,
        conversations: 0,
        apiCalls: 0,
        storageGB: 0,
      };

      usageRecords.forEach(record => {
        switch (record.metric) {
          case 'messages':
            usage.messages += Number(record.value);
            break;
          case 'tokens':
            usage.tokens += Number(record.value);
            break;
          case 'tool_calls':
            usage.toolCalls += Number(record.value);
            break;
          case 'conversations':
            usage.conversations += Number(record.value);
            break;
          case 'api_calls':
            usage.apiCalls += Number(record.value);
            break;
          case 'storage_gb':
            usage.storageGB += Number(record.value);
            break;
        }
      });

      // If no billing records, calculate from actual data
      if (usageRecords.length === 0) {
        const conversations = await this.conversationsRepo.count({
          where: {
            organizationId: orgId,
            createdAt: Between(startDate, endDate),
          },
        });

        const messages = await this.messagesRepo.count({
          where: {
            conversation: {
              organizationId: orgId,
              createdAt: Between(startDate, endDate),
            },
          },
        });

        usage.conversations = conversations;
        usage.messages = messages;
        usage.tokens = messages * 150; // Estimate 150 tokens per message
        usage.toolCalls = Math.floor(messages * 0.3); // Estimate 30% of messages use tools
        usage.apiCalls = messages * 2; // Estimate 2 API calls per message
      }

      return usage;
    } catch (error) {
      this.logger.error(`Error getting usage for org ${orgId}:`, error);
      return {
        messages: 0,
        tokens: 0,
        toolCalls: 0,
        conversations: 0,
        apiCalls: 0,
        storageGB: 0,
      };
    }
  }

  async getSeats(orgId: string): Promise<SeatInfo> {
    try {
      const memberships = await this.membershipsRepo.find({
        where: {
          organizationId: orgId,
        },
        relations: ['user'],
      });

      const total = 10; // Default seat limit
      const used = memberships.length;
      const activeUsers = memberships.filter(m => m.status === 'active').length;
      const inactiveUsers = used - activeUsers;

      return {
        total,
        used,
        available: total - used,
        activeUsers,
        inactiveUsers,
      };
    } catch (error) {
      this.logger.error(`Error getting seats for org ${orgId}:`, error);
      return {
        total: 10,
        used: 0,
        available: 10,
        activeUsers: 0,
        inactiveUsers: 0,
      };
    }
  }

  async getBillingPeriod(orgId: string, period?: { start: Date; end: Date }): Promise<BillingPeriod> {
    const startDate = period?.start || new Date(new Date().setDate(1));
    const endDate = period?.end || new Date();

    const usage = await this.getUsage(orgId, { start: startDate, end: endDate });
    const seats = await this.getSeats(orgId);

    // Calculate costs based on usage
    const cost = {
      messages: usage.messages * 0.01, // $0.01 per message
      tokens: usage.tokens * 0.0005, // $0.0005 per token
      toolCalls: usage.toolCalls * 0.05, // $0.05 per tool call
      conversations: usage.conversations * 0.10, // $0.10 per conversation
      apiCalls: usage.apiCalls * 0.001, // $0.001 per API call
      storage: usage.storageGB * 0.50, // $0.50 per GB
      seats: seats.used * 10, // $10 per seat per month
      total: 0,
    };

    cost.total = Object.values(cost).reduce((sum, val) => sum + val, 0);

    return {
      startDate,
      endDate,
      usage,
      cost,
    };
  }

  async recordUsage(orgId: string, metric: string, value: number, date: Date = new Date()): Promise<void> {
    try {
      // Check if record already exists for this date and metric
      const existingRecord = await this.billingUsageRepo.findOne({
        where: {
          organizationId: orgId,
          metric,
          date: date.toISOString().split('T')[0],
        },
      });

      if (existingRecord) {
        // Update existing record
        existingRecord.value = Number(existingRecord.value) + value;
        await this.billingUsageRepo.save(existingRecord);
      } else {
        // Create new record
        const billingUsage = this.billingUsageRepo.create({
          organizationId: orgId,
          date: date.toISOString().split('T')[0],
          metric,
          value: value.toString(),
          cost: this.calculateCost(metric, value),
        });
        await this.billingUsageRepo.save(billingUsage);
      }
    } catch (error) {
      this.logger.error(`Error recording usage for org ${orgId}:`, error);
    }
  }

  async recordMessageUsage(orgId: string, messageCount: number, tokenCount: number, toolCallCount: number = 0): Promise<void> {
    const date = new Date();
    
    await Promise.all([
      this.recordUsage(orgId, 'messages', messageCount, date),
      this.recordUsage(orgId, 'tokens', tokenCount, date),
      this.recordUsage(orgId, 'tool_calls', toolCallCount, date),
    ]);
  }

  async recordConversationUsage(orgId: string, conversationCount: number = 1): Promise<void> {
    await this.recordUsage(orgId, 'conversations', conversationCount);
  }

  async recordApiUsage(orgId: string, apiCallCount: number = 1): Promise<void> {
    await this.recordUsage(orgId, 'api_calls', apiCallCount);
  }

  async recordStorageUsage(orgId: string, storageGB: number): Promise<void> {
    await this.recordUsage(orgId, 'storage_gb', storageGB);
  }

  private calculateCost(metric: string, value: number): number {
    const rates = {
      messages: 0.01,
      tokens: 0.0005,
      tool_calls: 0.05,
      conversations: 0.10,
      api_calls: 0.001,
      storage_gb: 0.50,
    };

    return value * (rates[metric] || 0);
  }

  async getUsageHistory(orgId: string, days: number = 30): Promise<Array<{ date: string; usage: UsageMetrics }>> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    try {
      const usageRecords = await this.billingUsageRepo.find({
        where: {
          organizationId: orgId,
          date: Between(startDate, endDate),
        },
        order: { date: 'ASC' },
      });

      // Group by date
      const usageByDate = new Map<string, UsageMetrics>();

      usageRecords.forEach(record => {
        const date = record.date;
        if (!usageByDate.has(date)) {
          usageByDate.set(date, {
            messages: 0,
            tokens: 0,
            toolCalls: 0,
            conversations: 0,
            apiCalls: 0,
            storageGB: 0,
          });
        }

        const usage = usageByDate.get(date)!;
        switch (record.metric) {
          case 'messages':
            usage.messages += Number(record.value);
            break;
          case 'tokens':
            usage.tokens += Number(record.value);
            break;
          case 'tool_calls':
            usage.toolCalls += Number(record.value);
            break;
          case 'conversations':
            usage.conversations += Number(record.value);
            break;
          case 'api_calls':
            usage.apiCalls += Number(record.value);
            break;
          case 'storage_gb':
            usage.storageGB += Number(record.value);
            break;
        }
      });

      return Array.from(usageByDate.entries()).map(([date, usage]) => ({
        date,
        usage,
      }));
    } catch (error) {
      this.logger.error(`Error getting usage history for org ${orgId}:`, error);
      return [];
    }
  }

  async checkUsageLimits(orgId: string): Promise<{
    withinLimits: boolean;
    limits: {
      messages: { used: number; limit: number };
      tokens: { used: number; limit: number };
      seats: { used: number; limit: number };
    };
  }> {
    const currentUsage = await this.getUsage(orgId);
    const seats = await this.getSeats(orgId);

    // Define limits (these would come from plan configuration)
    const limits = {
      messages: 10000,
      tokens: 1000000,
      seats: 10,
    };

    const usageLimits = {
      messages: { used: currentUsage.messages, limit: limits.messages },
      tokens: { used: currentUsage.tokens, limit: limits.tokens },
      seats: { used: seats.used, limit: limits.seats },
    };

    const withinLimits = 
      currentUsage.messages <= limits.messages &&
      currentUsage.tokens <= limits.tokens &&
      seats.used <= limits.seats;

    return {
      withinLimits,
      limits: usageLimits,
    };
  }
}
