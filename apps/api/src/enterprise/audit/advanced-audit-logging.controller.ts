import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/rbac.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { AdvancedAuditLoggingService, AuditFilter, AuditReport, ComplianceReport } from './advanced-audit-logging.service';

@ApiTags('Advanced Audit Logging')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdvancedAuditLoggingController {
  constructor(private readonly auditService: AdvancedAuditLoggingService) {}

  @Post('events')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Log an audit event' })
  @ApiResponse({ status: 201, description: 'Audit event logged successfully' })
  async logEvent(
    @Body() body: {
      userId: string;
      organizationId: string;
      action: string;
      resource: string;
      resourceId: string;
      details: Record<string, any>;
      ipAddress: string;
      userAgent: string;
      sessionId: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      category?: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'compliance';
      tags?: string[];
    },
  ) {
    return this.auditService.logAuditEvent(
      body.userId,
      body.organizationId,
      body.action,
      body.resource,
      body.resourceId,
      body.details,
      body.ipAddress,
      body.userAgent,
      body.sessionId,
      body.severity,
      body.category,
      body.tags,
    );
  }

  @Post('reports')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Generate an audit report' })
  @ApiResponse({ status: 201, description: 'Audit report generated successfully' })
  async generateReport(
    @Body() body: {
      name: string;
      description: string;
      filters: AuditFilter;
      generatedBy: string;
    },
  ): Promise<AuditReport> {
    return this.auditService.generateAuditReport(
      body.name,
      body.description,
      body.filters,
      body.generatedBy,
    );
  }

  @Post('compliance-reports')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Generate a compliance report' })
  @ApiResponse({ status: 201, description: 'Compliance report generated successfully' })
  async generateComplianceReport(
    @Body() body: {
      type: 'soc2' | 'gdpr' | 'hipaa' | 'pci' | 'iso27001';
      period: { start: Date; end: Date };
      organizationId: string;
      generatedBy: string;
    },
  ): Promise<ComplianceReport> {
    return this.auditService.generateComplianceReport(
      body.type,
      body.period,
      body.organizationId,
      body.generatedBy,
    );
  }

  @Get('events')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get audit events with filters' })
  @ApiResponse({ status: 200, description: 'Audit events retrieved successfully' })
  async getEvents(
    @Query() filters: AuditFilter,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
  ) {
    return this.auditService.getAuditEvents(filters, page, limit);
  }

  @Get('metrics/:organizationId')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get audit metrics for an organization' })
  @ApiResponse({ status: 200, description: 'Audit metrics retrieved successfully' })
  async getMetrics(
    @Param('organizationId') organizationId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const timeRange = {
      start: new Date(start),
      end: new Date(end),
    };
    return this.auditService.getAuditMetrics(organizationId, timeRange);
  }

  @Get('reports/:reportId')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get a specific audit report' })
  @ApiResponse({ status: 200, description: 'Audit report retrieved successfully' })
  async getReport(@Param('reportId') reportId: string) {
    // This would typically fetch from a reports storage
    return { id: reportId, message: 'Report retrieved' };
  }

  @Get('compliance-reports/:reportId')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get a specific compliance report' })
  @ApiResponse({ status: 200, description: 'Compliance report retrieved successfully' })
  async getComplianceReport(@Param('reportId') reportId: string) {
    // This would typically fetch from a reports storage
    return { id: reportId, message: 'Compliance report retrieved' };
  }
}
