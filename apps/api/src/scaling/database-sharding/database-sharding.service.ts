// Created automatically by Cursor AI (2024-12-19)

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface DatabaseShard {
  id: string;
  name: string;
  type: 'primary' | 'replica' | 'read_only';
  host: string;
  port: number;
  database: string;
  username: string;
  status: 'active' | 'inactive' | 'maintenance' | 'failed';
  region: string;
  shardKey: string; // For sharded databases
  connectionPool: {
    min: number;
    max: number;
    current: number;
  };
  metrics: {
    queriesPerSecond: number;
    averageResponseTime: number;
    activeConnections: number;
    replicationLag: number; // seconds
    diskUsage: number; // percentage
    cpuUsage: number; // percentage
  };
  createdAt: Date;
  lastHealthCheck: Date;
}

export interface ShardingStrategy {
  id: string;
  name: string;
  type: 'hash' | 'range' | 'list' | 'directory';
  shardKey: string;
  shardCount: number;
  distribution: 'uniform' | 'weighted' | 'custom';
  rebalancingEnabled: boolean;
  autoSharding: boolean;
}

export interface ReadReplica {
  id: string;
  name: string;
  primaryShardId: string;
  host: string;
  port: number;
  status: 'active' | 'inactive' | 'syncing' | 'failed';
  replicationLag: number; // seconds
  readCapacity: number; // queries per second
  region: string;
  createdAt: Date;
}

export interface ShardingMetrics {
  totalShards: number;
  activeShards: number;
  totalReplicas: number;
  activeReplicas: number;
  averageReplicationLag: number;
  totalQueriesPerSecond: number;
  averageResponseTime: number;
  shardDistribution: Record<string, number>;
  hotShards: string[];
  coldShards: string[];
}

@Injectable()
export class DatabaseShardingService {
  private readonly logger = new Logger(DatabaseShardingService.name);
  private shards: Map<string, DatabaseShard> = new Map();
  private replicas: Map<string, ReadReplica> = new Map();
  private shardingStrategies: Map<string, ShardingStrategy> = new Map();

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {
    this.initializeShards();
    this.startHealthChecks();
  }

  // Shard Management
  async createShard(shardData: Omit<DatabaseShard, 'id' | 'status' | 'connectionPool' | 'metrics' | 'createdAt' | 'lastHealthCheck'>): Promise<DatabaseShard> {
    const shard: DatabaseShard = {
      ...shardData,
      id: `shard_${Date.now()}`,
      status: 'active',
      connectionPool: {
        min: 5,
        max: 20,
        current: 0,
      },
      metrics: {
        queriesPerSecond: 0,
        averageResponseTime: 0,
        activeConnections: 0,
        replicationLag: 0,
        diskUsage: 0,
        cpuUsage: 0,
      },
      createdAt: new Date(),
      lastHealthCheck: new Date(),
    };

    this.shards.set(shard.id, shard);
    await this.logShardCreated(shard);
    
    return shard;
  }

  async removeShard(shardId: string): Promise<void> {
    const shard = this.shards.get(shardId);
    if (shard) {
      this.shards.delete(shardId);
      await this.logShardRemoved(shard);
    }
  }

  async updateShardStatus(shardId: string, status: DatabaseShard['status']): Promise<void> {
    const shard = this.shards.get(shardId);
    if (shard) {
      shard.status = status;
      shard.lastHealthCheck = new Date();
      await this.logShardStatusUpdated(shard);
    }
  }

  // Read Replica Management
  async createReadReplica(replicaData: Omit<ReadReplica, 'id' | 'status' | 'replicationLag' | 'readCapacity' | 'createdAt'>): Promise<ReadReplica> {
    const replica: ReadReplica = {
      ...replicaData,
      id: `replica_${Date.now()}`,
      status: 'syncing',
      replicationLag: 0,
      readCapacity: 1000, // Default capacity
      createdAt: new Date(),
    };

    this.replicas.set(replica.id, replica);
    await this.logReplicaCreated(replica);
    
    // Start replication sync
    await this.startReplicationSync(replica);
    
    return replica;
  }

