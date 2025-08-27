import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingUsage } from '../database/entities/billing-usage.entity';
import { Organizations } from '../database/entities/organizations.entity';
import { Users } from '../database/entities/users.entity';
import { NotificationsService } from '../notifications/notifications.service';

export interface CostCap {
  id: string;
  organizationId: string;
  type: 'daily' | 'weekly' | 'monthly';
  amount: number;
  currency: string;
  isActive: boolean;
  notificationThresholds: number[]; // Percentages of cap to trigger notifications
  actions: {
    onThresholdReached: 'notify' | 'suspend' | 'throttle';
    onCapExceeded: 'notify' | 'suspend' | 'throttle' | 'block';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCapViolation {
  id: string;
  organizationId: string;
  costCapId: string;
  type: 'threshold_reached' | 'cap_exceeded';
  currentAmount: number;
  capAmount: number;
  percentage: number;
  period: {
    start: Date;
    end: Date;
  };
  timestamp: Date;
  status: 'pending' | 'notified' | 'actioned' | 'resolved';
  actions: string[];
}

export interface CostCapNotification {
  id: string;
  organizationId: string;
  type: 'threshold' | 'cap_exceeded' | 'suspension' | 'throttling';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  recipients: string[];
  metadata: {
    currentAmount: number;
    capAmount: number;
    percentage: number;
    period: string;
  };
  createdAt: Date;
  sentAt?: Date;
}

@Injectable()
export class CostCapsService {
  private readonly logger = new Logger(CostCapsService.name);

  constructor(
    @InjectRepository(BillingUsage)
    private billingUsageRepo: Repository<BillingUsage>,
    @InjectRepository(Organizations)
    private organizationsRepo: Repository<Organizations>,
    @InjectRepository(Users)
    private usersRepo: Repository<Users>,
    private notificationsService: NotificationsService,
  ) {}

  // Scheduled cost cap monitoring
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledCostCapCheck() {
    this.logger.log('Starting scheduled cost cap check');
    await this.checkAllCostCaps();
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scheduledCostCapReport() {
    this.logger.log('Starting scheduled cost cap report');
    await this.generateCostCapReports();
  }

  async createCostCap(costCap: Omit<CostCap, 'id' | 'createdAt' | 'updatedAt'>): Promise<CostCap> {
    const newCostCap: CostCap = {
      ...costCap,
      id: `cost-cap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate cost cap
    await this.validateCostCap(newCostCap);

    // Store cost cap (this would be in a database)
    this.logger.log(`Created cost cap: ${newCostCap.id} for org ${newCostCap.organizationId}`);

    return newCostCap;
  }

  async getCostCap(organizationId: string, type: 'daily' | 'weekly' | 'monthly'): Promise<CostCap | null> {
    // This would query the database
    // For now, return stub data
    return {
      id: 'cost-cap-123',
      organizationId,
      type,
      amount: 1000,
      currency: 'USD',
      isActive: true,
      notificationThresholds: [50, 75, 90],
      actions: {
        onThresholdReached: 'notify',
        onCapExceeded: 'suspend',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async checkCostCap(organizationId: string): Promise<{
    currentAmount: number;
    capAmount: number;
    percentage: number;
    isExceeded: boolean;
    violations: CostCapViolation[];
  }> {
    const costCaps = await Promise.all([
      this.getCostCap(organizationId, 'daily'),
      this.getCostCap(organizationId, 'weekly'),
      this.getCostCap(organizationId, 'monthly'),
    ]);

    const violations: CostCapViolation[] = [];
    let currentAmount = 0;
    let capAmount = 0;

    for (const costCap of costCaps) {
      if (!costCap || !costCap.isActive) continue;

      const periodUsage = await this.getPeriodUsage(organizationId, costCap.type);
      const percentage = (periodUsage / costCap.amount) * 100;

      // Check for threshold violations
      for (const threshold of costCap.notificationThresholds) {
        if (percentage >= threshold) {
          const violation: CostCapViolation = {
            id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            organizationId,
            costCapId: costCap.id,
            type: 'threshold_reached',
            currentAmount: periodUsage,
            capAmount: costCap.amount,
            percentage,
            period: this.getPeriodDates(costCap.type),
            timestamp: new Date(),
            status: 'pending',
            actions: [],
          };

          violations.push(violation);
          await this.handleViolation(violation, costCap);
        }
      }

      // Check for cap exceeded
      if (percentage >= 100) {
        const violation: CostCapViolation = {
          id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          organizationId,
          costCapId: costCap.id,
          type: 'cap_exceeded',
          currentAmount: periodUsage,
          capAmount: costCap.amount,
          percentage,
          period: this.getPeriodDates(costCap.type),
          timestamp: new Date(),
          status: 'pending',
          actions: [],
        };

        violations.push(violation);
        await this.handleViolation(violation, costCap);
      }

      // Track the highest percentage for return value
      if (percentage > (currentAmount / capAmount) * 100) {
        currentAmount = periodUsage;
        capAmount = costCap.amount;
      }
    }

    return {
      currentAmount,
      capAmount,
      percentage: capAmount > 0 ? (currentAmount / capAmount) * 100 : 0,
      isExceeded: currentAmount > capAmount,
      violations,
    };
  }

  async enforceCostCap(organizationId: string, action: 'suspend' | 'throttle' | 'block'): Promise<void> {
    this.logger.log(`Enforcing cost cap action: ${action} for org ${organizationId}`);

    switch (action) {
      case 'suspend':
        await this.suspendOrganization(organizationId);
        break;
      case 'throttle':
        await this.throttleOrganization(organizationId);
        break;
      case 'block':
        await this.blockOrganization(organizationId);
        break;
    }

    // Send notification to admins
    await this.sendCostCapEnforcementNotification(organizationId, action);
  }

  async getCostCapHistory(organizationId: string, days: number = 30): Promise<{
    violations: CostCapViolation[];
    notifications: CostCapNotification[];
    trends: Array<{
      date: string;
      amount: number;
      capAmount: number;
      percentage: number;
    }>;
  }> {
    // This would query the database for historical data
    // For now, return stub data
    return {
      violations: [],
      notifications: [],
      trends: [
        {
          date: '2024-01-20',
          amount: 750,
          capAmount: 1000,
          percentage: 75,
        },
        {
          date: '2024-01-21',
          amount: 850,
          capAmount: 1000,
          percentage: 85,
        },
      ],
    };
  }

  async updateCostCap(costCapId: string, updates: Partial<CostCap>): Promise<CostCap> {
    // This would update the cost cap in the database
    this.logger.log(`Updated cost cap: ${costCapId}`);
    
    // Return updated cost cap
    return {
      id: costCapId,
      organizationId: 'org-123',
      type: 'monthly',
      amount: 1000,
      currency: 'USD',
      isActive: true,
      notificationThresholds: [50, 75, 90],
      actions: {
        onThresholdReached: 'notify',
        onCapExceeded: 'suspend',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteCostCap(costCapId: string): Promise<void> {
    this.logger.log(`Deleted cost cap: ${costCapId}`);
    // This would delete from database
  }

  private async checkAllCostCaps(): Promise<void> {
    // Get all organizations with active cost caps
    const organizations = await this.getAllOrganizationsWithCostCaps();

    for (const org of organizations) {
      try {
        await this.checkCostCap(org.id);
      } catch (error) {
        this.logger.error(`Error checking cost cap for org ${org.id}:`, error);
      }
    }
  }

  private async handleViolation(violation: CostCapViolation, costCap: CostCap): Promise<void> {
    this.logger.warn(`Cost cap violation detected: ${violation.type} for org ${violation.organizationId}`);

    // Determine action based on violation type
    const action = violation.type === 'cap_exceeded' 
      ? costCap.actions.onCapExceeded 
      : costCap.actions.onThresholdReached;

    // Execute action
    switch (action) {
      case 'notify':
        await this.sendCostCapNotification(violation, costCap);
        break;
      case 'suspend':
        await this.enforceCostCap(violation.organizationId, 'suspend');
        break;
      case 'throttle':
        await this.enforceCostCap(violation.organizationId, 'throttle');
        break;
      case 'block':
        await this.enforceCostCap(violation.organizationId, 'block');
        break;
    }

    // Update violation status
    violation.status = 'actioned';
    violation.actions.push(action);
  }

  private async sendCostCapNotification(violation: CostCapViolation, costCap: CostCap): Promise<void> {
    const notification: CostCapNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId: violation.organizationId,
      type: violation.type === 'cap_exceeded' ? 'cap_exceeded' : 'threshold',
      severity: violation.percentage >= 100 ? 'critical' : violation.percentage >= 90 ? 'high' : 'medium',
      title: `Cost Cap ${violation.type === 'cap_exceeded' ? 'Exceeded' : 'Threshold Reached'}`,
      message: this.generateNotificationMessage(violation, costCap),
      recipients: await this.getCostCapRecipients(violation.organizationId),
      metadata: {
        currentAmount: violation.currentAmount,
        capAmount: violation.capAmount,
        percentage: violation.percentage,
        period: `${costCap.type} (${violation.period.start.toDateString()} - ${violation.period.end.toDateString()})`,
      },
      createdAt: new Date(),
    };

    // Send notification
    await this.notificationsService.sendNotification(notification);
    
    // Update violation status
    violation.status = 'notified';
  }

  private async sendCostCapEnforcementNotification(organizationId: string, action: string): Promise<void> {
    const notification: CostCapNotification = {
      id: `enforcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      type: action === 'suspend' ? 'suspension' : 'throttling',
      severity: 'critical',
      title: `Cost Cap Enforcement: ${action.toUpperCase()}`,
      message: `Your organization has been ${action}ed due to cost cap violation. Please contact support to resolve.`,
      recipients: await this.getCostCapRecipients(organizationId),
      metadata: {
        currentAmount: 0,
        capAmount: 0,
        percentage: 0,
        period: 'N/A',
      },
      createdAt: new Date(),
    };

    await this.notificationsService.sendNotification(notification);
  }

  private generateNotificationMessage(violation: CostCapViolation, costCap: CostCap): string {
    const periodText = costCap.type === 'daily' ? 'today' : 
                      costCap.type === 'weekly' ? 'this week' : 'this month';
    
    if (violation.type === 'cap_exceeded') {
      return `Your ${costCap.type} cost cap of ${costCap.currency} ${costCap.amount} has been exceeded. Current spending: ${costCap.currency} ${violation.currentAmount} (${violation.percentage.toFixed(1)}%). Your account has been suspended. Please contact support to resolve.`;
    } else {
      return `Your ${costCap.type} cost cap threshold has been reached. Current spending: ${costCap.currency} ${violation.currentAmount} (${violation.percentage.toFixed(1)}%) of ${costCap.currency} ${costCap.amount} limit for ${periodText}.`;
    }
  }

  private async getCostCapRecipients(organizationId: string): Promise<string[]> {
    // Get admin users for the organization
    const adminUsers = await this.usersRepo.find({
      where: {
        memberships: {
          organizationId,
          role: 'admin',
        },
      },
    });

    return adminUsers.map(user => user.email);
  }

  private async getPeriodUsage(organizationId: string, type: 'daily' | 'weekly' | 'monthly'): Promise<number> {
    const period = this.getPeriodDates(type);
    
    const usageRecords = await this.billingUsageRepo.find({
      where: {
        organizationId,
        date: Between(period.start, period.end),
      },
    });

    return usageRecords.reduce((total, record) => total + Number(record.cost || 0), 0);
  }

  private getPeriodDates(type: 'daily' | 'weekly' | 'monthly'): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;

    switch (type) {
      case 'daily':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return { start, end: now };
  }

  private async validateCostCap(costCap: CostCap): Promise<void> {
    if (costCap.amount <= 0) {
      throw new Error('Cost cap amount must be greater than 0');
    }

    if (costCap.notificationThresholds.some(t => t <= 0 || t > 100)) {
      throw new Error('Notification thresholds must be between 0 and 100');
    }

    if (!costCap.notificationThresholds.every((t, i, arr) => i === 0 || t > arr[i - 1])) {
      throw new Error('Notification thresholds must be in ascending order');
    }
  }

  private async suspendOrganization(organizationId: string): Promise<void> {
    // Update organization status to suspended
    await this.organizationsRepo.update(
      { id: organizationId },
      { settings: { status: 'suspended', suspendedAt: new Date() } }
    );
    
    this.logger.log(`Organization ${organizationId} suspended due to cost cap violation`);
  }

  private async throttleOrganization(organizationId: string): Promise<void> {
    // Implement throttling logic
    this.logger.log(`Organization ${organizationId} throttled due to cost cap violation`);
  }

  private async blockOrganization(organizationId: string): Promise<void> {
    // Implement blocking logic
    this.logger.log(`Organization ${organizationId} blocked due to cost cap violation`);
  }

  private async getAllOrganizationsWithCostCaps(): Promise<Array<{ id: string }>> {
    // This would query organizations with active cost caps
    // For now, return stub data
    return [
      { id: 'org-1' },
      { id: 'org-2' },
      { id: 'org-3' },
    ];
  }

  private async generateCostCapReports(): Promise<void> {
    // Generate daily cost cap reports
    this.logger.log('Generated cost cap reports');
  }
}
