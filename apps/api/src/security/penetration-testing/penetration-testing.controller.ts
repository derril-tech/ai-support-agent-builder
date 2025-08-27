// Created automatically by Cursor AI (2024-12-19)

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PenetrationTestingService, SecurityTest, PenetrationTestReport } from './penetration-testing.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/guards/roles.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('Penetration Testing')
@Controller('security/penetration-testing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PenetrationTestingController {
  constructor(private readonly penetrationTestingService: PenetrationTestingService) {}

  @Post('web-security/:targetUrl')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Run web application security tests' })
  @ApiResponse({ status: 201, description: 'Web security tests completed' })
  async runWebSecurityTests(
    @Param('targetUrl') targetUrl: string,
  ): Promise<SecurityTest> {
    return this.penetrationTestingService.runWebSecurityTests(targetUrl);
  }

  @Post('api-security/:apiEndpoint')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Run API security tests' })
  @ApiResponse({ status: 201, description: 'API security tests completed' })
  async runAPISecurityTests(
    @Param('apiEndpoint') apiEndpoint: string,
  ): Promise<SecurityTest> {
    return this.penetrationTestingService.runAPISecurityTests(apiEndpoint);
  }

  @Post('network-security/:targetHost')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Run network security tests' })
  @ApiResponse({ status: 201, description: 'Network security tests completed' })
  async runNetworkSecurityTests(
    @Param('targetHost') targetHost: string,
  ): Promise<SecurityTest> {
    return this.penetrationTestingService.runNetworkSecurityTests(targetHost);
  }

  @Post('social-engineering/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Run social engineering tests' })
  @ApiResponse({ status: 201, description: 'Social engineering tests completed' })
  async runSocialEngineeringTests(
    @Param('organizationId') organizationId: string,
  ): Promise<SecurityTest> {
    return this.penetrationTestingService.runSocialEngineeringTests(organizationId);
  }

  @Post('comprehensive-assessment/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Run comprehensive security assessment' })
  @ApiResponse({ status: 201, description: 'Comprehensive security assessment completed' })
  async runComprehensiveSecurityAssessment(
    @Param('organizationId') organizationId: string,
    @Body() targets: {
      webUrls: string[];
      apiEndpoints: string[];
      networkHosts: string[];
    },
  ): Promise<PenetrationTestReport> {
    return this.penetrationTestingService.runComprehensiveSecurityAssessment(organizationId, targets);
  }

  @Get('dashboard/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get security testing dashboard data' })
  @ApiResponse({ status: 200, description: 'Returns security testing metrics' })
  async getSecurityDashboard(
    @Param('organizationId') organizationId: string,
  ): Promise<{
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    mediumVulnerabilities: number;
    lowVulnerabilities: number;
    overallRiskScore: number;
    recentTests: any[];
    topVulnerabilities: any[];
  }> {
    // In a real implementation, this would query the database for actual data
    return {
      totalTests: 25,
      passedTests: 18,
      failedTests: 7,
      criticalVulnerabilities: 2,
      highVulnerabilities: 3,
      mediumVulnerabilities: 5,
      lowVulnerabilities: 8,
      overallRiskScore: 65,
      recentTests: [
        {
          id: 'test_1',
          name: 'Web Application Security Assessment',
          status: 'completed',
          date: new Date(),
          vulnerabilities: 3,
        },
        {
          id: 'test_2',
          name: 'API Security Assessment',
          status: 'completed',
          date: new Date(),
          vulnerabilities: 1,
        },
      ],
      topVulnerabilities: [
        {
          name: 'SQL Injection',
          count: 2,
          severity: 'critical',
        },
        {
          name: 'XSS',
          count: 3,
          severity: 'high',
        },
        {
          name: 'Weak Authentication',
          count: 1,
          severity: 'medium',
        },
      ],
    };
  }
}
