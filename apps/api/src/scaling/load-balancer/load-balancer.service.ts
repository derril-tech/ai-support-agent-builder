// Created automatically by Cursor AI (2024-12-19)

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface LoadBalancerConfig {
  id: string;
  name: string;
  algorithm: 'round_robin' | 'least_connections' | 'weighted' | 'ip_hash' | 'least_response_time';
  healthCheck: {
    enabled: boolean;
    path: string;
    interval: number; // seconds
    timeout: number; // seconds
    healthyThreshold: number;
    unhealthyThreshold: number;
  };
  stickySessions: {
    enabled: boolean;
    cookieName: string;
    ttl: number; // seconds
  };
  ssl: {
    enabled: boolean;
    certificateArn?: string;
    redirectHttp: boolean;
  };
}

export interface BackendServer {
  id: string;
  host: string;
  port: number;
  weight: number;
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: Date;
  responseTime: number; // milliseconds
  activeConnections: number;
  totalRequests: number;
  errorRate: number;
}

export interface LoadBalancerMetrics {
  totalRequests: number;
  activeConnections: number;
  averageResponseTime: number;
  errorRate: number;
  healthyServers: number;
  unhealthyServers: number;
  throughput: number; // requests per second
}

@Injectable()
export class LoadBalancerService {
  private readonly logger = new Logger(LoadBalancerService.name);
  private backendServers: Map<string, BackendServer> = new Map();
  private requestCount: number = 0;
  private lastRequestTime: Date = new Date();

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {
    this.initializeBackendServers();
    this.startHealthChecks();
  }

  // Load Balancer Configuration
  async createLoadBalancer(config: Omit<LoadBalancerConfig, 'id'>): Promise<LoadBalancerConfig> {
    const loadBalancer: LoadBalancerConfig = {
      ...config,
      id: `lb_${Date.now()}`,
    };

    await this.logLoadBalancerCreated(loadBalancer);
    return loadBalancer;
  }

  async updateLoadBalancerConfig(id: string, config: Partial<LoadBalancerConfig>): Promise<LoadBalancerConfig> {
    // In a real implementation, this would update the load balancer configuration
    const updatedConfig = { id, ...config };
    
    await this.logLoadBalancerUpdated(updatedConfig);
    return updatedConfig as LoadBalancerConfig;
  }

  // Backend Server Management
  async addBackendServer(server: Omit<BackendServer, 'id' | 'health' | 'lastHealthCheck' | 'responseTime' | 'activeConnections' | 'totalRequests' | 'errorRate'>): Promise<BackendServer> {
    const newServer: BackendServer = {
      ...server,
      id: `server_${Date.now()}`,
      health: 'unknown',
      lastHealthCheck: new Date(),
      responseTime: 0,
      activeConnections: 0,
      totalRequests: 0,
      errorRate: 0,
    };

    this.backendServers.set(newServer.id, newServer);
    await this.logBackendServerAdded(newServer);
    
    return newServer;
  }

  async removeBackendServer(serverId: string): Promise<void> {
    const server = this.backendServers.get(serverId);
    if (server) {
      this.backendServers.delete(serverId);
      await this.logBackendServerRemoved(server);
    }
  }

  async updateServerHealth(serverId: string, health: BackendServer['health'], responseTime?: number): Promise<void> {
    const server = this.backendServers.get(serverId);
    if (server) {
      server.health = health;
      server.lastHealthCheck = new Date();
      if (responseTime !== undefined) {
        server.responseTime = responseTime;
      }
      
      await this.logServerHealthUpdated(server);
    }
  }

  // Request Routing
  async routeRequest(request: {
    method: string;
    path: string;
    headers: Record<string, string>;
    clientIp: string;
    sessionId?: string;
  }): Promise<{
    server: BackendServer;
    routingMethod: string;
    responseTime: number;
  }> {
    this.requestCount++;
    this.lastRequestTime = new Date();

    const healthyServers = Array.from(this.backendServers.values()).filter(s => s.health === 'healthy');
    
    if (healthyServers.length === 0) {
      throw new Error('No healthy backend servers available');
    }

    let selectedServer: BackendServer;
    let routingMethod: string;

    // Check for sticky sessions first
    if (request.sessionId) {
      selectedServer = this.getServerBySession(request.sessionId);
      if (selectedServer && selectedServer.health === 'healthy') {
        routingMethod = 'sticky_session';
      } else {
        selectedServer = this.selectServerByAlgorithm(healthyServers, request);
        routingMethod = 'algorithm_fallback';
      }
    } else {
      selectedServer = this.selectServerByAlgorithm(healthyServers, request);
      routingMethod = 'algorithm';
    }

    // Update server metrics
    selectedServer.activeConnections++;
    selectedServer.totalRequests++;

    const responseTime = await this.measureResponseTime(selectedServer, request);
    selectedServer.responseTime = responseTime;

    await this.logRequestRouted(selectedServer, request, routingMethod, responseTime);
    
    return {
      server: selectedServer,
      routingMethod,
      responseTime,
    };
  }

