// Created automatically by Cursor AI (2024-12-19)

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { Organization } from '../../database/entities/organization.entity';
import { User } from '../../database/entities/user.entity';

export interface DataProcessingAgreement {
  id: string;
  organizationId: string;
  processorName: string;
  purpose: string;
  dataCategories: string[];
  retentionPeriod: number; // days
  securityMeasures: string[];
  subprocessors: string[];
  status: 'active' | 'pending' | 'expired';
  effectiveDate: Date;
  expiryDate: Date;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  organizationId: string;
  purpose: string;
  consentType: 'explicit' | 'implicit' | 'withdrawn';
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  version: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  organizationId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  description: string;
  submittedAt: Date;
  completedAt?: Date;
  responseData?: any;
}

@Injectable()
export class GDPRComplianceService {
  private readonly logger = new Logger(GDPRComplianceService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Data Processing Agreements
  async createDataProcessingAgreement(agreement: Omit<DataProcessingAgreement, 'id'>): Promise<DataProcessingAgreement> {
    const newAgreement: DataProcessingAgreement = {
      ...agreement,
      id: `dpa_${Date.now()}`,
    };

    await this.logDataProcessingAgreement('created', newAgreement);
    return newAgreement;
  }

  async getDataProcessingAgreements(organizationId: string): Promise<DataProcessingAgreement[]> {
    // In a real implementation, this would query the database
    return [
      {
        id: 'dpa_1',
        organizationId,
        processorName: 'OpenAI',
        purpose: 'AI model training and inference',
        dataCategories: ['conversation_data', 'user_preferences'],
        retentionPeriod: 365,
        securityMeasures: ['encryption_at_rest', 'encryption_in_transit', 'access_controls'],
        subprocessors: ['AWS', 'Azure'],
        status: 'active',
        effectiveDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
      },
      {
        id: 'dpa_2',
        organizationId,
        processorName: 'Stripe',
        purpose: 'Payment processing',
        dataCategories: ['payment_data', 'billing_information'],
        retentionPeriod: 730,
        securityMeasures: ['pci_compliance', 'tokenization', 'fraud_detection'],
        subprocessors: ['Visa', 'Mastercard'],
        status: 'active',
        effectiveDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
      },
    ];
  }

  // Consent Management
  async recordConsent(consent: Omit<ConsentRecord, 'id' | 'timestamp'>): Promise<ConsentRecord> {
    const newConsent: ConsentRecord = {
      ...consent,
      id: `consent_${Date.now()}`,
      timestamp: new Date(),
    };

    await this.logConsentRecord('recorded', newConsent);
    return newConsent;
  }

  async withdrawConsent(userId: string, organizationId: string, purpose: string): Promise<void> {
    const withdrawal: ConsentRecord = {
      id: `withdrawal_${Date.now()}`,
      userId,
      organizationId,
      purpose,
      consentType: 'withdrawn',
      timestamp: new Date(),
      ipAddress: 'system',
      userAgent: 'system',
      version: '1.0',
    };

    await this.logConsentRecord('withdrawn', withdrawal);
    
    // Trigger data deletion if required
    await this.handleConsentWithdrawal(userId, organizationId, purpose);
  }

  async getConsentHistory(userId: string, organizationId: string): Promise<ConsentRecord[]> {
    // In a real implementation, this would query the database
    return [
      {
        id: 'consent_1',
        userId,
        organizationId,
        purpose: 'marketing_communications',
        consentType: 'explicit',
        timestamp: new Date('2024-01-01'),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        version: '1.0',
      },
      {
        id: 'consent_2',
        userId,
        organizationId,
        purpose: 'data_processing',
        consentType: 'explicit',
        timestamp: new Date('2024-01-01'),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        version: '1.0',
      },
    ];
  }

  // Data Subject Rights
  async submitDataSubjectRequest(request: Omit<DataSubjectRequest, 'id' | 'submittedAt' | 'status'>): Promise<DataSubjectRequest> {
    const newRequest: DataSubjectRequest = {
      ...request,
      id: `dsr_${Date.now()}`,
      submittedAt: new Date(),
      status: 'pending',
    };

    await this.logDataSubjectRequest('submitted', newRequest);
    
    // Process the request based on type
    await this.processDataSubjectRequest(newRequest);
    
    return newRequest;
  }

  async getDataSubjectRequests(userId: string, organizationId: string): Promise<DataSubjectRequest[]> {
    // In a real implementation, this would query the database
    return [
      {
        id: 'dsr_1',
        userId,
        organizationId,
        requestType: 'access',
        status: 'completed',
        description: 'Request for personal data access',
        submittedAt: new Date('2024-01-01'),
        completedAt: new Date('2024-01-03'),
        responseData: { dataExported: true, fileUrl: '/exports/user_data_123.json' },
      },
      {
        id: 'dsr_2',
        userId,
        organizationId,
        requestType: 'erasure',
        status: 'processing',
        description: 'Request for data deletion',
        submittedAt: new Date('2024-01-05'),
      },
    ];
  }

  // Data Retention and Deletion
  async scheduleDataRetention(organizationId: string): Promise<void> {
    this.logger.log(`Scheduling data retention sweep for organization ${organizationId}`);
    
    // Identify data that has exceeded retention periods
    const expiredData = await this.identifyExpiredData(organizationId);
    
    if (expiredData.length > 0) {
      await this.deleteExpiredData(expiredData);
    }
  }

  async performDataDeletion(userId: string, organizationId: string): Promise<void> {
    this.logger.log(`Performing data deletion for user ${userId} in organization ${organizationId}`);
    
    // Delete user data across all systems
    await this.deleteUserData(userId, organizationId);
    
    // Log the deletion
    await this.logDataDeletion(userId, organizationId);
  }

  // Privacy Impact Assessment
  async conductPrivacyImpactAssessment(organizationId: string, dataProcessingActivity: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    risks: string[];
    mitigations: string[];
    recommendations: string[];
  }> {
    const assessment = {
      riskLevel: 'medium' as const,
      risks: [
        'Potential unauthorized access to personal data',
        'Data retention beyond necessary period',
        'Inadequate data subject rights handling',
      ],
      mitigations: [
        'Implement strong access controls',
        'Establish data retention policies',
        'Automate data subject request processing',
      ],
      recommendations: [
        'Conduct regular privacy training',
        'Implement privacy by design principles',
        'Establish incident response procedures',
      ],
    };

    await this.logPrivacyImpactAssessment(organizationId, dataProcessingActivity, assessment);
    return assessment;
  }

  // Compliance Monitoring
  async monitorGDPRCompliance(organizationId: string): Promise<{
    consentCompliance: number;
    dataRetentionCompliance: number;
    dataSubjectRightsCompliance: number;
    overallCompliance: number;
    violations: string[];
  }> {
    const consentCompliance = await this.assessConsentCompliance(organizationId);
    const dataRetentionCompliance = await this.assessDataRetentionCompliance(organizationId);
    const dataSubjectRightsCompliance = await this.assessDataSubjectRightsCompliance(organizationId);
    
    const overallCompliance = (consentCompliance + dataRetentionCompliance + dataSubjectRightsCompliance) / 3;
    
    const violations = await this.identifyGDPRViolations(organizationId);
    
    return {
      consentCompliance,
      dataRetentionCompliance,
      dataSubjectRightsCompliance,
      overallCompliance,
      violations,
    };
  }

  // Private helper methods
  private async handleConsentWithdrawal(userId: string, organizationId: string, purpose: string): Promise<void> {
    // If consent withdrawal requires immediate data deletion
    if (purpose === 'data_processing') {
      await this.performDataDeletion(userId, organizationId);
    }
  }

  private async processDataSubjectRequest(request: DataSubjectRequest): Promise<void> {
    switch (request.requestType) {
      case 'access':
        await this.processAccessRequest(request);
        break;
      case 'rectification':
        await this.processRectificationRequest(request);
        break;
      case 'erasure':
        await this.processErasureRequest(request);
        break;
      case 'portability':
        await this.processPortabilityRequest(request);
        break;
      case 'restriction':
        await this.processRestrictionRequest(request);
        break;
      case 'objection':
        await this.processObjectionRequest(request);
        break;
    }
  }

  private async processAccessRequest(request: DataSubjectRequest): Promise<void> {
    // Generate data export
    const userData = await this.exportUserData(request.userId, request.organizationId);
    
    // Update request status
    request.status = 'completed';
    request.completedAt = new Date();
    request.responseData = { dataExported: true, data: userData };
    
    await this.logDataSubjectRequest('completed', request);
  }

  private async processErasureRequest(request: DataSubjectRequest): Promise<void> {
    // Perform data deletion
    await this.performDataDeletion(request.userId, request.organizationId);
    
    // Update request status
    request.status = 'completed';
    request.completedAt = new Date();
    
    await this.logDataSubjectRequest('completed', request);
  }

  private async exportUserData(userId: string, organizationId: string): Promise<any> {
    // In a real implementation, this would export all user data
    return {
      profile: { name: 'John Doe', email: 'john@example.com' },
      conversations: [],
      preferences: {},
      activity: [],
    };
  }

  private async deleteUserData(userId: string, organizationId: string): Promise<void> {
    // In a real implementation, this would delete user data from all systems
    this.logger.log(`Deleting data for user ${userId} from organization ${organizationId}`);
  }

  private async identifyExpiredData(organizationId: string): Promise<any[]> {
    // In a real implementation, this would identify data that has exceeded retention periods
    return [];
  }

  private async deleteExpiredData(expiredData: any[]): Promise<void> {
    // In a real implementation, this would delete expired data
    this.logger.log(`Deleting ${expiredData.length} expired data records`);
  }

  private async assessConsentCompliance(organizationId: string): Promise<number> {
    // In a real implementation, this would assess consent compliance
    return 95; // Percentage
  }

  private async assessDataRetentionCompliance(organizationId: string): Promise<number> {
    // In a real implementation, this would assess data retention compliance
    return 90; // Percentage
  }

  private async assessDataSubjectRightsCompliance(organizationId: string): Promise<number> {
    // In a real implementation, this would assess data subject rights compliance
    return 88; // Percentage
  }

  private async identifyGDPRViolations(organizationId: string): Promise<string[]> {
    // In a real implementation, this would identify GDPR violations
    return [];
  }

  // Logging methods
  private async logDataProcessingAgreement(action: string, agreement: DataProcessingAgreement): Promise<void> {
    await this.auditLogRepository.save({
      action: `dpa_${action}`,
      userId: 'system',
      organizationId: agreement.organizationId,
      resourceType: 'data_processing_agreement',
      resourceId: agreement.id,
      details: JSON.stringify(agreement),
      timestamp: new Date(),
    });
  }

  private async logConsentRecord(action: string, consent: ConsentRecord): Promise<void> {
    await this.auditLogRepository.save({
      action: `consent_${action}`,
      userId: consent.userId,
      organizationId: consent.organizationId,
      resourceType: 'consent_record',
      resourceId: consent.id,
      details: JSON.stringify(consent),
      timestamp: new Date(),
    });
  }

  private async logDataSubjectRequest(action: string, request: DataSubjectRequest): Promise<void> {
    await this.auditLogRepository.save({
      action: `dsr_${action}`,
      userId: request.userId,
      organizationId: request.organizationId,
      resourceType: 'data_subject_request',
      resourceId: request.id,
      details: JSON.stringify(request),
      timestamp: new Date(),
    });
  }

  private async logDataDeletion(userId: string, organizationId: string): Promise<void> {
    await this.auditLogRepository.save({
      action: 'data_deletion',
      userId,
      organizationId,
      resourceType: 'user_data',
      resourceId: userId,
      details: JSON.stringify({ reason: 'consent_withdrawal_or_dsr' }),
      timestamp: new Date(),
    });
  }

  private async logPrivacyImpactAssessment(organizationId: string, activity: string, assessment: any): Promise<void> {
    await this.auditLogRepository.save({
      action: 'privacy_impact_assessment',
      userId: 'system',
      organizationId,
      resourceType: 'privacy_assessment',
      resourceId: `pia_${Date.now()}`,
      details: JSON.stringify({ activity, assessment }),
      timestamp: new Date(),
    });
  }
}
