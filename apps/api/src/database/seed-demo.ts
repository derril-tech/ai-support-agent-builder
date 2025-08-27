import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export async function seedDemoData(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Create demo organization
    const orgId = uuidv4();
    await queryRunner.query(`
      INSERT INTO organizations (id, name, slug, domain, settings, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    `, [
      orgId,
      'Acme Corporation',
      'acme-corp',
      'acme.com',
      JSON.stringify({
        timezone: 'America/New_York',
        businessHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' }
        },
        features: {
          voiceEnabled: true,
          multilingual: true,
          advancedAnalytics: true
        }
      })
    ]);

    // Create demo users
    const users = [
      {
        id: uuidv4(),
        email: 'admin@acme.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'owner'
      },
      {
        id: uuidv4(),
        email: 'designer@acme.com',
        firstName: 'Designer',
        lastName: 'User',
        role: 'designer'
      },
      {
        id: uuidv4(),
        email: 'operator@acme.com',
        firstName: 'Operator',
        lastName: 'User',
        role: 'operator'
      },
      {
        id: uuidv4(),
        email: 'viewer@acme.com',
        firstName: 'Viewer',
        lastName: 'User',
        role: 'viewer'
      }
    ];

    for (const user of users) {
      await queryRunner.query(`
        INSERT INTO users (id, email, first_name, last_name, email_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [user.id, user.email, user.firstName, user.lastName, true]);

      await queryRunner.query(`
        INSERT INTO memberships (id, user_id, organization_id, role, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [uuidv4(), user.id, orgId, user.role, 'active']);
    }

    // Create demo agents
    const agents = [
      {
        id: uuidv4(),
        name: 'Customer Support Bot',
        description: 'Handles general customer inquiries and support requests',
        channel: 'web',
        status: 'active'
      },
      {
        id: uuidv4(),
        name: 'Sales Assistant',
        description: 'Qualifies leads and provides product information',
        channel: 'slack',
        status: 'draft'
      },
      {
        id: uuidv4(),
        name: 'Technical Support',
        description: 'Handles technical issues and troubleshooting',
        channel: 'email',
        status: 'active'
      }
    ];

    for (const agent of agents) {
      await queryRunner.query(`
        INSERT INTO agents (id, organization_id, name, description, status, channel, config, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [
        agent.id,
        orgId,
        agent.name,
        agent.description,
        agent.status,
        agent.channel,
        JSON.stringify({
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: `You are a helpful customer support agent for ${agent.name}.`,
          tools: ['search_knowledge', 'create_ticket', 'escalate'],
          guardrails: {
            maxConversationLength: 50,
            sensitiveTopics: ['pricing', 'refunds'],
            escalationTriggers: ['customer_angry', 'technical_issue']
          }
        })
      ]);

      // Create agent versions
      await queryRunner.query(`
        INSERT INTO agent_versions (id, agent_id, version, status, config, created_at, created_by)
        VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      `, [
        uuidv4(),
        agent.id,
        1,
        'released',
        JSON.stringify({
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 1000,
          systemPrompt: `You are a helpful customer support agent for ${agent.name}.`,
          tools: ['search_knowledge', 'create_ticket', 'escalate'],
          guardrails: {
            maxConversationLength: 50,
            sensitiveTopics: ['pricing', 'refunds'],
            escalationTriggers: ['customer_angry', 'technical_issue']
          }
        }),
        users[0].id
      ]);
    }

    // Create demo conversations
    const conversations = [
      {
        id: uuidv4(),
        agentId: agents[0].id,
        customerName: 'John Doe',
        customerEmail: 'john.doe@example.com',
        status: 'resolved',
        channel: 'web',
        priority: 'medium',
        tags: ['billing', 'resolved'],
        satisfactionRating: 5
      },
      {
        id: uuidv4(),
        agentId: agents[0].id,
        customerName: 'Jane Smith',
        customerEmail: 'jane.smith@example.com',
        status: 'active',
        channel: 'web',
        priority: 'high',
        tags: ['technical', 'urgent']
      },
      {
        id: uuidv4(),
        agentId: agents[1].id,
        customerName: 'Bob Wilson',
        customerEmail: 'bob.wilson@example.com',
        status: 'escalated',
        channel: 'slack',
        priority: 'urgent',
        tags: ['sales', 'escalated']
      },
      {
        id: uuidv4(),
        agentId: agents[2].id,
        customerName: 'Alice Johnson',
        customerEmail: 'alice.johnson@example.com',
        status: 'resolved',
        channel: 'email',
        priority: 'low',
        tags: ['general', 'resolved'],
        satisfactionRating: 4
      }
    ];

    for (const conversation of conversations) {
      await queryRunner.query(`
        INSERT INTO conversations (
          id, organization_id, agent_id, customer_name, customer_email, 
          status, channel, priority, tags, satisfaction_rating,
          started_at, last_message_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW(), NOW())
      `, [
        conversation.id,
        orgId,
        conversation.agentId,
        conversation.customerName,
        conversation.customerEmail,
        conversation.status,
        conversation.channel,
        conversation.priority,
        conversation.tags,
        conversation.satisfactionRating || null
      ]);

      // Create sample messages for each conversation
      const messages = [
        {
          senderType: 'customer',
          content: `Hi, I need help with my account. I'm ${conversation.customerName}.`
        },
        {
          senderType: 'agent',
          content: `Hello ${conversation.customerName}! I'd be happy to help you with your account. What specific issue are you experiencing?`
        },
        {
          senderType: 'customer',
          content: conversation.channel === 'web' 
            ? 'I can\'t seem to log into my account. It says my password is incorrect.'
            : conversation.channel === 'slack'
            ? 'I\'m interested in upgrading my plan. Can you tell me about the pricing?'
            : 'I have a technical question about your API integration.'
        },
        {
          senderType: 'agent',
          content: conversation.channel === 'web'
            ? 'I can help you with that. Let me check your account status. Can you confirm your email address?'
            : conversation.channel === 'slack'
            ? 'I\'d be happy to help you with pricing information. Let me connect you with our sales team.'
            : 'I can help you with API integration questions. What specific issue are you encountering?'
        }
      ];

      for (const message of messages) {
        await queryRunner.query(`
          INSERT INTO messages (id, conversation_id, sender_type, content, created_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [uuidv4(), conversation.id, message.senderType, message.content]);
      }

      // Create handoff request for escalated conversation
      if (conversation.status === 'escalated') {
        await queryRunner.query(`
          INSERT INTO handoff_requests (
            id, conversation_id, agent_id, operator_id, reason, priority, status,
            requested_at, accepted_at, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW(), NOW())
        `, [
          uuidv4(),
          conversation.id,
          conversation.agentId,
          users[2].id, // operator user
          'Customer requested to speak with sales representative',
          conversation.priority,
          'accepted'
        ]);
      }
    }

    // Create demo connectors
    const connectors = [
      {
        name: 'Main Zendesk',
        type: 'zendesk',
        status: 'connected',
        config: {
          subdomain: 'acme',
          email: 'support@acme.com'
        }
      },
      {
        name: 'Intercom Support',
        type: 'intercom',
        status: 'connected',
        config: {
          workspaceId: 'abc123'
        }
      }
    ];

    for (const connector of connectors) {
      await queryRunner.query(`
        INSERT INTO connectors (
          id, organization_id, name, type, status, config, last_sync_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
      `, [
        uuidv4(),
        orgId,
        connector.name,
        connector.type,
        connector.status,
        JSON.stringify(connector.config)
      ]);
    }

    // Create demo API keys
    const apiKeys = [
      {
        name: 'Production API Key',
        environment: 'production',
        permissions: ['read', 'write']
      },
      {
        name: 'Development Key',
        environment: 'development',
        permissions: ['read']
      }
    ];

    for (const apiKey of apiKeys) {
      const keyHash = await bcrypt.hash(`sk-${apiKey.environment}-${Math.random().toString(36).substr(2, 9)}`, 10);
      await queryRunner.query(`
        INSERT INTO api_keys (
          id, organization_id, name, key_hash, environment, permissions, is_active, created_at, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
      `, [
        uuidv4(),
        orgId,
        apiKey.name,
        keyHash,
        apiKey.environment,
        apiKey.permissions,
        true,
        users[0].id
      ]);
    }

    // Create demo deployments
    const deployments = [
      {
        name: 'Customer Support Bot - Prod',
        environment: 'production',
        status: 'active',
        agentId: agents[0].id,
        endpoint: 'https://api.acme.com/v1/agents/customer-support'
      },
      {
        name: 'Sales Assistant - Staging',
        environment: 'staging',
        status: 'inactive',
        agentId: agents[1].id,
        endpoint: 'https://staging-api.acme.com/v1/agents/sales'
      }
    ];

    for (const deployment of deployments) {
      await queryRunner.query(`
        INSERT INTO deployments (
          id, organization_id, agent_id, name, environment, status, endpoint, last_deployed_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
      `, [
        uuidv4(),
        orgId,
        deployment.agentId,
        deployment.name,
        deployment.environment,
        deployment.status,
        deployment.endpoint
      ]);
    }

    // Create demo knowledge collections
    const knowledgeCollections = [
      {
        name: 'Product Documentation',
        description: 'Comprehensive product guides and documentation'
      },
      {
        name: 'FAQ',
        description: 'Frequently asked questions and answers'
      }
    ];

    for (const collection of knowledgeCollections) {
      await queryRunner.query(`
        INSERT INTO knowledge_collections (
          id, organization_id, name, description, status, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [
        uuidv4(),
        orgId,
        collection.name,
        collection.description,
        'active'
      ]);
    }

    // Create demo eval runs
    const evalRuns = [
      {
        name: 'Customer Support Quality Check',
        description: 'Evaluation of customer support agent responses',
        status: 'completed',
        config: {
          model: 'gpt-4',
          criteria: ['accuracy', 'helpfulness', 'professionalism'],
          threshold: 0.8
        },
        results: {
          totalConversations: 150,
          averageScore: 0.85,
          passedThreshold: 142,
          failedThreshold: 8
        }
      }
    ];

    for (const evalRun of evalRuns) {
      await queryRunner.query(`
        INSERT INTO eval_runs (
          id, organization_id, name, description, status, config, results, started_at, completed_at, created_at, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW(), $8)
      `, [
        uuidv4(),
        orgId,
        evalRun.name,
        evalRun.description,
        evalRun.status,
        JSON.stringify(evalRun.config),
        JSON.stringify(evalRun.results),
        users[0].id
      ]);
    }

    // Create demo billing usage
    const billingUsage = [
      { date: '2024-01-20', metric: 'messages', value: 1250, cost: 12.50 },
      { date: '2024-01-20', metric: 'tokens', value: 50000, cost: 25.00 },
      { date: '2024-01-19', metric: 'messages', value: 1100, cost: 11.00 },
      { date: '2024-01-19', metric: 'tokens', value: 45000, cost: 22.50 }
    ];

    for (const usage of billingUsage) {
      await queryRunner.query(`
        INSERT INTO billing_usage (
          id, organization_id, date, metric, value, cost, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        uuidv4(),
        orgId,
        usage.date,
        usage.metric,
        usage.value,
        usage.cost
      ]);
    }

    // Create demo audit logs
    const auditLogs = [
      {
        userId: users[0].id,
        action: 'agent.created',
        resourceType: 'agent',
        resourceId: agents[0].id,
        details: { agentName: agents[0].name }
      },
      {
        userId: users[1].id,
        action: 'conversation.started',
        resourceType: 'conversation',
        resourceId: conversations[0].id,
        details: { customerEmail: conversations[0].customerEmail }
      }
    ];

    for (const log of auditLogs) {
      await queryRunner.query(`
        INSERT INTO audit_logs (
          id, organization_id, user_id, action, resource_type, resource_id, details, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        uuidv4(),
        orgId,
        log.userId,
        log.action,
        log.resourceType,
        log.resourceId,
        JSON.stringify(log.details)
      ]);
    }

    await queryRunner.commitTransaction();
    console.log('Demo data seeded successfully!');
    
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding demo data:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
