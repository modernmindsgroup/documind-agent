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
  contacts,
  agentPreferences,
  conversations,
  messages,
  llmProviders,
  llmModels,
  llmConfigurations,
  voiceProviders,
  voices,
  voiceModels,
  voiceConfigurations,
  transcriberProviders,
  transcriberLanguages,
  transcriberModels,
  transcriberConfigurations,
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
  type InsertApiKey,
  type Contact,
  type InsertContact,
  type AgentPreferences,
  type InsertAgentPreferences,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, count, sql, gte, lt } from "drizzle-orm";

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
  
  // Agent Preferences
  getAgentPreferences(agentId: string, tenantId: string): Promise<AgentPreferences | undefined>;
  updateAgentPreferences(agentId: string, preferences: Partial<InsertAgentPreferences>, tenantId: string): Promise<AgentPreferences | undefined>;
  
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
  
  // Conversations
  getConversationsByTenant(tenantId: string, filters?: {
    agentId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ conversations: Conversation[]; total: number }>;
  getConversation(id: string, tenantId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, conversation: Partial<InsertConversation>, tenantId: string): Promise<Conversation | undefined>;
  
  // Messages
  getMessagesByConversation(conversationId: string, tenantId: string, filters?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ messages: Message[]; total: number }>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Analytics
  getDashboardMetrics(tenantId: string): Promise<{
    totalAgents: number;
    totalWorkflows: number;
    totalCalls: number;
    totalChats: number;
    monthlyCallCost: number;
    monthlyCallMinutes: number;
  }>;

  // Agent-specific methods
  getAgentStats(agentId: string, tenantId: string): Promise<{
    totalCalls: number;
    successRate: number;
    averageDuration: number;
    weeklyGrowth: number;
  } | null>;

  getAgentActivity(agentId: string, tenantId: string, limit?: number): Promise<{
    id: string;
    type: 'call' | 'chat';
    status: 'completed' | 'failed' | 'active';
    phoneNumber?: string;
    duration?: number;
    createdAt: Date;
  }[]>;

  updateAgentStatus(agentId: string, isActive: boolean, tenantId: string): Promise<Agent | null>;

  updateAgentConfiguration(agentId: string, config: {
    llm?: {
      provider: string;
      model: string;
      prompt?: string;
      maxTokens?: number;
      temperature?: number;
    };
    transcriber?: {
      provider: string;
      language: string;
      model: string;
    };
    voice?: {
      provider: string;
      voice: string;
      model: string;
    };
  }, tenantId: string): Promise<Agent | null>;
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
    // Wrap everything in a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      const [newAgent] = await tx
        .insert(agents)
        .values(agent)
        .returning();

      // Create default agent preferences
      await tx.insert(agentPreferences).values({
        agentId: newAgent.id,
        isContactRequired: true,
        displayName: newAgent.name,
        widgetThemeColor: "#2563eb",
      });

      // Get first available providers and models (more robust than hardcoded names)
      const [defaultLlmProvider] = await tx.select().from(llmProviders).where(eq(llmProviders.isActive, true)).limit(1);
      const [defaultLlmModel] = await tx.select().from(llmModels).where(eq(llmModels.llmProviderId, defaultLlmProvider?.id || '')).limit(1);
      
      const [defaultVoiceProvider] = await tx.select().from(voiceProviders).where(eq(voiceProviders.isActive, true)).limit(1);
      const [defaultVoice] = await tx.select().from(voices).where(eq(voices.voiceProviderId, defaultVoiceProvider?.id || '')).limit(1);
      const [defaultVoiceModel] = await tx.select().from(voiceModels).where(eq(voiceModels.voiceProviderId, defaultVoiceProvider?.id || '')).limit(1);
      
      const [defaultTranscriberProvider] = await tx.select().from(transcriberProviders).where(eq(transcriberProviders.isActive, true)).limit(1);
      const [defaultTranscriberLanguage] = await tx.select().from(transcriberLanguages).where(eq(transcriberLanguages.transcriberProviderId, defaultTranscriberProvider?.id || '')).limit(1);
      const [defaultTranscriberModel] = await tx.select().from(transcriberModels).where(eq(transcriberModels.transcriberProviderId, defaultTranscriberProvider?.id || '')).limit(1);

      // Create default LLM configuration
      if (defaultLlmProvider && defaultLlmModel) {
        await tx.insert(llmConfigurations).values({
          agentId: newAgent.id,
          llmProviderId: defaultLlmProvider.id,
          llmModelId: defaultLlmModel.id,
          systemPrompt: "You are a helpful AI assistant. Be concise and helpful in your responses.",
          temperature: 70, // Fixed: 70 represents 0.7 in integer scale
          maxTokens: 2048,
        });
      }

      // Create default voice configuration (removed non-existent voiceSettings)
      if (defaultVoiceProvider && defaultVoice && defaultVoiceModel) {
        await tx.insert(voiceConfigurations).values({
          agentId: newAgent.id,
          voiceProviderId: defaultVoiceProvider.id,
          voiceId: defaultVoice.id,
          voiceModelId: defaultVoiceModel.id,
        });
      }

      // Create default transcriber configuration (removed non-existent transcriberSettings)
      if (defaultTranscriberProvider && defaultTranscriberLanguage && defaultTranscriberModel) {
        await tx.insert(transcriberConfigurations).values({
          agentId: newAgent.id,
          transcriberProviderId: defaultTranscriberProvider.id,
          transcriberLanguageId: defaultTranscriberLanguage.id,
          transcriberModelId: defaultTranscriberModel.id,
        });
      }

      return newAgent;
    });
  }

  async getAgentPreferences(agentId: string, tenantId: string): Promise<AgentPreferences | undefined> {
    // First verify the agent belongs to the tenant
    const agent = await this.getAgent(agentId, tenantId);
    if (!agent) return undefined;

    // Then get the preferences for this agent
    const [prefs] = await db.select().from(agentPreferences).where(
      eq(agentPreferences.agentId, agentId)
    );
    return prefs || undefined;
  }

  async updateAgentPreferences(agentId: string, preferences: Partial<InsertAgentPreferences>, tenantId: string): Promise<AgentPreferences | undefined> {
    // Ensure the agent belongs to the tenant before updating preferences
    const agent = await this.getAgent(agentId, tenantId);
    if (!agent) return undefined;

    const updateData = { ...preferences }; // Removed updatedAt as it may not exist in schema
    const [updated] = await db
      .update(agentPreferences)
      .set(updateData)
      .where(eq(agentPreferences.agentId, agentId))
      .returning();
    return updated || undefined;
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
      conditions.push(eq(callLogs.status, status as any));
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
      conditions.push(eq(chatLogs.status, status as any));
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
    // Use real database data instead of demo data
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      agentsCount,
      workflowsCount,
      callsCount,
      chatsCount,
      monthlyCalls
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(agents).where(eq(agents.tenantId, tenantId)),
      db.select({ count: sql<number>`count(*)` }).from(workflows).where(eq(workflows.tenantId, tenantId)),
      db.select({ count: sql<number>`count(*)` }).from(callLogs).where(eq(callLogs.tenantId, tenantId)),
      db.select({ count: sql<number>`count(*)` }).from(chatLogs).where(eq(chatLogs.tenantId, tenantId)),
      db.select().from(callLogs).where(
        and(
          eq(callLogs.tenantId, tenantId),
          gte(callLogs.startTime, firstDayOfMonth)
        )
      )
    ]);

    const monthlyCallCost = monthlyCalls.reduce((sum, call) => sum + (call.cost || 0), 0);
    const monthlyCallMinutes = Math.floor(monthlyCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / 60);

    return {
      totalAgents: Number(agentsCount[0]?.count || 0),
      totalWorkflows: Number(workflowsCount[0]?.count || 0),
      totalCalls: Number(callsCount[0]?.count || 0),
      totalChats: Number(chatsCount[0]?.count || 0),
      monthlyCallCost,
      monthlyCallMinutes
    };

  }

  // Agent-specific stats and activity methods
  async getAgentStats(agentId: string, tenantId: string): Promise<{
    totalCalls: number;
    totalChats: number;
    successRate: number;
    averageDuration: number;
    weeklyGrowth: number;
  } | null> {
    // First verify the agent exists and belongs to the tenant
    const agent = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)))
      .limit(1);
    
    if (agent.length === 0) {
      return null;
    }

    // Get call statistics for this specific agent
    const callStats = await db
      .select({
        total: sql<number>`count(*)`,
        successful: sql<number>`count(case when status = 'completed' then 1 end)`,
        avgDuration: sql<number>`avg(duration)`,
      })
      .from(callLogs)
      .where(eq(callLogs.agentId, agentId));

    const stats = callStats[0];
    const totalCalls = stats.total || 0;
    const successRate = totalCalls > 0 ? (stats.successful || 0) / totalCalls : 0;
    const averageDuration = stats.avgDuration || 180;

    // Get chat statistics for this specific agent
    const chatStats = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(chatLogs)
      .where(eq(chatLogs.agentId, agentId));

    const totalChats = chatStats[0]?.total || 0;

    // Calculate weekly growth (simplified - comparing last 7 days vs previous 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [recentCalls] = await db
      .select({ count: sql<number>`count(*)` })
      .from(callLogs)
      .where(and(
        eq(callLogs.agentId, agentId),
        gte(callLogs.startTime, oneWeekAgo)
      ));

    const [previousCalls] = await db
      .select({ count: sql<number>`count(*)` })
      .from(callLogs)
      .where(and(
        eq(callLogs.agentId, agentId),
        gte(callLogs.startTime, twoWeeksAgo),
        lt(callLogs.startTime, oneWeekAgo)
      ));

    const recentCount = recentCalls.count || 0;
    const previousCount = previousCalls.count || 0;
    const weeklyGrowth = previousCount > 0 ? (recentCount - previousCount) / previousCount : 0;

    return {
      totalCalls,
      totalChats,
      successRate,
      averageDuration: Math.round(averageDuration),
      weeklyGrowth,
    };
  }

  async getAgentActivity(agentId: string, tenantId: string, limit: number = 10): Promise<{
    id: string;
    type: 'call' | 'chat';
    status: 'completed' | 'failed' | 'active';
    phoneNumber?: string;
    duration?: number;
    createdAt: Date;
  }[]> {
    // First verify the agent exists and belongs to the tenant
    const agent = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)))
      .limit(1);
    
    if (agent.length === 0) {
      return [];
    }

    // Get actual activity data from both call and chat logs
    const callActivity = await db
      .select({
        id: callLogs.id,
        type: sql<'call'>`'call'`,
        status: callLogs.status,
        phoneNumber: callLogs.fromNumber,
        duration: callLogs.duration,
        createdAt: callLogs.startTime,
      })
      .from(callLogs)
      .where(eq(callLogs.agentId, agentId))
      .orderBy(desc(callLogs.startTime))
      .limit(Math.ceil(limit / 2));

    const chatActivity = await db
      .select({
        id: chatLogs.id,
        type: sql<'chat'>`'chat'`,
        status: chatLogs.status,
        phoneNumber: sql<string>`null`,
        duration: chatLogs.duration,
        createdAt: chatLogs.startTime,
      })
      .from(chatLogs)
      .where(eq(chatLogs.agentId, agentId))
      .orderBy(desc(chatLogs.startTime))
      .limit(Math.ceil(limit / 2));

    // Combine and sort by creation time
    const allActivity = [...callActivity, ...chatActivity]
      .filter(activity => activity.createdAt !== null)
      .sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime())
      .slice(0, limit);

    return allActivity.map(activity => ({
      ...activity,
      status: activity.status as 'completed' | 'failed' | 'active',
      phoneNumber: activity.phoneNumber || undefined,
      duration: activity.duration || undefined,
      createdAt: activity.createdAt as Date,
    }));
  }

  async updateAgentStatus(agentId: string, isActive: boolean, tenantId: string): Promise<Agent | null> {
    const [updatedAgent] = await db
      .update(agents)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)))
      .returning();
    return updatedAgent || null;
  }

  async updateAgentConfiguration(agentId: string, config: {
    llm?: {
      provider: string;
      model: string;
      prompt?: string;
      maxTokens?: number;
      temperature?: number;
    };
    transcriber?: {
      provider: string;
      language: string;
      model: string;
    };
    voice?: {
      provider: string;
      voice: string;
      model: string;
    };
  }, tenantId: string): Promise<Agent | null> {
    // Update agent with new configuration, ensuring tenant scoping
    const updateData: Partial<Agent> = { updatedAt: new Date() };
    
    // Configuration is now handled by separate configuration tables
    // TODO: Implement proper configuration updates using llmConfigurations, voiceConfigurations, etc.
    
    const [updatedAgent] = await db
      .update(agents)
      .set(updateData)
      .where(and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)))
      .returning();
    
    return updatedAgent || null;
  }

  // Conversations
  async getConversationsByTenant(tenantId: string, filters: {
    agentId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ conversations: Conversation[]; total: number }> {
    const { agentId, search, limit = 50, offset = 0 } = filters;
    
    // Build conditions array
    const conditions = [eq(conversations.tenantId, tenantId)];
    
    if (agentId) {
      conditions.push(eq(conversations.agentId, agentId));
    }
    
    if (search && search.trim()) {
      conditions.push(like(conversations.title, `%${search}%`));
    }

    const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

    const [conversationsList, totalResult] = await Promise.all([
      db.select().from(conversations)
        .where(whereClause)
        .orderBy(desc(conversations.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(conversations).where(whereClause)
    ]);

    return { conversations: conversationsList, total: Number(totalResult[0]?.count || 0) };
  }

  async getConversation(id: string, tenantId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)))
      .limit(1);
    return conversation || undefined;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async updateConversation(id: string, conversation: Partial<InsertConversation>, tenantId: string): Promise<Conversation | undefined> {
    const [updated] = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }
  
  // Messages
  async getMessagesByConversation(conversationId: string, tenantId: string, filters: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ messages: Message[]; total: number }> {
    const { search, limit = 100, offset = 0 } = filters;
    
    // Build conditions array
    const conditions = [
      eq(messages.conversationId, conversationId),
      eq(messages.tenantId, tenantId)
    ];
    
    if (search && search.trim()) {
      conditions.push(like(messages.content, `%${search}%`));
    }

    const whereClause = conditions.length === 2 ? and(...conditions) : and(...conditions);

    const [messagesList, totalResult] = await Promise.all([
      db.select().from(messages)
        .where(whereClause)
        .orderBy(messages.createdAt) // Order chronologically for conversation flow
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(messages).where(whereClause)
    ]);

    return { messages: messagesList, total: Number(totalResult[0]?.count || 0) };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();