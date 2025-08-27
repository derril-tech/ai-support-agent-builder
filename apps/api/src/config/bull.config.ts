import { Injectable } from '@nestjs/common';
import { BullRootModuleOptions, SharedBullConfigurationFactory } from '@nestjs/bull';

@Injectable()
export class BullConfig implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullRootModuleOptions {
    return {
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
      prefix: 'ai-support-agent',
    };
  }
}

