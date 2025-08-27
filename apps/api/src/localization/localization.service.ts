import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface LanguagePack {
  id: string;
  language: string;
  locale: string;
  name: string;
  isActive: boolean;
  translations: Record<string, string>;
  metadata: {
    version: string;
    lastUpdated: Date;
    completeness: number; // Percentage of translations covered
  };
}

export interface TranslationKey {
  key: string;
  category: string;
  description?: string;
  context?: string;
}

@Injectable()
export class LocalizationService {
  private readonly logger = new Logger(LocalizationService.name);

  // Supported languages
  private readonly supportedLanguages = [
    { code: 'en', locale: 'en-US', name: 'English (US)' },
    { code: 'es', locale: 'es-ES', name: 'Spanish' },
    { code: 'fr', locale: 'fr-FR', name: 'French' },
    { code: 'de', locale: 'de-DE', name: 'German' },
    { code: 'it', locale: 'it-IT', name: 'Italian' },
    { code: 'pt', locale: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ja', locale: 'ja-JP', name: 'Japanese' },
    { code: 'ko', locale: 'ko-KR', name: 'Korean' },
    { code: 'zh', locale: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'ar', locale: 'ar-SA', name: 'Arabic' },
    { code: 'hi', locale: 'hi-IN', name: 'Hindi' },
    { code: 'ru', locale: 'ru-RU', name: 'Russian' },
  ];

  // Default English translations
  private readonly defaultTranslations: Record<string, string> = {
    // Common UI elements
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Information',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.refresh': 'Refresh',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.agents': 'Agents',
    'nav.conversations': 'Conversations',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    'nav.help': 'Help',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',

    // Agent management
    'agents.title': 'AI Agents',
    'agents.create': 'Create Agent',
    'agents.edit': 'Edit Agent',
    'agents.delete': 'Delete Agent',
    'agents.name': 'Agent Name',
    'agents.description': 'Description',
    'agents.status': 'Status',
    'agents.channel': 'Channel',
    'agents.config': 'Configuration',
    'agents.versions': 'Versions',
    'agents.deploy': 'Deploy',
    'agents.test': 'Test',
    'agents.duplicate': 'Duplicate',

    // Conversation management
    'conversations.title': 'Conversations',
    'conversations.customer': 'Customer',
    'conversations.agent': 'Agent',
    'conversations.status': 'Status',
    'conversations.priority': 'Priority',
    'conversations.channel': 'Channel',
    'conversations.started': 'Started',
    'conversations.lastMessage': 'Last Message',
    'conversations.satisfaction': 'Satisfaction',
    'conversations.handoff': 'Handoff',
    'conversations.escalate': 'Escalate',

    // Analytics
    'analytics.title': 'Analytics',
    'analytics.overview': 'Overview',
    'analytics.conversations': 'Conversations',
    'analytics.messages': 'Messages',
    'analytics.satisfaction': 'Satisfaction',
    'analytics.responseTime': 'Response Time',
    'analytics.costs': 'Costs',
    'analytics.usage': 'Usage',
    'analytics.trends': 'Trends',
    'analytics.period': 'Period',
    'analytics.today': 'Today',
    'analytics.week': 'This Week',
    'analytics.month': 'This Month',
    'analytics.year': 'This Year',

    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.organization': 'Organization',
    'settings.security': 'Security',
    'settings.notifications': 'Notifications',
    'settings.billing': 'Billing',
    'settings.integrations': 'Integrations',
    'settings.language': 'Language',
    'settings.timezone': 'Timezone',
    'settings.theme': 'Theme',
    'settings.advanced': 'Advanced',

    // Authentication
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.register': 'Register',
    'auth.forgotPassword': 'Forgot Password',
    'auth.resetPassword': 'Reset Password',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.rememberMe': 'Remember Me',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.signOut': 'Sign Out',

    // Errors
    'error.404': 'Page not found',
    'error.500': 'Internal server error',
    'error.network': 'Network error',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Forbidden',
    'error.validation': 'Validation error',
    'error.unknown': 'Unknown error occurred',

    // Success messages
    'success.saved': 'Successfully saved',
    'success.created': 'Successfully created',
    'success.updated': 'Successfully updated',
    'success.deleted': 'Successfully deleted',
    'success.uploaded': 'Successfully uploaded',

    // Form validation
    'validation.required': 'This field is required',
    'validation.email': 'Please enter a valid email address',
    'validation.minLength': 'Minimum length is {min} characters',
    'validation.maxLength': 'Maximum length is {max} characters',
    'validation.passwordMatch': 'Passwords do not match',
    'validation.unique': 'This value must be unique',

    // Date and time
    'date.today': 'Today',
    'date.yesterday': 'Yesterday',
    'date.tomorrow': 'Tomorrow',
    'date.thisWeek': 'This Week',
    'date.lastWeek': 'Last Week',
    'date.thisMonth': 'This Month',
    'date.lastMonth': 'Last Month',
    'date.thisYear': 'This Year',
    'date.lastYear': 'Last Year',
    'time.ago': '{time} ago',
    'time.in': 'in {time}',
    'time.now': 'now',
    'time.minutes': 'minutes',
    'time.hours': 'hours',
    'time.days': 'days',
    'time.weeks': 'weeks',
    'time.months': 'months',
    'time.years': 'years',

    // Status
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.pending': 'Pending',
    'status.completed': 'Completed',
    'status.failed': 'Failed',
    'status.cancelled': 'Cancelled',
    'status.draft': 'Draft',
    'status.published': 'Published',
    'status.archived': 'Archived',

    // Priority
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',

    // Channels
    'channel.web': 'Web Chat',
    'channel.email': 'Email',
    'channel.slack': 'Slack',
    'channel.whatsapp': 'WhatsApp',
    'channel.voice': 'Voice',
    'channel.sms': 'SMS',

    // Agent status
    'agent.status.draft': 'Draft',
    'agent.status.active': 'Active',
    'agent.status.inactive': 'Inactive',
    'agent.status.archived': 'Archived',

    // Conversation status
    'conversation.status.active': 'Active',
    'conversation.status.resolved': 'Resolved',
    'conversation.status.escalated': 'Escalated',
    'conversation.status.closed': 'Closed',

    // Handoff status
    'handoff.status.pending': 'Pending',
    'handoff.status.accepted': 'Accepted',
    'handoff.status.completed': 'Completed',
    'handoff.status.cancelled': 'Cancelled',
  };

  constructor() {}

  async getLanguagePack(language: string): Promise<LanguagePack> {
    // This would load from database or file system
    // For now, return English as default
    return {
      id: `lang-${language}`,
      language,
      locale: this.getLocaleForLanguage(language),
      name: this.getLanguageName(language),
      isActive: true,
      translations: this.getTranslationsForLanguage(language),
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date(),
        completeness: 100,
      },
    };
  }

