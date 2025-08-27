import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Organizations } from '../database/entities/organizations.entity';
import { Users } from '../database/entities/users.entity';
import { Agents } from '../database/entities/agents.entity';
import { Conversations } from '../database/entities/conversations.entity';
import { Messages } from '../database/entities/messages.entity';
import { Connectors } from '../database/entities/connectors.entity';
import { ApiKeys } from '../database/entities/api-keys.entity';
import { Deployments } from '../database/entities/deployments.entity';
import { KnowledgeCollections } from '../database/entities/knowledge-collections.entity';
import { EvalRuns } from '../database/entities/eval-runs.entity';
import { AuditLogs } from '../database/entities/audit-logs.entity';
import { BillingUsage } from '../database/entities/billing-usage.entity';

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental' | 'point-in-time';
  size: number;
  checksum: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  tables: string[];
  organizationId?: string;
  retentionDays: number;
  compressionRatio?: number;
  encryptionKey?: string;
}

export interface RestoreRequest {
  backupId: string;
  targetOrganizationId?: string;
  tables?: string[];
  pointInTime?: Date;
  validateOnly?: boolean;
  dryRun?: boolean;
}

export interface RestoreResult {
  success: boolean;
  backupId: string;
  restoredTables: string[];
  restoredRecords: number;
  validationErrors?: string[];
  warnings?: string[];
  duration: number;
  pointInTime?: Date;
}