  // Health Checks
  private async startHealthChecks(): Promise<void> {
    setInterval(async () => {
      for (const server of this.backendServers.values()) {
        await this.performHealthCheck(server);
      }
    }, 30000); // Check every 30 seconds
  }

  private async performHealthCheck(server: BackendServer): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch(`http://${server.host}:${server.port}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        await this.updateServerHealth(server.id, 'healthy', responseTime);
      } else {
        await this.updateServerHealth(server.id, 'unhealthy');
      }
    } catch (error) {
      this.logger.warn(`Health check failed for server ${server.host}:${server.port}`, error);
      await this.updateServerHealth(server.id, 'unhealthy');
    }
  }

  // Server Selection Algorithms
  private selectServerByAlgorithm(servers: BackendServer[], request: any): BackendServer {
    // For demo purposes, use round-robin
    // In a real implementation, this would use the configured algorithm
    const algorithm = 'round_robin';
    
    switch (algorithm) {
      case 'round_robin':
        return this.roundRobinSelection(servers);
      case 'least_connections':
        return this.leastConnectionsSelection(servers);
      case 'weighted':
        return this.weightedSelection(servers);
      case 'ip_hash':
        return this.ipHashSelection(servers, request.clientIp);
      case 'least_response_time':
        return this.leastResponseTimeSelection(servers);
      default:
        return this.roundRobinSelection(servers);
    }
  }

  private roundRobinSelection(servers: BackendServer[]): BackendServer {
    const index = this.requestCount % servers.length;
    return servers[index];
  }

  private leastConnectionsSelection(servers: BackendServer[]): BackendServer {
    return servers.reduce((min, server) => 
      server.activeConnections < min.activeConnections ? server : min
    );
  }

  private weightedSelection(servers: BackendServer[]): BackendServer {
    const totalWeight = servers.reduce((sum, server) => sum + server.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const server of servers) {
      random -= server.weight;
      if (random <= 0) {
        return server;
      }
    }
    
    return servers[0]; // Fallback
  }

  private ipHashSelection(servers: BackendServer[], clientIp: string): BackendServer {
    const hash = this.hashString(clientIp);
    const index = hash % servers.length;
    return servers[index];
  }

  private leastResponseTimeSelection(servers: BackendServer[]): BackendServer {
    return servers.reduce((min, server) => 
      server.responseTime < min.responseTime ? server : min
    );
  }

  private getServerBySession(sessionId: string): BackendServer | null {
    // In a real implementation, this would check session storage
    // For demo purposes, use a simple hash-based selection
    const hash = this.hashString(sessionId);
    const servers = Array.from(this.backendServers.values()).filter(s => s.health === 'healthy');
    if (servers.length === 0) return null;
    
    const index = hash % servers.length;
    return servers[index];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Metrics and Monitoring
  async getLoadBalancerMetrics(): Promise<LoadBalancerMetrics> {
    const servers = Array.from(this.backendServers.values());
    const healthyServers = servers.filter(s => s.health === 'healthy').length;
    const unhealthyServers = servers.filter(s => s.health === 'unhealthy').length;
    
    const totalRequests = servers.reduce((sum, s) => sum + s.totalRequests, 0);
    const activeConnections = servers.reduce((sum, s) => sum + s.activeConnections, 0);
    const averageResponseTime = servers.length > 0 
      ? servers.reduce((sum, s) => sum + s.responseTime, 0) / servers.length 
      : 0;
    const errorRate = servers.length > 0 
      ? servers.reduce((sum, s) => sum + s.errorRate, 0) / servers.length 
      : 0;

    // Calculate throughput (requests per second)
    const timeDiff = (Date.now() - this.lastRequestTime.getTime()) / 1000;
    const throughput = timeDiff > 0 ? this.requestCount / timeDiff : 0;

    return {
      totalRequests,
      activeConnections,
      averageResponseTime,
      errorRate,
      healthyServers,
      unhealthyServers,
      throughput,
    };
  }

  async getBackendServers(): Promise<BackendServer[]> {
    return Array.from(this.backendServers.values());
  }

  // Auto-scaling
  async scaleUp(desiredCount: number): Promise<void> {
    const currentCount = this.backendServers.size;
    const healthyCount = Array.from(this.backendServers.values()).filter(s => s.health === 'healthy').length;
    
    if (healthyCount < desiredCount) {
      const serversToAdd = desiredCount - currentCount;
      this.logger.log(`Scaling up: adding ${serversToAdd} servers`);
      
      for (let i = 0; i < serversToAdd; i++) {
        await this.addBackendServer({
          host: `server-${Date.now()}-${i}.example.com`,
          port: 3000,
          weight: 1,
        });
      }
      
      await this.logAutoScaling('scale_up', { currentCount, desiredCount, serversAdded: serversToAdd });
    }
  }

  async scaleDown(desiredCount: number): Promise<void> {
    const currentCount = this.backendServers.size;
    
    if (currentCount > desiredCount) {
      const serversToRemove = currentCount - desiredCount;
      this.logger.log(`Scaling down: removing ${serversToRemove} servers`);
      
      const servers = Array.from(this.backendServers.values());
      const serversToDelete = servers.slice(0, serversToRemove);
      
      for (const server of serversToDelete) {
        await this.removeBackendServer(server.id);
      }
      
      await this.logAutoScaling('scale_down', { currentCount, desiredCount, serversRemoved: serversToRemove });
    }
  }

  // Private helper methods
  private initializeBackendServers(): void {
    // Initialize with some demo servers
    const demoServers = [
      { host: 'server1.example.com', port: 3000, weight: 1 },
      { host: 'server2.example.com', port: 3000, weight: 1 },
      { host: 'server3.example.com', port: 3000, weight: 1 },
    ];

    demoServers.forEach(async (server) => {
      await this.addBackendServer(server);
    });
  }

  private async measureResponseTime(server: BackendServer, request: any): Promise<number> {
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would make an actual request
      // For demo purposes, simulate response time
      const responseTime = Math.random() * 100 + 50; // 50-150ms
      await new Promise(resolve => setTimeout(resolve, responseTime));
      
      return responseTime;
    } catch (error) {
      server.errorRate += 1;
      return 0;
    }
  }

  // Logging methods
  private async logLoadBalancerCreated(config: LoadBalancerConfig): Promise<void> {
    await this.auditLogRepository.save({
      action: 'load_balancer_created',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'load_balancer',
      resourceId: config.id,
      details: JSON.stringify(config),
      timestamp: new Date(),
    });
  }

  private async logLoadBalancerUpdated(config: Partial<LoadBalancerConfig>): Promise<void> {
    await this.auditLogRepository.save({
      action: 'load_balancer_updated',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'load_balancer',
      resourceId: config.id,
      details: JSON.stringify(config),
      timestamp: new Date(),
    });
  }

  private async logBackendServerAdded(server: BackendServer): Promise<void> {
    await this.auditLogRepository.save({
      action: 'backend_server_added',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'backend_server',
      resourceId: server.id,
      details: JSON.stringify(server),
      timestamp: new Date(),
    });
  }

  private async logBackendServerRemoved(server: BackendServer): Promise<void> {
    await this.auditLogRepository.save({
      action: 'backend_server_removed',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'backend_server',
      resourceId: server.id,
      details: JSON.stringify(server),
      timestamp: new Date(),
    });
  }

  private async logServerHealthUpdated(server: BackendServer): Promise<void> {
    await this.auditLogRepository.save({
      action: 'server_health_updated',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'backend_server',
      resourceId: server.id,
      details: JSON.stringify({
        health: server.health,
        responseTime: server.responseTime,
        lastHealthCheck: server.lastHealthCheck,
      }),
      timestamp: new Date(),
    });
  }

  private async logRequestRouted(server: BackendServer, request: any, routingMethod: string, responseTime: number): Promise<void> {
    await this.auditLogRepository.save({
      action: 'request_routed',
      userId: 'system',
      organizationId: 'system',
      resourceType: 'load_balancer',
      resourceId: server.id,
      details: JSON.stringify({
        server: server.host,
        routingMethod,
        responseTime,
        requestPath: request.path,
        clientIp: request.clientIp,
      }),
      timestamp: new Date(),
    });
  }

  private async logAutoScaling(action: string, details: any): Promise<void> {
    await this.auditLogRepository.save({
      action: `auto_scaling_${action}`,
      userId: 'system',
      organizationId: 'system',
      resourceType: 'load_balancer',
      resourceId: 'auto_scaling',
      details: JSON.stringify(details),
      timestamp: new Date(),
    });
  }
}
