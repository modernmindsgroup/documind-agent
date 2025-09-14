import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, blob, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table for authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["super_admin", "tenant_admin"] }).notNull().default("tenant_admin"),
  tenantId: text("tenant_id").notNull(),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// Tenants for multi-tenancy
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull(),
  domain: text("domain"),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// AI Agents
export const agents = sqliteTable("agents", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["conversation_flow", "single_prompt", "multi_prompt", "custom_llm"] }).notNull(),
  callPlatform: text("call_platform", { enum: ["default"] }).default("default"), // Voice functionality removed
  isActive: integer("is_active").default(0),
  editedBy: text("edited_by").notNull(),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Voice Providers
export const voiceProviders = sqliteTable("voice_providers", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull(),
  apiKey: text("api_key"),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// Voices
export const voices = sqliteTable("voices", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  voiceProviderId: text("voice_provider_id").notNull(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(),
  language: text("language"),
  gender: text("gender"),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// Voice Models
export const voiceModels = sqliteTable("voice_models", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  voiceProviderId: text("voice_provider_id").notNull(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// LLM Providers
export const llmProviders = sqliteTable("llm_providers", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull(),
  apiKey: text("api_key"),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// LLM Models
export const llmModels = sqliteTable("llm_models", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  llmProviderId: text("llm_provider_id").notNull(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(),
  maxTokens: integer("max_tokens").default(4096),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// Transcriber Providers
export const transcriberProviders = sqliteTable("transcriber_providers", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull(),
  apiKey: text("api_key"),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// Transcriber Languages
export const transcriberLanguages = sqliteTable("transcriber_languages", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  transcriberProviderId: text("transcriber_provider_id").notNull(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// Transcriber Models
export const transcriberModels = sqliteTable("transcriber_models", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  transcriberProviderId: text("transcriber_provider_id").notNull(),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// LLM Configurations
export const llmConfigurations = sqliteTable("llm_configurations", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  agentId: text("agent_id").notNull(),
  llmProviderId: text("llm_provider_id").notNull(),
  llmModelId: text("llm_model_id").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  maxTokens: integer("max_tokens").default(2048),
  temperature: integer("temperature").default(70), // stored as integer (0-200 for 0.0-2.0)
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Transcriber Configurations
export const transcriberConfigurations = sqliteTable("transcriber_configurations", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  agentId: text("agent_id").notNull(),
  transcriberProviderId: text("transcriber_provider_id").notNull(),
  transcriberModelId: text("transcriber_model_id").notNull(),
  transcriberLanguageId: text("transcriber_language_id").notNull(),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Voice Configurations
export const voiceConfigurations = sqliteTable("voice_configurations", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  agentId: text("agent_id").notNull(),
  voiceProviderId: text("voice_provider_id").notNull(),
  voiceId: text("voice_id").notNull(),
  voiceModelId: text("voice_model_id").notNull(),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Workflows  
export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type", { enum: ["lead_qualification", "scheduler", "survey", "custom"] }).notNull(),
  nodes: text("nodes").notNull(), // JSON as text
  edges: text("edges").notNull(), // JSON as text
  isActive: integer("is_active").default(0),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Knowledge Base
export const knowledgeBase = sqliteTable("knowledge_base", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  type: text("type", { enum: ["faq", "url", "file", "folder"] }).notNull(),
  content: text("content"),
  url: text("url"),
  parentId: text("parent_id"),
  lastSynced: integer("last_synced"),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Call Logs
export const callLogs = sqliteTable("call_logs", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  agentId: text("agent_id").notNull(),
  callId: text("call_id").notNull().unique(),
  fromNumber: text("from_number"),
  toNumber: text("to_number"),
  type: text("type", { enum: ["inbound", "outbound", "api", "webhook"] }).notNull(),
  status: text("status", { enum: ["completed", "failed", "transferred", "no_answer"] }).notNull(),
  duration: integer("duration"), // in seconds
  cost: integer("cost"), // in cents
  transcript: text("transcript"),
  recording: text("recording_url"),
  analysis: text("analysis"),
  reason: text("reason"),
  evaluation: text("evaluation"),
  startTime: integer("start_time").$defaultFn(() => Date.now()),
  endTime: integer("end_time"),
  // Additional fields for comprehensive log details
  url: text("url"),
  path: text("path"),
  query: text("query"),
  origin: text("origin"),
  method: text("method", { enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] }),
  requestHeaders: text("request_headers"),
  requestBody: text("request_body"),
  responseCode: integer("response_code"),
  responseHeaders: text("response_headers"),
  responseBody: text("response_body"),
  startedAt: integer("started_at").$defaultFn(() => Date.now()),
  finishedAt: integer("finished_at"),
});

// Chat Logs
export const chatLogs = sqliteTable("chat_logs", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  agentId: text("agent_id").notNull(),
  chatId: text("chat_id").notNull().unique(),
  userId: text("user_id"),
  messages: text("messages").notNull(),
  duration: integer("duration"), // in seconds
  messageCount: integer("message_count").default(0),
  type: text("type", { enum: ["widget", "api", "internal"] }).notNull().default("widget"),
  status: text("status", { enum: ["active", "completed", "abandoned"] }).notNull().default("active"),
  startTime: integer("start_time").$defaultFn(() => Date.now()),
  endTime: integer("end_time"),
  // Additional fields for comprehensive log details
  url: text("url"),
  path: text("path"),
  query: text("query"),
  origin: text("origin"),
  method: text("method", { enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] }),
  requestHeaders: text("request_headers"),
  requestBody: text("request_body"),
  responseCode: integer("response_code"),
  responseHeaders: text("response_headers"),
  responseBody: text("response_body"),
  startedAt: integer("started_at").$defaultFn(() => Date.now()),
  finishedAt: integer("finished_at"),
});

// Webhook Logs - general webhook event logs
export const webhookLogs = sqliteTable("webhook_logs", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  webhookId: text("webhook_id"), // Optional - link to specific webhook if applicable
  eventType: text("event_type").notNull(),
  type: text("type", { enum: ["outbound", "inbound"] }).notNull().default("outbound"),
  url: text("url").notNull(),
  payload: text("payload").notNull(),
  response: text("response"),
  status: text("status", { enum: ["success", "failed", "pending"] }).notNull(),
  statusCode: integer("status_code"),
  retryCount: integer("retry_count").default(0),
  duration: integer("duration"), // in seconds
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  // Additional fields for comprehensive log details
  path: text("path"),
  query: text("query"),
  origin: text("origin"),
  method: text("method", { enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] }).notNull().default("POST"),
  requestHeaders: text("request_headers"),
  requestBody: text("request_body"),
  responseCode: integer("response_code"),
  responseHeaders: text("response_headers"),
  responseBody: text("response_body"),
  startedAt: integer("started_at").$defaultFn(() => Date.now()),
  finishedAt: integer("finished_at"),
});

// Webhooks Configuration
export const webhooks = sqliteTable("webhooks", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  agentId: text("agent_id"), // Optional - for agent-specific webhooks
  apiKeyId: text("api_key_id"), // Optional - for API key-specific webhooks
  name: text("name").notNull(),
  eventTypes: text("event_types").notNull(), // Array of event types: ['call.started', 'call.completed']
  url: text("url").notNull(),
  secret: text("secret"),
  timeout: integer("timeout").default(5000), // Request timeout in milliseconds
  retryLimit: integer("retry_limit").default(7), // Maximum retry attempts
  isActive: integer("is_active").default(1),
  disableOnFailure: integer("disable_on_failure").default(0), // Auto-disable after max retries
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Media Access Tokens
export const mediaTokens = sqliteTable("media_tokens", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  roomId: text("room_id").notNull(), // Reference to rooms table
  identity: text("identity").notNull(), // Participant identity
  platformToken: text("platform_token").notNull(), // Our token returned to client
  providerToken: text("provider_token").notNull(), // Provider's token (LiveKit, Agora, etc.)
  metadata: text("metadata"), // Additional token metadata
  permissions: text("permissions"), // Token permissions
  ttl: text("ttl").default("10m"), // Time to live
  isActive: integer("is_active").default(1),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// API Keys
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  keyType: text("key_type").notNull(), // "private" or "public"
  keyValue: text("key_value").notNull(),
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Webhook Deliveries - tracks individual webhook delivery jobs
export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(), // Required for multi-tenant isolation
  webhookId: text("webhook_id").notNull(),
  eventId: text("event_id").notNull(), // Reference to original event (call_id, chat_id, etc.)
  eventType: text("event_type").notNull(), // call.completed, chat.started, etc.
  status: text("status", { enum: ["pending", "success", "failed", "retrying"] }).notNull().default("pending"),
  attempt: integer("attempt").default(1),
  maxAttempts: integer("max_attempts").default(7),
  payload: text("payload").notNull(),
  scheduledAt: integer("scheduled_at").$defaultFn(() => Date.now()), // When to attempt delivery
  nextAttemptAt: integer("next_attempt_at"), // When next retry is scheduled
  completedAt: integer("completed_at"), // When delivery succeeded or permanently failed
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
}, (table) => ({
  // Prevent duplicate in-flight deliveries for the same event
  uniqueWebhookEvent: uniqueIndex("unique_webhook_event_delivery")
    .on(table.webhookId, table.eventId)
    .where(sql`${table.status} IN ('pending', 'retrying')`),
  // Non-unique indexes for efficient queue processing
  statusNextAttemptIndex: index("webhook_deliveries_status_next_attempt").on(table.status, table.nextAttemptAt),
  tenantStatusIndex: index("webhook_deliveries_tenant_status").on(table.tenantId, table.status, table.nextAttemptAt),
  webhookStatusIndex: index("webhook_deliveries_webhook_status_next").on(table.webhookId, table.status, table.nextAttemptAt),
}));

// Webhook Delivery Attempts - tracks individual delivery attempts for history
export const webhookDeliveryAttempts = sqliteTable("webhook_delivery_attempts", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  deliveryId: text("delivery_id").notNull(),
  attemptNo: integer("attempt_no").notNull(),
  status: text("status", { enum: ["success", "failed"] }).notNull(),
  responseCode: integer("response_code"),
  responseBody: text("response_body"),
  responseHeaders: text("response_headers"),
  errorMessage: text("error_message"),
  duration: integer("duration"), // Response time in milliseconds
  attemptedAt: integer("attempted_at").$defaultFn(() => Date.now()),
}, (table) => ({
  // Prevent duplicate attempt numbers per delivery
  uniqueAttemptPerDelivery: uniqueIndex("unique_attempt_no_per_delivery").on(table.deliveryId, table.attemptNo),
}));

// Contacts (guest users who interact with agents via widget)
export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Agent Preferences (widget and contact requirements)
export const agentPreferences = sqliteTable("agent_preferences", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  agentId: text("agent_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  isContactRequired: integer("is_contact_required").default(1),
  logo: text("logo"), // URL or base64 image
  displayName: text("display_name"), // Custom name shown in widget
  widgetTheme: text("widget_theme"), // JSON as text
  realtimeVoicePlatform: text("realtime_voice_platform").default("text"), // Voice functionality removed
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Conversations between contacts and agents
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  agentId: text("agent_id").notNull(),
  contactId: text("contact_id"), // Nullable if contact not required
  title: text("title").notNull(), // Auto-generated or "Untitled"
  isActive: integer("is_active").default(1),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at").$defaultFn(() => Date.now()),
});

// Individual messages within conversations
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  agentId: text("agent_id").notNull(),
  conversationId: text("conversation_id").notNull(),
  contactId: text("contact_id"), // Nullable if contact not required
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// Rooms for voice calls
export const rooms = sqliteTable("rooms", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  createdByAgentId: text("created_by_agent_id"), // Optional - which agent triggered the room creation
  status: text("status", { enum: ["active", "ended"] }).notNull().default("active"),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// Room-Agent associations (many-to-many)
export const roomAgents = sqliteTable("room_agents", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  roomId: text("room_id").notNull(),
  agentId: text("agent_id").notNull(),
  role: text("role", { enum: ["primary", "assistant"] }).notNull().default("primary"),
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// Voice calls
export const calls = sqliteTable("calls", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  agentId: text("agent_id").notNull(),
  roomId: text("room_id").notNull(),
  contactId: text("contact_id"), // Nullable if contact not required
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull().default("inbound"),
  status: text("status", { enum: ["initiated", "ringing", "connected", "completed", "failed", "canceled"] }).notNull().default("initiated"),
  callToken: text("call_token").notNull().$default(() => crypto.randomUUID()), // Security token for widget access
  startedAt: integer("started_at").$defaultFn(() => Date.now()),
  endedAt: integer("ended_at"),
  durationSeconds: integer("duration_seconds"),
  recordingUrl: text("recording_url"),
  transcriptUrl: text("transcript_url"),
  metadata: text("metadata"), // Additional call data (transcript summary, etc.)
  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// User credits and billing
export const userCredits = sqliteTable("user_credits", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  balance: real("balance", { precision: 10, scale: 3 }).default("0.000").notNull(),
  createdAt: integer("created_at").$defaultFn(() => Date.now()).notNull(),
  updatedAt: integer("updated_at").$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  // Ensure one credit record per user-tenant combination
  uniqueUserTenant: uniqueIndex("unique_user_tenant_credits").on(table.userId, table.tenantId),
}));

// Transaction history
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  type: text("type", { enum: ["topup", "deduction", "bonus"] }).notNull(),
  amount: real("amount", { precision: 10, scale: 3 }).notNull(),
  description: text("description").notNull(),
  reference: text("reference"), // Paystack reference for topups
  messageId: text("message_id"), // Message ID for deduction idempotency
  metadata: text("metadata"),
  createdAt: integer("created_at").$defaultFn(() => Date.now()).notNull(),
}, (table) => ({
  // Prevent duplicate message charges - unique constraint for deduction transactions with messageId
  uniqueMessageDeduction: uniqueIndex("unique_message_deduction")
    .on(table.tenantId, table.userId, table.type, table.messageId)
    .where(sql`${table.type} = 'deduction' AND ${table.messageId} IS NOT NULL`),
}));

// Payment sessions
export const paymentSessions = sqliteTable("payment_sessions", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  amount: real("amount", { precision: 10, scale: 2 }).notNull(),
  paystackReference: text("paystack_reference").notNull(),
  status: text("status", { enum: ["pending", "processing", "completed", "failed"] }).notNull().default("pending"),
  authorizationUrl: text("authorization_url"),
  createdAt: integer("created_at").$defaultFn(() => Date.now()).notNull(),
  completedAt: integer("completed_at"),
}, (table) => ({
  // Ensure unique Paystack references to prevent duplicate payment processing
  uniquePaystackReference: uniqueIndex("unique_paystack_reference").on(table.paystackReference),
}));

// Documents for knowledge base and agent associations
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  storageKey: text("storage_key").notNull().unique(), // Unique key for object storage
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // File size in bytes
  source: text("source", { enum: ["upload", "import", "sync"] }).notNull().default("upload"),
  uploadedBy: text("uploaded_by").notNull(), // User ID who uploaded
  createdAt: integer("created_at").$defaultFn(() => Date.now()).notNull(),
  updatedAt: integer("updated_at").$defaultFn(() => new Date()).notNull(),
});

// Agent-Document associations (many-to-many)
export const agentDocuments = sqliteTable("agent_documents", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  tenantId: text("tenant_id").notNull(),
  agentId: text("agent_id").notNull(),
  documentId: text("document_id").notNull(),
  addedBy: text("added_by").notNull(), // User ID who added this association
  createdAt: integer("created_at").$defaultFn(() => Date.now()).notNull(),
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
  webhookDeliveries: many(webhookDeliveries),
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
  webhooks: many(webhooks),
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
  agent: one(agents, {
    fields: [webhooks.agentId],
    references: [agents.id],
  }),
  apiKey: one(apiKeys, {
    fields: [webhooks.apiKeyId],
    references: [apiKeys.id],
  }),
  logs: many(webhookLogs),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [webhookDeliveries.tenantId],
    references: [tenants.id],
  }),
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
  attempts: many(webhookDeliveryAttempts),
}));

export const webhookDeliveryAttemptsRelations = relations(webhookDeliveryAttempts, ({ one }) => ({
  delivery: one(webhookDeliveries, {
    fields: [webhookDeliveryAttempts.deliveryId],
    references: [webhookDeliveries.id],
  }),
}));

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [webhookLogs.tenantId],
    references: [tenants.id],
  }),
  webhook: one(webhooks, {
    fields: [webhookLogs.webhookId],
    references: [webhooks.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
  webhooks: many(webhooks),
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
  eventTypes: true,
  url: true,
  secret: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  tenantId: true,
  name: true,
  keyType: true,
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
  widgetTheme: true,
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

export const insertMediaTokenSchema = createInsertSchema(mediaTokens).pick({
  tenantId: true,
  roomId: true,
  identity: true,
  platformToken: true,
  providerToken: true,
  metadata: true,
  permissions: true,
  ttl: true,
  expiresAt: true,
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
export type InsertMediaToken = z.infer<typeof insertMediaTokenSchema>;
export type MediaToken = typeof mediaTokens.$inferSelect;
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
  integer: string;
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