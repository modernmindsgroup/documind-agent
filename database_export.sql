-- PostgreSQL Database Export
-- Generated on: 2025-09-12T11:55:16.283Z
-- 

SET session_replication_role = replica;

-- Table: agent_preferences (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "agent_preferences" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" CHARACTER VARYING NOT NULL,
  "is_contact_required" BOOLEAN DEFAULT true,
  "logo" TEXT,
  "display_name" TEXT,
  "widget_theme_color" TEXT DEFAULT '#2563eb'::text,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "agent_preferences" ("id", "agent_id", "is_contact_required", "logo", "display_name", "widget_theme_color", "created_at", "updated_at") VALUES
  ('87e47c86-636e-42e6-bc1b-06c40c7be76c', 'b875d286-e4c8-4724-af59-2e9f5c4aaedc', TRUE, NULL, 'Default Config Test Agent', '#2563eb', '2025-09-12T08:54:39.151Z', '2025-09-12T08:54:39.151Z');

ALTER TABLE "agent_preferences" ADD CONSTRAINT "agent_preferences_pkey" PRIMARY KEY ("id");


-- Table: agents (8 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "agents" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT false,
  "edited_by" CHARACTER VARYING NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "description" TEXT
);

INSERT INTO "agents" ("id", "tenant_id", "name", "type", "is_active", "edited_by", "created_at", "updated_at", "description") VALUES
  ('e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent', 'single_prompt', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:29:47.099Z', '2025-09-11T07:29:47.099Z', NULL),
  ('56f35988-759c-4c5f-86ab-85fdcd1dd889', 'ffa73277-d396-4244-b516-5d178fafde35', 'Customer Support Agent', 'single_prompt', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', NULL),
  ('de41cfe8-7357-4bc8-870d-6ae16584055f', 'ffa73277-d396-4244-b516-5d178fafde35', 'Lead Qualification Agent', 'conversation_flow', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', NULL),
  ('add4c2b1-184c-4ce5-bc94-0f6d12e909a0', 'ffa73277-d396-4244-b516-5d178fafde35', 'Appointment Booking Agent', 'single_prompt', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', NULL),
  ('7dd3cb04-b647-4b8f-8594-d55c5d77fcf8', 'ffa73277-d396-4244-b516-5d178fafde35', 'Product Information Agent', 'multi_prompt', FALSE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', NULL),
  ('1afd4dce-3b74-44b6-bd61-7cb045124c6c', 'ffa73277-d396-4244-b516-5d178fafde35', 'Feedback Collection Agent', 'conversation_flow', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', NULL),
  ('c59d8fc4-1969-452f-8b77-a85ff2f15c70', 'ffa73277-d396-4244-b516-5d178fafde35', 'Test Single Prompt Agent', 'single_prompt', FALSE, 'e7f1bebb-6fa1-4676-96f2-4bdc23771bc0', '2025-09-12T08:43:42.475Z', '2025-09-12T08:43:42.475Z', 'This is a test single prompt agent for testing purposes'),
  ('b875d286-e4c8-4724-af59-2e9f5c4aaedc', 'ffa73277-d396-4244-b516-5d178fafde35', 'Default Config Test Agent', 'single_prompt', FALSE, 'e7f1bebb-6fa1-4676-96f2-4bdc23771bc0', '2025-09-12T08:54:39.077Z', '2025-09-12T08:54:39.077Z', 'Testing automatic default configuration creation');

ALTER TABLE "agents" ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");


-- Table: api_keys (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "key_value" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");


-- Table: call_logs (11 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "call_logs" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "agent_id" CHARACTER VARYING NOT NULL,
  "call_id" TEXT NOT NULL,
  "from_number" TEXT,
  "to_number" TEXT,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "duration" INTEGER,
  "cost" INTEGER,
  "transcript" TEXT,
  "recording_url" TEXT,
  "analysis" JSONB,
  "reason" TEXT,
  "evaluation" TEXT,
  "start_time" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "end_time" TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO "call_logs" ("id", "tenant_id", "agent_id", "call_id", "from_number", "to_number", "type", "status", "duration", "cost", "transcript", "recording_url", "analysis", "reason", "evaluation", "start_time", "end_time") VALUES
  ('9cc0c1a9-a940-453c-9c08-7f9ac33194b4', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'call_001', '+1-555-123-9876', '+1-555-123-4567', 'inbound', 'completed', 245, 125, 'Customer inquired about snowboards and placed order for premium model', NULL, NULL, NULL, NULL, '2025-09-11T06:48:41.579Z', '2025-09-11T06:52:46.579Z'),
  ('8a20d118-7749-4ed8-b0e1-5cdbc945e13f', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'call_002', '+1-555-789-1234', '+1-555-123-4567', 'inbound', 'completed', 189, 95, 'Customer interested in outdoor gear collection', NULL, NULL, NULL, NULL, '2025-09-11T04:48:41.579Z', '2025-09-11T04:51:50.579Z'),
  ('274b67e6-9076-4c68-9f4d-c566eea07e01', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'call_003', '+1-555-456-7890', '+1-555-123-4567', 'inbound', 'completed', 312, 156, 'Product comparison discussion, customer chose premium snowboard package', NULL, NULL, NULL, NULL, '2025-09-11T01:48:41.579Z', '2025-09-11T01:53:53.579Z'),
  ('f52897b6-59cb-4796-87e6-d68ffda43a6b', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'call_004', '+1-555-321-6543', '+1-555-123-4567', 'inbound', 'completed', 156, 78, 'Quick product question and checkout assistance', NULL, NULL, NULL, NULL, '2025-09-10T23:48:41.579Z', '2025-09-10T23:51:17.579Z'),
  ('2d0e7149-76a3-44d0-b088-20c71170f09c', 'ffa73277-d396-4244-b516-5d178fafde35', '56f35988-759c-4c5f-86ab-85fdcd1dd889', 'call_005', '+1-555-111-2222', '+1-555-234-5678', 'inbound', 'completed', 423, 212, 'Order status inquiry and shipping update', NULL, NULL, NULL, NULL, '2025-09-11T05:48:41.579Z', '2025-09-11T05:55:44.579Z'),
  ('cb025cbd-9fa7-4937-b6f2-2d3d40ada9e0', 'ffa73277-d396-4244-b516-5d178fafde35', '56f35988-759c-4c5f-86ab-85fdcd1dd889', 'call_006', '+1-555-333-4444', '+1-555-234-5678', 'inbound', 'completed', 278, 139, 'Return request assistance and refund processing', NULL, NULL, NULL, NULL, '2025-09-11T03:48:41.579Z', '2025-09-11T03:53:19.579Z'),
  ('804fc9c6-5480-4ca9-94f2-1349f1b94a1e', 'ffa73277-d396-4244-b516-5d178fafde35', '56f35988-759c-4c5f-86ab-85fdcd1dd889', 'call_007', '+1-555-555-6666', '+1-555-234-5678', 'inbound', 'failed', 45, 23, 'Call dropped during troubleshooting session', NULL, NULL, NULL, NULL, '2025-09-11T00:48:41.579Z', '2025-09-11T00:49:26.579Z'),
  ('d15f1aac-977a-4e47-8358-b3988ad7f5b7', 'ffa73277-d396-4244-b516-5d178fafde35', 'de41cfe8-7357-4bc8-870d-6ae16584055f', 'call_008', '+1-555-777-8888', '+1-555-345-6789', 'outbound', 'completed', 567, 284, 'Qualified lead for enterprise outdoor gear partnership', NULL, NULL, NULL, NULL, '2025-09-11T02:48:41.579Z', '2025-09-11T02:58:08.579Z'),
  ('db56f3b6-4603-4878-9840-d5f3034b9e34', 'ffa73277-d396-4244-b516-5d178fafde35', 'de41cfe8-7357-4bc8-870d-6ae16584055f', 'call_009', '+1-555-999-0000', '+1-555-345-6789', 'outbound', 'completed', 345, 173, 'Initial qualification call for bulk purchase inquiry', NULL, NULL, NULL, NULL, '2025-09-10T22:48:41.579Z', '2025-09-10T22:54:26.579Z'),
  ('562a5d05-065c-407c-9662-218f17337bf6', 'ffa73277-d396-4244-b516-5d178fafde35', 'add4c2b1-184c-4ce5-bc94-0f6d12e909a0', 'call_010', '+1-555-111-3333', '+1-555-456-7890', 'inbound', 'completed', 156, 78, 'Scheduled product consultation appointment', NULL, NULL, NULL, NULL, '2025-09-11T06:18:41.579Z', '2025-09-11T06:21:17.579Z'),
  ('006e0c42-e69b-4c81-92d8-5401fc26d6a7', 'ffa73277-d396-4244-b516-5d178fafde35', 'add4c2b1-184c-4ce5-bc94-0f6d12e909a0', 'call_011', '+1-555-222-4444', '+1-555-456-7890', 'inbound', 'completed', 89, 45, 'Quick rescheduling request', NULL, NULL, NULL, NULL, '2025-09-11T01:33:41.579Z', '2025-09-11T01:35:10.579Z');

ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id");


-- Table: chat_logs (7 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "chat_logs" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "agent_id" CHARACTER VARYING NOT NULL,
  "chat_id" TEXT NOT NULL,
  "user_id" TEXT,
  "messages" JSONB NOT NULL,
  "duration" INTEGER,
  "message_count" INTEGER DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active'::text,
  "start_time" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "end_time" TIMESTAMP WITHOUT TIME ZONE
);

INSERT INTO "chat_logs" ("id", "tenant_id", "agent_id", "chat_id", "user_id", "messages", "duration", "message_count", "status", "start_time", "end_time") VALUES
  ('35dac36b-2a34-4e7f-8b88-5fd12e60e145', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'chat_001', 'user_123', '[{"role":"user","content":"Looking for a good snowboard for beginners"},{"role":"assistant","content":"I recommend our Multi-managed Snowboard - perfect for beginners!"}]', 180, 8, 'completed', '2025-09-11T05:49:06.130Z', '2025-09-11T05:52:06.130Z'),
  ('7540e03d-5098-419f-a086-1d171aff65c6', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'chat_002', 'user_456', '[{"role":"user","content":"What snowboards do you have in stock?"},{"role":"assistant","content":"We have the Collection Snowboard and Complete Snowboard available"}]', 120, 6, 'completed', '2025-09-11T03:49:06.130Z', '2025-09-11T03:51:06.130Z'),
  ('4e06ef08-2aed-42de-becf-68ed54c552f8', 'ffa73277-d396-4244-b516-5d178fafde35', '56f35988-759c-4c5f-86ab-85fdcd1dd889', 'chat_003', 'user_789', '[{"role":"user","content":"My order hasnt shipped yet"},{"role":"assistant","content":"Let me check your order status right away"}]', 300, 12, 'completed', '2025-09-11T06:49:06.130Z', '2025-09-11T06:54:06.130Z'),
  ('bc850b74-9ead-4ed6-9784-303742670e63', 'ffa73277-d396-4244-b516-5d178fafde35', '56f35988-759c-4c5f-86ab-85fdcd1dd889', 'chat_004', 'user_012', '[{"role":"user","content":"Need help with return"},{"role":"assistant","content":"I can help process your return today"}]', 240, 10, 'completed', '2025-09-11T04:49:06.130Z', '2025-09-11T04:53:06.130Z'),
  ('18d2582c-67d7-4068-8098-e71a207621d2', 'ffa73277-d396-4244-b516-5d178fafde35', 'de41cfe8-7357-4bc8-870d-6ae16584055f', 'chat_005', 'user_345', '[{"role":"user","content":"Interested in bulk pricing"},{"role":"assistant","content":"Id love to discuss our enterprise solutions with you"}]', 450, 15, 'completed', '2025-09-11T02:49:06.130Z', '2025-09-11T02:56:36.130Z'),
  ('b4598718-6a6f-44ed-b19f-a0694d9e5ae2', 'ffa73277-d396-4244-b516-5d178fafde35', 'add4c2b1-184c-4ce5-bc94-0f6d12e909a0', 'chat_006', 'user_678', '[{"role":"user","content":"Want to schedule a consultation"},{"role":"assistant","content":"I have availability tomorrow at 2pm"}]', 90, 4, 'completed', '2025-09-11T07:19:06.130Z', '2025-09-11T07:20:36.130Z'),
  ('1f4197de-5bd2-49f4-b7f8-a7807e628b3f', 'ffa73277-d396-4244-b516-5d178fafde35', '1afd4dce-3b74-44b6-bd61-7cb045124c6c', 'chat_007', 'user_901', '[{"role":"user","content":"Great shopping experience!"},{"role":"assistant","content":"Thank you! Would you mind rating your experience?"}]', 150, 6, 'completed', '2025-09-11T00:49:06.130Z', '2025-09-11T00:51:36.130Z');

ALTER TABLE "chat_logs" ADD CONSTRAINT "chat_logs_pkey" PRIMARY KEY ("id");


-- Table: contacts (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "contacts" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "contacts" ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");


-- Table: conversations (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "agent_id" CHARACTER VARYING NOT NULL,
  "contact_id" CHARACTER VARYING,
  "title" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");


-- Table: knowledge_base (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "knowledge_base" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "content" TEXT,
  "url" TEXT,
  "parent_id" CHARACTER VARYING,
  "last_synced" TIMESTAMP WITHOUT TIME ZONE,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id");


-- Table: llm_configurations (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "llm_configurations" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" CHARACTER VARYING NOT NULL,
  "llm_provider_id" CHARACTER VARYING NOT NULL,
  "llm_model_id" CHARACTER VARYING NOT NULL,
  "system_prompt" TEXT NOT NULL,
  "temperature" NUMERIC(3,2) DEFAULT 0.7,
  "max_tokens" INTEGER DEFAULT 2048,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "llm_configurations" ("id", "agent_id", "llm_provider_id", "llm_model_id", "system_prompt", "temperature", "max_tokens", "created_at", "updated_at") VALUES
  ('ae16f324-8642-4139-af41-caf6850461fc', 'b875d286-e4c8-4724-af59-2e9f5c4aaedc', '85c4ff79-f5b6-4f63-a177-2f82c7a906c4', '42d5c2f5-eeed-4d4d-88e3-4cbd1a57e785', 'You are a helpful AI assistant. Be concise and helpful in your responses.', '0.70', 2048, '2025-09-12T08:54:39.833Z', '2025-09-12T08:54:39.833Z');

ALTER TABLE "llm_configurations" ADD CONSTRAINT "llm_configurations_pkey" PRIMARY KEY ("id");


-- Table: llm_models (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "llm_models" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "llm_provider_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "max_tokens" INTEGER DEFAULT 4096,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "llm_models" ("id", "llm_provider_id", "name", "identifier", "max_tokens", "is_active", "created_at") VALUES
  ('42d5c2f5-eeed-4d4d-88e3-4cbd1a57e785', '85c4ff79-f5b6-4f63-a177-2f82c7a906c4', 'GPT-4', 'gpt-4', 4096, TRUE, '2025-09-12T08:51:17.824Z');

ALTER TABLE "llm_models" ADD CONSTRAINT "llm_models_pkey" PRIMARY KEY ("id");


-- Table: llm_providers (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "llm_providers" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "api_key" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "llm_providers" ("id", "name", "api_key", "is_active", "created_at") VALUES
  ('85c4ff79-f5b6-4f63-a177-2f82c7a906c4', 'OpenAI', NULL, TRUE, '2025-09-12T08:51:16.933Z');

ALTER TABLE "llm_providers" ADD CONSTRAINT "llm_providers_pkey" PRIMARY KEY ("id");


-- Table: messages (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "messages" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "agent_id" CHARACTER VARYING NOT NULL,
  "conversation_id" CHARACTER VARYING NOT NULL,
  "contact_id" CHARACTER VARYING,
  "content" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "messages" ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");


-- Table: tenants (2 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "tenants" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "domain" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "tenants" ("id", "name", "domain", "created_at") VALUES
  ('ffa73277-d396-4244-b516-5d178fafde35', 'Scopic Test', NULL, '2025-09-11T05:06:25.440Z'),
  ('315a0f17-830b-46ee-b73a-5c3776f5ca9a', 'kg', NULL, '2025-09-12T07:54:46.940Z');

ALTER TABLE "tenants" ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");


-- Table: transcriber_configurations (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "transcriber_configurations" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" CHARACTER VARYING NOT NULL,
  "transcriber_provider_id" CHARACTER VARYING NOT NULL,
  "transcriber_language_id" CHARACTER VARYING NOT NULL,
  "transcriber_model_id" CHARACTER VARYING NOT NULL,
  "transcriber_settings" JSONB,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "transcriber_configurations" ("id", "agent_id", "transcriber_provider_id", "transcriber_language_id", "transcriber_model_id", "transcriber_settings", "created_at", "updated_at") VALUES
  ('998eda52-1a19-4661-94d1-d2ec3d0c4761', 'b875d286-e4c8-4724-af59-2e9f5c4aaedc', '6560cb95-7303-4ef6-bcf4-43669dc3f221', 'a4ac2492-cdbc-4399-875e-18cfdf70161c', 'dcf934bf-6849-4b4e-ade6-b9ba7b4549e5', NULL, '2025-09-12T08:54:39.978Z', '2025-09-12T08:54:39.978Z');

ALTER TABLE "transcriber_configurations" ADD CONSTRAINT "transcriber_configurations_pkey" PRIMARY KEY ("id");


-- Table: transcriber_languages (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "transcriber_languages" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "transcriber_provider_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "transcriber_languages" ("id", "transcriber_provider_id", "name", "code", "is_active", "created_at") VALUES
  ('a4ac2492-cdbc-4399-875e-18cfdf70161c', '6560cb95-7303-4ef6-bcf4-43669dc3f221', 'English', 'en', TRUE, '2025-09-12T08:51:21.510Z');

ALTER TABLE "transcriber_languages" ADD CONSTRAINT "transcriber_languages_pkey" PRIMARY KEY ("id");


-- Table: transcriber_models (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "transcriber_models" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "transcriber_provider_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "transcriber_models" ("id", "transcriber_provider_id", "name", "identifier", "is_active", "created_at") VALUES
  ('dcf934bf-6849-4b4e-ade6-b9ba7b4549e5', '6560cb95-7303-4ef6-bcf4-43669dc3f221', 'Whisper-1', 'whisper-1', TRUE, '2025-09-12T08:51:22.269Z');

ALTER TABLE "transcriber_models" ADD CONSTRAINT "transcriber_models_pkey" PRIMARY KEY ("id");


-- Table: transcriber_providers (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "transcriber_providers" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "api_key" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "transcriber_providers" ("id", "name", "api_key", "is_active", "created_at") VALUES
  ('6560cb95-7303-4ef6-bcf4-43669dc3f221', 'OpenAI Whisper', NULL, TRUE, '2025-09-12T08:51:20.776Z');

ALTER TABLE "transcriber_providers" ADD CONSTRAINT "transcriber_providers_pkey" PRIMARY KEY ("id");


-- Table: users (3 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "users" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "username" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'tenant_admin'::text,
  "tenant_id" CHARACTER VARYING NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "users" ("id", "username", "email", "password", "role", "tenant_id", "created_at") VALUES
  ('7b582e7c-1681-40ea-9b27-afebdf00ac46', 'scopictest', 'scopicservices@gmail.com', '$2b$10$GA50ZY.Zjiwwvhoj0ri8i.NIFJvPzWfCIZr7.8q3OF.ugn53unB1a', 'tenant_admin', 'ffa73277-d396-4244-b516-5d178fafde35', '2025-09-11T05:06:25.591Z'),
  ('e7f1bebb-6fa1-4676-96f2-4bdc23771bc0', 'testuser', 'user@example.com', '$2b$10$qDSgxBOrxZv7iAQai2hdAO3bH7tHreSvBjVPbHmEaVkOPizWlftJu', 'tenant_admin', 'ffa73277-d396-4244-b516-5d178fafde35', '2025-09-11T08:35:53.769Z'),
  ('75b5fb1b-60cc-4477-b5f6-4785ea959e51', 'kg', 'kg@gmail.com', '$2b$10$6P0NamZHPWnKnECE0hvozuaX085InsoQCGFj.OKiSmxas5wa6iLUC', 'tenant_admin', '315a0f17-830b-46ee-b73a-5c3776f5ca9a', '2025-09-12T07:54:47.090Z');

ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


-- Table: voice_configurations (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "voice_configurations" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" CHARACTER VARYING NOT NULL,
  "voice_provider_id" CHARACTER VARYING NOT NULL,
  "voice_id" CHARACTER VARYING NOT NULL,
  "voice_model_id" CHARACTER VARYING NOT NULL,
  "voice_settings" JSONB,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "voice_configurations" ("id", "agent_id", "voice_provider_id", "voice_id", "voice_model_id", "voice_settings", "created_at", "updated_at") VALUES
  ('6cfae103-0d10-4aa9-8f6f-ae0739036261', 'b875d286-e4c8-4724-af59-2e9f5c4aaedc', 'ec7e1275-7cac-44cb-8e4d-e77b441287cb', 'afa65b7d-e7bf-4c98-ba2a-272073b24dab', 'd14817e4-02d4-4609-8ce8-5e6178dc0abb', NULL, '2025-09-12T08:54:39.905Z', '2025-09-12T08:54:39.905Z');

ALTER TABLE "voice_configurations" ADD CONSTRAINT "voice_configurations_pkey" PRIMARY KEY ("id");


-- Table: voice_models (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "voice_models" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "voice_provider_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "voice_models" ("id", "voice_provider_id", "name", "identifier", "is_active", "created_at") VALUES
  ('d14817e4-02d4-4609-8ce8-5e6178dc0abb', 'ec7e1275-7cac-44cb-8e4d-e77b441287cb', 'Standard', 'standard', TRUE, '2025-09-12T08:51:19.994Z');

ALTER TABLE "voice_models" ADD CONSTRAINT "voice_models_pkey" PRIMARY KEY ("id");


-- Table: voice_providers (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "voice_providers" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "api_key" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "voice_providers" ("id", "name", "api_key", "is_active", "created_at") VALUES
  ('ec7e1275-7cac-44cb-8e4d-e77b441287cb', 'ElevenLabs', NULL, TRUE, '2025-09-12T08:51:18.545Z');

ALTER TABLE "voice_providers" ADD CONSTRAINT "voice_providers_pkey" PRIMARY KEY ("id");


-- Table: voices (1 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "voices" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "voice_provider_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "language" TEXT,
  "gender" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "voices" ("id", "voice_provider_id", "name", "identifier", "language", "gender", "is_active", "created_at") VALUES
  ('afa65b7d-e7bf-4c98-ba2a-272073b24dab', 'ec7e1275-7cac-44cb-8e4d-e77b441287cb', 'Alloy', 'alloy', 'en', 'neutral', TRUE, '2025-09-12T08:51:19.262Z');

ALTER TABLE "voices" ADD CONSTRAINT "voices_pkey" PRIMARY KEY ("id");


-- Table: webhook_logs (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "webhook_logs" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "event_type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "response" JSONB,
  "status" TEXT NOT NULL,
  "status_code" INTEGER,
  "retry_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");


-- Table: webhooks (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "webhooks" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "secret" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id");


-- Table: workflows (3 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "workflows" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "nodes" JSONB NOT NULL,
  "edges" JSONB NOT NULL,
  "is_active" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "workflows" ("id", "tenant_id", "name", "description", "type", "nodes", "edges", "is_active", "created_at", "updated_at") VALUES
  ('127775b1-1e9b-4d0e-a805-0d7c172779f2', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Pipeline', 'Automated sales qualification and lead routing workflow', 'lead_qualification', '{"nodes":[{"id":"start","data":{"label":"New Lead"},"type":"trigger"},{"id":"qualify","data":{"label":"Qualify Lead"},"type":"condition"}]}', '{"edges":[{"id":"edge1","source":"start","target":"qualify"}]}', TRUE, '2025-09-11T08:20:06.351Z', '2025-09-11T08:20:06.351Z'),
  ('d5efad9e-8459-475b-bce0-1e22675e8e12', 'ffa73277-d396-4244-b516-5d178fafde35', 'Customer Support Routing', 'Route customer inquiries to appropriate support agents', 'custom', '{"nodes":[{"id":"start","data":{"label":"Support Request"},"type":"trigger"},{"id":"route","data":{"label":"Route to Agent"},"type":"action"}]}', '{"edges":[{"id":"edge1","source":"start","target":"route"}]}', TRUE, '2025-09-11T08:20:06.351Z', '2025-09-11T08:20:06.351Z'),
  ('acd7ef27-b31a-4269-b6c9-eee39593e851', 'ffa73277-d396-4244-b516-5d178fafde35', 'Test Workflow E2E', '', 'custom', '[{"id":"start-1","data":{"label":"Start"},"type":"start","position":{"x":100,"y":200}},{"id":"end-1","data":{"label":"End"},"type":"end","position":{"x":600,"y":200}}]', '[{"id":"edge-1","source":"start-1","target":"end-1"}]', FALSE, '2025-09-11T08:40:38.696Z', '2025-09-11T08:40:38.696Z');

ALTER TABLE "workflows" ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");


SET session_replication_role = DEFAULT;

-- Export completed
