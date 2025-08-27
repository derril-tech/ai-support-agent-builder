import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../rbac/rbac.guard';
import { Roles } from '../../rbac/decorators/roles.decorator';
import { SCIMProvisioningService, SCIMUser, SCIMOperation, SCIMResponse } from './scim-provisioning.service';

@ApiTags('SCIM Provisioning')
@Controller('scim/v2')
export class SCIMProvisioningController {
  constructor(private readonly scimService: SCIMProvisioningService) {}

  @Post('Users')
  @ApiOperation({ summary: 'Create a new SCIM user' })
  @ApiResponse({ status: 201, description: 'SCIM user created successfully' })
  async createUser(
    @Body() userData: Omit<SCIMUser, 'id'>,
    @Headers('x-organization-id') organizationId: string,
  ): Promise<SCIMResponse> {
    return this.scimService.createUser(userData, organizationId);
  }

  @Get('Users/:userId')
  @ApiOperation({ summary: 'Get a SCIM user by ID' })
  @ApiResponse({ status: 200, description: 'SCIM user retrieved successfully' })
  async getUser(
    @Param('userId') userId: string,
    @Headers('x-organization-id') organizationId: string,
  ): Promise<SCIMResponse | null> {
    return this.scimService.getUser(userId, organizationId);
  }

  @Put('Users/:userId')
  @ApiOperation({ summary: 'Update a SCIM user' })
  @ApiResponse({ status: 200, description: 'SCIM user updated successfully' })
  async updateUser(
    @Param('userId') userId: string,
    @Body() body: { operations: SCIMOperation[] },
    @Headers('x-organization-id') organizationId: string,
  ): Promise<SCIMResponse> {
    return this.scimService.updateUser(userId, body.operations, organizationId);
  }

  @Delete('Users/:userId')
  @ApiOperation({ summary: 'Delete a SCIM user' })
  @ApiResponse({ status: 204, description: 'SCIM user deleted successfully' })
  async deleteUser(
    @Param('userId') userId: string,
    @Headers('x-organization-id') organizationId: string,
  ): Promise<void> {
    return this.scimService.deleteUser(userId, organizationId);
  }

  @Get('Users')
  @ApiOperation({ summary: 'List SCIM users' })
  @ApiResponse({ status: 200, description: 'SCIM users listed successfully' })
  async listUsers(
    @Headers('x-organization-id') organizationId: string,
    @Query('filter') filter?: string,
    @Query('startIndex') startIndex?: number,
    @Query('count') count?: number,
  ): Promise<{ resources: SCIMResponse[]; totalResults: number; startIndex: number; itemsPerPage: number }> {
    return this.scimService.listUsers(organizationId, filter, startIndex, count);
  }

  @Post('Bulk')
  @ApiOperation({ summary: 'Perform bulk SCIM operations' })
  @ApiResponse({ status: 200, description: 'Bulk operations completed successfully' })
  async bulkOperations(
    @Body() body: {
      operations: Array<{
        method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
        path: string;
        data?: any;
      }>;
    },
    @Headers('x-organization-id') organizationId: string,
  ): Promise<Array<{ statusCode: number; location?: string; data?: any }>> {
    return this.scimService.bulkOperations(body.operations, organizationId);
  }

  @Get('ServiceProviderConfig')
  @ApiOperation({ summary: 'Get SCIM service provider configuration' })
  @ApiResponse({ status: 200, description: 'Service provider config retrieved successfully' })
  async getServiceProviderConfig(): Promise<any> {
    return {
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
      patch: { supported: true },
      bulk: { supported: true, maxOperations: 100, maxPayloadSize: 1048576 },
      filter: { supported: true, maxResults: 200 },
      changePassword: { supported: false },
      sort: { supported: false },
      etag: { supported: false },
      authenticationSchemes: [
        {
          type: 'OAuth Bearer Token',
          name: 'OAuth2',
          description: 'OAuth2 Bearer Token',
          specUrl: 'https://tools.ietf.org/html/rfc6749',
          primary: true,
        },
      ],
      meta: {
        location: '/scim/v2/ServiceProviderConfig',
        resourceType: 'ServiceProviderConfig',
      },
    };
  }

  @Get('ResourceTypes')
  @ApiOperation({ summary: 'Get SCIM resource types' })
  @ApiResponse({ status: 200, description: 'Resource types retrieved successfully' })
  async getResourceTypes(): Promise<any> {
    return {
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: 1,
      Resources: [
        {
          schemas: ['urn:ietf:params:scim:schemas:core:2.0:ResourceType'],
          id: 'User',
          name: 'User',
          endpoint: '/Users',
          description: 'User Account',
          schema: 'urn:ietf:params:scim:schemas:core:2.0:User',
          schemaExtensions: [],
          meta: {
            location: '/scim/v2/ResourceTypes/User',
            resourceType: 'ResourceType',
          },
        },
      ],
    };
  }
}
