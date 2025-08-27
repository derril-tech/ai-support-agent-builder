// Created automatically by Cursor AI (2024-12-19)

import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SOC2ComplianceService, SOC2Control, SOC2Report } from './soc2-compliance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/guards/roles.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('SOC 2 Compliance')
@Controller('compliance/soc2')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SOC2ComplianceController {
  constructor(private readonly soc2ComplianceService: SOC2ComplianceService) {}

  @Get('controls')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get all SOC 2 controls assessment' })
  @ApiResponse({ status: 200, description: 'Returns all SOC 2 controls' })
  async getAllControls(): Promise<SOC2Control[]> {
    return Promise.all([
      this.soc2ComplianceService.assessControlEnvironment(),
      this.soc2ComplianceService.assessCommunicationAndInformation(),
      this.soc2ComplianceService.assessRiskAssessment(),
      this.soc2ComplianceService.assessMonitoringActivities(),
      this.soc2ComplianceService.assessControlActivities(),
      this.soc2ComplianceService.assessAvailability(),
      this.soc2ComplianceService.assessDataConfidentiality(),
      this.soc2ComplianceService.assessDataIntegrity(),
      this.soc2ComplianceService.assessPrivacy(),
    ]);
  }

  @Get('controls/:category')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get SOC 2 controls by category' })
  @ApiResponse({ status: 200, description: 'Returns controls for specified category' })
  async getControlsByCategory(@Query('category') category: string): Promise<SOC2Control[]> {
    const allControls = await this.getAllControls();
    return allControls.filter(control => control.category === category);
  }

  @Post('report')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Generate SOC 2 compliance report' })
  @ApiResponse({ status: 201, description: 'SOC 2 report generated successfully' })
  async generateReport(
    @Body() body: { periodStart: string; periodEnd: string },
  ): Promise<SOC2Report> {
    const periodStart = new Date(body.periodStart);
    const periodEnd = new Date(body.periodEnd);
    
    return this.soc2ComplianceService.generateSOC2Report(periodStart, periodEnd);
  }

  @Post('monitor')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Start compliance monitoring' })
  @ApiResponse({ status: 200, description: 'Compliance monitoring started' })
  async startMonitoring(): Promise<{ message: string }> {
    await this.soc2ComplianceService.monitorCompliance();
    return { message: 'Compliance monitoring started successfully' };
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get compliance dashboard data' })
  @ApiResponse({ status: 200, description: 'Returns compliance dashboard metrics' })
  async getDashboard(): Promise<{
    totalControls: number;
    implementedControls: number;
    partiallyImplementedControls: number;
    notImplementedControls: number;
    lastAssessment: Date;
    nextAssessment: Date;
    complianceScore: number;
  }> {
    const controls = await this.getAllControls();
    
    const implemented = controls.filter(c => c.status === 'implemented').length;
    const partiallyImplemented = controls.filter(c => c.status === 'partially_implemented').length;
    const notImplemented = controls.filter(c => c.status === 'not_implemented').length;
    
    const complianceScore = (implemented / controls.length) * 100;
    
    const lastAssessment = new Date(Math.max(...controls.map(c => c.lastAssessed.getTime())));
    const nextAssessment = new Date(Math.min(...controls.map(c => c.nextAssessment.getTime())));
    
    return {
      totalControls: controls.length,
      implementedControls: implemented,
      partiallyImplementedControls: partiallyImplemented,
      notImplementedControls: notImplemented,
      lastAssessment,
      nextAssessment,
      complianceScore,
    };
  }
}
