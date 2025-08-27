import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { TerminusModule } from '@nestjs/terminus';

import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { MembershipsModule } from './memberships/memberships.module';
import { AgentsModule } from './agents/agents.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { DeploymentsModule } from './deployments/deployments.module';
import { ConversationsModule } from './conversations/conversations.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { FlowsModule } from './flows/flows.module';
import { PoliciesModule } from './policies/policies.module';
import { ToolsModule } from './tools/tools.module';
import { GuardrailsModule } from './guardrails/guardrails.module';
import { PromptsModule } from './prompts/prompts.module';
import { MetricsModule } from './metrics/metrics.module';
import { KpiModule } from './kpi/kpi.module';
import { RoutingModule } from './routing/routing.module';
import { DatasetsModule } from './datasets/datasets.module';
import { EvalsModule } from './evals/evals.module';
import { AuditModule } from './audit/audit.module';
import { PrivacyModule } from './privacy/privacy.module';
import { BudgetsModule } from './budgets/budgets.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { VoiceModule } from './voice/voice.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { SharesModule } from './shares/shares.module';
import { ExportsModule } from './exports/exports.module';
import { ApiKeysModule } from './apikeys/apikeys.module';
import { SettingsModule } from './settings/settings.module';
import { FlagsModule } from './flags/flags.module';
import { GithubModule } from './github/github.module';
import { BillingModule } from './billing/billing.module';

import { DatabaseConfig } from './config/database.config';
import { BullConfig } from './config/bull.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env'] }),
    TypeOrmModule.forRootAsync({ useClass: DatabaseConfig }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }, { ttl: 3600000, limit: 1000 }]),
    BullModule.forRootAsync({ useClass: BullConfig }),
    TerminusModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    MembershipsModule,
    AgentsModule,
    KnowledgeModule,
    DeploymentsModule,
    ConversationsModule,
    AnalyticsModule,
    HealthModule,
    FlowsModule,
    PoliciesModule,
    ToolsModule,
    GuardrailsModule,
    PromptsModule,
    MetricsModule,
    KpiModule,
    RoutingModule,
    DatasetsModule,
    EvalsModule,
    AuditModule,
    PrivacyModule,
    BudgetsModule,
    WebhooksModule,
    VoiceModule,
    ConnectorsModule,
    SharesModule,
    ExportsModule,
    ApiKeysModule,
    SettingsModule,
    FlagsModule,
    GithubModule,
    BillingModule,
  ],
})
export class AppModule {}
