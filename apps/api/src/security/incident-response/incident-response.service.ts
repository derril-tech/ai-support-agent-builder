// Created automatically by Cursor AI (2024-12-19)

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'malware' | 'phishing' | 'data_breach' | 'ddos' | 'insider_threat' | 'physical' | 'other';
  status: 'detected' | 'investigating' | 'contained' | 'resolved' | 'closed';
  detectedAt: Date;
  reportedBy: string;
  assignedTo?: string;
  affectedSystems: string[];
  affectedUsers: number;
  estimatedImpact: string;
  timeline: IncidentTimelineEvent[];
  evidence: IncidentEvidence[];
  actions: IncidentAction[];
  lessonsLearned?: string[];
}

export interface IncidentTimelineEvent {
  timestamp: Date;
  event: string;
  description: string;
  actor: string;
  evidence?: string;
}

export interface IncidentEvidence {
  id: string;
  type: 'log' | 'screenshot' | 'file' | 'network' | 'memory' | 'other';
  description: string;
  source: string;
  collectedAt: Date;
  hash?: string;
  preserved: boolean;
}

export interface IncidentAction {
  id: string;
  action: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: Date;
  completedAt?: Date;
  notes?: string;
}

export interface IncidentResponsePlaybook {
  id: string;
  name: string;
  category: string;
  severity: string;
  description: string;
  steps: PlaybookStep[];
  escalationProcedures: EscalationProcedure[];
  communicationTemplates: CommunicationTemplate[];
}

export interface PlaybookStep {
  stepNumber: number;
  title: string;
  description: string;
  responsibleRole: string;
  estimatedTime: number; // minutes
  required: boolean;
  dependencies: number[]; // step numbers
}

export interface EscalationProcedure {
  level: number;
  title: string;
  trigger: string;
  contacts: string[];
  timeframe: number; // minutes
  actions: string[];
}

export interface CommunicationTemplate {
  type: 'internal' | 'external' | 'regulatory' | 'customer';
  title: string;
  template: string;
  variables: string[];
}

@Injectable()
export class IncidentResponseService {
  private readonly logger = new Logger(IncidentResponseService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  // Incident Detection and Creation
  async detectIncident(incidentData: Omit<SecurityIncident, 'id' | 'detectedAt' | 'timeline' | 'evidence' | 'actions'>): Promise<SecurityIncident> {
    const incident: SecurityIncident = {
      ...incidentData,
      id: `incident_${Date.now()}`,
      detectedAt: new Date(),
      timeline: [{
        timestamp: new Date(),
        event: 'Incident Detected',
        description: `Security incident detected: ${incidentData.title}`,
        actor: 'system',
      }],
      evidence: [],
      actions: [],
    };

    await this.logIncidentCreated(incident);
    await this.triggerInitialResponse(incident);

    return incident;
  }

  // Incident Response Workflow
  async startIncidentResponse(incidentId: string, assignedTo: string): Promise<void> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    incident.status = 'investigating';
    incident.assignedTo = assignedTo;

    incident.timeline.push({
      timestamp: new Date(),
      event: 'Response Started',
      description: `Incident response initiated by ${assignedTo}`,
      actor: assignedTo,
    });

    await this.logIncidentUpdate(incident);
    await this.executePlaybook(incident);
  }

  async containIncident(incidentId: string, containmentActions: string[]): Promise<void> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    incident.status = 'contained';

    incident.timeline.push({
      timestamp: new Date(),
      event: 'Incident Contained',
      description: `Incident contained with actions: ${containmentActions.join(', ')}`,
      actor: incident.assignedTo || 'system',
    });

