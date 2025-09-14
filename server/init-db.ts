import { db } from './db';
import { 
  users, tenants, agents, workflows, contacts, agentPreferences,
  conversations, messages, callLogs, chatLogs, webhooks, apiKeys
} from '@shared/schema';
import { seedDatabase } from './seed';
import { createTables } from './create-tables';

export async function initializeDatabase() {
  console.log('🔧 Initializing database...');
  
  try {
    // Create tables first
    await createTables();
    
    // Check if database has data
    try {
      const existingTenants = await db.select().from(tenants);
      
      if (existingTenants.length === 0) {
        console.log('📭 No existing data found, seeding database...');
        await seedDatabase();
      } else {
        console.log(`📊 Found ${existingTenants.length} existing tenant(s), skipping seeding`);
      }
    } catch (error) {
      console.log('📭 Database appears empty, seeding...');
      await seedDatabase();
    }
    
    console.log('✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't throw - let the app continue even if seeding fails
  }
}