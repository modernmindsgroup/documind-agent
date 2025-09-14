-- PostgreSQL Database Export
-- Generated on: 2025-09-14T07:10:13.608Z
-- 

SET session_replication_role = replica;

-- Table: agent_documents (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "agent_documents" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "agent_id" CHARACTER VARYING NOT NULL,
  "document_id" CHARACTER VARYING NOT NULL,
  "added_by" CHARACTER VARYING NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE "agent_documents" ADD CONSTRAINT "agent_documents_pkey" PRIMARY KEY ("id");


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
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "realtime_voice_platform" TEXT DEFAULT 'text'::text
);

INSERT INTO "agent_preferences" ("id", "agent_id", "is_contact_required", "logo", "display_name", "widget_theme_color", "created_at", "updated_at", "realtime_voice_platform") VALUES
  ('87e47c86-636e-42e6-bc1b-06c40c7be76c', 'b875d286-e4c8-4724-af59-2e9f5c4aaedc', TRUE, NULL, 'Default Config Test Agent', '#2563eb', '2025-09-12T08:54:39.151Z', '2025-09-12T08:54:39.151Z', 'Custom');

ALTER TABLE "agent_preferences" ADD CONSTRAINT "agent_preferences_pkey" PRIMARY KEY ("id");


-- Table: agents (8 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "agents" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT false,
  "edited_by" CHARACTER VARYING NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "call_platform" TEXT DEFAULT 'default'::text
);

