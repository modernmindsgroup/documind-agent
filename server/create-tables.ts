import { db } from './db';
import { sql } from 'drizzle-orm';

export async function createTables() {
  console.log('🔨 Creating database tables...');
  
  try {
    // Create tables using raw SQL since Drizzle doesn't auto-create SQLite tables
    // Core tables
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'tenant_admin',
        tenant_id TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        call_platform TEXT DEFAULT 'default',
        is_active INTEGER DEFAULT 0,
        edited_by TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS agent_preferences (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        is_contact_required INTEGER DEFAULT 1,
        logo TEXT,
        display_name TEXT,
        widget_theme TEXT,
        realtime_voice_platform TEXT DEFAULT 'text',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (agent_id) REFERENCES agents (id),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        source TEXT,
        status TEXT DEFAULT 'active',
        metadata TEXT,
        last_interaction INTEGER,
        interaction_count INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        nodes TEXT NOT NULL,
        edges TEXT NOT NULL,
        is_active INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Knowledge base table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT,
        url TEXT,
        parent_id TEXT,
        last_synced INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (parent_id) REFERENCES knowledge_base (id)
      );
    `);

    // Call logs table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS call_logs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        call_id TEXT NOT NULL UNIQUE,
        from_number TEXT,
        to_number TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        duration INTEGER,
        cost INTEGER,
        transcript TEXT,
        recording_url TEXT,
        analysis TEXT,
        reason TEXT,
        evaluation TEXT,
        start_time INTEGER DEFAULT (strftime('%s', 'now')),
        end_time INTEGER,
        url TEXT,
        path TEXT,
        query TEXT,
        origin TEXT,
        method TEXT,
        request_headers TEXT,
        request_body TEXT,
        response_code INTEGER,
        response_headers TEXT,
        response_body TEXT,
        started_at INTEGER DEFAULT (strftime('%s', 'now')),
        finished_at INTEGER,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (agent_id) REFERENCES agents (id)
      );
    `);

    // Chat logs table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS chat_logs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        chat_id TEXT NOT NULL UNIQUE,
        user_id TEXT,
        messages TEXT NOT NULL,
        duration INTEGER,
        message_count INTEGER DEFAULT 0,
        type TEXT NOT NULL DEFAULT 'widget',
        status TEXT NOT NULL DEFAULT 'active',
        start_time INTEGER DEFAULT (strftime('%s', 'now')),
        end_time INTEGER,
        url TEXT,
        path TEXT,
        query TEXT,
        origin TEXT,
        method TEXT,
        request_headers TEXT,
        request_body TEXT,
        response_code INTEGER,
        response_headers TEXT,
        response_body TEXT,
        started_at INTEGER DEFAULT (strftime('%s', 'now')),
        finished_at INTEGER,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (agent_id) REFERENCES agents (id)
      );
    `);

    // Webhook logs table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        webhook_id TEXT,
        event_type TEXT NOT NULL,
        payload TEXT,
        status INTEGER DEFAULT 0,
        attempts INTEGER DEFAULT 0,
        last_attempt INTEGER,
        error_message TEXT,
        type TEXT DEFAULT 'webhook',
        url TEXT,
        path TEXT,
        query TEXT,
        origin TEXT,
        method TEXT,
        request_headers TEXT,
        request_body TEXT,
        response_code INTEGER,
        response_headers TEXT,
        response_body TEXT,
        started_at INTEGER DEFAULT (strftime('%s', 'now')),
        finished_at INTEGER,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Webhooks table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        events TEXT NOT NULL,
        secret TEXT,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // API keys table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        prefix TEXT NOT NULL,
        permissions TEXT NOT NULL,
        expires_at INTEGER,
        last_used INTEGER,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Conversations table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        contact_id TEXT,
        title TEXT,
        status TEXT DEFAULT 'active',
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (agent_id) REFERENCES agents (id),
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );
    `);

    // Messages table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (conversation_id) REFERENCES conversations (id)
      );
    `);

    // Rooms table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        metadata TEXT,
        max_participants INTEGER DEFAULT 10,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Room agents table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS room_agents (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (room_id) REFERENCES rooms (id),
        FOREIGN KEY (agent_id) REFERENCES agents (id),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Calls table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        room_id TEXT,
        agent_id TEXT,
        contact_id TEXT,
        phone_number TEXT,
        direction TEXT NOT NULL,
        status TEXT DEFAULT 'initiated',
        duration INTEGER DEFAULT 0,
        cost INTEGER DEFAULT 0,
        metadata TEXT,
        started_at INTEGER DEFAULT (strftime('%s', 'now')),
        ended_at INTEGER,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (room_id) REFERENCES rooms (id),
        FOREIGN KEY (agent_id) REFERENCES agents (id),
        FOREIGN KEY (contact_id) REFERENCES contacts (id)
      );
    `);

    // User credits table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS user_credits (
        user_id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        balance TEXT NOT NULL DEFAULT '0',
        currency TEXT DEFAULT 'USD',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Transactions table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount TEXT NOT NULL,
        currency TEXT DEFAULT 'USD',
        description TEXT,
        reference TEXT,
        metadata TEXT,
        status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Payment sessions table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS payment_sessions (
        reference TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        amount TEXT NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending',
        authorization_url TEXT,
        access_code TEXT,
        metadata TEXT,
        expires_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Documents table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        name TEXT NOT NULL,
        mime_type TEXT,
        size_bytes INTEGER,
        url TEXT,
        source TEXT DEFAULT 'upload',
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Agent documents table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS agent_documents (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        document_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (agent_id) REFERENCES agents (id),
        FOREIGN KEY (document_id) REFERENCES documents (id),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      );
    `);

    // Media tokens table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS media_tokens (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        token TEXT NOT NULL,
        agent_id TEXT,
        room_id TEXT,
        participant_name TEXT,
        expires_at INTEGER NOT NULL,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (agent_id) REFERENCES agents (id),
        FOREIGN KEY (room_id) REFERENCES rooms (id)
      );
    `);

    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  }
}