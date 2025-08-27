// Created automatically by Cursor AI (2024-12-19)

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GDPRComplianceService, DataProcessingAgreement, ConsentRecord, DataSubjectRequest } from './gdpr-compliance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/guards/roles.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('GDPR/CCPA Compliance')
@Controller('compliance/gdpr')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GDPRComplianceController {
  constructor(private readonly gdprComplianceService: GDPRComplianceService) {}

  // Data Processing Agreements
  @Post('data-processing-agreements')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new data processing agreement' })
  @ApiResponse({ status: 201, description: 'Data processing agreement created successfully' })
  async createDataProcessingAgreement(
    @Body() agreement: Omit<DataProcessingAgreement, 'id'>,
  ): Promise<DataProcessingAgreement> {
    return this.gdprComplianceService.createDataProcessingAgreement(agreement);
  }

  @Get('data-processing-agreements/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get data processing agreements for an organization' })
  @ApiResponse({ status: 200, description: 'Returns data processing agreements' })
  async getDataProcessingAgreements(
    @Param('organizationId') organizationId: string,
  ): Promise<DataProcessingAgreement[]> {
    return this.gdprComplianceService.getDataProcessingAgreements(organizationId);
  }

  // Consent Management
  @Post('consent')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DESIGNER)
  @ApiOperation({ summary: 'Record user consent' })
  @ApiResponse({ status: 201, description: 'Consent recorded successfully' })
  async recordConsent(
    @Body() consent: Omit<ConsentRecord, 'id' | 'timestamp'>,
  ): Promise<ConsentRecord> {
    return this.gdprComplianceService.recordConsent(consent);
  }

  @Post('consent/withdraw')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DESIGNER)
  @ApiOperation({ summary: 'Withdraw user consent' })
  @ApiResponse({ status: 200, description: 'Consent withdrawn successfully' })
  async withdrawConsent(
    @Body() body: { userId: string; organizationId: string; purpose: string },
  ): Promise<{ message: string }> {
    await this.gdprComplianceService.withdrawConsent(body.userId, body.organizationId, body.purpose);
    return { message: 'Consent withdrawn successfully' };
  }

  @Get('consent/:userId/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get consent history for a user' })
  @ApiResponse({ status: 200, description: 'Returns consent history' })
  async getConsentHistory(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<ConsentRecord[]> {
    return this.gdprComplianceService.getConsentHistory(userId, organizationId);
  }

  // Data Subject Rights
  @Post('data-subject-requests')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.DESIGNER)
  @ApiOperation({ summary: 'Submit a data subject request' })
  @ApiResponse({ status: 201, description: 'Data subject request submitted successfully' })
  async submitDataSubjectRequest(
    @Body() request: Omit<DataSubjectRequest, 'id' | 'submittedAt' | 'status'>,
  ): Promise<DataSubjectRequest> {
    return this.gdprComplianceService.submitDataSubjectRequest(request);
  }

  @Get('data-subject-requests/:userId/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get data subject requests for a user' })
  @ApiResponse({ status: 200, description: 'Returns data subject requests' })
  async getDataSubjectRequests(
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ): Promise<DataSubjectRequest[]> {
    return this.gdprComplianceService.getDataSubjectRequests(userId, organizationId);
  }

  // Data Retention and Deletion
  @Post('data-retention/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Schedule data retention sweep' })
  @ApiResponse({ status: 200, description: 'Data retention sweep scheduled' })
  async scheduleDataRetention(
    @Param('organizationId') organizationId: string,
  ): Promise<{ message: string }> {
    await this.gdprComplianceService.scheduleDataRetention(organizationId);
    return { message: 'Data retention sweep scheduled successfully' };
  }

  @Post('data-deletion')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Perform data deletion for a user' })
  @ApiResponse({ status: 200, description: 'Data deletion completed' })
  async performDataDeletion(
    @Body() body: { userId: string; organizationId: string },
  ): Promise<{ message: string }> {
    await this.gdprComplianceService.performDataDeletion(body.userId, body.organizationId);
    return { message: 'Data deletion completed successfully' };
  }

  // Privacy Impact Assessment
  @Post('privacy-impact-assessment/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Conduct privacy impact assessment' })
  @ApiResponse({ status: 200, description: 'Privacy impact assessment completed' })
  async conductPrivacyImpactAssessment(
    @Param('organizationId') organizationId: string,
    @Body() body: { dataProcessingActivity: string },
  ): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    risks: string[];
    mitigations: string[];
    recommendations: string[];
  }> {
    return this.gdprComplianceService.conductPrivacyImpactAssessment(
      organizationId,
      body.dataProcessingActivity,
    );
  }

  // Compliance Monitoring
  @Get('compliance/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Monitor GDPR compliance for an organization' })
  @ApiResponse({ status: 200, description: 'Returns compliance metrics' })
  async monitorGDPRCompliance(
    @Param('organizationId') organizationId: string,
  ): Promise<{
    consentCompliance: number;
    dataRetentionCompliance: number;
    dataSubjectRightsCompliance: number;
    overallCompliance: number;
    violations: string[];
  }> {
    return this.gdprComplianceService.monitorGDPRCompliance(organizationId);
  }

  // Dashboard endpoints
  @Get('dashboard/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get GDPR compliance dashboard data' })
  @ApiResponse({ status: 200, description: 'Returns dashboard metrics' })
  async getDashboard(
    @Param('organizationId') organizationId: string,
  ): Promise<{
    totalDataProcessingAgreements: number;
    activeAgreements: number;
    pendingDataSubjectRequests: number;
    completedDataSubjectRequests: number;
    consentCompliance: number;
    dataRetentionCompliance: number;
    overallCompliance: number;
    recentViolations: string[];
  }> {
    const agreements = await this.gdprComplianceService.getDataProcessingAgreements(organizationId);
    const compliance = await this.gdprComplianceService.monitorGDPRCompliance(organizationId);
    
    // Mock data for dashboard
    const pendingRequests = 5;
    const completedRequests = 25;
    
    return {
      totalDataProcessingAgreements: agreements.length,
      activeAgreements: agreements.filter(a => a.status === 'active').length,
      pendingDataSubjectRequests: pendingRequests,
      completedDataSubjectRequests: completedRequests,
      consentCompliance: compliance.consentCompliance,
      dataRetentionCompliance: compliance.dataRetentionCompliance,
      overallCompliance: compliance.overallCompliance,
      recentViolations: compliance.violations,
    };
  }
}
