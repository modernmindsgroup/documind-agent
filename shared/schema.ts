import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["super_admin", "tenant_admin"] }).notNull().default("tenant_admin"),
  tenantId: varchar("tenant_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tenants for multi-tenancy
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  domain: text("domain"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Agents
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["conversation_flow", "single_prompt", "multi_prompt", "custom_llm"] }).notNull(),
  callPlatform: text("call_platform", { enum: ["default"] }).default("default"), // Voice functionality removed
  isActive: boolean("is_active").default(false),
  editedBy: varchar("edited_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice Providers
export const voiceProviders = pgTable("voice_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  apiKey: text("api_key"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voices
export const voices = pgTable("voices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voiceProviderId: varchar("voice_provider_id").notNull(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(),
  language: text("language"),
  gender: text("gender"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice Models
export const voiceModels = pgTable("voice_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  voiceProviderId: varchar("voice_provider_id").notNull(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// LLM Providers
export const llmProviders = pgTable("llm_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  apiKey: text("api_key"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// LLM Models
export const llmModels = pgTable("llm_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  llmProviderId: varchar("llm_provider_id").notNull(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(),
  maxTokens: integer("max_tokens").default(4096),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transcriber Providers
export const transcriberProviders = pgTable("transcriber_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  apiKey: text("api_key"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transcriber Languages
export const transcriberLanguages = pgTable("transcriber_languages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transcriberProviderId: varchar("transcriber_provider_id").notNull(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transcriber Models
export const transcriberModels = pgTable("transcriber_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transcriberProviderId: varchar("transcriber_provider_id").notNull(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// LLM Configurations
export const llmConfigurations = pgTable("llm_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  llmProviderId: varchar("llm_provider_id").notNull(),
  llmModelId: varchar("llm_model_id").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  maxTokens: integer("max_tokens").default(2048),
  temperature: integer("temperature").default(70), // stored as integer (0-200 for 0.0-2.0)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transcriber Configurations
export const transcriberConfigurations = pgTable("transcriber_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  transcriberProviderId: varchar("transcriber_provider_id").notNull(),
  transcriberModelId: varchar("transcriber_model_id").notNull(),
  transcriberLanguageId: varchar("transcriber_language_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Voice Configurations
export const voiceConfigurations = pgTable("voice_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  voiceProviderId: varchar("voice_provider_id").notNull(),
  voiceId: varchar("voice_id").notNull(),
  voiceModelId: varchar("voice_model_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflows
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["lead_qualification", "scheduler", "survey", "custom"] }).notNull(),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Knowledge Base
export const knowledgeBase = pgTable("knowledge_base", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["faq", "url", "file", "folder"] }).notNull(),
  content: text("content"),
  url: text("url"),
  parentId: varchar("parent_id"),
  lastSynced: timestamp("last_synced"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Call Logs
export const callLogs = pgTable("call_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  callId: text("call_id").notNull().unique(),
  fromNumber: text("from_number"),
  toNumber: text("to_number"),
  type: text("type", { enum: ["inbound", "outbound"] }).notNull(),
  status: text("status", { enum: ["completed", "failed", "transferred", "no_answer"] }).notNull(),
  duration: integer("duration"), // in seconds
  cost: integer("cost"), // in cents
  transcript: text("transcript"),
  recording: text("recording_url"),
  analysis: jsonb("analysis"),
  reason: text("reason"),
  evaluation: text("evaluation"),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
});

// Chat Logs
export const chatLogs = pgTable("chat_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  chatId: text("chat_id").notNull().unique(),
  userId: text("user_id"),
  messages: jsonb("messages").notNull(),
  duration: integer("duration"), // in seconds
  messageCount: integer("message_count").default(0),
  status: text("status", { enum: ["active", "completed", "abandoned"] }).notNull().default("active"),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
});

// Webhook Logs
export const webhookLogs = pgTable("webhook_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  eventType: text("event_type").notNull(),
  url: text("url").notNull(),
  payload: jsonb("payload").notNull(),
  response: jsonb("response"),
  status: text("status", { enum: ["success", "failed", "pending"] }).notNull(),
  statusCode: integer("status_code"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Webhooks Configuration
export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  eventType: text("event_type").notNull(),
  url: text("url").notNull(),
  secret: text("secret"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Keys
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // e.g., "openai", "twilio", "custom"
  keyValue: text("key_value").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contacts (guest users who interact with agents via widget)
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Preferences (widget and contact requirements)
export const agentPreferences = pgTable("agent_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  isContactRequired: boolean("is_contact_required").default(true),
  logo: text("logo"), // URL or base64 image
  displayName: text("display_name"), // Custom name shown in widget
  widgetThemeColor: text("widget_theme_color").default("#2563eb"), // Hex color code
  realtimeVoicePlatform: text("realtime_voice_platform").default("text"), // Voice functionality removed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversations between contacts and agents
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  contactId: varchar("contact_id"), // Nullable if contact not required
  title: text("title").notNull(), // Auto-generated or "Untitled"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual messages within conversations
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  conversationId: varchar("conversation_id").notNull(),
  contactId: varchar("contact_id"), // Nullable if contact not required
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rooms for voice calls
export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  createdByAgentId: varchar("created_by_agent_id"), // Optional - which agent triggered the room creation
  status: text("status", { enum: ["active", "ended"] }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Room-Agent associations (many-to-many)
export const roomAgents = pgTable("room_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  role: text("role", { enum: ["primary", "assistant"] }).notNull().default("primary"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Voice calls
export const calls = pgTable("calls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  roomId: varchar("room_id").notNull(),
  contactId: varchar("contact_id"), // Nullable if contact not required
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull().default("inbound"),
  status: text("status", { enum: ["initiated", "ringing", "connected", "completed", "failed", "canceled"] }).notNull().default("initiated"),
  callToken: varchar("call_token").notNull().default(sql`gen_random_uuid()`), // Security token for widget access
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
  durationSeconds: integer("duration_seconds"),
  recordingUrl: text("recording_url"),
  transcriptUrl: text("transcript_url"),
  metadata: jsonb("metadata"), // Additional call data (transcript summary, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

// User credits and billing
export const userCredits = pgTable("user_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  balance: decimal("balance", { precision: 10, scale: 3 }).default("0.000").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure one credit record per user-tenant combination
  uniqueUserTenant: uniqueIndex("unique_user_tenant_credits").on(table.userId, table.tenantId),
}));

// Transaction history
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  type: text("type", { enum: ["topup", "deduction", "bonus"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  description: text("description").notNull(),
  reference: text("reference"), // Paystack reference for topups
  messageId: text("message_id"), // Message ID for deduction idempotency
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Prevent duplicate message charges - unique constraint for deduction transactions with messageId
  uniqueMessageDeduction: uniqueIndex("unique_message_deduction")
    .on(table.tenantId, table.userId, table.type, table.messageId)
    .where(sql`${table.type} = 'deduction' AND ${table.messageId} IS NOT NULL`),
}));

// Payment sessions
export const paymentSessions = pgTable("payment_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tenantId: varchar("tenant_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paystackReference: text("paystack_reference").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  authorizationUrl: text("authorization_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  // Ensure unique Paystack references to prevent duplicate payment processing
  uniquePaystackReference: uniqueIndex("unique_paystack_reference").on(table.paystackReference),
}));

// Documents for knowledge base and agent associations
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  storageKey: text("storage_key").notNull().unique(), // Unique key for object storage
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // File size in bytes
  source: text("source", { enum: ["upload", "import", "sync"] }).notNull().default("upload"),
  uploadedBy: varchar("uploaded_by").notNull(), // User ID who uploaded
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agent-Document associations (many-to-many)
export const agentDocuments = pgTable("agent_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull(),
  agentId: varchar("agent_id").notNull(),
  documentId: varchar("document_id").notNull(),
  addedBy: varchar("added_by").notNull(), // User ID who added this association
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure unique agent-document associations
  uniqueAgentDocument: uniqueIndex("unique_agent_document").on(table.agentId, table.documentId),
}));

// Define relations for foreign keys
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  agents: many(agents),
  workflows: many(workflows),
  knowledgeBase: many(knowledgeBase),
  callLogs: many(callLogs),
  chatLogs: many(chatLogs),
  webhooks: many(webhooks),
  webhookLogs: many(webhookLogs),
  apiKeys: many(apiKeys),
  contacts: many(contacts),
  conversations: many(conversations),
  messages: many(messages),
  rooms: many(rooms),
  calls: many(calls),
  userCredits: many(userCredits),
  transactions: many(transactions),
  paymentSessions: many(paymentSessions),
  documents: many(documents),
  agentDocuments: many(agentDocuments),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  editedAgents: many(agents),
  userCredits: one(userCredits),
  transactions: many(transactions),
  paymentSessions: many(paymentSessions),
  uploadedDocuments: many(documents),
  addedAgentDocuments: many(agentDocuments),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [agents.tenantId],
    references: [tenants.id],
  }),
  editedBy: one(users, {
    fields: [agents.editedBy],
    references: [users.id],
  }),
  callLogs: many(callLogs),
  chatLogs: many(chatLogs),
  preferences: one(agentPreferences),
  conversations: many(conversations),
  messages: many(messages),
  roomAgents: many(roomAgents),
  calls: many(calls),
  createdRooms: many(rooms),
  agentDocuments: many(agentDocuments),
}));

export const workflowsRelations = relations(workflows, ({ one }) => ({
  tenant: one(tenants, {
    fields: [workflows.tenantId],
    references: [tenants.id],
  }),
}));

export const knowledgeBaseRelations = relations(knowledgeBase, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [knowledgeBase.tenantId],
    references: [tenants.id],
  }),
  parent: one(knowledgeBase, {
    fields: [knowledgeBase.parentId],
    references: [knowledgeBase.id],
  }),
  children: many(knowledgeBase),
}));

export const callLogsRelations = relations(callLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [callLogs.tenantId],
    references: [tenants.id],
  }),
  agent: one(agents, {
    fields: [callLogs.agentId],
    references: [agents.id],
  }),
}));

