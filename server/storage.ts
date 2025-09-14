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
  rooms,
  roomAgents,
  calls,
  llmProviders,
  llmModels,
  llmConfigurations,
  userCredits,
  transactions,
  paymentSessions,
  documents,
  agentDocuments,
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
  type InsertMessage,
  type Room,
  type InsertRoom,
  type RoomAgent,
  type InsertRoomAgent,
  type Call,
  type InsertCall,
  type UserCredits,
  type InsertUserCredits,
  type Transaction,
  type InsertTransaction,
  type PaymentSession,
  type InsertPaymentSession,
  type Document,
  type InsertDocument,
  type AgentDocument,
  type InsertAgentDocument
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, count, sql, gte, lt } from "drizzle-orm";

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
  getAgentById(id: string): Promise<Agent | undefined>; // Widget API - no tenant filter
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, agent: Partial<InsertAgent>, tenantId: string): Promise<Agent | undefined>;
  deleteAgent(id: string, tenantId: string): Promise<boolean>;
  
  // Agent Preferences
  getAgentPreferences(agentId: string, tenantId: string): Promise<AgentPreferences | undefined>;
  updateAgentPreferences(agentId: string, preferences: Partial<InsertAgentPreferences>, tenantId: string): Promise<AgentPreferences | undefined>;

  // Contacts
  createContact(contact: InsertContact): Promise<Contact>;
  getContactById(id: string, tenantId: string): Promise<Contact | undefined>;
  getContactsByTenant(tenantId: string, filters?: {
    search?: string;
    status?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<Contact[]>;
  updateContact(id: string, contact: Partial<InsertContact>, tenantId: string): Promise<Contact | undefined>;
  deleteContact(id: string, tenantId: string): Promise<boolean>;
  getContactStats(tenantId: string): Promise<{
    total: number;
    active: number;
    newThisMonth: number;
    activePercentage: string;
    recentActivity: number;
    avgInteractions: number;
  }>;
  
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
  getConversationById(id: string): Promise<Conversation | undefined>; // Widget API - no tenant filter
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

  getRecentActivity(tenantId: string, limit?: number): Promise<{
    id: string;
    type: 'agent_created' | 'workflow_updated' | 'call_completed' | 'chat_ended';
    title: string;
    description: string;
    timestamp: string;
    user: string;
  }[]>;

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

  // Rooms
  getRoomsByTenant(tenantId: string, filters?: {
    status?: string;
    agentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rooms: Room[]; total: number }>;
  getRoom(id: string, tenantId: string): Promise<Room | undefined>;
  getRoomByAgentId(agentId: string, tenantId: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, room: Partial<InsertRoom>, tenantId: string): Promise<Room | undefined>;

  // Room Agents
  getRoomAgentsByRoom(roomId: string, tenantId: string): Promise<RoomAgent[]>;
  createRoomAgent(roomAgent: InsertRoomAgent): Promise<RoomAgent>;
  deleteRoomAgent(roomId: string, agentId: string, tenantId: string): Promise<boolean>;

  // Calls
  getCallsByTenant(tenantId: string, filters?: {
    status?: string;
    agentId?: string;
    roomId?: string;
    contactId?: string;
    direction?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ calls: Call[]; total: number }>;
  getCall(id: string, tenantId: string): Promise<Call | undefined>;
  createCall(call: InsertCall): Promise<Call>;
  updateCall(id: string, call: Partial<InsertCall>, tenantId: string): Promise<Call | undefined>;

  // Billing
  getUserCredits(userId: string, tenantId: string): Promise<UserCredits | undefined>;
  createUserCredits(userCredits: InsertUserCredits): Promise<UserCredits>;
  updateUserCredits(userId: string, tenantId: string, balance: string): Promise<UserCredits | undefined>;
  getTransactionsByUser(userId: string, tenantId: string, filters?: {
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: Transaction[]; total: number }>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getPaymentSessionByReference(reference: string): Promise<PaymentSession | undefined>;
  createPaymentSession(session: InsertPaymentSession): Promise<PaymentSession>;
  updatePaymentSession(reference: string, updates: Partial<InsertPaymentSession>): Promise<PaymentSession | undefined>;

  // Documents
  getDocumentsByTenant(tenantId: string, filters?: {
    search?: string;
    mimeType?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ documents: Document[]; total: number }>;
  getDocument(id: string, tenantId: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>, tenantId: string): Promise<Document | undefined>;
  deleteDocument(id: string, tenantId: string): Promise<boolean>;

  // Agent-Document associations
  getAgentDocuments(agentId: string, tenantId: string, filters?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ documents: (Document & { addedBy: string; addedAt: string })[]; total: number }>;
  addAgentDocument(association: InsertAgentDocument): Promise<AgentDocument>;
  removeAgentDocument(agentId: string, documentId: string, tenantId: string): Promise<boolean>;
  getDocumentsByAgent(agentId: string, tenantId: string): Promise<Document[]>;
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

  async getAgentById(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
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

      // Get first available LLM provider and model for text conversations
      const [defaultLlmProvider] = await tx.select().from(llmProviders).where(eq(llmProviders.isActive, true)).limit(1);
      const [defaultLlmModel] = await tx.select().from(llmModels).where(eq(llmModels.llmProviderId, defaultLlmProvider?.id || '')).limit(1);

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

      // Voice functionality has been removed
      // Voice and transcriber configurations are no longer created by default

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
    
    // Use upsert pattern: try to update first, if no rows affected, insert new
    let updated = await db
      .update(agentPreferences)
      .set(updateData)
      .where(eq(agentPreferences.agentId, agentId))
      .returning();

    // If no rows were updated (preferences don't exist yet), create them
    if (updated.length === 0) {
      const insertData = { agentId, ...updateData };
      updated = await db
        .insert(agentPreferences)
        .values(insertData)
        .returning();
    }

    // Voice platform functionality has been removed
    // No longer sync realtimeVoicePlatform with agent callPlatform

    return updated[0] || undefined;
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

  async getRecentActivity(tenantId: string, limit: number = 10): Promise<{
    id: string;
    type: 'agent_created' | 'workflow_updated' | 'call_completed' | 'chat_ended';
    title: string;
    description: string;
    timestamp: string;
    user: string;
  }[]> {
    const activities: Array<{
      id: string;
      type: 'agent_created' | 'workflow_updated' | 'call_completed' | 'chat_ended';
      title: string;
      description: string;
      timestamp: string;
      user: string;
    }> = [];

    // Get recent agents created (last 30 days) - fetch more to ensure global sorting
    const recentAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
        createdAt: agents.createdAt,
        editedBy: agents.editedBy
      })
      .from(agents)
      .leftJoin(users, eq(agents.editedBy, users.id))
      .where(
        and(
          eq(agents.tenantId, tenantId),
          gte(agents.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(agents.createdAt))
      .limit(limit * 3); // Fetch more to avoid missing recent items in global sort

    recentAgents.forEach(agent => {
      activities.push({
        id: agent.id,
        type: 'agent_created',
        title: `Agent "${agent.name}" created`,
        description: `New agent was added to the system`,
        timestamp: agent.createdAt?.toISOString() || new Date().toISOString(),
        user: agent.editedBy || 'System'
      });
    });

    // Get recent workflows updated (last 30 days) - fetch more to ensure global sorting
    const recentWorkflows = await db
      .select({
        id: workflows.id,
        name: workflows.name,
        updatedAt: workflows.updatedAt
      })
      .from(workflows)
      .where(
        and(
          eq(workflows.tenantId, tenantId),
          gte(workflows.updatedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(workflows.updatedAt))
      .limit(limit * 3); // Fetch more to avoid missing recent items in global sort

    recentWorkflows.forEach(workflow => {
      activities.push({
        id: workflow.id,
        type: 'workflow_updated',
        title: `Workflow "${workflow.name}" updated`,
        description: `Workflow configuration was modified`,
        timestamp: workflow.updatedAt?.toISOString() || new Date().toISOString(),
        user: 'System'
      });
    });

    // Get recent completed calls (last 7 days) - fetch more to ensure global sorting
    const recentCalls = await db
      .select({
        id: callLogs.id,
        callId: callLogs.callId,
        agentId: callLogs.agentId,
        status: callLogs.status,
        startTime: callLogs.startTime,
        duration: callLogs.duration
      })
      .from(callLogs)
      .leftJoin(agents, eq(callLogs.agentId, agents.id))
      .where(
        and(
          eq(callLogs.tenantId, tenantId),
          gte(callLogs.startTime, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(callLogs.startTime))
      .limit(limit * 3); // Fetch more to avoid missing recent items in global sort

    recentCalls.forEach(call => {
      activities.push({
        id: call.id,
        type: 'call_completed',
        title: `Call ${call.status}`,
        description: `${call.duration ? Math.floor(call.duration / 60) : 0} min call completed`,
        timestamp: call.startTime?.toISOString() || new Date().toISOString(),
        user: 'System'
      });
    });

    // Get recent chat sessions (last 7 days) - fetch more to ensure global sorting
    const recentChats = await db
      .select({
        id: chatLogs.id,
        chatId: chatLogs.chatId,
        agentId: chatLogs.agentId,
        status: chatLogs.status,
        startTime: chatLogs.startTime,
        messageCount: chatLogs.messageCount
      })
      .from(chatLogs)
      .leftJoin(agents, eq(chatLogs.agentId, agents.id))
      .where(
        and(
          eq(chatLogs.tenantId, tenantId),
          gte(chatLogs.startTime, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(desc(chatLogs.startTime))
      .limit(limit * 3); // Fetch more to avoid missing recent items in global sort

    recentChats.forEach(chat => {
      activities.push({
        id: chat.id,
        type: 'chat_ended',
        title: `Chat ${chat.status}`,
        description: `${chat.messageCount || 0} messages exchanged`,
        timestamp: chat.startTime?.toISOString() || new Date().toISOString(),
        user: 'System'
      });
    });

    // Sort all activities globally by timestamp DESC and apply final limit
    // This ensures true chronological order across all activity types
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
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
    // TODO: Implement proper configuration updates using llmConfigurations, etc.
    
    const [updatedAgent] = await db
      .update(agents)
      .set(updateData)
      .where(and(eq(agents.id, agentId), eq(agents.tenantId, tenantId)))
      .returning();
    
    return updatedAgent || null;
  }

  // Contacts
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values(contact)
      .returning();
    return newContact;
  }

  async getContactById(id: string, tenantId: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
    return contact || undefined;
  }

  async getContactsByTenant(tenantId: string, filters: {
    search?: string;
    status?: string;
    source?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Contact[]> {
    let query = db
      .select()
      .from(contacts)
      .where(eq(contacts.tenantId, tenantId));

    // Add search filter
    if (filters.search) {
      query = query.where(
        or(
          like(contacts.name, `%${filters.search}%`),
          like(contacts.email, `%${filters.search}%`),
          like(contacts.phone, `%${filters.search}%`)
        )
      );
    }

    // Add pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    // Order by creation date
    query = query.orderBy(desc(contacts.createdAt));

    const contactsList = await query;
    return contactsList;
  }

  async updateContact(id: string, contact: Partial<InsertContact>, tenantId: string): Promise<Contact | undefined> {
    const updateData = {
      ...contact,
      updatedAt: new Date()
    };

    const [updatedContact] = await db
      .update(contacts)
      .set(updateData)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)))
      .returning();
    
    return updatedContact || undefined;
  }

  async deleteContact(id: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.tenantId, tenantId)));
    
    return result.count > 0;
  }

  async getContactStats(tenantId: string): Promise<{
    total: number;
    active: number;
    newThisMonth: number;
    activePercentage: string;
    recentActivity: number;
    avgInteractions: number;
  }> {
    // Get total contacts
    const [totalResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.tenantId, tenantId));
    
    const total = totalResult.count;

    // Get contacts created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const [newThisMonthResult] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(
        eq(contacts.tenantId, tenantId),
        gte(contacts.createdAt, startOfMonth)
      ));
    
    const newThisMonth = newThisMonthResult.count;

    // For now, we'll calculate basic stats
    // In a real implementation, you'd have status and interaction tracking
    const active = Math.floor(total * 0.7); // Assume 70% are active
    const activePercentage = total > 0 ? Math.round((active / total) * 100).toString() : "0";
    const recentActivity = Math.floor(total * 0.3); // Assume 30% recent activity
    const avgInteractions = total > 0 ? Math.floor(Math.random() * 10) + 5 : 0; // Mock data

    return {
      total,
      active,
      newThisMonth,
      activePercentage,
      recentActivity,
      avgInteractions
    };
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

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
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

  // Rooms
  async getRoomsByTenant(tenantId: string, filters: {
    status?: string;
    agentId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ rooms: Room[]; total: number }> {
    const { status, agentId, limit = 100, offset = 0 } = filters;
    
    const conditions = [eq(rooms.tenantId, tenantId)];
    
    if (status) {
      conditions.push(eq(rooms.status, status as any));
    }
    
    if (agentId) {
      conditions.push(eq(rooms.createdByAgentId, agentId));
    }

    const whereClause = and(...conditions);

    const [roomsList, totalResult] = await Promise.all([
      db.select().from(rooms)
        .where(whereClause)
        .orderBy(desc(rooms.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(rooms).where(whereClause)
    ]);

    return { rooms: roomsList, total: Number(totalResult[0]?.count || 0) };
  }

  async getRoom(id: string, tenantId: string): Promise<Room | undefined> {
    const [room] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, id), eq(rooms.tenantId, tenantId)))
      .limit(1);
    return room || undefined;
  }

  async getRoomByAgentId(agentId: string, tenantId: string): Promise<Room | undefined> {
    const [room] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.createdByAgentId, agentId), eq(rooms.tenantId, tenantId)))
      .limit(1);
    return room || undefined;
  }

  async createRoom(room: InsertRoom): Promise<Room> {
    const [newRoom] = await db
      .insert(rooms)
      .values(room)
      .returning();
    return newRoom;
  }

  async updateRoom(id: string, room: Partial<InsertRoom>, tenantId: string): Promise<Room | undefined> {
    const [updated] = await db
      .update(rooms)
      .set(room)
      .where(and(eq(rooms.id, id), eq(rooms.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  // Room Agents
  async getRoomAgentsByRoom(roomId: string, tenantId: string): Promise<RoomAgent[]> {
    // First verify the room belongs to the tenant
    const room = await this.getRoom(roomId, tenantId);
    if (!room) return [];

    return await db
      .select()
      .from(roomAgents)
      .where(eq(roomAgents.roomId, roomId))
      .orderBy(roomAgents.role); // primary first, then assistant
  }

  async createRoomAgent(roomAgent: InsertRoomAgent): Promise<RoomAgent> {
    const [newRoomAgent] = await db
      .insert(roomAgents)
      .values(roomAgent)
      .returning();
    return newRoomAgent;
  }

  async deleteRoomAgent(roomId: string, agentId: string, tenantId: string): Promise<boolean> {
    // First verify the room belongs to the tenant
    const room = await this.getRoom(roomId, tenantId);
    if (!room) return false;

    const result = await db
      .delete(roomAgents)
      .where(and(eq(roomAgents.roomId, roomId), eq(roomAgents.agentId, agentId)));
    
    return result.rowCount > 0;
  }

  // Calls
  async getCallsByTenant(tenantId: string, filters: {
    status?: string;
    agentId?: string;
    roomId?: string;
    contactId?: string;
    direction?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ calls: Call[]; total: number }> {
    const { status, agentId, roomId, contactId, direction, limit = 100, offset = 0 } = filters;
    
    const conditions = [eq(calls.tenantId, tenantId)];
    
    if (status) {
      conditions.push(eq(calls.status, status as any));
    }
    
    if (agentId) {
      conditions.push(eq(calls.agentId, agentId));
    }
    
    if (roomId) {
      conditions.push(eq(calls.roomId, roomId));
    }
    
    if (contactId) {
      conditions.push(eq(calls.contactId, contactId));
    }
    
    if (direction) {
      conditions.push(eq(calls.direction, direction as any));
    }

    const whereClause = and(...conditions);

    const [callsList, totalResult] = await Promise.all([
      db.select().from(calls)
        .where(whereClause)
        .orderBy(desc(calls.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(calls).where(whereClause)
    ]);

    return { calls: callsList, total: Number(totalResult[0]?.count || 0) };
  }

  async getCall(id: string, tenantId: string): Promise<Call | undefined> {
    const [call] = await db
      .select()
      .from(calls)
      .where(and(eq(calls.id, id), eq(calls.tenantId, tenantId)))
      .limit(1);
    return call || undefined;
  }

  async createCall(call: InsertCall): Promise<Call> {
    const [newCall] = await db
      .insert(calls)
      .values(call)
      .returning();
    return newCall;
  }

  async updateCall(id: string, call: Partial<InsertCall>, tenantId: string): Promise<Call | undefined> {
    const [updated] = await db
      .update(calls)
      .set(call)
      .where(and(eq(calls.id, id), eq(calls.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  // Billing methods
  async getUserCredits(userId: string, tenantId: string): Promise<UserCredits | undefined> {
    const [credits] = await db
      .select()
      .from(userCredits)
      .where(and(eq(userCredits.userId, userId), eq(userCredits.tenantId, tenantId)))
      .limit(1);
    return credits || undefined;
  }

  async createUserCredits(insertUserCredits: InsertUserCredits): Promise<UserCredits> {
    const [credits] = await db
      .insert(userCredits)
      .values(insertUserCredits)
      .returning();
    return credits;
  }

  async updateUserCredits(userId: string, tenantId: string, balance: string): Promise<UserCredits | undefined> {
    const [updated] = await db
      .update(userCredits)
      .set({ 
        balance,
        updatedAt: new Date()
      })
      .where(and(eq(userCredits.userId, userId), eq(userCredits.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async getTransactionsByUser(userId: string, tenantId: string, filters: {
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ transactions: Transaction[]; total: number }> {
    const { type, limit = 50, offset = 0 } = filters;
    
    const conditions = [eq(transactions.userId, userId), eq(transactions.tenantId, tenantId)];
    
    if (type) {
      conditions.push(eq(transactions.type, type as any));
    }

    const whereClause = and(...conditions);

    const [transactionsList, totalResult] = await Promise.all([
      db.select().from(transactions)
        .where(whereClause)
        .orderBy(desc(transactions.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(transactions).where(whereClause)
    ]);

    return { transactions: transactionsList, total: Number(totalResult[0]?.count || 0) };
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async getPaymentSessionByReference(reference: string): Promise<PaymentSession | undefined> {
    const [session] = await db
      .select()
      .from(paymentSessions)
      .where(eq(paymentSessions.paystackReference, reference))
      .limit(1);
    return session || undefined;
  }

  async createPaymentSession(insertSession: InsertPaymentSession): Promise<PaymentSession> {
    const [session] = await db
      .insert(paymentSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async updatePaymentSession(reference: string, updates: Partial<InsertPaymentSession>): Promise<PaymentSession | undefined> {
    const [updated] = await db
      .update(paymentSessions)
      .set(updates)
      .where(eq(paymentSessions.paystackReference, reference))
      .returning();
    return updated || undefined;
  }

  // Documents
  async getDocumentsByTenant(tenantId: string, filters: {
    search?: string;
    mimeType?: string;
    source?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ documents: Document[]; total: number }> {
    const { search, mimeType, source, limit = 50, offset = 0 } = filters;
    
    const conditions = [eq(documents.tenantId, tenantId)];
    
    if (search) {
      conditions.push(
        or(
          like(documents.name, `%${search}%`),
          like(documents.description, `%${search}%`)
        )!
      );
    }
    
    if (mimeType) {
      conditions.push(like(documents.mimeType, `%${mimeType}%`));
    }
    
    if (source) {
      conditions.push(eq(documents.source, source as any));
    }

    const whereClause = and(...conditions);

    const [docsList, totalResult] = await Promise.all([
      db.select().from(documents)
        .where(whereClause)
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(documents).where(whereClause)
    ]);

    return { documents: docsList, total: Number(totalResult[0]?.count || 0) };
  }

  async getDocument(id: string, tenantId: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
      .limit(1);
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: string, updateData: Partial<InsertDocument>, tenantId: string): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))
      .returning();
    return updated || undefined;
  }

  async deleteDocument(id: string, tenantId: string): Promise<boolean> {
    // First remove all agent associations
    await db
      .delete(agentDocuments)
      .where(and(eq(agentDocuments.documentId, id), eq(agentDocuments.tenantId, tenantId)));
    
    // Then delete the document
    const deleted = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)));
    return deleted.rowCount > 0;
  }

  // Agent-Document associations
  async getAgentDocuments(agentId: string, tenantId: string, filters: {
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ documents: (Document & { addedBy: string; addedAt: string })[]; total: number }> {
    const { search, limit = 50, offset = 0 } = filters;
    
    let conditions = [
      eq(agentDocuments.agentId, agentId), 
      eq(agentDocuments.tenantId, tenantId)
    ];
    
    if (search) {
      conditions.push(
        or(
          like(documents.name, `%${search}%`),
          like(documents.description, `%${search}%`)
        )!
      );
    }

    const [docsList, totalResult] = await Promise.all([
      db.select({
        id: documents.id,
        tenantId: documents.tenantId,
        name: documents.name,
        description: documents.description,
        storageKey: documents.storageKey,
        mimeType: documents.mimeType,
        size: documents.size,
        source: documents.source,
        uploadedBy: documents.uploadedBy,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        addedBy: agentDocuments.addedBy,
        addedAt: sql<string>`${agentDocuments.createdAt}::text`,
      })
        .from(agentDocuments)
        .innerJoin(documents, eq(agentDocuments.documentId, documents.id))
        .where(and(...conditions))
        .orderBy(desc(agentDocuments.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(agentDocuments)
        .innerJoin(documents, eq(agentDocuments.documentId, documents.id))
        .where(and(...conditions))
    ]);

    return { 
      documents: docsList as (Document & { addedBy: string; addedAt: string })[], 
      total: Number(totalResult[0]?.count || 0) 
    };
  }

  async addAgentDocument(association: InsertAgentDocument): Promise<AgentDocument> {
    const [created] = await db
      .insert(agentDocuments)
      .values(association)
      .returning();
    return created;
  }

  async removeAgentDocument(agentId: string, documentId: string, tenantId: string): Promise<boolean> {
    const deleted = await db
      .delete(agentDocuments)
      .where(and(
        eq(agentDocuments.agentId, agentId),
        eq(agentDocuments.documentId, documentId),
        eq(agentDocuments.tenantId, tenantId)
      ));
    return deleted.rowCount > 0;
  }

  async getDocumentsByAgent(agentId: string, tenantId: string): Promise<Document[]> {
    const result = await db
      .select({
        id: documents.id,
        tenantId: documents.tenantId,
        name: documents.name,
        description: documents.description,
        storageKey: documents.storageKey,
        mimeType: documents.mimeType,
        size: documents.size,
        source: documents.source,
        uploadedBy: documents.uploadedBy,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(agentDocuments)
      .innerJoin(documents, eq(agentDocuments.documentId, documents.id))
      .where(and(
        eq(agentDocuments.agentId, agentId),
        eq(agentDocuments.tenantId, tenantId)
      ))
      .orderBy(documents.name);
    
    return result;
  }
}

export const storage = new DatabaseStorage();