INSERT INTO "agents" ("id", "tenant_id", "name", "description", "type", "is_active", "edited_by", "created_at", "updated_at", "call_platform") VALUES
  ('56f35988-759c-4c5f-86ab-85fdcd1dd889', 'ffa73277-d396-4244-b516-5d178fafde35', 'Customer Support Agent', NULL, 'single_prompt', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', 'default'),
  ('de41cfe8-7357-4bc8-870d-6ae16584055f', 'ffa73277-d396-4244-b516-5d178fafde35', 'Lead Qualification Agent', NULL, 'conversation_flow', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', 'default'),
  ('add4c2b1-184c-4ce5-bc94-0f6d12e909a0', 'ffa73277-d396-4244-b516-5d178fafde35', 'Appointment Booking Agent', NULL, 'single_prompt', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', 'default'),
  ('7dd3cb04-b647-4b8f-8594-d55c5d77fcf8', 'ffa73277-d396-4244-b516-5d178fafde35', 'Product Information Agent', NULL, 'multi_prompt', FALSE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', 'default'),
  ('1afd4dce-3b74-44b6-bd61-7cb045124c6c', 'ffa73277-d396-4244-b516-5d178fafde35', 'Feedback Collection Agent', NULL, 'conversation_flow', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:40:09.466Z', '2025-09-11T07:40:09.466Z', 'default'),
  ('c59d8fc4-1969-452f-8b77-a85ff2f15c70', 'ffa73277-d396-4244-b516-5d178fafde35', 'Test Single Prompt Agent', 'This is a test single prompt agent for testing purposes', 'single_prompt', FALSE, 'e7f1bebb-6fa1-4676-96f2-4bdc23771bc0', '2025-09-12T08:43:42.475Z', '2025-09-12T08:43:42.475Z', 'default'),
  ('b875d286-e4c8-4724-af59-2e9f5c4aaedc', 'ffa73277-d396-4244-b516-5d178fafde35', 'Default Config Test Agent', 'Testing automatic default configuration creation', 'single_prompt', FALSE, 'e7f1bebb-6fa1-4676-96f2-4bdc23771bc0', '2025-09-12T08:54:39.077Z', '2025-09-12T08:54:39.077Z', 'default'),
  ('e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent', NULL, 'single_prompt', TRUE, '7b582e7c-1681-40ea-9b27-afebdf00ac46', '2025-09-11T07:29:47.099Z', '2025-09-13T17:47:01.037Z', 'livekit');

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


-- Table: calls (22 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "calls" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "agent_id" CHARACTER VARYING NOT NULL,
  "room_id" CHARACTER VARYING NOT NULL,
  "contact_id" CHARACTER VARYING,
  "direction" TEXT NOT NULL DEFAULT 'inbound'::text,
  "status" TEXT NOT NULL DEFAULT 'initiated'::text,
  "started_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "ended_at" TIMESTAMP WITHOUT TIME ZONE,
  "duration_seconds" INTEGER,
  "recording_url" TEXT,
  "transcript_url" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "call_token" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid()
);

INSERT INTO "calls" ("id", "tenant_id", "agent_id", "room_id", "contact_id", "direction", "status", "started_at", "ended_at", "duration_seconds", "recording_url", "transcript_url", "metadata", "created_at", "call_token") VALUES
  ('81d5310a-c9bd-471c-b43e-a4b1c3539991', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'fbf41876-16e5-4c4b-be18-88c41b0f933f', NULL, 'inbound', 'initiated', '2025-09-13T11:10:52.994Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T11:10:52.994Z', 'db4df886-7ec3-4a58-a2cf-31c67f9c56fa'),
  ('d70d1e9e-0091-435b-b22e-5d96e86e9ac7', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'd5087f33-a9f8-4625-aa5f-b5c836863379', NULL, 'inbound', 'initiated', '2025-09-13T11:15:43.624Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T11:15:43.624Z', '7a5866f6-a874-42e7-a0a6-cdc3ea83c567'),
  ('bfb61699-5b8b-4122-9a35-44e0b1146fc1', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '1ced376b-116a-422a-8fc2-05021dc64246', NULL, 'inbound', 'initiated', '2025-09-13T11:19:24.903Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T11:19:24.903Z', 'e510d147-c600-4f2d-92c6-2fa1205161cb'),
  ('3e4d4def-3c6d-48f8-9cc6-b8dc318b74f4', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '2049abf2-bc73-4bf6-9632-c3ca5a15f97a', NULL, 'inbound', 'initiated', '2025-09-13T11:22:18.981Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T11:22:18.981Z', '343c8ab9-fd4c-4a1d-9069-437ca690af54'),
  ('3fe252e6-db17-4ad1-be16-855e24fe971f', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'dd1ff694-f0da-46a6-92a5-72bf9ecb0256', NULL, 'inbound', 'initiated', '2025-09-13T11:34:32.659Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T11:34:32.659Z', '22181675-e583-469e-b35a-b57f6b934834'),
  ('2180cd36-b0bc-4983-add3-5de653ddf9a5', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '846a5abc-5fea-4a18-bf4f-7f67a5052d6e', NULL, 'inbound', 'initiated', '2025-09-13T11:58:52.646Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T11:58:52.646Z', '88936684-6330-4bf2-8823-31b363fe2f37'),
  ('b6d547f5-17d6-4b4d-bbc1-3d0348959050', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '8278528d-092e-458b-87af-921799c37b68', NULL, 'inbound', 'connected', '2025-09-13T12:28:46.256Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T12:28:46.256Z', 'c790149e-4951-4aa2-8930-45d97db65b21'),
  ('a241f2b3-1fb7-4f04-974f-75a77e284608', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'c045ceb1-b5a3-46f1-833e-14384f575564', NULL, 'inbound', 'connected', '2025-09-13T12:44:21.900Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T12:44:21.900Z', 'aac42399-0621-46a5-b515-0666505c20e8'),
  ('8e55e107-687a-4445-8bef-3b80b70eb619', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'ccda4fa6-5355-4e6d-ba6d-decc2d237158', NULL, 'inbound', 'connected', '2025-09-13T12:47:19.711Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T12:47:19.711Z', '98bee222-fa6c-4331-8e95-53affdefd59c'),
  ('a3ddcc6f-2aef-4039-9454-41f31a743cbe', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b6f3a6ba-a48b-4ec5-bbf4-a926e080c809', NULL, 'inbound', 'connected', '2025-09-13T13:00:53.876Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T13:00:53.876Z', '650d8fd8-3a36-4b7e-9db0-c8c1e7378e6d'),
  ('4118670c-6d3d-40f7-8ff4-dc3589ef7351', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '08d4afb9-d5e6-435c-97ed-9f0d4a8d5860', NULL, 'inbound', 'connected', '2025-09-13T13:07:26.617Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T13:07:26.617Z', '5f3e008d-3c2a-4159-888f-85dbe8cabe72'),
  ('bb3f3192-5bbe-4aef-a7e8-8d2e36b4241e', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '4b8c56f1-99d8-45e7-a231-c3c18f09c31e', NULL, 'inbound', 'connected', '2025-09-13T13:13:04.182Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T13:13:04.182Z', 'f53c5c19-349e-4fd2-bcb3-7fcfadb5d708'),
  ('d002b1ac-db8e-41e0-9c10-bee7caf485f4', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '822a1f85-f45c-4b70-b11e-8413ba922ae4', NULL, 'inbound', 'connected', '2025-09-13T13:17:08.472Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T13:17:08.472Z', '16ef9091-ff4a-485d-a492-abba9e41cf46'),
  ('1b4b3997-bdbd-49a7-a8f3-481eda6d2cb5', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '732eb558-75f9-40d9-8136-8ecace10a2a3', NULL, 'inbound', 'connected', '2025-09-13T13:24:09.825Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T13:24:09.825Z', '523aff76-8dba-4c35-ba51-0a639c906d4a'),
  ('286ac1c0-806b-4686-8ee8-58c73c117d5d', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '2fc19ef5-404b-4db8-8bec-34aa2a21a8a5', NULL, 'inbound', 'initiated', '2025-09-13T13:26:10.121Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T13:26:10.121Z', 'd3caa106-80e4-4697-b4b2-aeddba7c7b26'),
  ('543143ee-42c4-4d1e-8e4b-b03eac33d479', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'e9e99992-bc25-42bd-8ce1-7abd9610bc4c', NULL, 'inbound', 'initiated', '2025-09-13T13:28:53.761Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T13:28:53.761Z', '1baf9f4d-15ee-4970-a3b3-6d9afb9cbe35'),
  ('c9f2ea22-ff38-40f8-a5a5-ace3ccebb1be', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '3f348954-15cf-42f1-8090-81a952d5b039', NULL, 'inbound', 'connected', '2025-09-13T15:09:06.524Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T15:09:06.524Z', '51682872-c361-4c88-98a9-dadf0ea279c7'),
  ('dabd7ea0-fe7b-43ab-8476-7ef3d93ac310', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '44992d5a-2215-4294-9a99-aeb3649f3cd9', NULL, 'inbound', 'connected', '2025-09-13T15:11:16.171Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T15:11:16.171Z', '7d0c724d-d58c-4195-b7c7-abbe9e8b3bd5'),
  ('8454b340-4966-4805-b0b2-9ae196b3f61e', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '0e646f7b-056d-4ea5-81d8-705ca8b53b16', NULL, 'inbound', 'connected', '2025-09-13T15:21:39.672Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T15:21:39.672Z', 'ac720656-8956-40b5-aa42-97f09e865575'),
  ('aceaaeae-e7bf-4cc5-8e27-c96cb8c91946', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'fa6c5e80-7cdf-4ed7-bb2b-8a29131c0c58', 'c9de6ab0-e868-4ac1-a8c1-a70322322d82', 'inbound', 'active', '2025-09-13T16:24:54.479Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T16:24:54.433Z', '6bd7efe2-7b2e-4abd-af2d-5914a3227733'),
  ('bc6f5f90-a2c8-4813-acf7-1ed284606aa9', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '0697860b-f555-4fae-a62a-98c4ee519e63', 'a43b5671-ad19-47f8-8c12-73da4e9b2d1c', 'inbound', 'completed', '2025-09-13T17:55:16.896Z', '2025-09-13T17:58:39.532Z', 202, NULL, NULL, NULL, '2025-09-13T17:55:16.896Z', '6667876c-0006-4d67-af56-2265941ad9b3'),
  ('8680050c-02b1-46f9-be6b-a81a989a5c3d', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '5ade58fd-1516-49b0-9ee3-44ec27ae0f5a', '73d031ad-6cbf-490d-ab2a-bad141a5011e', 'inbound', 'connected', '2025-09-13T17:59:02.089Z', NULL, NULL, NULL, NULL, NULL, '2025-09-13T17:59:02.089Z', 'c1cec88d-1031-4c94-821a-7d314740cc99');

ALTER TABLE "calls" ADD CONSTRAINT "calls_pkey" PRIMARY KEY ("id");


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


-- Table: contacts (27 rows)
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

INSERT INTO "contacts" ("id", "tenant_id", "name", "email", "phone", "created_at", "updated_at") VALUES
  ('4f934c56-af4e-42aa-a612-e83b72e14bf3', 'ffa73277-d396-4244-b516-5d178fafde35', 'Martin Muriithi', 'macmuriithi@gmail.com', '0729934932', '2025-09-13T08:43:10.396Z', '2025-09-13T08:43:10.396Z'),
  ('69d8f29a-57cd-4004-9a92-1c76101046ec', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T09:06:22.945Z', '2025-09-13T09:06:22.945Z'),
  ('4fed076c-9c34-4611-8a9e-ef84195b02ed', 'ffa73277-d396-4244-b516-5d178fafde35', 'Martin Machunia Muriithi', 'martin@scopicafrica.com', '0729934932', '2025-09-13T10:30:29.529Z', '2025-09-13T10:30:29.529Z'),
  ('65147f8f-adda-4e1e-87c4-3b876d9062c4', 'ffa73277-d396-4244-b516-5d178fafde35', 'Martin Machunia Muriithi', 'martin@scopicafrica.com', '0729934932', '2025-09-13T10:53:54.107Z', '2025-09-13T10:53:54.107Z'),
  ('75648e14-cddd-4e36-8cbb-defde535ed46', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T11:10:51.887Z', '2025-09-13T11:10:51.887Z'),
  ('38710aa8-a8eb-41f5-809d-a356de9aa8d3', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T11:15:42.482Z', '2025-09-13T11:15:42.482Z'),
  ('f4c56a9a-3162-43d5-a629-a4c47da06195', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T11:19:23.762Z', '2025-09-13T11:19:23.762Z'),
  ('5e083b3c-0a78-4cf3-a762-5ea2020006e6', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T11:22:17.787Z', '2025-09-13T11:22:17.787Z'),
  ('7ea6011e-71e8-421f-a462-12ba94bf552d', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T11:34:31.512Z', '2025-09-13T11:34:31.512Z'),
  ('0dfffa3b-5fc0-49b6-8bc8-37f589a95c39', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T11:58:51.433Z', '2025-09-13T11:58:51.433Z'),
  ('5b54a89f-2dff-4679-a707-4737f0438223', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T12:28:44.679Z', '2025-09-13T12:28:44.679Z'),
  ('2c9e6691-4ab5-4360-ba7f-f6fe8fad65b0', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T12:44:20.769Z', '2025-09-13T12:44:20.769Z'),
  ('122cff3a-1b6f-4136-8e3e-366d4ab8eac1', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T12:47:18.299Z', '2025-09-13T12:47:18.299Z'),
  ('34a74e22-4acb-4d9d-9b9a-ec936043eca5', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T13:00:52.742Z', '2025-09-13T13:00:52.742Z'),
  ('fd923f60-161f-40a2-a7f5-f4d5eba22788', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T13:07:25.437Z', '2025-09-13T13:07:25.437Z'),
  ('f5eaf9df-4234-4d1a-b6f2-c572456b2f81', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T13:13:03.010Z', '2025-09-13T13:13:03.010Z'),
  ('40b99697-f8c7-4238-9dfb-50378015e29b', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T13:17:07.263Z', '2025-09-13T13:17:07.263Z'),
  ('d4bfd49e-752e-4169-b29d-b8e409ce78ab', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T13:24:08.658Z', '2025-09-13T13:24:08.658Z'),
  ('04437419-b831-4c8f-bdec-b496475daad0', 'ffa73277-d396-4244-b516-5d178fafde35', 'Test User', 'test@example.com', NULL, '2025-09-13T13:26:01.584Z', '2025-09-13T13:26:01.584Z'),
  ('bbbfbb4b-d399-49df-a515-1c582a0415b1', 'ffa73277-d396-4244-b516-5d178fafde35', 'Test User', 'test@example.com', NULL, '2025-09-13T13:28:45.639Z', '2025-09-13T13:28:45.639Z'),
  ('77c726e4-1cad-45df-a31f-25f384e6d480', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T15:09:05.357Z', '2025-09-13T15:09:05.357Z'),
  ('ba0bb270-2176-44d0-9f86-eb72fb86f5fa', 'ffa73277-d396-4244-b516-5d178fafde35', 'Martin', 'macmuriithi@gmail.com', '0729934932', '2025-09-13T15:11:15.059Z', '2025-09-13T15:11:15.059Z'),
  ('07ce6449-68a0-4866-a129-aadca03422b8', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T15:21:38.494Z', '2025-09-13T15:21:38.494Z'),
  ('c9de6ab0-e868-4ac1-a8c1-a70322322d82', 'ffa73277-d396-4244-b516-5d178fafde35', 'Test User', 'test@example.com', '+1234567890', '2025-09-13T16:24:54.109Z', '2025-09-13T16:24:54.109Z'),
  ('a43b5671-ad19-47f8-8c12-73da4e9b2d1c', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T17:55:16.560Z', '2025-09-13T17:55:16.560Z'),
  ('73d031ad-6cbf-490d-ab2a-bad141a5011e', 'ffa73277-d396-4244-b516-5d178fafde35', 'Modern Minds', 'modernmindsgroup@gmail.com', '0729934932', '2025-09-13T17:59:01.759Z', '2025-09-13T17:59:01.759Z'),
  ('f530cf84-dbcd-4cc7-b3bd-87dd41e868ec', 'ffa73277-d396-4244-b516-5d178fafde35', 'Martin Machunia Muriithi', 'martin@scopicafrica.com', '0729934932', '2025-09-13T18:56:43.874Z', '2025-09-13T18:56:43.874Z');

ALTER TABLE "contacts" ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");


-- Table: conversations (4 rows)
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

INSERT INTO "conversations" ("id", "tenant_id", "agent_id", "contact_id", "title", "is_active", "created_at", "updated_at") VALUES
  ('b818d6f7-d563-4d3f-af70-afe5dd970ebd', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '4f934c56-af4e-42aa-a612-e83b72e14bf3', 'Widget Chat', TRUE, '2025-09-13T08:43:11.111Z', '2025-09-13T08:43:11.111Z'),
  ('2753d569-61b6-41c5-b8bc-581ef6d5a85f', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '69d8f29a-57cd-4004-9a92-1c76101046ec', 'Widget Chat', TRUE, '2025-09-13T09:06:23.490Z', '2025-09-13T09:06:23.490Z'),
  ('e748eaa9-b62c-43f1-be1d-eea50a3c6ccc', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '4fed076c-9c34-4611-8a9e-ef84195b02ed', 'Widget Chat', TRUE, '2025-09-13T10:30:30.007Z', '2025-09-13T10:30:30.007Z'),
  ('3c3e44a7-b819-48c3-911c-618acd53680b', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'f530cf84-dbcd-4cc7-b3bd-87dd41e868ec', 'Widget Chat', TRUE, '2025-09-13T18:56:44.362Z', '2025-09-13T18:56:44.362Z');

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");


-- Table: documents (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "documents" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "storage_key" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'upload'::text,
  "uploaded_by" CHARACTER VARYING NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE "documents" ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");


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
  "max_tokens" INTEGER DEFAULT 2048,
  "temperature" INTEGER DEFAULT 70,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "llm_configurations" ("id", "agent_id", "llm_provider_id", "llm_model_id", "system_prompt", "max_tokens", "temperature", "created_at", "updated_at") VALUES
  ('ae16f324-8642-4139-af41-caf6850461fc', 'b875d286-e4c8-4724-af59-2e9f5c4aaedc', '85c4ff79-f5b6-4f63-a177-2f82c7a906c4', '42d5c2f5-eeed-4d4d-88e3-4cbd1a57e785', 'You are a helpful AI assistant. Be concise and helpful in your responses.', 2048, 1, '2025-09-12T08:54:39.833Z', '2025-09-12T08:54:39.833Z');

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


-- Table: messages (18 rows)
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

INSERT INTO "messages" ("id", "tenant_id", "agent_id", "conversation_id", "contact_id", "content", "role", "created_at") VALUES
  ('b743513c-1028-4fbe-830e-d06f36810829', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b818d6f7-d563-4d3f-af70-afe5dd970ebd', NULL, 'hello', 'user', '2025-09-13T08:43:15.360Z'),
  ('07ab7475-648a-4878-be17-b89acb5d4078', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b818d6f7-d563-4d3f-af70-afe5dd970ebd', NULL, 'hello', 'user', '2025-09-13T08:43:16.381Z'),
  ('24134720-8387-4b48-b918-9f90b36f5799', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b818d6f7-d563-4d3f-af70-afe5dd970ebd', NULL, 'AI chat is currently unavailable. Please ensure the OpenAI API key is configured.', 'assistant', '2025-09-13T08:43:16.702Z'),
  ('e85946a4-d797-4887-ae67-b2c21f7e5a01', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b818d6f7-d563-4d3f-af70-afe5dd970ebd', NULL, 'Hello', 'user', '2025-09-13T08:55:59.103Z'),
  ('de29481b-cd13-408d-b472-f3e1ce24a1f8', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b818d6f7-d563-4d3f-af70-afe5dd970ebd', NULL, 'Hello', 'user', '2025-09-13T08:55:59.633Z'),
  ('c79420bb-bdd8-4556-95c7-7acc3fe7412b', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b818d6f7-d563-4d3f-af70-afe5dd970ebd', NULL, 'Hello! How can I assist you today?', 'assistant', '2025-09-13T08:56:00.871Z'),
  ('6c429f52-c9bb-47e8-b14a-1eac5278eee7', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b818d6f7-d563-4d3f-af70-afe5dd970ebd', NULL, 'Am good. How are you', 'user', '2025-09-13T08:56:09.146Z'),
  ('30e90d2b-a9f4-4144-95a2-3e589e7d6b2e', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b818d6f7-d563-4d3f-af70-afe5dd970ebd', NULL, 'Am good. How are you', 'user', '2025-09-13T08:56:09.708Z'),
  ('b6797f35-dbbe-483f-ade5-da3d9213fd05', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'b818d6f7-d563-4d3f-af70-afe5dd970ebd', NULL, 'Hello! How can I assist you today?', 'assistant', '2025-09-13T08:56:10.790Z'),
  ('e38520bd-ed02-4cc6-931e-6c36436190ab', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '2753d569-61b6-41c5-b8bc-581ef6d5a85f', NULL, 'Hello', 'user', '2025-09-13T09:06:28.096Z'),
  ('ec0bf791-58c8-4117-94f3-4e3bcf800800', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '2753d569-61b6-41c5-b8bc-581ef6d5a85f', NULL, 'Hello', 'user', '2025-09-13T09:06:28.592Z'),
  ('19e34561-1da8-4b74-b9dc-83928e749750', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '2753d569-61b6-41c5-b8bc-581ef6d5a85f', NULL, 'Hi there! How can I assist you today?', 'assistant', '2025-09-13T09:06:30.112Z'),
  ('e4fd425f-da14-4d03-bbd1-9b2c00e812ab', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'e748eaa9-b62c-43f1-be1d-eea50a3c6ccc', NULL, 'hello', 'user', '2025-09-13T10:31:00.054Z'),
  ('40b6c6b2-fc19-4dfb-909d-4a5159bff7c9', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'e748eaa9-b62c-43f1-be1d-eea50a3c6ccc', NULL, 'hello', 'user', '2025-09-13T10:31:00.577Z'),
  ('65266da1-0708-4f7c-885f-e7c84637a785', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'e748eaa9-b62c-43f1-be1d-eea50a3c6ccc', NULL, 'Hello! How can I assist you today?', 'assistant', '2025-09-13T10:31:02.009Z'),
  ('92fcc52d-58ee-4ec2-a926-f04002e4c1f0', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '3c3e44a7-b819-48c3-911c-618acd53680b', NULL, 'hello', 'user', '2025-09-13T18:56:47.767Z'),
  ('b0f1e6b5-8671-49f8-aa7b-53cbe2b4259f', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '3c3e44a7-b819-48c3-911c-618acd53680b', NULL, 'hello', 'user', '2025-09-13T18:56:48.307Z'),
  ('88535946-e632-47bf-9ce3-e05b974191d5', 'ffa73277-d396-4244-b516-5d178fafde35', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', '3c3e44a7-b819-48c3-911c-618acd53680b', NULL, 'Hello! How can I assist you today?', 'assistant', '2025-09-13T18:56:49.494Z');

ALTER TABLE "messages" ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");


-- Table: payment_sessions (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "payment_sessions" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "user_id" CHARACTER VARYING NOT NULL,
  "tenant_id" CHARACTER VARYING NOT NULL,
  "amount" NUMERIC(10,2) NOT NULL,
  "paystack_reference" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending'::text,
  "authorization_url" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  "completed_at" TIMESTAMP WITHOUT TIME ZONE
);

ALTER TABLE "payment_sessions" ADD CONSTRAINT "payment_sessions_pkey" PRIMARY KEY ("id");


-- Table: room_agents (22 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "room_agents" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "room_id" CHARACTER VARYING NOT NULL,
  "agent_id" CHARACTER VARYING NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'primary'::text,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "room_agents" ("id", "room_id", "agent_id", "role", "created_at") VALUES
  ('1c843210-31ba-4baa-8fa8-80d3b2b65ffc', 'fbf41876-16e5-4c4b-be18-88c41b0f933f', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T11:10:52.918Z'),
  ('5ed34a23-cc9e-4cd2-a3ed-0612a368841c', 'd5087f33-a9f8-4625-aa5f-b5c836863379', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T11:15:43.546Z'),
  ('d7cf221b-4f41-40ca-a1f0-a9050c68c25e', '1ced376b-116a-422a-8fc2-05021dc64246', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T11:19:24.824Z'),
  ('f874001e-7b3e-4c18-afba-e562e5e1ba40', '2049abf2-bc73-4bf6-9632-c3ca5a15f97a', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T11:22:18.902Z'),
  ('0e21e73a-69ab-47b5-92b0-3c1fc56e0204', 'dd1ff694-f0da-46a6-92a5-72bf9ecb0256', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T11:34:32.579Z'),
  ('223cecad-f7d7-4ad6-a048-c18197c441c6', '846a5abc-5fea-4a18-bf4f-7f67a5052d6e', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T11:58:52.558Z'),
  ('dcd4145d-921b-4ae5-97e5-f4ab70bd4046', '8278528d-092e-458b-87af-921799c37b68', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T12:28:46.175Z'),
  ('d27fd78f-0d46-4024-afa6-71ecbffe5b1b', 'c045ceb1-b5a3-46f1-833e-14384f575564', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T12:44:21.823Z'),
  ('3105ff73-ec55-486f-b60a-87e219b2d1e0', 'ccda4fa6-5355-4e6d-ba6d-decc2d237158', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T12:47:19.632Z'),
  ('be9ec12d-25af-446f-beff-8fdb1abcc3c5', 'b6f3a6ba-a48b-4ec5-bbf4-a926e080c809', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T13:00:53.799Z'),
  ('351e8b47-74bd-483a-971d-5442f933a0d9', '08d4afb9-d5e6-435c-97ed-9f0d4a8d5860', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T13:07:26.536Z'),
  ('498017a2-b574-4ed6-8ff5-7190c167f5c0', '4b8c56f1-99d8-45e7-a231-c3c18f09c31e', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T13:13:04.102Z'),
  ('719e6a51-5d05-46b7-b220-9e282e5e3948', '822a1f85-f45c-4b70-b11e-8413ba922ae4', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T13:17:08.392Z'),
  ('bddd669d-bc59-4d7c-9200-f9659772c78c', '732eb558-75f9-40d9-8136-8ecace10a2a3', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T13:24:09.743Z'),
  ('f4e3d918-50eb-4635-b138-2d2986bc4cb5', '2fc19ef5-404b-4db8-8bec-34aa2a21a8a5', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T13:26:10.040Z'),
  ('1c980049-c9ca-4ab1-8cb4-fee8fd1dee82', 'e9e99992-bc25-42bd-8ce1-7abd9610bc4c', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T13:28:53.682Z'),
  ('70ff3848-4590-4ad3-9919-e467f019d83c', '3f348954-15cf-42f1-8090-81a952d5b039', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T15:09:06.446Z'),
  ('029ded90-e357-4f0e-8509-a4956f19e4c7', '44992d5a-2215-4294-9a99-aeb3649f3cd9', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T15:11:16.096Z'),
  ('1463728d-8e2c-4691-b91e-2777f60531fa', '0e646f7b-056d-4ea5-81d8-705ca8b53b16', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T15:21:39.591Z'),
  ('8e57376e-367c-43fd-b878-faa686ad8ce4', 'fa6c5e80-7cdf-4ed7-bb2b-8a29131c0c58', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T16:24:54.352Z'),
  ('aa39af1b-2dfe-4fa3-98ee-e43c39351976', '0697860b-f555-4fae-a62a-98c4ee519e63', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T17:55:16.814Z'),
  ('e5d58251-cf6a-475d-92cb-146674cdb234', '5ade58fd-1516-49b0-9ee3-44ec27ae0f5a', 'e6395d0e-802f-4a62-bf8f-4c65f707cee4', 'primary', '2025-09-13T17:59:02.008Z');

ALTER TABLE "room_agents" ADD CONSTRAINT "room_agents_pkey" PRIMARY KEY ("id");


-- Table: rooms (22 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "rooms" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "created_by_agent_id" CHARACTER VARYING,
  "status" TEXT NOT NULL DEFAULT 'active'::text,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

INSERT INTO "rooms" ("id", "tenant_id", "name", "created_by_agent_id", "status", "created_at") VALUES
  ('fbf41876-16e5-4c4b-be18-88c41b0f933f', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T11:10:52.841Z'),
  ('d5087f33-a9f8-4625-aa5f-b5c836863379', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T11:15:43.468Z'),
  ('1ced376b-116a-422a-8fc2-05021dc64246', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T11:19:24.748Z'),
  ('2049abf2-bc73-4bf6-9632-c3ca5a15f97a', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T11:22:18.826Z'),
  ('dd1ff694-f0da-46a6-92a5-72bf9ecb0256', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T11:34:32.501Z'),
  ('846a5abc-5fea-4a18-bf4f-7f67a5052d6e', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T11:58:52.481Z'),
  ('8278528d-092e-458b-87af-921799c37b68', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T12:28:46.098Z'),
  ('c045ceb1-b5a3-46f1-833e-14384f575564', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T12:44:21.745Z'),
  ('ccda4fa6-5355-4e6d-ba6d-decc2d237158', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T12:47:19.554Z'),
  ('b6f3a6ba-a48b-4ec5-bbf4-a926e080c809', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T13:00:53.723Z'),
  ('08d4afb9-d5e6-435c-97ed-9f0d4a8d5860', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T13:07:26.445Z'),
  ('4b8c56f1-99d8-45e7-a231-c3c18f09c31e', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T13:13:04.023Z'),
  ('822a1f85-f45c-4b70-b11e-8413ba922ae4', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T13:17:08.315Z'),
  ('732eb558-75f9-40d9-8136-8ecace10a2a3', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T13:24:09.664Z'),
  ('2fc19ef5-404b-4db8-8bec-34aa2a21a8a5', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T13:26:09.963Z'),
  ('e9e99992-bc25-42bd-8ce1-7abd9610bc4c', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T13:28:53.604Z'),
  ('3f348954-15cf-42f1-8090-81a952d5b039', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T15:09:06.367Z'),
  ('44992d5a-2215-4294-9a99-aeb3649f3cd9', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T15:11:16.020Z'),
  ('0e646f7b-056d-4ea5-81d8-705ca8b53b16', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T15:21:39.512Z'),
  ('fa6c5e80-7cdf-4ed7-bb2b-8a29131c0c58', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T16:24:54.275Z'),
  ('0697860b-f555-4fae-a62a-98c4ee519e63', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T17:55:16.735Z'),
  ('5ade58fd-1516-49b0-9ee3-44ec27ae0f5a', 'ffa73277-d396-4244-b516-5d178fafde35', 'Sales Agent Room', NULL, 'active', '2025-09-13T17:59:01.930Z');

ALTER TABLE "rooms" ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");


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


-- Table: transactions (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "user_id" CHARACTER VARYING NOT NULL,
  "tenant_id" CHARACTER VARYING NOT NULL,
  "type" TEXT NOT NULL,
  "amount" NUMERIC(10,3) NOT NULL,
  "description" TEXT NOT NULL,
  "reference" TEXT,
  "message_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");


-- Table: transcriber_configurations (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "transcriber_configurations" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" CHARACTER VARYING NOT NULL,
  "transcriber_provider_id" CHARACTER VARYING NOT NULL,
  "transcriber_model_id" CHARACTER VARYING NOT NULL,
  "transcriber_language_id" CHARACTER VARYING NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "transcriber_configurations" ADD CONSTRAINT "transcriber_configurations_pkey" PRIMARY KEY ("id");


-- Table: transcriber_languages (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "transcriber_languages" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "transcriber_provider_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "transcriber_languages" ADD CONSTRAINT "transcriber_languages_pkey" PRIMARY KEY ("id");


-- Table: transcriber_models (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "transcriber_models" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "transcriber_provider_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "transcriber_models" ADD CONSTRAINT "transcriber_models_pkey" PRIMARY KEY ("id");


-- Table: transcriber_providers (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "transcriber_providers" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "api_key" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "transcriber_providers" ADD CONSTRAINT "transcriber_providers_pkey" PRIMARY KEY ("id");


-- Table: user_credits (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "user_credits" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "user_id" CHARACTER VARYING NOT NULL,
  "tenant_id" CHARACTER VARYING NOT NULL,
  "balance" NUMERIC(10,3) NOT NULL DEFAULT 0.000,
  "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE "user_credits" ADD CONSTRAINT "user_credits_pkey" PRIMARY KEY ("id");


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


-- Table: voice_configurations (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "voice_configurations" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" CHARACTER VARYING NOT NULL,
  "voice_provider_id" CHARACTER VARYING NOT NULL,
  "voice_id" CHARACTER VARYING NOT NULL,
  "voice_model_id" CHARACTER VARYING NOT NULL,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  "updated_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "voice_configurations" ADD CONSTRAINT "voice_configurations_pkey" PRIMARY KEY ("id");


-- Table: voice_models (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "voice_models" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "voice_provider_id" CHARACTER VARYING NOT NULL,
  "name" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "voice_models" ADD CONSTRAINT "voice_models_pkey" PRIMARY KEY ("id");


-- Table: voice_providers (0 rows)
-- ----------------------------------------

CREATE TABLE IF NOT EXISTS "voice_providers" (
  "id" CHARACTER VARYING NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "api_key" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE "voice_providers" ADD CONSTRAINT "voice_providers_pkey" PRIMARY KEY ("id");


-- Table: voices (0 rows)
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


-- Table: workflows (0 rows)
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

ALTER TABLE "workflows" ADD CONSTRAINT "workflows_pkey" PRIMARY KEY ("id");


SET session_replication_role = DEFAULT;

-- Export completed