  async translate(key: string, language: string, params?: Record<string, any>): Promise<string> {
    const languagePack = await this.getLanguagePack(language);
    let translation = languagePack.translations[key] || this.defaultTranslations[key] || key;

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }

    return translation;
  }

  async getSupportedLanguages(): Promise<Array<{ code: string; locale: string; name: string }>> {
    return this.supportedLanguages;
  }

  async detectLanguage(text: string): Promise<string> {
    // This would use a language detection library
    // For now, return English as default
    return 'en';
  }

  async updateLanguagePack(language: string, translations: Record<string, string>): Promise<void> {
    this.logger.log(`Updating language pack for ${language}`);
    // This would update the database or file system
  }

  async createLanguagePack(language: string, translations: Record<string, string>): Promise<LanguagePack> {
    const languagePack: LanguagePack = {
      id: `lang-${language}`,
      language,
      locale: this.getLocaleForLanguage(language),
      name: this.getLanguageName(language),
      isActive: true,
      translations,
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date(),
        completeness: this.calculateCompleteness(translations),
      },
    };

    this.logger.log(`Created language pack for ${language}`);
    return languagePack;
  }

  async getMissingTranslations(language: string): Promise<string[]> {
    const languagePack = await this.getLanguagePack(language);
    const missingKeys: string[] = [];

    Object.keys(this.defaultTranslations).forEach(key => {
      if (!languagePack.translations[key]) {
        missingKeys.push(key);
      }
    });

    return missingKeys;
  }

  private getLocaleForLanguage(language: string): string {
    const lang = this.supportedLanguages.find(l => l.code === language);
    return lang?.locale || 'en-US';
  }

  private getLanguageName(language: string): string {
    const lang = this.supportedLanguages.find(l => l.code === language);
    return lang?.name || 'English (US)';
  }

  private getTranslationsForLanguage(language: string): Record<string, string> {
    // This would load actual translations for the language
    // For now, return empty object (will fall back to English)
    return {};
  }

  private calculateCompleteness(translations: Record<string, string>): number {
    const totalKeys = Object.keys(this.defaultTranslations).length;
    const translatedKeys = Object.keys(translations).length;
    return Math.round((translatedKeys / totalKeys) * 100);
  }
}
