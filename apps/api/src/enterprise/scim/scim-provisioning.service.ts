import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';

export interface SCIMUser {
  id: string;
  userName: string;
  active: boolean;
  emails: SCIMEmail[];
  name: SCIMName;
  displayName: string;
  groups: SCIMGroup[];
  organizationId: string;
  externalId?: string;
}

export interface SCIMEmail {
  value: string;
  primary: boolean;
  type: 'work' | 'home' | 'other';
}

export interface SCIMName {
  formatted: string;
  familyName: string;
  givenName: string;
  middleName?: string;
  honorificPrefix?: string;
  honorificSuffix?: string;
}

export interface SCIMGroup {
  value: string;
  display: string;
  type: 'direct' | 'indirect';
}

export interface SCIMOperation {
  op: 'add' | 'remove' | 'replace';
  path?: string;
  value: any;
}

export interface SCIMRequest {
  schemas: string[];
  operations: SCIMOperation[];
}

export interface SCIMResponse {
  schemas: string[];
  id: string;
  userName: string;
  active: boolean;
  emails: SCIMEmail[];
  name: SCIMName;
  displayName: string;
  groups: SCIMGroup[];
  meta: {
    resourceType: string;
    created: string;
    lastModified: string;
    version: string;
  };
}

@Injectable()
export class SCIMProvisioningService {
  private readonly logger = new Logger(SCIMProvisioningService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createUser(
    userData: Omit<SCIMUser, 'id'>,
    organizationId: string,
  ): Promise<SCIMResponse> {
    const user: SCIMUser = {
      ...userData,
      id: `scim_user_${Date.now()}`,
      organizationId,
    };

    await this.auditLogRepository.save({
      action: 'scim_user_created',
      resource: 'scim_user',
      resourceId: user.id,
      details: { userName: user.userName, organizationId },
      timestamp: new Date(),
    });

    this.logger.log(`Created SCIM user: ${user.userName} for organization ${organizationId}`);

    return this.formatSCIMResponse(user);
  }

  async getUser(userId: string, organizationId: string): Promise<SCIMResponse | null> {
    const user = await this.getSCIMUser(userId);
    
    if (!user || user.organizationId !== organizationId) {
      return null;
    }

    await this.auditLogRepository.save({
      action: 'scim_user_retrieved',
      resource: 'scim_user',
      resourceId: userId,
      details: { organizationId },
      timestamp: new Date(),
    });

    return this.formatSCIMResponse(user);
  }

  async updateUser(
    userId: string,
    operations: SCIMOperation[],
    organizationId: string,
  ): Promise<SCIMResponse> {
    const user = await this.getSCIMUser(userId);
    
    if (!user || user.organizationId !== organizationId) {
      throw new Error('User not found or access denied');
    }

    // Apply SCIM operations
    for (const operation of operations) {
      switch (operation.op) {
        case 'add':
          await this.applyAddOperation(user, operation);
          break;
        case 'remove':
          await this.applyRemoveOperation(user, operation);
          break;
        case 'replace':
          await this.applyReplaceOperation(user, operation);
          break;
      }
    }

    await this.auditLogRepository.save({
      action: 'scim_user_updated',
      resource: 'scim_user',
      resourceId: userId,
      details: { operations, organizationId },
      timestamp: new Date(),
    });

    this.logger.log(`Updated SCIM user: ${userId} with ${operations.length} operations`);
    return this.formatSCIMResponse(user);
  }

  async deleteUser(userId: string, organizationId: string): Promise<void> {
    const user = await this.getSCIMUser(userId);
    
    if (!user || user.organizationId !== organizationId) {
      throw new Error('User not found or access denied');
    }

    await this.auditLogRepository.save({
      action: 'scim_user_deleted',
      resource: 'scim_user',
      resourceId: userId,
      details: { organizationId },
      timestamp: new Date(),
    });

    this.logger.log(`Deleted SCIM user: ${userId}`);
  }

  async listUsers(
    organizationId: string,
    filter?: string,
    startIndex?: number,
    count?: number,
  ): Promise<{ resources: SCIMResponse[]; totalResults: number; startIndex: number; itemsPerPage: number }> {
    const users = await this.getSCIMUsers(organizationId, filter);
    
    const start = startIndex || 1;
    const limit = count || 100;
    const paginatedUsers = users.slice(start - 1, start - 1 + limit);

    await this.auditLogRepository.save({
      action: 'scim_users_listed',
      resource: 'scim_user',
      resourceId: organizationId,
      details: { filter, startIndex: start, count: limit, totalResults: users.length },
      timestamp: new Date(),
    });

    return {
      resources: paginatedUsers.map(user => this.formatSCIMResponse(user)),
      totalResults: users.length,
      startIndex: start,
      itemsPerPage: limit,
    };
  }

  async bulkOperations(
    operations: Array<{
      method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      path: string;
      data?: any;
    }>,
    organizationId: string,
  ): Promise<Array<{ statusCode: number; location?: string; data?: any }>> {
    const results = [];

    for (const operation of operations) {
      try {
        switch (operation.method) {
          case 'POST':
            const newUser = await this.createUser(operation.data, organizationId);
            results.push({ statusCode: 201, location: `/Users/${newUser.id}`, data: newUser });
            break;
          case 'PUT':
            const updatedUser = await this.updateUser(operation.path.split('/').pop()!, operation.data.operations, organizationId);
            results.push({ statusCode: 200, data: updatedUser });
            break;
          case 'DELETE':
            await this.deleteUser(operation.path.split('/').pop()!, organizationId);
            results.push({ statusCode: 204 });
            break;
        }
      } catch (error) {
        results.push({ statusCode: 400, data: { error: error.message } });
      }
    }

    await this.auditLogRepository.save({
      action: 'scim_bulk_operations',
      resource: 'scim_user',
      resourceId: organizationId,
      details: { operationsCount: operations.length, results },
      timestamp: new Date(),
    });

    return results;
  }

  private async applyAddOperation(user: SCIMUser, operation: SCIMOperation): Promise<void> {
    if (operation.path === 'emails') {
      user.emails.push(operation.value);
    } else if (operation.path === 'groups') {
      user.groups.push(operation.value);
    }
  }

  private async applyRemoveOperation(user: SCIMUser, operation: SCIMOperation): Promise<void> {
    if (operation.path?.startsWith('emails[')) {
      const index = parseInt(operation.path.match(/\[(\d+)\]/)?.[1] || '0');
      user.emails.splice(index, 1);
    } else if (operation.path?.startsWith('groups[')) {
      const index = parseInt(operation.path.match(/\[(\d+)\]/)?.[1] || '0');
      user.groups.splice(index, 1);
    }
  }

  private async applyReplaceOperation(user: SCIMUser, operation: SCIMOperation): Promise<void> {
    if (operation.path === 'userName') {
      user.userName = operation.value;
    } else if (operation.path === 'active') {
      user.active = operation.value;
    } else if (operation.path === 'displayName') {
      user.displayName = operation.value;
    } else if (operation.path === 'name') {
      user.name = operation.value;
    }
  }

  private formatSCIMResponse(user: SCIMUser): SCIMResponse {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
      id: user.id,
      userName: user.userName,
      active: user.active,
      emails: user.emails,
      name: user.name,
      displayName: user.displayName,
      groups: user.groups,
      meta: {
        resourceType: 'User',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: '1',
      },
    };
  }