  async removeReadReplica(replicaId: string): Promise<void> {
    const replica = this.replicas.get(replicaId);
    if (replica) {
      this.replicas.delete(replicaId);
      await this.logReplicaRemoved(replica);
    }
  }

  // Sharding Strategy Management
  async createShardingStrategy(strategyData: Omit<ShardingStrategy, 'id'>): Promise<ShardingStrategy> {
    const strategy: ShardingStrategy = {
      ...strategyData,
      id: `strategy_${Date.now()}`,
    };

    this.shardingStrategies.set(strategy.id, strategy);
    await this.logShardingStrategyCreated(strategy);
    
    return strategy;
  }

  async updateShardingStrategy(strategyId: string, updates: Partial<ShardingStrategy>): Promise<ShardingStrategy> {
    const strategy = this.shardingStrategies.get(strategyId);
    if (strategy) {
      Object.assign(strategy, updates);
      await this.logShardingStrategyUpdated(strategy);
    }
    return strategy;
  }

  // Query Routing
  async routeQuery(query: {
    sql: string;
    operation: 'read' | 'write' | 'delete' | 'update';
    table: string;
    shardKey?: string;
    shardValue?: any;
    useReplica?: boolean;
  }): Promise<{
    shard: DatabaseShard;
    replica?: ReadReplica;
    routingMethod: string;
    estimatedCost: number;
  }> {
    let targetShard: DatabaseShard;
    let replica: ReadReplica | undefined;
    let routingMethod: string;

    // Determine target shard
    if (query.shardKey && query.shardValue) {
      targetShard = this.getShardByKey(query.shardKey, query.shardValue);
      routingMethod = 'shard_key';
    } else {
      targetShard = this.selectShardByLoad(query.operation);
      routingMethod = 'load_balanced';
    }

    // For read operations, consider using replicas
    if (query.operation === 'read' && query.useReplica !== false) {
      replica = this.selectReadReplica(targetShard.id);
      if (replica && replica.status === 'active' && replica.replicationLag < 5) {
        routingMethod = 'read_replica';
      }
    }

    const estimatedCost = this.estimateQueryCost(query, targetShard, replica);

    await this.logQueryRouted(query, targetShard, replica, routingMethod, estimatedCost);

    return {
      shard: targetShard,
      replica,
      routingMethod,
      estimatedCost,
    };
  }

  // Shard Selection Algorithms
  private getShardByKey(shardKey: string, shardValue: any): DatabaseShard {
    // Hash-based sharding
    const hash = this.hashValue(shardValue);
    const activeShards = Array.from(this.shards.values()).filter(s => s.status === 'active');
    const shardIndex = hash % activeShards.length;
    
    return activeShards[shardIndex];
  }

  private selectShardByLoad(operation: string): DatabaseShard {
    const activeShards = Array.from(this.shards.values()).filter(s => s.status === 'active');
    
    if (operation === 'read') {
      // For reads, prefer shards with lower load
      return activeShards.reduce((min, shard) => 
        shard.metrics.activeConnections < min.metrics.activeConnections ? shard : min
      );
    } else {
      // For writes, use round-robin among primary shards
      const primaryShards = activeShards.filter(s => s.type === 'primary');
      const index = Math.floor(Math.random() * primaryShards.length);
      return primaryShards[index];
    }
  }

  private selectReadReplica(primaryShardId: string): ReadReplica | undefined {
    const availableReplicas = Array.from(this.replicas.values())
      .filter(r => r.primaryShardId === primaryShardId && r.status === 'active')
      .sort((a, b) => a.replicationLag - b.replicationLag);
    
    return availableReplicas[0];
  }

