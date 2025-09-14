import { db } from './db';
import { 
  users, tenants, agents, workflows, contacts, agentPreferences,
  callLogs, chatLogs, conversations, messages 
} from '@shared/schema';
import { hashPassword } from './auth';
import { eq } from 'drizzle-orm';

export async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');
  
  try {
    // Check if data already exists to prevent duplicate seeding
    const existingTenants = await db.select().from(tenants).limit(1);
    if (existingTenants.length > 0) {
      console.log('📋 Data already exists, skipping seeding to prevent duplicates');
      return;
    }

    // Create sample tenant
    console.log('Creating sample tenant...');
    const [tenant] = await db.insert(tenants).values({
      id: 'demo-tenant-id', // Use fixed ID for consistency
      name: 'Demo Company',
      domain: 'demo.example.com'
    }).returning();

    // Create sample user
    console.log('Creating sample user...');
    const hashedPassword = await hashPassword('demo123');
    const [user] = await db.insert(users).values({
      id: 'demo-user-id', // Use fixed ID for consistency
      username: 'demo',
      email: 'demo@example.com',
      password: hashedPassword,
      role: 'tenant_admin',
      tenantId: tenant.id
    }).returning();

    // Create sample agents
    console.log('Creating sample agents...');
    const agentValues = [
      {
        id: 'agent-1', // Use fixed ID for consistency
        tenantId: tenant.id,
        name: 'Customer Support Agent',
        description: 'Helpful customer service assistant that can answer questions about products and services.',
        type: 'single_prompt' as const,
        isActive: 1, // Use 1/0 for boolean in SQLite
        editedBy: user.id
      },
      {
        id: 'agent-2', // Use fixed ID for consistency
        tenantId: tenant.id,
        name: 'Sales Assistant',
        description: 'AI sales assistant that helps qualify leads and schedule appointments.',
        type: 'conversation_flow' as const,
        isActive: 1,
        editedBy: user.id
      },
      {
        id: 'agent-3', // Use fixed ID for consistency
        tenantId: tenant.id,
        name: 'Technical Support',
        description: 'Specialized technical support agent for troubleshooting issues.',
        type: 'multi_prompt' as const,
        isActive: 0,
        editedBy: user.id
      }
    ];

    const createdAgents = await db.insert(agents).values(agentValues).returning();

    // Create sample agent preferences
    console.log('Creating agent preferences...');
    await db.insert(agentPreferences).values([
      {
        agentId: createdAgents[0].id,
        tenantId: tenant.id,
        isContactRequired: 1, // Use 1/0 for boolean in SQLite
        displayName: 'Customer Support',
        widgetTheme: JSON.stringify({
          primaryColor: '#2563eb',
          secondaryColor: '#1d4ed8'
        })
      },
      {
        agentId: createdAgents[1].id,
        tenantId: tenant.id,
        isContactRequired: 0, // Use 1/0 for boolean in SQLite
        displayName: 'Sales Bot',
        widgetTheme: JSON.stringify({
          primaryColor: '#059669',
          secondaryColor: '#047857'
        })
      }
    ]);

    // Create sample contacts
    console.log('Creating sample contacts...');
    const sampleContacts = [
      {
        tenantId: tenant.id,
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1-555-0123',
        source: 'website'
      },
      {
        tenantId: tenant.id,
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1-555-0124',
        source: 'referral'
      },
      {
        tenantId: tenant.id,
        name: 'Mike Davis',
        email: 'mike@example.com',
        source: 'widget'
      }
    ];

    await db.insert(contacts).values(sampleContacts);

    // Create sample workflows
    console.log('Creating sample workflows...');
    const sampleWorkflows = [
      {
        tenantId: tenant.id,
        name: 'Lead Qualification',
        description: 'Automated lead qualification workflow',
        type: 'lead_qualification' as const,
        nodes: JSON.stringify([
          { id: 'start', type: 'start', position: { x: 100, y: 100 } },
          { id: 'qualify', type: 'question', position: { x: 250, y: 100 }, data: { question: 'What is your budget?' } },
          { id: 'end', type: 'end', position: { x: 400, y: 100 } }
        ]),
        edges: JSON.stringify([
          { id: 'e1', source: 'start', target: 'qualify' },
          { id: 'e2', source: 'qualify', target: 'end' }
        ]),
        isActive: 1 // Use 1/0 for boolean in SQLite
      },
      {
        tenantId: tenant.id,
        name: 'Appointment Scheduler',
        description: 'Book appointments with customers',
        type: 'scheduler' as const,
        nodes: JSON.stringify([
          { id: 'start', type: 'start', position: { x: 100, y: 100 } },
          { id: 'schedule', type: 'calendar', position: { x: 250, y: 100 } },
          { id: 'confirm', type: 'confirmation', position: { x: 400, y: 100 } },
          { id: 'end', type: 'end', position: { x: 550, y: 100 } }
        ]),
        edges: JSON.stringify([
          { id: 'e1', source: 'start', target: 'schedule' },
          { id: 'e2', source: 'schedule', target: 'confirm' },
          { id: 'e3', source: 'confirm', target: 'end' }
        ]),
        isActive: 1 // Use 1/0 for boolean in SQLite
      }
    ];

    await db.insert(workflows).values(sampleWorkflows);

    // Create sample call logs for dashboard metrics
    console.log('Creating sample call logs...');
    const currentTime = Date.now();
    await db.insert(callLogs).values([
      {
        tenantId: tenant.id,
        agentId: createdAgents[0].id,
        callId: 'call-1',
        fromNumber: '+15551234567',
        toNumber: '+15559876543',
        type: 'inbound',
        status: 'completed',
        duration: 300,
        cost: 150,
        startTime: currentTime - 86400000, // 1 day ago
        endTime: currentTime - 86400000 + 300000
      },
      {
        tenantId: tenant.id,
        agentId: createdAgents[1].id,
        callId: 'call-2',
        fromNumber: '+15551234567',
        toNumber: '+15559876544',
        type: 'outbound',
        status: 'completed',
        duration: 180,
        cost: 90,
        startTime: currentTime - 43200000, // 12 hours ago
        endTime: currentTime - 43200000 + 180000
      }
    ]);

    // Create sample chat logs for dashboard metrics
    console.log('Creating sample chat logs...');
    await db.insert(chatLogs).values([
      {
        tenantId: tenant.id,
        agentId: createdAgents[0].id,
        chatId: 'chat-1',
        userId: 'user-1',
        messages: JSON.stringify([
          { role: 'user', content: 'Hello, I need help with my order', timestamp: currentTime - 7200000 },
          { role: 'assistant', content: 'I\'d be happy to help you with your order. Can you provide me with your order number?', timestamp: currentTime - 7200000 + 5000 }
        ]),
        duration: 900,
        messageCount: 8,
        type: 'widget',
        status: 'completed',
        startTime: currentTime - 7200000, // 2 hours ago
        endTime: currentTime - 7200000 + 900000
      },
      {
        tenantId: tenant.id,
        agentId: createdAgents[1].id,
        chatId: 'chat-2',
        userId: 'user-2',
        messages: JSON.stringify([
          { role: 'user', content: 'I\'m interested in your services', timestamp: currentTime - 3600000 },
          { role: 'assistant', content: 'Great! I\'d be happy to tell you more about our services. What specific area are you interested in?', timestamp: currentTime - 3600000 + 3000 }
        ]),
        duration: 600,
        messageCount: 5,
        type: 'widget',
        status: 'completed',
        startTime: currentTime - 3600000, // 1 hour ago
        endTime: currentTime - 3600000 + 600000
      }
    ]);

    console.log('✅ Database seeded successfully!');
    console.log(`📊 Created:
    - 1 tenant (${tenant.name})
    - 1 user (${user.username})
    - ${agentValues.length} agents
    - ${sampleContacts.length} contacts  
    - ${sampleWorkflows.length} workflows
    - 2 call logs
    - 2 chat logs`);

    return {
      tenant,
      user,
      agents: createdAgents,
      contacts: sampleContacts,
      workflows: sampleWorkflows
    };
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

export async function clearDatabase() {
  console.log('🧹 Clearing database...');
  try {
    // Clear tables in correct order (respecting foreign key constraints)
    await db.delete(agentPreferences);
    await db.delete(workflows);
    await db.delete(contacts);
    await db.delete(agents);
    await db.delete(users);
    await db.delete(tenants);
    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}