  private async getSCIMUser(userId: string): Promise<SCIMUser | null> {
    // Simulate user retrieval
    return {
      id: userId,
      userName: 'test.user@example.com',
      active: true,
      emails: [{ value: 'test.user@example.com', primary: true, type: 'work' }],
      name: { formatted: 'Test User', familyName: 'User', givenName: 'Test' },
      displayName: 'Test User',
      groups: [{ value: 'users', display: 'Users', type: 'direct' }],
      organizationId: 'org_123',
    };
  }

  private async getSCIMUsers(organizationId: string, filter?: string): Promise<SCIMUser[]> {
    // Simulate users retrieval
    return [
      {
        id: 'user_1',
        userName: 'user1@example.com',
        active: true,
        emails: [{ value: 'user1@example.com', primary: true, type: 'work' }],
        name: { formatted: 'User One', familyName: 'One', givenName: 'User' },
        displayName: 'User One',
        groups: [{ value: 'users', display: 'Users', type: 'direct' }],
        organizationId,
      },
      {
        id: 'user_2',
        userName: 'user2@example.com',
        active: true,
        emails: [{ value: 'user2@example.com', primary: true, type: 'work' }],
        name: { formatted: 'User Two', familyName: 'Two', givenName: 'User' },
        displayName: 'User Two',
        groups: [{ value: 'admins', display: 'Administrators', type: 'direct' }],
        organizationId,
      },
    ];
  }
}