  // Auto-sharding and Rebalancing
  async autoShard(): Promise<void> {
    this.logger.log('Starting auto-sharding process');

    const metrics = await this.getShardingMetrics();
    const hotShards = metrics.hotShards;
    const coldShards = metrics.coldShards;

    // If we have hot shards, consider splitting them
    for (const hotShardId of hotShards) {
      await this.splitHotShard(hotShardId);
    }

    // If we have cold shards, consider merging them
    if (coldShards.length > 1) {
      await this.mergeColdShards(coldShards);
    }

    // Rebalance data across shards
    await this.rebalanceShards();
  }

  async rebalanceShards(): Promise<void> {
    this.logger.log('Starting shard rebalancing');

    const shards = Array.from(this.shards.values());
    const totalLoad = shards.reduce((sum, shard) => sum + shard.metrics.queriesPerSecond, 0);
    const targetLoadPerShard = totalLoad / shards.length;

    for (const shard of shards) {
      const currentLoad = shard.metrics.queriesPerSecond;
      const loadDifference = currentLoad - targetLoadPerShard;

      if (Math.abs(loadDifference) > targetLoadPerShard * 0.2) { // 20% threshold
        await this.rebalanceShard(shard, loadDifference);
      }
    }
  }

  // Monitoring and Metrics
  async getShardingMetrics(): Promise<ShardingMetrics> {
    const shards = Array.from(this.shards.values());
    const replicas = Array.from(this.replicas.values());

    const totalShards = shards.length;
    const activeShards = shards.filter(s => s.status === 'active').length;
    const totalReplicas = replicas.length;
    const activeReplicas = replicas.filter(r => r.status === 'active').length;

    const averageReplicationLag = replicas.length > 0 
      ? replicas.reduce((sum, r) => sum + r.replicationLag, 0) / replicas.length 
      : 0;

    const totalQueriesPerSecond = shards.reduce((sum, s) => sum + s.metrics.queriesPerSecond, 0);
    const averageResponseTime = shards.length > 0 
      ? shards.reduce((sum, s) => sum + s.metrics.averageResponseTime, 0) / shards.length 
      : 0;

    // Calculate shard distribution
    const shardDistribution: Record<string, number> = {};
    shards.forEach(shard => {
      shardDistribution[shard.name] = shard.metrics.queriesPerSecond;
    });

    // Identify hot and cold shards
    const sortedShards = shards.sort((a, b) => b.metrics.queriesPerSecond - a.metrics.queriesPerSecond);
    const hotShards = sortedShards.slice(0, Math.ceil(shards.length * 0.2)).map(s => s.id);
    const coldShards = sortedShards.slice(-Math.ceil(shards.length * 0.2)).map(s => s.id);

    return {
      totalShards,
      activeShards,
      totalReplicas,
      activeReplicas,
      averageReplicationLag,
      totalQueriesPerSecond,
      averageResponseTime,
      shardDistribution,
      hotShards,
      coldShards,
    };
  }

  // Health Checks
  private async startHealthChecks(): Promise<void> {
    setInterval(async () => {
      for (const shard of this.shards.values()) {
        await this.performShardHealthCheck(shard);
      }
      
      for (const replica of this.replicas.values()) {
        await this.performReplicaHealthCheck(replica);
      }
    }, 60000); // Check every minute
  }

  private async performShardHealthCheck(shard: DatabaseShard): Promise<void> {
    try {
      // In a real implementation, this would check actual database connectivity
      const isHealthy = Math.random() > 0.05; // 95% uptime
      
      if (isHealthy) {
        shard.status = 'active';
        shard.metrics.queriesPerSecond = Math.random() * 1000;
        shard.metrics.averageResponseTime = Math.random() * 100 + 10;
        shard.metrics.activeConnections = Math.floor(Math.random() * 20);
        shard.metrics.diskUsage = Math.random() * 80 + 10;
        shard.metrics.cpuUsage = Math.random() * 60 + 10;
      } else {
        shard.status = 'failed';
      }
      
      shard.lastHealthCheck = new Date();
      await this.logShardHealthUpdated(shard);
    } catch (error) {
      this.logger.error(`Health check failed for shard ${shard.name}`, error);
      shard.status = 'failed';
    }
  }

