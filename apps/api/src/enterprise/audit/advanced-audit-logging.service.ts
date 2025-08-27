import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'compliance';
  tags: string[];
}

export interface AuditReport {
  id: string;
  name: string;
  description: string;
  filters: AuditFilter;
  generatedAt: Date;
  generatedBy: string;
  data: AuditEvent[];
  summary: AuditSummary;
}

export interface AuditFilter {
  startDate?: Date;
  endDate?: Date;
  userIds?: string[];
  organizationIds?: string[];
  actions?: string[];
  resources?: string[];
  severity?: AuditEvent['severity'][];
  categories?: AuditEvent['category'][];
  tags?: string[];
}

export interface AuditSummary {
  totalEvents: number;
  eventsByCategory: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByAction: Record<string, number>;
  eventsByUser: Record<string, number>;
  eventsByResource: Record<string, number>;
  timeDistribution: Record<string, number>;
}

export interface ComplianceReport {
  id: string;
  type: 'soc2' | 'gdpr' | 'hipaa' | 'pci' | 'iso27001';
  period: { start: Date; end: Date };
  organizationId: string;
  generatedAt: Date;
  generatedBy: string;
  findings: ComplianceFinding[];
  recommendations: string[];
  status: 'compliant' | 'non_compliant' | 'partial';
}

export interface ComplianceFinding {
  id: string;
  control: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  evidence: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}

@Injectable()
export class AdvancedAuditLoggingService {
  private readonly logger = new Logger(AdvancedAuditLoggingService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAuditEvent(
    userId: string,
    organizationId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    ipAddress: string,
    userAgent: string,
    sessionId: string,
    severity: AuditEvent['severity'] = 'medium',
    category: AuditEvent['category'] = 'system',
    tags: string[] = [],
  ): Promise<AuditEvent> {
    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      organizationId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      sessionId,
      severity,
      category,
      tags,
    };

    await this.auditLogRepository.save({
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      details: event.details,
      timestamp: event.timestamp,
      userId: event.userId,
      organizationId: event.organizationId,
    });

    this.logger.log(`Audit event logged: ${action} on ${resource} by ${userId}`);
    return event;
  }

  async generateAuditReport(
    name: string,
    description: string,
    filters: AuditFilter,
    generatedBy: string,
  ): Promise<AuditReport> {
    const events = await this.queryAuditEvents(filters);
    const summary = this.generateAuditSummary(events);

    const report: AuditReport = {
      id: `report_${Date.now()}`,
      name,
      description,
      filters,
      generatedAt: new Date(),
      generatedBy,
      data: events,
      summary,
    };

    await this.auditLogRepository.save({
      action: 'audit_report_generated',
      resource: 'audit_report',
      resourceId: report.id,
      details: { name, description, filters, eventCount: events.length },
      timestamp: new Date(),
      userId: generatedBy,
      organizationId: 'system',
    });

    this.logger.log(`Generated audit report: ${name} with ${events.length} events`);
    return report;
  }

  async generateComplianceReport(
    type: ComplianceReport['type'],
    period: { start: Date; end: Date },
    organizationId: string,
    generatedBy: string,
  ): Promise<ComplianceReport> {
    const findings = await this.assessCompliance(type, period, organizationId);
    const status = this.determineComplianceStatus(findings);
    const recommendations = this.generateRecommendations(findings);

    const report: ComplianceReport = {
      id: `compliance_${type}_${Date.now()}`,
      type,
      period,
      organizationId,
      generatedAt: new Date(),
      generatedBy,
      findings,
      recommendations,
      status,
    };

    await this.auditLogRepository.save({
      action: 'compliance_report_generated',
      resource: 'compliance_report',
      resourceId: report.id,
      details: { type, period, organizationId, findingsCount: findings.length, status },
      timestamp: new Date(),
      userId: generatedBy,
      organizationId,
    });

    this.logger.log(`Generated compliance report: ${type} for organization ${organizationId}`);
    return report;
  }

  async getAuditEvents(
    filters: AuditFilter,
    page: number = 1,
    limit: number = 100,
  ): Promise<{ events: AuditEvent[]; total: number; page: number; totalPages: number }> {
    const events = await this.queryAuditEvents(filters);
    const total = events.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEvents = events.slice(startIndex, endIndex);

    return {
      events: paginatedEvents,
      total,
      page,
      totalPages,
    };
  }