export interface BackupValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  integrityChecks: {
    checksumValid: boolean;
    structureValid: boolean;
    dataValid: boolean;
  };
  metadata: {
    backupSize: number;
    recordCount: number;
    tableCount: number;
    compressionRatio: number;
  };
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    @InjectRepository(Organizations)
    private organizationsRepo: Repository<Organizations>,
    @InjectRepository(Users)
    private usersRepo: Repository<Users>,
    @InjectRepository(Agents)
    private agentsRepo: Repository<Agents>,
    @InjectRepository(Conversations)
    private conversationsRepo: Repository<Conversations>,
    @InjectRepository(Messages)
    private messagesRepo: Repository<Messages>,
    @InjectRepository(Connectors)
    private connectorsRepo: Repository<Connectors>,
    @InjectRepository(ApiKeys)
    private apiKeysRepo: Repository<ApiKeys>,
    @InjectRepository(Deployments)
    private deploymentsRepo: Repository<Deployments>,
    @InjectRepository(KnowledgeCollections)
    private knowledgeCollectionsRepo: Repository<KnowledgeCollections>,
    @InjectRepository(EvalRuns)
    private evalRunsRepo: Repository<EvalRuns>,
    @InjectRepository(AuditLogs)
    private auditLogsRepo: Repository<AuditLogs>,
    @InjectRepository(BillingUsage)
    private billingUsageRepo: Repository<BillingUsage>,
  ) {}

  // Scheduled backup jobs
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledFullBackup() {
    this.logger.log('Starting scheduled full backup');
    await this.createFullBackup();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledIncrementalBackup() {
    this.logger.log('Starting scheduled incremental backup');
    await this.createIncrementalBackup();
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledBackupValidation() {
    this.logger.log('Starting scheduled backup validation');
    await this.validateRecentBackups();
  }

  @Cron(CronExpression.EVERY_WEEK)
  async scheduledBackupCleanup() {
    this.logger.log('Starting scheduled backup cleanup');
    await this.cleanupExpiredBackups();
  }

  async createFullBackup(organizationId?: string): Promise<BackupMetadata> {
    const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      this.logger.log(`Starting full backup: ${backupId}`);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        type: 'full',
        size: 0,
        checksum: '',
        status: 'in_progress',
        tables: [],
        organizationId,
        retentionDays: 30,
      };

      // Define backup order (dependencies first)
      const backupOrder = [
        'organizations',
        'users',
        'memberships',
        'agents',
        'agent_versions',
        'conversations',
        'messages',
        'handoff_requests',
        'connectors',
        'api_keys',
        'deployments',
        'knowledge_collections',
        'knowledge_documents',
        'eval_runs',
        'audit_logs',
        'billing_usage',
      ];

      const backupData: Record<string, any[]> = {};

      for (const table of backupOrder) {
        if (organizationId && this.isOrganizationSpecificTable(table)) {
          backupData[table] = await this.backupTableWithOrgFilter(table, organizationId);
        } else {
          backupData[table] = await this.backupTable(table);
        }
        metadata.tables.push(table);
      }

      // Compress and encrypt backup data
      const compressedData = await this.compressBackupData(backupData);
      const encryptedData = await this.encryptBackupData(compressedData);
      
      // Calculate checksum
      metadata.checksum = await this.calculateChecksum(encryptedData);
      metadata.size = encryptedData.length;
      metadata.compressionRatio = compressedData.length / JSON.stringify(backupData).length;

      // Store backup
      await this.storeBackup(backupId, encryptedData, metadata);

      metadata.status = 'completed';
      const duration = Date.now() - startTime;
      this.logger.log(`Full backup completed: ${backupId} (${duration}ms)`);

      return metadata;
    } catch (error) {
      this.logger.error(`Full backup failed: ${backupId}`, error);
      throw error;
    }
  }

  async createIncrementalBackup(organizationId?: string, since?: Date): Promise<BackupMetadata> {
    const backupId = `incremental-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const sinceDate = since || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago

    try {
      this.logger.log(`Starting incremental backup: ${backupId} since ${sinceDate}`);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        type: 'incremental',
        size: 0,
        checksum: '',
        status: 'in_progress',
        tables: [],
        organizationId,
        retentionDays: 7,
      };

      const backupData: Record<string, any[]> = {};

      // Backup only changed records since last backup
      const tablesWithTimestamps = [
        'conversations',
        'messages',
        'handoff_requests',
        'audit_logs',
        'billing_usage',
      ];

      for (const table of tablesWithTimestamps) {
        if (organizationId && this.isOrganizationSpecificTable(table)) {
          backupData[table] = await this.backupTableIncremental(table, organizationId, sinceDate);
        } else {
          backupData[table] = await this.backupTableIncremental(table, undefined, sinceDate);
        }
        if (backupData[table].length > 0) {
          metadata.tables.push(table);
        }
      }

      if (metadata.tables.length === 0) {
        this.logger.log(`No changes detected for incremental backup: ${backupId}`);
        metadata.status = 'completed';
        return metadata;
      }

      // Compress and encrypt backup data
      const compressedData = await this.compressBackupData(backupData);
      const encryptedData = await this.encryptBackupData(compressedData);
      
      metadata.checksum = await this.calculateChecksum(encryptedData);
      metadata.size = encryptedData.length;
      metadata.compressionRatio = compressedData.length / JSON.stringify(backupData).length;

      // Store backup
      await this.storeBackup(backupId, encryptedData, metadata);

      metadata.status = 'completed';
      const duration = Date.now() - startTime;
      this.logger.log(`Incremental backup completed: ${backupId} (${duration}ms)`);

      return metadata;
    } catch (error) {
      this.logger.error(`Incremental backup failed: ${backupId}`, error);
      throw error;
    }
  }

  async restoreBackup(request: RestoreRequest): Promise<RestoreResult> {
    const startTime = Date.now();
    const { backupId, targetOrganizationId, tables, pointInTime, validateOnly, dryRun } = request;

    try {
      this.logger.log(`Starting restore: ${backupId}`);

      // Load backup metadata and data
      const { metadata, data } = await this.loadBackup(backupId);
      
      // Validate backup integrity
      const validation = await this.validateBackup(backupId);
      if (!validation.isValid) {
        throw new Error(`Backup validation failed: ${validation.errors.join(', ')}`);
      }

      if (validateOnly) {
        return {
          success: true,
          backupId,
          restoredTables: [],
          restoredRecords: 0,
          duration: Date.now() - startTime,
        };
      }

      // Filter tables if specified
      const tablesToRestore = tables || metadata.tables;
      const filteredData = this.filterBackupData(data, tablesToRestore);

      // Apply point-in-time recovery if specified
      let finalData = filteredData;
      if (pointInTime) {
        finalData = await this.applyPointInTimeRecovery(filteredData, pointInTime);
      }

      // Transform data for target organization if specified
      if (targetOrganizationId && metadata.organizationId) {
        finalData = await this.transformDataForOrganization(finalData, metadata.organizationId, targetOrganizationId);
      }

      if (dryRun) {
        const recordCount = Object.values(finalData).reduce((sum, records) => sum + records.length, 0);
        return {
          success: true,
          backupId,
          restoredTables: tablesToRestore,
          restoredRecords: recordCount,
          duration: Date.now() - startTime,
          pointInTime,
        };
      }

      // Restore data in dependency order
      const restoreOrder = [
        'organizations',
        'users',
        'memberships',
        'agents',
        'agent_versions',
        'conversations',
        'messages',
        'handoff_requests',
        'connectors',
        'api_keys',
        'deployments',
        'knowledge_collections',
        'knowledge_documents',
        'eval_runs',
        'audit_logs',
        'billing_usage',
      ];

      const restoredTables: string[] = [];
      let totalRecords = 0;

      for (const table of restoreOrder) {
        if (finalData[table] && finalData[table].length > 0) {
          await this.restoreTable(table, finalData[table]);
          restoredTables.push(table);
          totalRecords += finalData[table].length;
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Restore completed: ${backupId} (${duration}ms)`);

      return {
        success: true,
        backupId,
        restoredTables,
        restoredRecords: totalRecords,
        duration,
        pointInTime,
      };
    } catch (error) {
      this.logger.error(`Restore failed: ${backupId}`, error);
      throw error;
    }
  }

  async validateBackup(backupId: string): Promise<BackupValidation> {
    try {
      const { metadata, data } = await this.loadBackup(backupId);
      
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate checksum
      const expectedChecksum = metadata.checksum;
      const actualChecksum = await this.calculateChecksum(data);
      const checksumValid = expectedChecksum === actualChecksum;

      if (!checksumValid) {
        errors.push('Backup checksum validation failed');
      }

      // Validate structure
      const structureValid = this.validateBackupStructure(data, metadata.tables);
      if (!structureValid) {
        errors.push('Backup structure validation failed');
      }

      // Validate data integrity
      const dataValid = await this.validateBackupData(data);
      if (!dataValid) {
        errors.push('Backup data validation failed');
      }

      // Calculate metadata
      const backupSize = data.length;
      const recordCount = Object.values(data).reduce((sum, records) => sum + records.length, 0);
      const tableCount = Object.keys(data).length;
      const compressionRatio = metadata.compressionRatio || 1;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        integrityChecks: {
          checksumValid,
          structureValid,
          dataValid,
        },
        metadata: {
          backupSize,
          recordCount,
          tableCount,
          compressionRatio,
        },
      };
    } catch (error) {
      this.logger.error(`Backup validation failed: ${backupId}`, error);
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
        integrityChecks: {
          checksumValid: false,
          structureValid: false,
          dataValid: false,
        },
        metadata: {
          backupSize: 0,
          recordCount: 0,
          tableCount: 0,
          compressionRatio: 1,
        },
      };
    }
  }

  async listBackups(organizationId?: string, type?: string): Promise<BackupMetadata[]> {
    // This would query the backup storage system
    // For now, return stub data
    return [
      {
        id: 'backup-1234567890',
        timestamp: new Date(),
        type: 'full',
        size: 1024000,
        checksum: 'sha256:abc123...',
        status: 'completed',
        tables: ['organizations', 'users', 'agents'],
        retentionDays: 30,
        compressionRatio: 0.8,
      },
    ];
  }

  async deleteBackup(backupId: string): Promise<void> {
    this.logger.log(`Deleting backup: ${backupId}`);
    // This would delete from backup storage
    // For now, just log the action
  }

  // Private helper methods
  private async backupTable(table: string): Promise<any[]> {
    const repo = this.getRepositoryForTable(table);
    if (!repo) {
      throw new Error(`No repository found for table: ${table}`);
    }
    return repo.find();
  }

  private async backupTableWithOrgFilter(table: string, organizationId: string): Promise<any[]> {
    const repo = this.getRepositoryForTable(table);
    if (!repo) {
      throw new Error(`No repository found for table: ${table}`);
    }
    return repo.find({ where: { organizationId } });
  }

  private async backupTableIncremental(table: string, organizationId?: string, since?: Date): Promise<any[]> {
    const repo = this.getRepositoryForTable(table);
    if (!repo) {
      throw new Error(`No repository found for table: ${table}`);
    }

    const where: any = {};
    if (organizationId) {
      where.organizationId = organizationId;
    }
    if (since) {
      where.updatedAt = { $gte: since };
    }

    return repo.find({ where });
  }

  private getRepositoryForTable(table: string): Repository<any> | null {
    const repoMap: Record<string, Repository<any>> = {
      organizations: this.organizationsRepo,
      users: this.usersRepo,
      agents: this.agentsRepo,
      conversations: this.conversationsRepo,
      messages: this.messagesRepo,
      connectors: this.connectorsRepo,
      api_keys: this.apiKeysRepo,
      deployments: this.deploymentsRepo,
      knowledge_collections: this.knowledgeCollectionsRepo,
      eval_runs: this.evalRunsRepo,
      audit_logs: this.auditLogsRepo,
      billing_usage: this.billingUsageRepo,
    };
    return repoMap[table] || null;
  }

  private isOrganizationSpecificTable(table: string): boolean {
    const orgSpecificTables = [
      'agents',
      'conversations',
      'messages',
      'handoff_requests',
      'connectors',
      'api_keys',
      'deployments',
      'knowledge_collections',
      'knowledge_documents',
      'eval_runs',
      'audit_logs',
      'billing_usage',
    ];
    return orgSpecificTables.includes(table);
  }

  private async compressBackupData(data: Record<string, any[]>): Promise<Buffer> {
    // This would use a compression library like zlib
    // For now, return JSON string as buffer
    return Buffer.from(JSON.stringify(data));
  }

  private async encryptBackupData(data: Buffer): Promise<Buffer> {
    // This would use encryption
    // For now, return data as-is
    return data;
  }

  private async calculateChecksum(data: Buffer): Promise<string> {
    // This would calculate SHA-256 checksum
    // For now, return a stub checksum
    return `sha256:${data.length.toString(16)}`;
  }

  private async storeBackup(backupId: string, data: Buffer, metadata: BackupMetadata): Promise<void> {
    // This would store to S3, local filesystem, etc.
    // For now, just log the action
    this.logger.log(`Storing backup: ${backupId} (${data.length} bytes)`);
  }

  private async loadBackup(backupId: string): Promise<{ metadata: BackupMetadata; data: Record<string, any[]> }> {
    // This would load from storage
    // For now, return stub data
    return {
      metadata: {
        id: backupId,
        timestamp: new Date(),
        type: 'full',
        size: 1024,
        checksum: 'sha256:abc123',
        status: 'completed',
        tables: ['organizations', 'users'],
        retentionDays: 30,
      },
      data: {
        organizations: [],
        users: [],
      },
    };
  }

  private filterBackupData(data: Record<string, any[]>, tables: string[]): Record<string, any[]> {
    const filtered: Record<string, any[]> = {};
    for (const table of tables) {
      if (data[table]) {
        filtered[table] = data[table];
      }
    }
    return filtered;
  }

  private async applyPointInTimeRecovery(data: Record<string, any[]>, pointInTime: Date): Promise<Record<string, any[]>> {
    // This would apply point-in-time recovery logic
    // For now, return data as-is
    return data;
  }

  private async transformDataForOrganization(
    data: Record<string, any[]>,
    sourceOrgId: string,
    targetOrgId: string,
  ): Promise<Record<string, any[]>> {
    // This would transform organization-specific data
    // For now, return data as-is
    return data;
  }

  private async restoreTable(table: string, records: any[]): Promise<void> {
    const repo = this.getRepositoryForTable(table);
    if (!repo) {
      throw new Error(`No repository found for table: ${table}`);
    }
    
    // Clear existing data and insert backup data
    await repo.clear();
    if (records.length > 0) {
      await repo.save(records);
    }
  }

  private validateBackupStructure(data: Record<string, any[]>, expectedTables: string[]): boolean {
    const actualTables = Object.keys(data);
    return expectedTables.every(table => actualTables.includes(table));
  }

  private async validateBackupData(data: Record<string, any[]>): Promise<boolean> {
    // This would perform data integrity checks
    // For now, return true
    return true;
  }

  private async validateRecentBackups(): Promise<void> {
    const recentBackups = await this.listBackups();
    for (const backup of recentBackups) {
      if (backup.status === 'completed') {
        await this.validateBackup(backup.id);
      }
    }
  }

  private async cleanupExpiredBackups(): Promise<void> {
    const allBackups = await this.listBackups();
    const now = new Date();
    
    for (const backup of allBackups) {
      const ageInDays = (now.getTime() - backup.timestamp.getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays > backup.retentionDays) {
        await this.deleteBackup(backup.id);
      }
    }
  }
}
