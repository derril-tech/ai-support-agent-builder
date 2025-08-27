import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompleteSchema1700000000000 implements MigrationInterface {
  name = 'CompleteSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create organizations table
    await queryRunner.query(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        domain VARCHAR(255),
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        avatar_url TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create memberships table (user-org relationships)
    await queryRunner.query(`
      CREATE TABLE memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL DEFAULT 'viewer',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, organization_id)
      )
    `);

    // Create agents table
    await queryRunner.query(`
      CREATE TABLE agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        channel VARCHAR(50) NOT NULL,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create agent_versions table
    await queryRunner.query(`
      CREATE TABLE agent_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        config JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id),
        UNIQUE(agent_id, version)
      )
    `);

    // Create conversations table
    await queryRunner.query(`
      CREATE TABLE conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES agents(id),
        customer_id VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        channel VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE,
        satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL,
        sender_id VARCHAR(255),
        content TEXT NOT NULL,
        content_type VARCHAR(20) DEFAULT 'text',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create handoff_requests table
    await queryRunner.query(`
      CREATE TABLE handoff_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES agents(id),
        operator_id UUID REFERENCES users(id),
        reason TEXT NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        notes TEXT,
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        accepted_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create connectors table
    await queryRunner.query(`
      CREATE TABLE connectors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'disconnected',
        config JSONB NOT NULL,
        last_sync_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create api_keys table
    await queryRunner.query(`
      CREATE TABLE api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) NOT NULL UNIQUE,
        environment VARCHAR(20) NOT NULL,
        permissions TEXT[],
        last_used_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id)
      )
    `);

    // Create deployments table
    await queryRunner.query(`
      CREATE TABLE deployments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id),
        name VARCHAR(255) NOT NULL,
        environment VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'inactive',
        endpoint VARCHAR(500),
        config JSONB DEFAULT '{}',
        last_deployed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create knowledge_collections table
    await queryRunner.query(`
      CREATE TABLE knowledge_collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create knowledge_documents table
    await queryRunner.query(`
      CREATE TABLE knowledge_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collection_id UUID NOT NULL REFERENCES knowledge_collections(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        content_type VARCHAR(50) NOT NULL,
        content TEXT,
        file_path VARCHAR(500),
        file_size INTEGER,
        metadata JSONB DEFAULT '{}',
        embedding_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create eval_runs table
    await queryRunner.query(`
      CREATE TABLE eval_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'running',
        config JSONB NOT NULL,
        results JSONB,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES users(id)
      )
    `);

    // Create audit_logs table
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(255),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create billing_usage table
    await queryRunner.query(`
      CREATE TABLE billing_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        metric VARCHAR(50) NOT NULL,
        value DECIMAL(15,2) NOT NULL,
        cost DECIMAL(10,4),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, date, metric)
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX idx_conversations_org_status ON conversations(organization_id, status)`);
    await queryRunner.query(`CREATE INDEX idx_conversations_customer ON conversations(customer_email)`);
    await queryRunner.query(`CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at)`);
    await queryRunner.query(`CREATE INDEX idx_agents_org ON agents(organization_id)`);
    await queryRunner.query(`CREATE INDEX idx_audit_logs_org_date ON audit_logs(organization_id, created_at)`);
    await queryRunner.query(`CREATE INDEX idx_billing_usage_org_date ON billing_usage(organization_id, date)`);

    // Enable RLS on all tables
    await queryRunner.query(`ALTER TABLE organizations ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE users ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE memberships ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE agents ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE agent_versions ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE conversations ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE messages ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE handoff_requests ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE connectors ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE deployments ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE knowledge_collections ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE eval_runs ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(`ALTER TABLE billing_usage ENABLE ROW LEVEL SECURITY`);

    // Create RLS policies for organizations (only super admins can access)
    await queryRunner.query(`
      CREATE POLICY organizations_select_policy ON organizations
      FOR SELECT USING (current_setting('app.current_user_role') = 'super_admin')
    `);

    // Create RLS policies for users (users can only see themselves)
    await queryRunner.query(`
      CREATE POLICY users_select_policy ON users
      FOR SELECT USING (id = current_setting('app.current_user_id')::UUID)
    `);

    // Create RLS policies for memberships (users can see their own memberships)
    await queryRunner.query(`
      CREATE POLICY memberships_select_policy ON memberships
      FOR SELECT USING (user_id = current_setting('app.current_user_id')::UUID)
    `);

    // Create RLS policies for agents (organization-based access)
    await queryRunner.query(`
      CREATE POLICY agents_select_policy ON agents
      FOR SELECT USING (organization_id = current_setting('app.current_org_id')::UUID)
    `);
    await queryRunner.query(`
      CREATE POLICY agents_insert_policy ON agents
      FOR INSERT WITH CHECK (organization_id = current_setting('app.current_org_id')::UUID)
    `);
    await queryRunner.query(`
      CREATE POLICY agents_update_policy ON agents
      FOR UPDATE USING (organization_id = current_setting('app.current_org_id')::UUID)
    `);
    await queryRunner.query(`
      CREATE POLICY agents_delete_policy ON agents
      FOR DELETE USING (organization_id = current_setting('app.current_org_id')::UUID)
    `);

    // Create RLS policies for conversations (organization-based access)
    await queryRunner.query(`
      CREATE POLICY conversations_select_policy ON conversations
      FOR SELECT USING (organization_id = current_setting('app.current_org_id')::UUID)
    `);
    await queryRunner.query(`
      CREATE POLICY conversations_insert_policy ON conversations
      FOR INSERT WITH CHECK (organization_id = current_setting('app.current_org_id')::UUID)
    `);
    await queryRunner.query(`
      CREATE POLICY conversations_update_policy ON conversations
      FOR UPDATE USING (organization_id = current_setting('app.current_org_id')::UUID)
    `);

    // Create RLS policies for messages (organization-based access via conversation)
    await queryRunner.query(`
      CREATE POLICY messages_select_policy ON messages
      FOR SELECT USING (
        conversation_id IN (
          SELECT id FROM conversations 
          WHERE organization_id = current_setting('app.current_org_id')::UUID
        )
      )
    `);
    await queryRunner.query(`
      CREATE POLICY messages_insert_policy ON messages
      FOR INSERT WITH CHECK (
        conversation_id IN (
          SELECT id FROM conversations 
          WHERE organization_id = current_setting('app.current_org_id')::UUID
        )
      )
    `);

    // Create RLS policies for other tables (organization-based access)
    const orgBasedTables = [
      'connectors', 'api_keys', 'deployments', 'knowledge_collections', 
      'knowledge_documents', 'eval_runs', 'audit_logs', 'billing_usage'
    ];

    for (const table of orgBasedTables) {
      await queryRunner.query(`
        CREATE POLICY ${table}_select_policy ON ${table}
        FOR SELECT USING (organization_id = current_setting('app.current_org_id')::UUID)
      `);
      await queryRunner.query(`
        CREATE POLICY ${table}_insert_policy ON ${table}
        FOR INSERT WITH CHECK (organization_id = current_setting('app.current_org_id')::UUID)
      `);
      await queryRunner.query(`
        CREATE POLICY ${table}_update_policy ON ${table}
        FOR UPDATE USING (organization_id = current_setting('app.current_org_id')::UUID)
      `);
      await queryRunner.query(`
        CREATE POLICY ${table}_delete_policy ON ${table}
        FOR DELETE USING (organization_id = current_setting('app.current_org_id')::UUID)
      `);
    }

    // Create RLS policies for handoff_requests (organization-based access via conversation)
    await queryRunner.query(`
      CREATE POLICY handoff_requests_select_policy ON handoff_requests
      FOR SELECT USING (
        conversation_id IN (
          SELECT id FROM conversations 
          WHERE organization_id = current_setting('app.current_org_id')::UUID
        )
      )
    `);
    await queryRunner.query(`
      CREATE POLICY handoff_requests_insert_policy ON handoff_requests
      FOR INSERT WITH CHECK (
        conversation_id IN (
          SELECT id FROM conversations 
          WHERE organization_id = current_setting('app.current_org_id')::UUID
        )
      )
    `);
    await queryRunner.query(`
      CREATE POLICY handoff_requests_update_policy ON handoff_requests
      FOR UPDATE USING (
        conversation_id IN (
          SELECT id FROM conversations 
          WHERE organization_id = current_setting('app.current_org_id')::UUID
        )
      )
    `);

    // Create RLS policies for agent_versions (organization-based access via agent)
    await queryRunner.query(`
      CREATE POLICY agent_versions_select_policy ON agent_versions
      FOR SELECT USING (
        agent_id IN (
          SELECT id FROM agents 
          WHERE organization_id = current_setting('app.current_org_id')::UUID
        )
      )
    `);
    await queryRunner.query(`
      CREATE POLICY agent_versions_insert_policy ON agent_versions
      FOR INSERT WITH CHECK (
        agent_id IN (
          SELECT id FROM agents 
          WHERE organization_id = current_setting('app.current_org_id')::UUID
        )
      )
    `);
    await queryRunner.query(`
      CREATE POLICY agent_versions_update_policy ON agent_versions
      FOR UPDATE USING (
        agent_id IN (
          SELECT id FROM agents 
          WHERE organization_id = current_setting('app.current_org_id')::UUID
        )
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all RLS policies
    const tables = [
      'organizations', 'users', 'memberships', 'agents', 'agent_versions',
      'conversations', 'messages', 'handoff_requests', 'connectors', 'api_keys',
      'deployments', 'knowledge_collections', 'knowledge_documents', 'eval_runs',
      'audit_logs', 'billing_usage'
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_select_policy ON ${table}`);
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_insert_policy ON ${table}`);
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_update_policy ON ${table}`);
      await queryRunner.query(`DROP POLICY IF EXISTS ${table}_delete_policy ON ${table}`);
    }

    // Disable RLS
    for (const table of tables) {
      await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
    }

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS billing_usage`);
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS eval_runs`);
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_documents`);
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_collections`);
    await queryRunner.query(`DROP TABLE IF EXISTS deployments`);
    await queryRunner.query(`DROP TABLE IF EXISTS api_keys`);
    await queryRunner.query(`DROP TABLE IF EXISTS connectors`);
    await queryRunner.query(`DROP TABLE IF EXISTS handoff_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS messages`);
    await queryRunner.query(`DROP TABLE IF EXISTS conversations`);
    await queryRunner.query(`DROP TABLE IF EXISTS agent_versions`);
    await queryRunner.query(`DROP TABLE IF EXISTS agents`);
    await queryRunner.query(`DROP TABLE IF EXISTS memberships`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TABLE IF EXISTS organizations`);
  }
}