  private async performReplicaHealthCheck(replica: ReadReplica): Promise<void> {
    try {
      // In a real implementation, this would check replication status
      const isHealthy = Math.random() > 0.1; // 90% uptime
      
      if (isHealthy) {
        replica.status = 'active';
        replica.replicationLag = Math.random() * 10;
        replica.readCapacity = Math.random() * 2000 + 500;
      } else {
        replica.status = 'failed';
      }
      
      await this.logReplicaHealthUpdated(replica);
    } catch (error) {
      this.logger.error(`Health check failed for replica ${replica.name}`, error);
      replica.status = 'failed';
    }
  }

  // Private helper methods
  private initializeShards(): void {
    // Initialize with demo shards
    const demoShards = [
      {
        name: 'shard-1',
        type: 'primary' as const,
        host: 'db-shard-1.example.com',
        port: 5432,
        database: 'ai_support_shard_1',
        username: 'shard_user',
        region: 'us-east-1',
        shardKey: 'organization_id',
      },
      {
        name: 'shard-2',
        type: 'primary' as const,
        host: 'db-shard-2.example.com',
        port: 5432,
        database: 'ai_support_shard_2',
        username: 'shard_user',
        region: 'us-west-1',
        shardKey: 'organization_id',
      },
      {
        name: 'replica-1',
        type: 'replica' as const,
        host: 'db-replica-1.example.com',
        port: 5432,
        database: 'ai_support_replica_1',
        username: 'replica_user',
        region: 'us-east-1',
        shardKey: 'organization_id',
      },
    ];

    demoShards.forEach(async (shard) => {
      await this.createShard(shard);
    });

    // Create demo replicas
    const demoReplicas = [
      {
        name: 'replica-east-1',
        primaryShardId: 'shard_1',
        host: 'db-replica-east-1.example.com',
        port: 5432,
        region: 'us-east-1',
      },
      {
        name: 'replica-west-1',
        primaryShardId: 'shard_2',
        host: 'db-replica-west-1.example.com',
        port: 5432,
        region: 'us-west-1',
      },
    ];

    demoReplicas.forEach(async (replica) => {
      await this.createReadReplica(replica);
    });
  }

  private async startReplicationSync(replica: ReadReplica): Promise<void> {
    // Simulate replication sync
    setTimeout(async () => {
      replica.status = 'active';
      replica.replicationLag = 0;
      await this.logReplicaStatusUpdated(replica);
    }, 5000);
  }

