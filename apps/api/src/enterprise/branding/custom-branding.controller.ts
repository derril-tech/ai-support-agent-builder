import { Controller, Post, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/rbac.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { CustomBrandingService, BrandingConfig, WhiteLabelConfig, BrandingColors, BrandingFonts, BrandingAsset, WhiteLabelFeature } from './custom-branding.service';

@ApiTags('Custom Branding')
@Controller('branding')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomBrandingController {
  constructor(private readonly brandingService: CustomBrandingService) {}

  @Post('configs')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create a new branding configuration' })
  @ApiResponse({ status: 201, description: 'Branding configuration created successfully' })
  async createBrandingConfig(
    @Body() body: {
      organizationId: string;
      name: string;
      logo: Omit<BrandingAsset, 'id'>;
      favicon: Omit<BrandingAsset, 'id'>;
      colors: BrandingColors;
      fonts: BrandingFonts;
      customDomain?: string;
      customEmailDomain?: string;
    },
  ): Promise<BrandingConfig> {
    return this.brandingService.createBrandingConfig(
      body.organizationId,
      body.name,
      body.logo,
      body.favicon,
      body.colors,
      body.fonts,
      body.customDomain,
      body.customEmailDomain,
    );
  }

  @Put('configs/:configId')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update a branding configuration' })
  @ApiResponse({ status: 200, description: 'Branding configuration updated successfully' })
  async updateBrandingConfig(
    @Param('configId') configId: string,
    @Body() updates: Partial<Omit<BrandingConfig, 'id' | 'organizationId' | 'createdAt'>>,
  ): Promise<BrandingConfig> {
    return this.brandingService.updateBrandingConfig(configId, updates);
  }

  @Post('whitelabel')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Create a new white-label configuration' })
  @ApiResponse({ status: 201, description: 'White-label configuration created successfully' })
  async createWhiteLabelConfig(
    @Body() body: {
      organizationId: string;
      productName: string;
      companyName: string;
      supportEmail: string;
      website: string;
      termsOfService: string;
      privacyPolicy: string;
      supportPhone?: string;
      customCss?: string;
      customJs?: string;
      features?: WhiteLabelFeature[];
    },
  ): Promise<WhiteLabelConfig> {
    return this.brandingService.createWhiteLabelConfig(
      body.organizationId,
      body.productName,
      body.companyName,
      body.supportEmail,
      body.website,
      body.termsOfService,
      body.privacyPolicy,
      body.supportPhone,
      body.customCss,
      body.customJs,
      body.features,
    );
  }

  @Put('whitelabel/:configId')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Update a white-label configuration' })
  @ApiResponse({ status: 200, description: 'White-label configuration updated successfully' })
  async updateWhiteLabelConfig(
    @Param('configId') configId: string,
    @Body() updates: Partial<Omit<WhiteLabelConfig, 'id' | 'organizationId'>>,
  ): Promise<WhiteLabelConfig> {
    return this.brandingService.updateWhiteLabelConfig(configId, updates);
  }

  @Post('configs/:configId/activate')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Activate a branding configuration' })
  @ApiResponse({ status: 200, description: 'Branding configuration activated successfully' })
  async activateBranding(@Param('configId') configId: string): Promise<void> {
    return this.brandingService.activateBranding(configId);
  }

  @Post('whitelabel/:configId/activate')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Activate a white-label configuration' })
  @ApiResponse({ status: 200, description: 'White-label configuration activated successfully' })
  async activateWhiteLabel(@Param('configId') configId: string): Promise<void> {
    return this.brandingService.activateWhiteLabel(configId);
  }

  @Get('configs/:configId')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get a branding configuration' })
  @ApiResponse({ status: 200, description: 'Branding configuration retrieved successfully' })
  async getBrandingConfig(@Param('configId') configId: string): Promise<BrandingConfig | null> {
    return this.brandingService.getBrandingConfig(configId);
  }

  @Get('whitelabel/:configId')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get a white-label configuration' })
  @ApiResponse({ status: 200, description: 'White-label configuration retrieved successfully' })
  async getWhiteLabelConfig(@Param('configId') configId: string): Promise<WhiteLabelConfig | null> {
    return this.brandingService.getWhiteLabelConfig(configId);
  }

  @Get('assets/:organizationId')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Get branding assets for an organization' })
  @ApiResponse({ status: 200, description: 'Branding assets retrieved successfully' })
  async getBrandingAssets(@Param('organizationId') organizationId: string): Promise<BrandingAsset[]> {
    return this.brandingService.getBrandingAssets(organizationId);
  }

  @Post('validate-domain')
  @Roles('ADMIN', 'OWNER')
  @ApiOperation({ summary: 'Validate a custom domain for white-labeling' })
  @ApiResponse({ status: 200, description: 'Domain validation completed' })
  async validateCustomDomain(@Body() body: { domain: string }): Promise<{ valid: boolean; message?: string }> {
    return this.brandingService.validateCustomDomain(body.domain);
  }

  @Post('preview/:configId')
  @Roles('ADMIN', 'OWNER', 'DESIGNER')
  @ApiOperation({ summary: 'Generate a branding preview' })
  @ApiResponse({ status: 200, description: 'Branding preview generated successfully' })
  async generateBrandingPreview(@Param('configId') configId: string): Promise<{ previewUrl: string; expiresAt: Date }> {
    return this.brandingService.generateBrandingPreview(configId);
  }
}
