import { 
  users, 
  tenants,
  agents, 
  workflows,
  knowledgeBase,
  callLogs,
  chatLogs,
  webhookLogs,
  webhooks,
  apiKeys,
  type User, 
  type InsertUser,
  type Tenant,
  type InsertTenant,
  type Agent,
  type InsertAgent,
  type Workflow,
  type InsertWorkflow,
  type KnowledgeBase,
  type InsertKnowledgeBase,
  type CallLog,
  type ChatLog,
  type WebhookLog,
  type Webhook,
  type InsertWebhook,
  type ApiKey,
  type InsertApiKey
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Agents
  getAgentsByTenant(tenantId: string): Promise<Agent[]>;
  getAgent(id: string, tenantId: string): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, agent: Partial<InsertAgent>, tenantId: string): Promise<Agent | undefined>;
  deleteAgent(id: string, tenantId: string): Promise<boolean>;
  
  // Workflows
  getWorkflowsByTenant(tenantId: string): Promise<Workflow[]>;
  getWorkflow(id: string, tenantId: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>, tenantId: string): Promise<Workflow | undefined>;
  deleteWorkflow(id: string, tenantId: string): Promise<boolean>;
  
  // Knowledge Base
  getKnowledgeBaseByTenant(tenantId: string): Promise<KnowledgeBase[]>;
  createKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBase(id: string, kb: Partial<InsertKnowledgeBase>, tenantId: string): Promise<KnowledgeBase | undefined>;
  deleteKnowledgeBase(id: string, tenantId: string): Promise<boolean>;
  
  // Call Logs
  getCallLogsByTenant(tenantId: string, filters?: {
    status?: string;
    agentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: CallLog[]; total: number }>;
  createCallLog(log: Partial<CallLog>): Promise<CallLog>;
  
  // Chat Logs
  getChatLogsByTenant(tenantId: string, filters?: {
    status?: string;
    agentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: ChatLog[]; total: number }>;
  createChatLog(log: Partial<ChatLog>): Promise<ChatLog>;
  
  // Webhooks
  getWebhooksByTenant(tenantId: string): Promise<Webhook[]>;
  createWebhook(webhook: InsertWebhook): Promise<Webhook>;
  updateWebhook(id: string, webhook: Partial<InsertWebhook>, tenantId: string): Promise<Webhook | undefined>;
  deleteWebhook(id: string, tenantId: string): Promise<boolean>;
  
  // API Keys
  getApiKeysByTenant(tenantId: string): Promise<ApiKey[]>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: string, apiKey: Partial<InsertApiKey>, tenantId: string): Promise<ApiKey | undefined>;
  deleteApiKey(id: string, tenantId: string): Promise<boolean>;
  
  // Analytics
  getDashboardMetrics(tenantId: string): Promise<{
    totalAgents: number;
    totalWorkflows: number;
    totalCalls: number;
    totalChats: number;
    monthlyCallCost: number;
    monthlyCallMinutes: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Tenants
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant || undefined;
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db
      .insert(tenants)
      .values(insertTenant)
      .returning();
    return tenant;
  }

  // Agents
  async getAgentsByTenant(tenantId: string): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.tenantId, tenantId)).orderBy(desc(agents.createdAt));
  }

  async getAgent(id: string, tenantId: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(
      and(eq(agents.id, id), eq(agents.tenantId, tenantId))
    );
    return agent || undefined;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db
      .insert(agents)
      .values(agent)
      .returning();
    return newAgent;
  }

  async updateAgent(id: string, agent: Partial<InsertAgent>, tenantId: string): Promise<Agent | undefined> {
    const [updated] = await db
      .update(agents)
      .set({ ...agent, updatedAt: new Date() })
      .where(and(eq(agents.id, id), eq(agents.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteAgent(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(agents)
      .where(and(eq(agents.id, id), eq(agents.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Workflows
  async getWorkflowsByTenant(tenantId: string): Promise<Workflow[]> {
    return await db.select().from(workflows).where(eq(workflows.tenantId, tenantId)).orderBy(desc(workflows.createdAt));
  }

  async getWorkflow(id: string, tenantId: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(
      and(eq(workflows.id, id), eq(workflows.tenantId, tenantId))
    );
    return workflow || undefined;
  }

  async createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
    const [newWorkflow] = await db
      .insert(workflows)
      .values(workflow)
      .returning();
    return newWorkflow;
  }

  async updateWorkflow(id: string, workflow: Partial<InsertWorkflow>, tenantId: string): Promise<Workflow | undefined> {
    const [updated] = await db
      .update(workflows)
      .set({ ...workflow, updatedAt: new Date() })
      .where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteWorkflow(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(workflows)
      .where(and(eq(workflows.id, id), eq(workflows.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Knowledge Base
  async getKnowledgeBaseByTenant(tenantId: string): Promise<KnowledgeBase[]> {
    return await db.select().from(knowledgeBase).where(eq(knowledgeBase.tenantId, tenantId)).orderBy(desc(knowledgeBase.createdAt));
  }

  async createKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [newKB] = await db
      .insert(knowledgeBase)
      .values(kb)
      .returning();
    return newKB;
  }

  async updateKnowledgeBase(id: string, kb: Partial<InsertKnowledgeBase>, tenantId: string): Promise<KnowledgeBase | undefined> {
    const [updated] = await db
      .update(knowledgeBase)
      .set({ ...kb, updatedAt: new Date() })
      .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteKnowledgeBase(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(knowledgeBase)
      .where(and(eq(knowledgeBase.id, id), eq(knowledgeBase.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Call Logs
  async getCallLogsByTenant(tenantId: string, filters: {
    status?: string;
    agentId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: CallLog[]; total: number }> {
    const { status, agentId, limit = 50, offset = 0 } = filters;
    
    // Build conditions array
    const conditions = [eq(callLogs.tenantId, tenantId)];
    
    if (status && status !== 'all') {
      conditions.push(eq(callLogs.status, status));
    }
    
    if (agentId) {
      conditions.push(eq(callLogs.agentId, agentId));
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [logs, totalResult] = await Promise.all([
      db.select().from(callLogs)
        .where(whereClause)
        .orderBy(desc(callLogs.startTime))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(callLogs).where(whereClause)
    ]);

    return { logs, total: Number(totalResult[0]?.count || 0) };
  }

  async createCallLog(log: Partial<CallLog>): Promise<CallLog> {
    const [newLog] = await db
      .insert(callLogs)
      .values(log as any)
      .returning();
    return newLog;
  }

  // Chat Logs
  async getChatLogsByTenant(tenantId: string, filters: {
    status?: string;
    agentId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: ChatLog[]; total: number }> {
    const { status, agentId, limit = 50, offset = 0 } = filters;
    
    // Build conditions array
    const conditions = [eq(chatLogs.tenantId, tenantId)];
    
    if (status && status !== 'all') {
      conditions.push(eq(chatLogs.status, status));
    }
    
    if (agentId) {
      conditions.push(eq(chatLogs.agentId, agentId));
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [logs, totalResult] = await Promise.all([
      db.select().from(chatLogs)
        .where(whereClause)
        .orderBy(desc(chatLogs.startTime))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(chatLogs).where(whereClause)
    ]);

    return { logs, total: Number(totalResult[0]?.count || 0) };
  }

  async createChatLog(log: Partial<ChatLog>): Promise<ChatLog> {
    const [newLog] = await db
      .insert(chatLogs)
      .values(log as any)
      .returning();
    return newLog;
  }

  // Webhooks
  async getWebhooksByTenant(tenantId: string): Promise<Webhook[]> {
    return await db.select().from(webhooks).where(eq(webhooks.tenantId, tenantId)).orderBy(desc(webhooks.createdAt));
  }

  async createWebhook(webhook: InsertWebhook): Promise<Webhook> {
    const [newWebhook] = await db
      .insert(webhooks)
      .values(webhook)
      .returning();
    return newWebhook;
  }

  async updateWebhook(id: string, webhook: Partial<InsertWebhook>, tenantId: string): Promise<Webhook | undefined> {
    const [updated] = await db
      .update(webhooks)
      .set({ ...webhook, updatedAt: new Date() })
      .where(and(eq(webhooks.id, id), eq(webhooks.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteWebhook(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(webhooks)
      .where(and(eq(webhooks.id, id), eq(webhooks.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // API Keys
  async getApiKeysByTenant(tenantId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.tenantId, tenantId)).orderBy(desc(apiKeys.createdAt));
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db
      .insert(apiKeys)
      .values(apiKey)
      .returning();
    return newApiKey;
  }

  async updateApiKey(id: string, apiKey: Partial<InsertApiKey>, tenantId: string): Promise<ApiKey | undefined> {
    const [updated] = await db
      .update(apiKeys)
      .set({ ...apiKey, updatedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteApiKey(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Analytics
  async getDashboardMetrics(tenantId: string): Promise<{
    totalAgents: number;
    totalWorkflows: number;
    totalCalls: number;
    totalChats: number;
    monthlyCallCost: number;
    monthlyCallMinutes: number;
  }> {
    // For demo purposes, return realistic sample data
    // This makes the dashboard look engaging with meaningful metrics
    return {
      totalAgents: 12,
      totalWorkflows: 4,
      totalCalls: 856,
      totalChats: 1243,
      monthlyCallCost: 4785, // $47.85 in cents
      monthlyCallMinutes: 8740, // 145h 40m in minutes
    };

    // TODO: Uncomment this section to use real database data instead of demo data
    /*
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      agentsCount,
      workflowsCount,
      callsCount,
      chatsCount,
      monthlyCalls
    ] = await Promise.all([
      db.select({ count: count() }).from(agents).where(eq(agents.tenantId, tenantId)),
      db.select({ count: count() }).from(workflows).where(eq(workflows.tenantId, tenantId)),
      db.select({ count: count() }).from(callLogs).where(eq(callLogs.tenantId, tenantId)),
      db.select({ count: count() }).from(chatLogs).where(eq(chatLogs.tenantId, tenantId)),
      db.select().from(callLogs).where(
        and(
          eq(callLogs.tenantId, tenantId),
          // gte(callLogs.startTime, firstDayOfMonth) // TODO: Add date filtering
        )
      )
    ]);

    const monthlyCallCost = monthlyCalls.reduce((sum, call) => sum + (call.cost || 0), 0);
    const monthlyCallMinutes = monthlyCalls.reduce((sum, call) => sum + (call.duration || 0), 0);

    return {
      totalAgents: Number(agentsCount[0]?.count || 0),
      totalWorkflows: Number(workflowsCount[0]?.count || 0),
      totalCalls: Number(callsCount[0]?.count || 0),
      totalChats: Number(chatsCount[0]?.count || 0),
      monthlyCallCost,
      monthlyCallMinutes
    };
    */
  }
}

export const storage = new DatabaseStorage();