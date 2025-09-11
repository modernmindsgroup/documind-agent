import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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
  type: text("type", { enum: ["conversation_flow", "single_prompt", "multi_prompt", "custom_llm"] }).notNull(),
  voice: text("voice").default("alloy"),
  phoneNumber: text("phone_number"),
  prompt: text("prompt"),
  isActive: boolean("is_active").default(false),
  config: jsonb("config"),
  editedBy: varchar("edited_by").notNull(),
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
  type: true,
  voice: true,
  phoneNumber: true,
  prompt: true,
  config: true,
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