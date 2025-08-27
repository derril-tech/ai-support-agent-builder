import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface BrandingConfig {
  id: string;
  organizationId: string;
  name: string;
  logo: BrandingAsset;
  favicon: BrandingAsset;
  colors: BrandingColors;
  fonts: BrandingFonts;
  customDomain?: string;
  customEmailDomain?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingAsset {
  id: string;
  type: 'logo' | 'favicon' | 'background' | 'icon';
  url: string;
  altText?: string;
  width?: number;
  height?: number;
  format: 'png' | 'jpg' | 'jpeg' | 'svg' | 'ico';
  size: number; // bytes
}

export interface BrandingColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface BrandingFonts {
  primary: string;
  secondary: string;
  heading: string;
  body: string;
  monospace: string;
}

export interface WhiteLabelConfig {
  id: string;
  organizationId: string;
  productName: string;
  companyName: string;
  supportEmail: string;
  supportPhone?: string;
  website: string;
  termsOfService: string;
  privacyPolicy: string;
  customCss?: string;
  customJs?: string;
  features: WhiteLabelFeature[];
  status: 'active' | 'inactive' | 'pending';
}

export interface WhiteLabelFeature {
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
}

@Injectable()
export class CustomBrandingService {
  private readonly logger = new Logger(CustomBrandingService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createBrandingConfig(
    organizationId: string,
    name: string,
    logo: Omit<BrandingAsset, 'id'>,
    favicon: Omit<BrandingAsset, 'id'>,
    colors: BrandingColors,
    fonts: BrandingFonts,
    customDomain?: string,
    customEmailDomain?: string,
  ): Promise<BrandingConfig> {
    const config: BrandingConfig = {
      id: `branding_${Date.now()}`,
      organizationId,
      name,
      logo: { ...logo, id: `asset_${Date.now()}_1` },
      favicon: { ...favicon, id: `asset_${Date.now()}_2` },
      colors,
      fonts,
      customDomain,
      customEmailDomain,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.auditLogRepository.save({
      action: 'branding_config_created',
      resource: 'branding_config',
      resourceId: config.id,
      details: { organizationId, name, customDomain },
      timestamp: new Date(),
    });

    this.logger.log(`Created branding config: ${name} for organization ${organizationId}`);
    return config;
  }

  async updateBrandingConfig(
    configId: string,
    updates: Partial<Omit<BrandingConfig, 'id' | 'organizationId' | 'createdAt'>>,
  ): Promise<BrandingConfig> {
    const config = await this.getBrandingConfig(configId);
    
    if (!config) {
      throw new Error('Branding config not found');
    }

    const updatedConfig: BrandingConfig = {
      ...config,
      ...updates,
      updatedAt: new Date(),
    };

    await this.auditLogRepository.save({
      action: 'branding_config_updated',
      resource: 'branding_config',
      resourceId: configId,
      details: { updates },
      timestamp: new Date(),
    });

    this.logger.log(`Updated branding config: ${configId}`);
    return updatedConfig;
  }

  async createWhiteLabelConfig(
    organizationId: string,
    productName: string,
    companyName: string,
    supportEmail: string,
    website: string,
    termsOfService: string,
    privacyPolicy: string,
    supportPhone?: string,
    customCss?: string,
    customJs?: string,
    features: WhiteLabelFeature[] = [],
  ): Promise<WhiteLabelConfig> {
    const config: WhiteLabelConfig = {
      id: `whitelabel_${Date.now()}`,
      organizationId,
      productName,
      companyName,
      supportEmail,
      supportPhone,
      website,
      termsOfService,
      privacyPolicy,
      customCss,
      customJs,
      features,
      status: 'pending',
    };

    await this.auditLogRepository.save({
      action: 'whitelabel_config_created',
      resource: 'whitelabel_config',
      resourceId: config.id,
      details: { organizationId, productName, companyName },
      timestamp: new Date(),
    });

    this.logger.log(`Created white-label config: ${productName} for organization ${organizationId}`);
    return config;
  }

  async updateWhiteLabelConfig(
    configId: string,
    updates: Partial<Omit<WhiteLabelConfig, 'id' | 'organizationId'>>,
  ): Promise<WhiteLabelConfig> {
    const config = await this.getWhiteLabelConfig(configId);
    
    if (!config) {
      throw new Error('White-label config not found');
    }

    const updatedConfig: WhiteLabelConfig = {
      ...config,
      ...updates,
    };

    await this.auditLogRepository.save({
      action: 'whitelabel_config_updated',
      resource: 'whitelabel_config',
      resourceId: configId,
      details: { updates },
      timestamp: new Date(),
    });

    this.logger.log(`Updated white-label config: ${configId}`);
    return updatedConfig;
  }

  async activateBranding(configId: string): Promise<void> {
    const config = await this.getBrandingConfig(configId);
    
    if (!config) {
      throw new Error('Branding config not found');
    }

    await this.auditLogRepository.save({
      action: 'branding_config_activated',
      resource: 'branding_config',
      resourceId: configId,
      details: {},
      timestamp: new Date(),
    });

    this.logger.log(`Activated branding config: ${configId}`);
  }

  async activateWhiteLabel(configId: string): Promise<void> {
    const config = await this.getWhiteLabelConfig(configId);
    
    if (!config) {
      throw new Error('White-label config not found');
    }

    await this.auditLogRepository.save({
      action: 'whitelabel_config_activated',
      resource: 'whitelabel_config',
      resourceId: configId,
      details: {},
      timestamp: new Date(),
    });

    this.logger.log(`Activated white-label config: ${configId}`);
  }

  async getBrandingConfig(configId: string): Promise<BrandingConfig | null> {
    // Simulate config retrieval
    return {
      id: configId,
      organizationId: 'org_123',
      name: 'Enterprise Branding',
      logo: {
        id: 'logo_1',
        type: 'logo',
        url: 'https://example.com/logo.png',
        altText: 'Company Logo',
        width: 200,
        height: 60,
        format: 'png',
        size: 15000,
      },
      favicon: {
        id: 'favicon_1',
        type: 'favicon',
        url: 'https://example.com/favicon.ico',
        format: 'ico',
        size: 5000,
      },
      colors: {
        primary: '#1976d2',
        secondary: '#dc004e',
        accent: '#ff9800',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#212121',
        textSecondary: '#757575',
        error: '#f44336',
        warning: '#ff9800',
        success: '#4caf50',
        info: '#2196f3',
      },
      fonts: {
        primary: 'Roboto',
        secondary: 'Open Sans',
        heading: 'Roboto',
        body: 'Open Sans',
        monospace: 'Consolas',
      },
      customDomain: 'app.example.com',
      customEmailDomain: 'example.com',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getWhiteLabelConfig(configId: string): Promise<WhiteLabelConfig | null> {
    // Simulate config retrieval
    return {
      id: configId,
      organizationId: 'org_123',
      productName: 'Enterprise AI Assistant',
      companyName: 'Example Corp',
      supportEmail: 'support@example.com',
      supportPhone: '+1-555-0123',
      website: 'https://example.com',
      termsOfService: 'https://example.com/terms',
      privacyPolicy: 'https://example.com/privacy',
      customCss: '.custom-brand { color: #1976d2; }',
      customJs: 'console.log("Custom branding loaded");',
      features: [
        { name: 'custom_domain', enabled: true },
        { name: 'custom_email', enabled: true },
        { name: 'custom_branding', enabled: true },
        { name: 'advanced_analytics', enabled: false },
      ],
      status: 'active',
    };
  }

  async getBrandingAssets(organizationId: string): Promise<BrandingAsset[]> {
    const config = await this.getBrandingConfig(`branding_${organizationId}`);
    
    if (!config) {
      return [];
    }

    return [config.logo, config.favicon];
  }

  async validateCustomDomain(domain: string): Promise<{ valid: boolean; message?: string }> {
    // Simulate domain validation
    const validDomains = ['example.com', 'test.com', 'demo.com'];
    const isValid = validDomains.some(validDomain => domain.endsWith(validDomain));

    return {
      valid: isValid,
      message: isValid ? undefined : 'Domain not allowed for white-labeling',
    };
  }

  async generateBrandingPreview(configId: string): Promise<{ previewUrl: string; expiresAt: Date }> {
    // Simulate preview generation
    const previewUrl = `https://preview.example.com/branding/${configId}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.auditLogRepository.save({
      action: 'branding_preview_generated',
      resource: 'branding_config',
      resourceId: configId,
      details: { previewUrl, expiresAt },
      timestamp: new Date(),
    });

    return { previewUrl, expiresAt };
  }
}
