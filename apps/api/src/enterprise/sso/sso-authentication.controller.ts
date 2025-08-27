import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/rbac.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { SSOAuthenticationService, SSOProvider, SSOSession, SAMLConfig, OIDCConfig, OAuth2Config } from './sso-authentication.service';

@ApiTags('SSO Authentication')
@Controller('sso')
export class SSOAuthenticationController {
  constructor(private readonly ssoService: SSOAuthenticationService) {}

  @Post('providers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new SSO provider' })
  @ApiResponse({ status: 201, description: 'SSO provider created successfully' })
  async createProvider(
    @Body() body: {
      name: string;
      type: SSOProvider['type'];
      config: SAMLConfig | OIDCConfig | OAuth2Config;
      organizationId: string;
    },
  ): Promise<SSOProvider> {
    return this.ssoService.createSSOProvider(
      body.name,
      body.type,
      body.config,
      body.organizationId,
    );
  }

  @Post('initiate/:providerId')
  @ApiOperation({ summary: 'Initiate SSO authentication' })
  @ApiResponse({ status: 200, description: 'SSO initiated successfully' })
  async initiateSSO(
    @Param('providerId') providerId: string,
    @Query('returnUrl') returnUrl: string,
    @Query('organizationId') organizationId: string,
  ): Promise<{ authUrl: string; sessionId: string }> {
    return this.ssoService.initiateSSO(providerId, returnUrl, organizationId);
  }

  @Post('callback/:providerId')
  @ApiOperation({ summary: 'Handle SSO callback' })
  @ApiResponse({ status: 200, description: 'SSO callback handled successfully' })
  async handleCallback(
    @Param('providerId') providerId: string,
    @Body() callbackData: any,
    @Query('sessionId') sessionId: string,
  ): Promise<SSOSession> {
    return this.ssoService.handleSSOCallback(providerId, callbackData, sessionId);
  }

  @Get('validate/:sessionToken')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate SSO session' })
  @ApiResponse({ status: 200, description: 'Session validation result' })
  async validateSession(@Param('sessionToken') sessionToken: string): Promise<SSOSession | null> {
    return this.ssoService.validateSSOSession(sessionToken);
  }

  @Post('logout/:sessionToken')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from SSO session' })
  @ApiResponse({ status: 200, description: 'SSO logout successful' })
  async logoutSSO(@Param('sessionToken') sessionToken: string): Promise<void> {
    return this.ssoService.logoutSSO(sessionToken);
  }
}
