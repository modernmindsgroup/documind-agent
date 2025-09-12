import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
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
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  editedAgents: many(agents),
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