  private hashValue(value: any): number {
    const str = JSON.stringify(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private estimateQueryCost(query: any, shard: DatabaseShard, replica?: ReadReplica): number {
    // Simple cost estimation based on operation type and target
    let baseCost = 1;
    
    switch (query.operation) {
      case 'read':
        baseCost = replica ? 0.5 : 1;
        break;
      case 'write':
        baseCost = 2;
        break;
      case 'update':
        baseCost = 1.5;
        break;
      case 'delete':
        baseCost = 1.5;
        break;
    }

    // Adjust for shard load
    const loadFactor = shard.metrics.activeConnections / shard.connectionPool.max;
    return baseCost * (1 + loadFactor);
  }

  private async splitHotShard(shardId: string): Promise<void> {
    this.logger.log(`Splitting hot shard ${shardId}`);
    // Implementation would create new shard and redistribute data
  }

  private async mergeColdShards(shardIds: string[]): Promise<void> {
    this.logger.log(`Merging cold shards: ${shardIds.join(', ')}`);
    // Implementation would merge data and remove redundant shards
  }

  private async rebalanceShard(shard: DatabaseShard, loadDifference: number): Promise<void> {
    this.logger.log(`Rebalancing shard ${shard.name} (load difference: ${loadDifference})`);
    // Implementation would redistribute data to balance load
  }

  // Logging methods
  private async logShardCreated(shard: DatabaseShard): Promise<void> {
    await this.auditLogRepository.save({
      action: 'shard_created',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'database_shard',
      resourceId: shard.id,
      details: JSON.stringify(shard),
      timestamp: new Date(),
    });
  }

  private async logShardRemoved(shard: DatabaseShard): Promise<void> {
    await this.auditLogRepository.save({
      action: 'shard_removed',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'database_shard',
      resourceId: shard.id,
      details: JSON.stringify(shard),
      timestamp: new Date(),
    });
  }

  private async logShardStatusUpdated(shard: DatabaseShard): Promise<void> {
    await this.auditLogRepository.save({
      action: 'shard_status_updated',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'database_shard',
      resourceId: shard.id,
      details: JSON.stringify({ status: shard.status, lastHealthCheck: shard.lastHealthCheck }),
      timestamp: new Date(),
    });
  }

  private async logShardHealthUpdated(shard: DatabaseShard): Promise<void> {
    await this.auditLogRepository.save({
      action: 'shard_health_updated',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'database_shard',
      resourceId: shard.id,
      details: JSON.stringify({ metrics: shard.metrics, status: shard.status }),
      timestamp: new Date(),
    });
  }

  private async logReplicaCreated(replica: ReadReplica): Promise<void> {
    await this.auditLogRepository.save({
      action: 'replica_created',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'read_replica',
      resourceId: replica.id,
      details: JSON.stringify(replica),
      timestamp: new Date(),
    });
  }

  private async logReplicaRemoved(replica: ReadReplica): Promise<void> {
    await this.auditLogRepository.save({
      action: 'replica_removed',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'read_replica',
      resourceId: replica.id,
      details: JSON.stringify(replica),
      timestamp: new Date(),
    });
  }

  private async logReplicaStatusUpdated(replica: ReadReplica): Promise<void> {
    await this.auditLogRepository.save({
      action: 'replica_status_updated',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'read_replica',
      resourceId: replica.id,
      details: JSON.stringify({ status: replica.status, replicationLag: replica.replicationLag }),
      timestamp: new Date(),
    });
  }

  private async logReplicaHealthUpdated(replica: ReadReplica): Promise<void> {
    await this.auditLogRepository.save({
      action: 'replica_health_updated',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'read_replica',
      resourceId: replica.id,
      details: JSON.stringify({ status: replica.status, replicationLag: replica.replicationLag }),
      timestamp: new Date(),
    });
  }

  private async logShardingStrategyCreated(strategy: ShardingStrategy): Promise<void> {
    await this.auditLogRepository.save({
      action: 'sharding_strategy_created',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'sharding_strategy',
      resourceId: strategy.id,
      details: JSON.stringify(strategy),
      timestamp: new Date(),
    });
  }

  private async logShardingStrategyUpdated(strategy: ShardingStrategy): Promise<void> {
    await this.auditLogRepository.save({
      action: 'sharding_strategy_updated',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'sharding_strategy',
      resourceId: strategy.id,
      details: JSON.stringify(strategy),
      timestamp: new Date(),
    });
  }

  private async logQueryRouted(query: any, shard: DatabaseShard, replica: ReadReplica | undefined, routingMethod: string, estimatedCost: number): Promise<void> {
    await this.auditLogRepository.save({
      action: 'query_routed',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'database_query',
      resourceId: `query_${Date.now()}`,
      details: JSON.stringify({
        table: query.table,
        operation: query.operation,
        shard: shard.name,
        replica: replica?.name,
        routingMethod,
        estimatedCost,
      }),
      timestamp: new Date(),
    });
  }
}