export const chatLogsRelations = relations(chatLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [chatLogs.tenantId],
    references: [tenants.id],
  }),
  agent: one(agents, {
    fields: [chatLogs.agentId],
    references: [agents.id],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [webhooks.tenantId],
    references: [tenants.id],
  }),
  logs: many(webhookLogs),
}));

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [webhookLogs.tenantId],
    references: [tenants.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [contacts.tenantId],
    references: [tenants.id],
  }),
  conversations: many(conversations),
  messages: many(messages),
}));

export const agentPreferencesRelations = relations(agentPreferences, ({ one }) => ({
  agent: one(agents, {
    fields: [agentPreferences.agentId],
    references: [agents.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [conversations.tenantId],
    references: [tenants.id],
  }),
  agent: one(agents, {
    fields: [conversations.agentId],
    references: [agents.id],
  }),
  contact: one(contacts, {
    fields: [conversations.contactId],
    references: [contacts.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  tenant: one(tenants, {
    fields: [messages.tenantId],
    references: [tenants.id],
  }),
  agent: one(agents, {
    fields: [messages.agentId],
    references: [agents.id],
  }),
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  contact: one(contacts, {
    fields: [messages.contactId],
    references: [contacts.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [rooms.tenantId],
    references: [tenants.id],
  }),
  createdByAgent: one(agents, {
    fields: [rooms.createdByAgentId],
    references: [agents.id],
  }),
  roomAgents: many(roomAgents),
  calls: many(calls),
}));

export const roomAgentsRelations = relations(roomAgents, ({ one }) => ({
  room: one(rooms, {
    fields: [roomAgents.roomId],
    references: [rooms.id],
  }),
  agent: one(agents, {
    fields: [roomAgents.agentId],
    references: [agents.id],
  }),
}));

export const callsRelations = relations(calls, ({ one }) => ({
  tenant: one(tenants, {
    fields: [calls.tenantId],
    references: [tenants.id],
  }),
  agent: one(agents, {
    fields: [calls.agentId],
    references: [agents.id],
  }),
  room: one(rooms, {
    fields: [calls.roomId],
    references: [rooms.id],
  }),
  contact: one(contacts, {
    fields: [calls.contactId],
    references: [contacts.id],
  }),
}));

export const userCreditsRelations = relations(userCredits, ({ one }) => ({
  user: one(users, {
    fields: [userCredits.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [userCredits.tenantId],
    references: [tenants.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [transactions.tenantId],
    references: [tenants.id],
  }),
}));

export const paymentSessionsRelations = relations(paymentSessions, ({ one }) => ({
  user: one(users, {
    fields: [paymentSessions.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [paymentSessions.tenantId],
    references: [tenants.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
  agentDocuments: many(agentDocuments),
}));

export const agentDocumentsRelations = relations(agentDocuments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [agentDocuments.tenantId],
    references: [tenants.id],
  }),
  agent: one(agents, {
    fields: [agentDocuments.agentId],
    references: [agents.id],
  }),
  document: one(documents, {
    fields: [agentDocuments.documentId],
    references: [documents.id],
  }),
  addedBy: one(users, {
    fields: [agentDocuments.addedBy],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  tenantId: true,
});

export const insertTenantSchema = createInsertSchema(tenants).pick({
  name: true,
  domain: true,
});

export const insertAgentSchema = createInsertSchema(agents).pick({
  tenantId: true,
  name: true,
  description: true,
  type: true,
  callPlatform: true,
  editedBy: true,
});

export const insertWorkflowSchema = createInsertSchema(workflows).pick({
  tenantId: true,
  name: true,
  description: true,
  type: true,
  nodes: true,
  edges: true,
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).pick({
  tenantId: true,
  name: true,
  type: true,
  content: true,
  url: true,
  parentId: true,
});

export const insertWebhookSchema = createInsertSchema(webhooks).pick({
  tenantId: true,
  name: true,
  eventType: true,
  url: true,
  secret: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  tenantId: true,
  name: true,
  provider: true,
  keyValue: true,
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  tenantId: true,
  name: true,
  email: true,
  phone: true,
});

export const insertAgentPreferencesSchema = createInsertSchema(agentPreferences).pick({
  agentId: true,
  isContactRequired: true,
  logo: true,
  displayName: true,
  widgetThemeColor: true,
  realtimeVoicePlatform: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  tenantId: true,
  agentId: true,
  contactId: true,
  title: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  tenantId: true,
  agentId: true,
  conversationId: true,
  contactId: true,
  content: true,
  role: true,
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  tenantId: true,
  name: true,
  createdByAgentId: true,
  status: true,
});

export const insertRoomAgentSchema = createInsertSchema(roomAgents).pick({
  roomId: true,
  agentId: true,
  role: true,
});

export const insertCallSchema = createInsertSchema(calls).pick({
  tenantId: true,
  agentId: true,
  roomId: true,
  contactId: true,
  direction: true,
  status: true,
  callToken: true,
  durationSeconds: true,
  recordingUrl: true,
  transcriptUrl: true,
  metadata: true,
});

export const updateCallSchema = createInsertSchema(calls).pick({
  status: true,
  durationSeconds: true,
  recordingUrl: true,
  transcriptUrl: true,
  metadata: true,
}).partial();

export const insertUserCreditsSchema = createInsertSchema(userCredits).pick({
  userId: true,
  tenantId: true,
  balance: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  tenantId: true,
  type: true,
  amount: true,
  description: true,
  reference: true,
  metadata: true,
});

export const insertPaymentSessionSchema = createInsertSchema(paymentSessions).pick({
  userId: true,
  tenantId: true,
  amount: true,
  paystackReference: true,
  status: true,
  authorizationUrl: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  tenantId: true,
  name: true,
  description: true,
  storageKey: true,
  mimeType: true,
  size: true,
  source: true,
  uploadedBy: true,
});

export const insertAgentDocumentSchema = createInsertSchema(agentDocuments).pick({
  tenantId: true,
  agentId: true,
  documentId: true,
  addedBy: true,
});






// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type CallLog = typeof callLogs.$inferSelect;
export type ChatLog = typeof chatLogs.$inferSelect;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertAgentPreferences = z.infer<typeof insertAgentPreferencesSchema>;
export type AgentPreferences = typeof agentPreferences.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoomAgent = z.infer<typeof insertRoomAgentSchema>;
export type RoomAgent = typeof roomAgents.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof calls.$inferSelect;
export type InsertUserCredits = z.infer<typeof insertUserCreditsSchema>;
export type UserCredits = typeof userCredits.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertPaymentSession = z.infer<typeof insertPaymentSessionSchema>;
export type PaymentSession = typeof paymentSessions.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertAgentDocument = z.infer<typeof insertAgentDocumentSchema>;
export type AgentDocument = typeof agentDocuments.$inferSelect;

// Shared API Response Types - prevent type drift between server and client
export interface DashboardMetrics {
  totalAgents: number;
  totalWorkflows: number;
  totalCalls: number;
  totalChats: number;
  monthlyCallCost: number;
  monthlyCallMinutes: number;
}

export interface RecentActivity {
  id: string;
  type: 'agent_created' | 'workflow_updated' | 'call_completed' | 'chat_ended';
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

export interface AgentStats {
  totalCalls: number;
  successRate: number;
  averageDuration: number;
  weeklyGrowth: number;
}

export interface AgentActivity {
  id: string;
  type: 'call' | 'chat';
  status: 'completed' | 'failed' | 'active';
  phoneNumber?: string;
  duration?: number;
  createdAt: Date;
}