  async getAuditMetrics(
    organizationId: string,
    timeRange: { start: Date; end: Date },
  ): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
  }> {
    const filters: AuditFilter = {
      startDate: timeRange.start,
      endDate: timeRange.end,
      organizationIds: [organizationId],
    };

    const events = await this.queryAuditEvents(filters);
    const summary = this.generateAuditSummary(events);

    const topActions = Object.entries(summary.eventsByAction)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topUsers = Object.entries(summary.eventsByUser)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topResources = Object.entries(summary.eventsByResource)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: summary.totalEvents,
      eventsByCategory: summary.eventsByCategory,
      eventsBySeverity: summary.eventsBySeverity,
      topActions,
      topUsers,
      topResources,
    };
  }

  private async queryAuditEvents(filters: AuditFilter): Promise<AuditEvent[]> {
    // Simulate querying audit events with filters
    const mockEvents: AuditEvent[] = [
      {
        id: 'audit_1',
        timestamp: new Date(),
        userId: 'user_1',
        organizationId: 'org_1',
        action: 'user_login',
        resource: 'authentication',
        resourceId: 'auth_1',
        details: { method: 'password', success: true },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        sessionId: 'session_1',
        severity: 'low',
        category: 'authentication',
        tags: ['login', 'success'],
      },
      {
        id: 'audit_2',
        timestamp: new Date(),
        userId: 'user_2',
        organizationId: 'org_1',
        action: 'data_access',
        resource: 'conversations',
        resourceId: 'conv_1',
        details: { conversationId: 'conv_1', accessType: 'read' },
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0...',
        sessionId: 'session_2',
        severity: 'medium',
        category: 'data_access',
        tags: ['conversation', 'read'],
      },
    ];

    return mockEvents.filter(event => {
      if (filters.startDate && event.timestamp < filters.startDate) return false;
      if (filters.endDate && event.timestamp > filters.endDate) return false;
      if (filters.userIds && !filters.userIds.includes(event.userId)) return false;
      if (filters.organizationIds && !filters.organizationIds.includes(event.organizationId)) return false;
      if (filters.actions && !filters.actions.includes(event.action)) return false;
      if (filters.resources && !filters.resources.includes(event.resource)) return false;
      if (filters.severity && !filters.severity.includes(event.severity)) return false;
      if (filters.categories && !filters.categories.includes(event.category)) return false;
      if (filters.tags && !filters.tags.some(tag => event.tags.includes(tag))) return false;
      return true;
    });
  }

  private generateAuditSummary(events: AuditEvent[]): AuditSummary {
    const summary: AuditSummary = {
      totalEvents: events.length,
      eventsByCategory: {},
      eventsBySeverity: {},
      eventsByAction: {},
      eventsByUser: {},
      eventsByResource: {},
      timeDistribution: {},
    };

    for (const event of events) {
      summary.eventsByCategory[event.category] = (summary.eventsByCategory[event.category] || 0) + 1;
      summary.eventsBySeverity[event.severity] = (summary.eventsBySeverity[event.severity] || 0) + 1;
      summary.eventsByAction[event.action] = (summary.eventsByAction[event.action] || 0) + 1;
      summary.eventsByUser[event.userId] = (summary.eventsByUser[event.userId] || 0) + 1;
      summary.eventsByResource[event.resource] = (summary.eventsByResource[event.resource] || 0) + 1;
      
      const hour = event.timestamp.getHours();
      summary.timeDistribution[hour.toString()] = (summary.timeDistribution[hour.toString()] || 0) + 1;
    }

    return summary;
  }

  private async assessCompliance(
    type: ComplianceReport['type'],
    period: { start: Date; end: Date },
    organizationId: string,
  ): Promise<ComplianceFinding[]> {
    // Simulate compliance assessment
    const findings: ComplianceFinding[] = [
      {
        id: 'finding_1',
        control: 'CC6.1',
        description: 'Logical access security software, infrastructure, and architectures are implemented',
        status: 'pass',
        evidence: ['RBAC implemented', 'JWT tokens used', 'Session management active'],
        riskLevel: 'low',
        remediation: 'No action required',
      },
      {
        id: 'finding_2',
        control: 'CC7.1',
        description: 'System operations are monitored to detect potential security events',
        status: 'pass',
        evidence: ['Audit logging enabled', 'Real-time monitoring active', 'Alerts configured'],
        riskLevel: 'low',
        remediation: 'No action required',
      },
    ];

    return findings;
  }

  private determineComplianceStatus(findings: ComplianceFinding[]): ComplianceReport['status'] {
    const failedFindings = findings.filter(f => f.status === 'fail');
    const warningFindings = findings.filter(f => f.status === 'warning');

    if (failedFindings.length === 0 && warningFindings.length === 0) {
      return 'compliant';
    } else if (failedFindings.length === 0) {
      return 'partial';
    } else {
      return 'non_compliant';
    }
  }

  private generateRecommendations(findings: ComplianceFinding[]): string[] {
    const recommendations: string[] = [];

    for (const finding of findings) {
      if (finding.status === 'fail' || finding.status === 'warning') {
        recommendations.push(finding.remediation);
      }
    }

    return recommendations;
  }
}