    await this.logIncidentUpdate(incident);
    await this.notifyStakeholders(incident, 'contained');
  }

  async resolveIncident(incidentId: string, resolutionDetails: string): Promise<void> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    incident.status = 'resolved';

    incident.timeline.push({
      timestamp: new Date(),
      event: 'Incident Resolved',
      description: resolutionDetails,
      actor: incident.assignedTo || 'system',
    });

    await this.logIncidentUpdate(incident);
    await this.generatePostIncidentReport(incident);
  }

  // Playbook Management
  async getPlaybook(category: string, severity: string): Promise<IncidentResponsePlaybook> {
    // In a real implementation, this would query the database
    const playbooks: Record<string, IncidentResponsePlaybook> = {
      'malware_critical': {
        id: 'playbook_malware_critical',
        name: 'Critical Malware Incident Response',
        category: 'malware',
        severity: 'critical',
        description: 'Response procedures for critical malware incidents',
        steps: [
          {
            stepNumber: 1,
            title: 'Immediate Isolation',
            description: 'Isolate affected systems from the network',
            responsibleRole: 'Security Analyst',
            estimatedTime: 15,
            required: true,
            dependencies: [],
          },
          {
            stepNumber: 2,
            title: 'Evidence Collection',
            description: 'Collect and preserve evidence from affected systems',
            responsibleRole: 'Forensic Analyst',
            estimatedTime: 60,
            required: true,
            dependencies: [1],
          },
          {
            stepNumber: 3,
            title: 'Malware Analysis',
            description: 'Analyze malware samples to understand threat',
            responsibleRole: 'Malware Analyst',
            estimatedTime: 120,
            required: true,
            dependencies: [2],
          },
          {
            stepNumber: 4,
            title: 'System Remediation',
            description: 'Remove malware and restore affected systems',
            responsibleRole: 'System Administrator',
            estimatedTime: 180,
            required: true,
            dependencies: [3],
          },
        ],
        escalationProcedures: [
          {
            level: 1,
            title: 'Security Team Escalation',
            trigger: 'Incident detected',
            contacts: ['security-team@company.com'],
            timeframe: 15,
            actions: ['Notify security team', 'Begin initial assessment'],
          },
          {
            level: 2,
            title: 'Management Escalation',
            trigger: 'Critical severity confirmed',
            contacts: ['cto@company.com', 'ciso@company.com'],
            timeframe: 30,
            actions: ['Notify management', 'Activate incident response team'],
          },
        ],
        communicationTemplates: [
          {
            type: 'internal',
            title: 'Internal Notification',
            template: 'Critical malware incident detected. Affected systems: {affectedSystems}. Estimated impact: {estimatedImpact}.',
            variables: ['affectedSystems', 'estimatedImpact'],
          },
        ],
      },
      'data_breach_high': {
        id: 'playbook_data_breach_high',
        name: 'High Severity Data Breach Response',
        category: 'data_breach',
        severity: 'high',
        description: 'Response procedures for high severity data breaches',
        steps: [
          {
            stepNumber: 1,
            title: 'Breach Assessment',
            description: 'Assess scope and impact of data breach',
            responsibleRole: 'Security Analyst',
            estimatedTime: 30,
            required: true,
            dependencies: [],
          },
          {
            stepNumber: 2,
            title: 'Legal Notification',
            description: 'Notify legal team and assess regulatory requirements',
            responsibleRole: 'Legal Counsel',
            estimatedTime: 60,
            required: true,
            dependencies: [1],
          },
          {
            stepNumber: 3,
            title: 'Customer Notification',
            description: 'Prepare and send customer notifications',
            responsibleRole: 'Communications Team',
            estimatedTime: 120,
            required: true,
            dependencies: [2],
          },
        ],
        escalationProcedures: [
          {
            level: 1,
            title: 'Legal Escalation',
            trigger: 'Data breach confirmed',
            contacts: ['legal@company.com'],
            timeframe: 60,
            actions: ['Notify legal team', 'Assess regulatory requirements'],
          },
        ],
        communicationTemplates: [
          {
            type: 'customer',
            title: 'Customer Breach Notification',
            template: 'We have detected unauthorized access to your data. We are investigating and will provide updates.',
            variables: [],
          },
        ],
      },
    };

    const key = `${category}_${severity}`;
    return playbooks[key] || this.getDefaultPlaybook();
  }

  private getDefaultPlaybook(): IncidentResponsePlaybook {
    return {
      id: 'playbook_default',
      name: 'Default Incident Response',
      category: 'other',
      severity: 'medium',
      description: 'Default response procedures for security incidents',
      steps: [
        {
          stepNumber: 1,
          title: 'Initial Assessment',
          description: 'Assess the incident and determine severity',
          responsibleRole: 'Security Analyst',
          estimatedTime: 30,
          required: true,
          dependencies: [],
        },
        {
          stepNumber: 2,
          title: 'Containment',
          description: 'Contain the incident to prevent further damage',
          responsibleRole: 'Security Analyst',
          estimatedTime: 60,
          required: true,
          dependencies: [1],
        },
        {
          stepNumber: 3,
          title: 'Investigation',
          description: 'Investigate the root cause and impact',
          responsibleRole: 'Security Analyst',
          estimatedTime: 120,
          required: true,
          dependencies: [2],
        },
      ],
      escalationProcedures: [
        {
          level: 1,
          title: 'Security Team Escalation',
          trigger: 'Incident detected',
          contacts: ['security-team@company.com'],
          timeframe: 30,
          actions: ['Notify security team'],
        },
      ],
      communicationTemplates: [
        {
          type: 'internal',
          title: 'Internal Notification',
          template: 'Security incident detected. Status: {status}. Impact: {impact}.',
          variables: ['status', 'impact'],
        },
      ],
    };
  }

  // Evidence Management
  async addEvidence(incidentId: string, evidence: Omit<IncidentEvidence, 'id' | 'collectedAt'>): Promise<IncidentEvidence> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const newEvidence: IncidentEvidence = {
      ...evidence,
      id: `evidence_${Date.now()}`,
      collectedAt: new Date(),
    };

    incident.evidence.push(newEvidence);

    incident.timeline.push({
      timestamp: new Date(),
      event: 'Evidence Collected',
      description: `Evidence collected: ${evidence.description}`,
      actor: 'system',
      evidence: newEvidence.id,
    });

    await this.logIncidentUpdate(incident);
    return newEvidence;
  }

  // Action Management
  async createAction(incidentId: string, action: Omit<IncidentAction, 'id' | 'status'>): Promise<IncidentAction> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const newAction: IncidentAction = {
      ...action,
      id: `action_${Date.now()}`,
      status: 'pending',
    };

    incident.actions.push(newAction);

    await this.logIncidentUpdate(incident);
    return newAction;
  }

  async updateActionStatus(incidentId: string, actionId: string, status: IncidentAction['status'], notes?: string): Promise<void> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const action = incident.actions.find(a => a.id === actionId);
    if (!action) {
      throw new Error('Action not found');
    }

    action.status = status;
    if (status === 'completed') {
      action.completedAt = new Date();
    }
    if (notes) {
      action.notes = notes;
    }

    await this.logIncidentUpdate(incident);
  }

  // Reporting and Analytics
  async generateIncidentReport(incidentId: string): Promise<{
    incident: SecurityIncident;
    timeline: IncidentTimelineEvent[];
    evidence: IncidentEvidence[];
    actions: IncidentAction[];
    metrics: {
      timeToDetection: number;
      timeToContainment: number;
      timeToResolution: number;
      totalActions: number;
      completedActions: number;
    };
  }> {
    const incident = await this.getIncident(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const timeToDetection = 0; // Calculate based on detection time
    const timeToContainment = this.calculateTimeToContainment(incident);
    const timeToResolution = this.calculateTimeToResolution(incident);
    const totalActions = incident.actions.length;
    const completedActions = incident.actions.filter(a => a.status === 'completed').length;

    return {
      incident,
      timeline: incident.timeline,
      evidence: incident.evidence,
      actions: incident.actions,
      metrics: {
        timeToDetection,
        timeToContainment,
        timeToResolution,
        totalActions,
        completedActions,
      },
    };
  }

  // Private helper methods
  private async getIncident(incidentId: string): Promise<SecurityIncident | null> {
    // In a real implementation, this would query the database
    // For now, return null to simulate incident not found
    return null;
  }

  private async triggerInitialResponse(incident: SecurityIncident): Promise<void> {
    this.logger.log(`Triggering initial response for incident ${incident.id}`);

    // Determine if escalation is needed
    if (incident.severity === 'critical' || incident.severity === 'high') {
      await this.escalateIncident(incident);
    }

    // Send initial notifications
    await this.sendInitialNotifications(incident);
  }

  private async executePlaybook(incident: SecurityIncident): Promise<void> {
    const playbook = await this.getPlaybook(incident.category, incident.severity);

    for (const step of playbook.steps) {
      const action = await this.createAction(incident.id, {
        action: step.title,
        description: step.description,
        assignedTo: step.responsibleRole,
        priority: this.mapSeverityToPriority(incident.severity),
        dueDate: new Date(Date.now() + step.estimatedTime * 60 * 1000),
      });

      incident.timeline.push({
        timestamp: new Date(),
        event: 'Playbook Step Created',
        description: `Created action: ${step.title}`,
        actor: 'system',
      });
    }
  }

  private async escalateIncident(incident: SecurityIncident): Promise<void> {
    const playbook = await this.getPlaybook(incident.category, incident.severity);

    for (const escalation of playbook.escalationProcedures) {
      this.logger.log(`Escalating incident ${incident.id} to level ${escalation.level}`);
      
      // In a real implementation, this would send notifications to contacts
      for (const contact of escalation.contacts) {
        await this.sendEscalationNotification(incident, contact, escalation);
      }
    }
  }

  private async notifyStakeholders(incident: SecurityIncident, status: string): Promise<void> {
    this.logger.log(`Notifying stakeholders about incident ${incident.id} status: ${status}`);
    
    // In a real implementation, this would send notifications to relevant stakeholders
  }

  private async generatePostIncidentReport(incident: SecurityIncident): Promise<void> {
    this.logger.log(`Generating post-incident report for ${incident.id}`);
    
    // In a real implementation, this would generate a comprehensive report
    const report = await this.generateIncidentReport(incident.id);
    
    // Extract lessons learned
    incident.lessonsLearned = this.extractLessonsLearned(incident);
    
    await this.logIncidentUpdate(incident);
  }

  private calculateTimeToContainment(incident: SecurityIncident): number {
    const containmentEvent = incident.timeline.find(e => e.event === 'Incident Contained');
    if (!containmentEvent) return 0;
    
    return containmentEvent.timestamp.getTime() - incident.detectedAt.getTime();
  }

  private calculateTimeToResolution(incident: SecurityIncident): number {
    const resolutionEvent = incident.timeline.find(e => e.event === 'Incident Resolved');
    if (!resolutionEvent) return 0;
    
    return resolutionEvent.timestamp.getTime() - incident.detectedAt.getTime();
  }

  private mapSeverityToPriority(severity: string): IncidentAction['priority'] {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private extractLessonsLearned(incident: SecurityIncident): string[] {
    const lessons: string[] = [];
    
    // Analyze timeline and actions to extract lessons
    if (incident.timeline.length > 0) {
      lessons.push('Review incident detection procedures');
    }
    
    if (incident.actions.some(a => a.status === 'failed')) {
      lessons.push('Improve action execution procedures');
    }
    
    return lessons;
  }

  private async sendInitialNotifications(incident: SecurityIncident): Promise<void> {
    // In a real implementation, this would send notifications
    this.logger.log(`Sending initial notifications for incident ${incident.id}`);
  }

  private async sendEscalationNotification(incident: SecurityIncident, contact: string, escalation: EscalationProcedure): Promise<void> {
    // In a real implementation, this would send escalation notifications
    this.logger.log(`Sending escalation notification to ${contact} for incident ${incident.id}`);
  }

  // Logging methods
  private async logIncidentCreated(incident: SecurityIncident): Promise<void> {
    await this.auditLogRepository.save({
      action: 'incident_created',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'security_incident',
      resourceId: incident.id,
      details: JSON.stringify({
        title: incident.title,
        severity: incident.severity,
        category: incident.category,
      }),
      timestamp: new Date(),
    });
  }

  private async logIncidentUpdate(incident: SecurityIncident): Promise<void> {
    await this.auditLogRepository.save({
      action: 'incident_updated',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'security_incident',
      resourceId: incident.id,
      details: JSON.stringify({
        status: incident.status,
        timelineLength: incident.timeline.length,
        evidenceCount: incident.evidence.length,
        actionsCount: incident.actions.length,
      }),
      timestamp: new Date(),
    });
  }
}
