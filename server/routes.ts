import type { Express } from "express";
import { storage } from "./storage";
import { authenticateToken, generateToken, generateWidgetVoiceToken, hashPassword, comparePassword, requireTenantAccess, type AuthRequest } from "./auth";
import { 
  insertUserSchema, 
  insertTenantSchema,
  insertAgentSchema,
  insertWorkflowSchema,
  insertKnowledgeBaseSchema,
  insertWebhookSchema,
  insertApiKeySchema,
  insertAgentPreferencesSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertContactSchema,
  insertRoomSchema,
  insertRoomAgentSchema,
  insertCallSchema,
  updateCallSchema,
  widgetCallCreateSchema,
  widgetCallUpdateSchema,
  widgetCallResponseSchema,
  type Call
} from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { callPlatformRegistry } from "./calls/index";
import * as crypto from "crypto";
import { WebhookReceiver } from 'livekit-server-sdk';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = insertUserSchema.omit({ tenantId: true }).extend({
  confirmPassword: z.string(),
  tenantName: z.string().min(1),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Widget API validation schemas
const widgetContactSchema = insertContactSchema.omit({ tenantId: true }).extend({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

const widgetConversationSchema = z.object({
  contactId: z.string().uuid("Invalid contact ID"),
  title: z.string().optional(),
});

const widgetMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  role: z.enum(['user', 'assistant']).default('user'),
});

const widgetChatSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

// LiveKit webhook schemas
const livekitWebhookEvent = z.object({
  event: z.string(),
  room: z.object({
    sid: z.string(),
    name: z.string(),
    empty_timeout: z.number().optional(),
    max_participants: z.number().optional(),
    creation_time: z.number().optional(),
    turn_password: z.string().optional(),
    enabled_codecs: z.array(z.string()).optional(),
    metadata: z.string().optional(),
    num_participants: z.number().optional(),
    num_publishers: z.number().optional(),
    active_recording: z.boolean().optional(),
  }),
  participant: z.object({
    sid: z.string(),
    identity: z.string(),
    name: z.string().optional(),
    state: z.enum(['JOINING', 'JOINED', 'ACTIVE', 'DISCONNECTED']).optional(),
    tracks: z.array(z.object({
      sid: z.string(),
      type: z.enum(['AUDIO', 'VIDEO', 'DATA']).optional(),
      name: z.string().optional(),
      muted: z.boolean().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })).optional(),
    metadata: z.string().optional(),
    joined_at: z.number().optional(),
    permission: z.object({
      can_subscribe: z.boolean(),
      can_publish: z.boolean(),
      can_publish_data: z.boolean(),
    }).optional(),
    region: z.string().optional(),
    is_publisher: z.boolean().optional(),
  }).optional(),
  track: z.object({
    sid: z.string(),
    type: z.enum(['AUDIO', 'VIDEO', 'DATA']),
    name: z.string().optional(),
    muted: z.boolean().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  egress_info: z.object({
    egress_id: z.string(),
    room_id: z.string(),
    room_name: z.string(),
    status: z.string(),
    started_at: z.number(),
    ended_at: z.number().optional(),
    updated_at: z.number(),
  }).optional(),
  created_at: z.number(),
  num_dropped: z.number().optional(),
});

// Helper function to verify LiveKit webhook signature using proper JWT verification
function verifyLiveKitWebhookSignature(
  rawBody: Buffer,
  authHeader: string,
  apiSecret: string
): { isValid: boolean; payload?: any } {
  try {
    if (!authHeader || !apiSecret) {
      return { isValid: false };
    }

    // Create WebhookReceiver instance
    const webhookReceiver = new WebhookReceiver('', apiSecret);
    
    // Verify and decode the webhook
    const event = webhookReceiver.receive(rawBody.toString('utf8'), authHeader);
    
    return { isValid: true, payload: event };
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return { isValid: false };
  }
}

// Helper function to handle LiveKit webhook events
async function handleLiveKitWebhookEvent(event: any): Promise<void> {
  try {
    console.log(`🎯 Processing LiveKit event: ${event.event}`);
    
    // Extract room info and try to find corresponding call
    const roomName = event.room.name;
    const callInfo = await extractCallInfoFromRoomName(roomName);
    
    if (!callInfo) {
      console.warn(`⚠️ Could not extract call info from room name: ${roomName}`);
      return;
    }

    const { roomId, callId } = callInfo;
    
    // Handle different event types
    switch (event.event) {
      case 'room_started':
        console.log(`🏠 Room started: ${roomName}`);
        await storage.updateCall(callId, {
          status: 'connected',
          metadata: {
            roomStarted: true,
            roomStartedAt: new Date(event.created_at * 1000).toISOString(),
            livekitRoomSid: event.room.sid,
          },
        }, callInfo.tenantId);
        break;

      case 'room_finished':
        console.log(`🏁 Room finished: ${roomName}`);
        const endTime = new Date(event.created_at * 1000);
        await storage.updateCall(callId, {
          status: 'completed',
          endedAt: endTime,
          metadata: {
            roomFinished: true,
            roomFinishedAt: endTime.toISOString(),
            livekitRoomSid: event.room.sid,
          },
        }, callInfo.tenantId);
        break;

      case 'participant_joined':
        console.log(`👤 Participant joined: ${event.participant?.identity} in room ${roomName}`);
        if (event.participant?.identity?.startsWith('agent_')) {
          // Agent joined
          await storage.updateCall(callId, {
            metadata: {
              agentJoined: true,
              agentJoinedAt: new Date(event.created_at * 1000).toISOString(),
              agentIdentity: event.participant.identity,
            },
          }, callInfo.tenantId);
        } else {
          // User joined
          await storage.updateCall(callId, {
            metadata: {
              userJoined: true,
              userJoinedAt: new Date(event.created_at * 1000).toISOString(),
              userIdentity: event.participant.identity,
            },
          }, callInfo.tenantId);
        }
        break;

      case 'participant_left':
        console.log(`👋 Participant left: ${event.participant?.identity} from room ${roomName}`);
        if (event.participant?.identity?.startsWith('agent_')) {
          // Agent left
          await storage.updateCall(callId, {
            metadata: {
              agentLeft: true,
              agentLeftAt: new Date(event.created_at * 1000).toISOString(),
            },
          }, callInfo.tenantId);
        } else {
          // User left
          await storage.updateCall(callId, {
            metadata: {
              userLeft: true,
              userLeftAt: new Date(event.created_at * 1000).toISOString(),
            },
          }, callInfo.tenantId);
        }
        break;

      case 'track_published':
        console.log(`🎵 Track published: ${event.track?.type} by ${event.participant?.identity}`);
        break;

      case 'track_unpublished':
        console.log(`🔇 Track unpublished: ${event.track?.type} by ${event.participant?.identity}`);
        break;

      case 'recording_started':
        console.log(`🔴 Recording started for room: ${roomName}`);
        await storage.updateCall(callId, {
          metadata: {
            recordingStarted: true,
            recordingStartedAt: new Date(event.created_at * 1000).toISOString(),
          },
        }, callInfo.tenantId);
        break;

      case 'recording_finished':
        console.log(`⏹️ Recording finished for room: ${roomName}`);
        await storage.updateCall(callId, {
          recordingUrl: event.egress_info?.room_name || null,
          metadata: {
            recordingFinished: true,
            recordingFinishedAt: new Date(event.created_at * 1000).toISOString(),
            egressInfo: event.egress_info,
          },
        }, callInfo.tenantId);
        break;

      default:
        console.log(`🔍 Unhandled LiveKit event: ${event.event}`);
        break;
    }

    console.log(`✅ Successfully processed LiveKit event: ${event.event}`);
  } catch (error) {
    console.error(`❌ Error handling LiveKit webhook event:`, error);
    throw error;
  }
}

// Helper function to extract call info from room name with tenant isolation
async function extractCallInfoFromRoomName(roomName: string): Promise<{
  roomId: string;
  callId: string;
  tenantId: string;
} | null> {
  try {
    // Parse room name format: tenant_${tenantId}_room_${roomId}_call_${callId}
    const roomMatch = roomName.match(/tenant_([^_]+)_room_([^_]+)_call_([^_]+)/);
    if (!roomMatch) {
      console.warn(`⚠️ Invalid room name format: ${roomName}. Expected: tenant_<tenantId>_room_<roomId>_call_<callId>`);
      return null;
    }

    const [, tenantId, roomId, callId] = roomMatch;

    // Use tenant-scoped lookup instead of global '*' lookup for security
    const calls = await storage.getCallsByTenant(tenantId, { roomId, limit: 1 });
    if (calls.calls.length === 0) {
      console.warn(`⚠️ Call not found: callId=${callId}, roomId=${roomId}, tenantId=${tenantId}`);
      return null;
    }

    const call = calls.calls[0];
    
    // Verify call matches extracted IDs for security
    if (call.id !== callId || call.tenantId !== tenantId) {
      console.error(`❌ Security validation failed: extracted IDs don't match call data`);
      return null;
    }

    return {
      roomId,
      callId,
      tenantId,
    };
  } catch (error) {
    console.error('❌ Error extracting call info from room name:', error);
    return null;
  }
}

// Helper function to check LiveKit environment variables
async function checkLiveKitEnvironment(): Promise<boolean> {
  try {
    const requiredVars = [
      'LIVEKIT_URL',
      'LIVEKIT_API_KEY', 
      'LIVEKIT_API_SECRET',
      'OPENAI_API_KEY'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Environment check failed:', error);
    return false;
  }
}

// Helper function to check agent worker health
async function checkAgentWorkerHealth(): Promise<boolean> {
  try {
    // Import worker health check function
    const { getWorkerHealth, isWorkerRunning } = await import('./livekit/agentWorker');
    
    if (!isWorkerRunning()) {
      console.warn('⚠️ LiveKit agent worker not running');
      return false;
    }

    const workerHealth = await getWorkerHealth();
    if (!workerHealth.healthy) {
      console.warn(`⚠️ Agent worker unhealthy: ${workerHealth.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Agent worker health check failed:', error);
    return false;
  }
}

// Helper function to check database connectivity
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Try a simple database query to verify connectivity
    const result = await storage.getTenant('test');  // Simple tenant check
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<void> {
  
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' });
      }

      // Create tenant first
      const tenant = await storage.createTenant({
        name: validatedData.tenantName,
      });

      // Create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role || 'tenant_admin',
        tenantId: tenant.id,
      });

      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Initialize OpenAI client conditionally
  let openai: OpenAI | null = null;
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.warn('⚠️  OpenAI API key not found. AI chat features will be disabled. Set OPENAI_API_KEY environment variable to enable.');
  }

  // LiveKit webhook endpoint (public, with signature verification)
  app.post('/api/webhooks/livekit', async (req, res) => {
    try {
      console.log('📥 Received LiveKit webhook event');
      
      // Get raw body and authorization header
      const rawBody = req.body as Buffer;
      const authHeader = req.headers['authorization'] as string;
      const apiSecret = process.env.LIVEKIT_API_SECRET;
      
      if (!apiSecret) {
        console.warn('⚠️ LIVEKIT_API_SECRET not configured. Skipping signature verification.');
        return res.status(500).json({ error: 'Server configuration error' });
      }
      
      // Verify webhook signature using proper JWT verification
      const verificationResult = verifyLiveKitWebhookSignature(rawBody, authHeader, apiSecret);
      
      if (!verificationResult.isValid) {
        console.error('❌ Invalid LiveKit webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      // Use the verified payload from JWT
      const webhookEvent = verificationResult.payload;
      console.log(`📊 LiveKit event: ${webhookEvent.event} for room: ${webhookEvent.room.name}`);

      // Validate webhook event structure
      const validatedEvent = livekitWebhookEvent.parse(webhookEvent);
      
      // Handle different event types
      await handleLiveKitWebhookEvent(validatedEvent);

      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Invalid webhook payload:', error.errors);
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }
      
      console.error('❌ LiveKit webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // LiveKit health check endpoint (public)
  app.get('/api/health/livekit', async (req, res) => {
    try {
      console.log('🏥 LiveKit health check requested');
      
      // Get LiveKit platform instance
      const livekitPlatform = callPlatformRegistry.getPlatform('livekit');
      if (!livekitPlatform) {
        return res.status(503).json({
          healthy: false,
          message: 'LiveKit platform not registered',
          timestamp: new Date().toISOString(),
        });
      }

      // Perform comprehensive health checks
      const healthChecks = await Promise.allSettled([
        // 1. Check platform health
        livekitPlatform.isHealthy(),
        
        // 2. Check environment variables
        checkLiveKitEnvironment(),
        
        // 3. Check agent worker health
        checkAgentWorkerHealth(),
        
        // 4. Check database connectivity
        checkDatabaseHealth(),
      ]);

      const [platformHealth, envHealth, workerHealth, dbHealth] = healthChecks;

      const healthStatus = {
        healthy: healthChecks.every(check => check.status === 'fulfilled' && check.value === true),
        timestamp: new Date().toISOString(),
        checks: {
          platform: {
            status: platformHealth.status === 'fulfilled' ? (platformHealth.value ? 'healthy' : 'unhealthy') : 'error',
            message: platformHealth.status === 'fulfilled' ? 'LiveKit platform reachable' : 'Platform check failed',
          },
          environment: {
            status: envHealth.status === 'fulfilled' ? (envHealth.value ? 'healthy' : 'unhealthy') : 'error', 
            message: envHealth.status === 'fulfilled' ? 'Environment variables configured' : 'Missing environment variables',
          },
          worker: {
            status: workerHealth.status === 'fulfilled' ? (workerHealth.value ? 'healthy' : 'unhealthy') : 'error',
            message: workerHealth.status === 'fulfilled' ? 'Agent worker operational' : 'Agent worker issues',
          },
          database: {
            status: dbHealth.status === 'fulfilled' ? (dbHealth.value ? 'healthy' : 'unhealthy') : 'error',
            message: dbHealth.status === 'fulfilled' ? 'Database accessible' : 'Database connectivity issues',
          },
        },
      };

      const statusCode = healthStatus.healthy ? 200 : 503;
      console.log(`🏥 LiveKit health check completed: ${healthStatus.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      
      res.status(statusCode).json(healthStatus);
      
    } catch (error) {
      console.error('❌ LiveKit health check error:', error);
      res.status(503).json({
        healthy: false,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Widget API routes (public, no authentication required)
  // Get agent configuration and preferences for widget
  app.get('/api/widget/agents/:agentId', async (req, res) => {
    try {
      const { agentId } = req.params;
      
      // Validate agent ID format
      if (!agentId || typeof agentId !== 'string') {
        return res.status(400).json({ error: 'Invalid agent ID' });
      }
      
      const agent = await storage.getAgentById(agentId);
      
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get agent preferences
      const preferences = await storage.getAgentPreferences(agentId, agent.tenantId);

      res.json({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        preferences: preferences || {
          isContactRequired: true,
          displayName: agent.name,
          widgetTheme: {
            primaryColor: '#2563eb',
            secondaryColor: '#1d4ed8'
          }
        }
      });
    } catch (error) {
      console.error('Widget agent config error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create contact for widget chat
  app.post('/api/widget/agents/:agentId/contacts', async (req, res) => {
    try {
      const { agentId } = req.params;
      
      // Validate request body
      const validatedData = widgetContactSchema.parse(req.body);

      // Get agent to verify it exists and get tenant info
      const agent = await storage.getAgentById(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Create contact
      const contact = await storage.createContact({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        tenantId: agent.tenantId,
      });

      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Widget create contact error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Start conversation for widget
  app.post('/api/widget/agents/:agentId/conversations', async (req, res) => {
    try {
      const { agentId } = req.params;
      
      // Validate request body
      const validatedData = widgetConversationSchema.parse(req.body);

      // Get agent to verify it exists and get tenant info
      const agent = await storage.getAgentById(agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Verify contact exists
      const contact = await storage.getContactById(validatedData.contactId, agent.tenantId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }

      // Create conversation
      const conversation = await storage.createConversation({
        title: validatedData.title || 'Widget Chat',
        agentId,
        contactId: validatedData.contactId,
        tenantId: agent.tenantId,
      });

      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Widget create conversation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Send message to conversation
  app.post('/api/widget/conversations/:conversationId/messages', async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      // Validate request body
      const validatedData = widgetMessageSchema.parse(req.body);

      // Get conversation to verify access and get tenant info
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Create message (force role to 'user' for security on public endpoint)
      const message = await storage.createMessage({
        content: validatedData.content,
        role: 'user', // Always force 'user' role on public widget endpoints for security
        conversationId,
        agentId: conversation.agentId,
        tenantId: conversation.tenantId,
      });

      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Widget create message error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get AI chat response
  app.post('/api/widget/conversations/:conversationId/chat', async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      // Validate request body
      const validatedData = widgetChatSchema.parse(req.body);

      // Get conversation and agent info
      const conversation = await storage.getConversationById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const agent = await storage.getAgent(conversation.agentId, conversation.tenantId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Save user message first
      await storage.createMessage({
        content: validatedData.message,
        role: 'user',
        conversationId,
        agentId: conversation.agentId,
        tenantId: conversation.tenantId,
      });

      // Get recent conversation history for context
      const recentMessages = await storage.getMessagesByConversation(
        conversationId, 
        conversation.tenantId, 
        { limit: 10 }
      );

      // Build conversation context for OpenAI
      const messages: any[] = [
        {
          role: 'system',
          content: agent.description || 'You are a helpful AI assistant. Provide concise, helpful responses to user questions.'
        }
      ];

      // Add recent message history
      if (recentMessages.messages) {
        recentMessages.messages
          .reverse() // Most recent first for context
          .slice(-8) // Keep only last 8 messages for context
          .forEach(msg => {
            messages.push({
              role: msg.role,
              content: msg.content
            });
          });
      }

      // Get AI response using gpt-4o (current stable model)
      let aiResponse: string;
      
      if (!openai) {
        aiResponse = 'AI chat is currently unavailable. Please ensure the OpenAI API key is configured.';
      } else {
        try {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
            max_tokens: 500,
            temperature: 0.7,
          });
          aiResponse = response.choices[0].message.content || 'I apologize, but I was unable to generate a response. Please try again.';
        } catch (error) {
          console.error('OpenAI API error:', error);
          aiResponse = 'I apologize, but I encountered an error while generating a response. Please try again.';
        }
      }

      // Save AI response as a message
      await storage.createMessage({
        content: aiResponse,
        role: 'assistant',
        conversationId,
        agentId: conversation.agentId,
        tenantId: conversation.tenantId,
      });

      res.json({ message: aiResponse });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Widget chat response error:', error);
      res.status(500).json({ error: 'Failed to generate response' });
    }
  });

  // Widget voice call routes (public, no authentication required)
  
  // Start voice call for widget (matches widget JavaScript expectation)
  app.post('/api/widget/agents/:agentId/voice/start', async (req, res) => {
    try {
      // Validate agent ID format
      if (!req.params.agentId || typeof req.params.agentId !== 'string') {
        return res.status(400).json({ error: 'Invalid agent ID' });
      }

      // Validate request body - expecting contact info
      const { contactName, contactEmail, contactPhone } = req.body;

      // Get agent to verify it exists and get tenant info
      const agent = await storage.getAgentById(req.params.agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Create contact if contact info provided
      let contactId = null;
      if (contactName || contactEmail) {
        const contactData = insertContactSchema.parse({
          tenantId: agent.tenantId,
          email: contactEmail || '',
          name: contactName || 'Anonymous',
          phone: contactPhone || null,
        });
        const contact = await storage.createContact(contactData);
        contactId = contact.id;
      }

      // Get or create the agent's default room
      let room = await storage.getRoomByAgentId(agent.id, agent.tenantId);
      if (!room) {
        console.log(`Creating default room for agent ${agent.id}`);
        // Lazily create a default room for the agent
        const roomData = insertRoomSchema.parse({
          tenantId: agent.tenantId,
          name: `${agent.name || 'Agent'} Room`,
          isPublic: true,
        });
        room = await storage.createRoom(roomData);
        
        // Create room-agent mapping
        const roomAgentData = insertRoomAgentSchema.parse({
          roomId: room.id,
          agentId: agent.id,
          tenantId: agent.tenantId,
          role: 'primary',
        });
        await storage.createRoomAgent(roomAgentData);
      }

      // Create the call with auto-generated callToken
      const callData = insertCallSchema.parse({
        tenantId: agent.tenantId,
        agentId: agent.id,
        roomId: room.id,
        contactId: contactId,
        direction: 'inbound',
        status: 'initiated',
        // callToken will be auto-generated by the database
      });

      const call = await storage.createCall(callData);

      // Use platform abstraction to start the call
      const platform = callPlatformRegistry.getPlatformForAgent(agent);
      console.log(`🚀 Starting call ${call.id} using platform: ${platform.name}`);

      const connectionInfo = await platform.startCall(call, room, agent);

      // Update call status to connected
      await storage.updateCall(call.id, {
        status: 'connected',
      }, agent.tenantId);

      // Build response based on platform type
      const response: any = {
        success: true,
        callId: call.id,
        roomId: room.id,
        token: connectionInfo.connectionToken,
        jwtToken: connectionInfo.connectionToken, // Keep for backward compatibility
        call: {
          id: call.id,
          status: 'active',
          callToken: call.callToken,
        },
        platform: platform.type,
      };

      // Add platform-specific connection details
      if (platform.type === 'livekit') {
        response.livekitUrl = connectionInfo.livekitUrl;
        response.livekitToken = connectionInfo.livekitToken;
        response.livekitRoom = connectionInfo.additionalData?.livekitRoom;
      } else {
        // Default WebSocket platform
        response.wsUrl = connectionInfo.websocketUrl || `/ws/${room.id}/human/${call.id}`;
      }

      // Add any additional platform data
      if (connectionInfo.additionalData) {
        response.additionalData = connectionInfo.additionalData;
      }
      
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Voice start error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // End voice call for widget (matches widget JavaScript expectation)
  app.post('/api/widget/agents/:agentId/voice/end', async (req, res) => {
    try {
      // Validate agent ID format
      if (!req.params.agentId || typeof req.params.agentId !== 'string') {
        return res.status(400).json({ error: 'Invalid agent ID' });
      }

      // Validate request body - expecting callId
      const { callId } = req.body;
      if (!callId) {
        return res.status(400).json({ error: 'Call ID is required' });
      }

      // Get agent to verify it exists and get tenant info
      const agent = await storage.getAgentById(req.params.agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get and verify the call exists
      const call = await storage.getCall(callId, agent.tenantId);
      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify the call belongs to this agent
      if (call.agentId !== agent.id) {
        return res.status(403).json({ error: 'Call does not belong to this agent' });
      }

      // Use platform abstraction to end the call
      const platform = callPlatformRegistry.getPlatformForAgent(agent);
      console.log(`🛑 Ending call ${call.id} using platform: ${platform.name}`);

      await platform.endCall(call.id, call.roomId);

      // Calculate duration
      const endedAt = new Date();
      const duration = call.startedAt ? 
        Math.floor((endedAt.getTime() - new Date(call.startedAt).getTime()) / 1000) : 0;

      // Update call status in database (platform may have already done this)
      const updatedCall = await storage.updateCall(callId, {
        status: 'completed',
        endedAt: endedAt,
        durationSeconds: duration
      }, agent.tenantId);

      // Return response matching widget expectations
      res.json({
        success: true,
        callId: callId,
        status: 'completed',
        duration: duration,
        platform: platform.type,
        call: {
          id: updatedCall?.id || callId,
          status: 'completed',
          endedAt: endedAt,
          durationSeconds: duration
        }
      });
    } catch (error) {
      console.error('Voice end error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/widget/agents/:agentId/calls', async (req, res) => {
    try {
      // Validate agent ID format
      if (!req.params.agentId || typeof req.params.agentId !== 'string') {
        return res.status(400).json({ error: 'Invalid agent ID' });
      }

      // Validate request body with strict schema
      const validatedData = widgetCallCreateSchema.parse(req.body);

      // Get agent to verify it exists and get tenant info
      const agent = await storage.getAgentById(req.params.agentId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get or create contact if provided
      let contactId = validatedData.contactId;
      if (!contactId && (validatedData.contactEmail || validatedData.contactName)) {
        const contactData = insertContactSchema.parse({
          tenantId: agent.tenantId,
          email: validatedData.contactEmail || '',
          name: validatedData.contactName || 'Anonymous',
          phone: validatedData.contactPhone || null,
        });
        const contact = await storage.createContact(contactData);
        contactId = contact.id;
      }

      // Get the agent's default room
      const room = await storage.getRoomByAgentId(agent.id, agent.tenantId);
      if (!room) {
        return res.status(404).json({ error: 'No room available for this agent' });
      }

      // Create the call with auto-generated callToken
      const callData = insertCallSchema.parse({
        tenantId: agent.tenantId,
        agentId: agent.id,
        roomId: room.id,
        contactId: contactId || null,
        direction: 'inbound',
        status: 'initiated',
        // callToken will be auto-generated by the database
      });

      const call = await storage.createCall(callData);
      
      // Generate JWT token for WebSocket authentication
      const widgetVoiceToken = generateWidgetVoiceToken({
        type: 'widget_voice',
        tenantId: agent.tenantId,
        roomId: room.id,
        callId: call.id,
        callToken: call.callToken,
        agentId: agent.id,
      });
      
      // Return sanitized response with both callToken and JWT token
      const sanitizedCall = widgetCallResponseSchema.parse({
        id: call.id,
        status: call.status,
        direction: call.direction,
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        durationSeconds: call.durationSeconds,
        callToken: call.callToken,
      });
      
      res.status(201).json({
        call: sanitizedCall,
        room: { id: room.id, name: room.name },
        jwtToken: widgetVoiceToken // For WebSocket authentication
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create widget call error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/widget/calls/:callId', async (req, res) => {
    try {
      // callToken validation for security
      const callToken = req.headers.authorization?.replace('Bearer ', '') || req.query.callToken as string;
      if (!callToken) {
        return res.status(401).json({ error: 'Call token required. Provide via Authorization header or callToken query parameter.' });
      }

      // Get all calls for validation (security: using empty tenantId to bypass tenant scoping since callToken is the security measure)
      const calls = await storage.getCallsByTenant('', { limit: 10000 }); // Large limit to get all calls
      
      const call = calls.calls.find((c: Call) => c.id === req.params.callId);
      
      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify callToken matches for security
      if (call.callToken !== callToken) {
        return res.status(403).json({ error: 'Invalid call token' });
      }

      // Return sanitized call data
      const sanitizedCall = widgetCallResponseSchema.parse({
        id: call.id,
        status: call.status,
        direction: call.direction,
        startedAt: call.startedAt,
        endedAt: call.endedAt,
        durationSeconds: call.durationSeconds,
        callToken: call.callToken,
      });
      
      res.json(sanitizedCall);
    } catch (error) {
      console.error('Get widget call error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/widget/calls/:callId', async (req, res) => {
    try {
      // callToken validation for security
      const callToken = req.headers.authorization?.replace('Bearer ', '') || req.query.callToken as string;
      if (!callToken) {
        return res.status(401).json({ error: 'Call token required. Provide via Authorization header or callToken query parameter.' });
      }

      // Validate request body
      const validatedData = widgetCallUpdateSchema.parse(req.body);

      // Get all calls for validation (security: using empty tenantId to bypass tenant scoping since callToken is the security measure)
      const calls = await storage.getCallsByTenant('', { limit: 10000 }); // Large limit to get all calls
      
      const call = calls.calls.find((c: Call) => c.id === req.params.callId);
      
      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify callToken matches for security
      if (call.callToken !== callToken) {
        return res.status(403).json({ error: 'Invalid call token' });
      }

      // Convert endedAt string to Date object if provided
      const updateData: Partial<Parameters<typeof storage.updateCall>[1]> = {
        status: validatedData.status,
        durationSeconds: validatedData.durationSeconds,
        metadata: validatedData.metadata,
        ...(validatedData.endedAt && { endedAt: new Date(validatedData.endedAt) })
      };

      // Update the call (using proper tenant ID for security)
      const updatedCall = await storage.updateCall(req.params.callId, updateData, call.tenantId);
      
      if (!updatedCall) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Return sanitized call data
      const sanitizedCall = widgetCallResponseSchema.parse({
        id: updatedCall.id,
        status: updatedCall.status,
        direction: updatedCall.direction,
        startedAt: updatedCall.startedAt,
        endedAt: updatedCall.endedAt,
        durationSeconds: updatedCall.durationSeconds,
        callToken: updatedCall.callToken,
      });
      
      res.json(sanitizedCall);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Update widget call error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Protected routes (require authentication)
  app.use('/api', authenticateToken);

  // Dashboard metrics
  app.get('/api/dashboard/metrics', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.user!.tenantId);
      res.json(metrics);
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Call platforms availability
  app.get('/api/call-platforms', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const platforms = [];

      // Default platform is always available
      platforms.push({
        id: "default",
        name: "Default WebSocket Platform",
        available: true,
        description: "WebSocket-based platform for voice calls"
      });

      // Check LiveKit availability
      const livekitEnvOk = await checkLiveKitEnvironment();
      const livekitWorkerOk = await checkAgentWorkerHealth();
      const livekitAvailable = livekitEnvOk && livekitWorkerOk;

      platforms.push({
        id: "livekit",
        name: "LiveKit Platform",
        available: livekitAvailable,
        description: "Advanced real-time platform with enhanced voice features"
      });

      res.json(platforms);
    } catch (error) {
      console.error('Call platforms error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Agent-specific stats routes
  app.get('/api/agents/:id/stats', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getAgentStats(id, req.user!.tenantId);
      
      if (!stats) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/agents/:id/activity', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const activity = await storage.getAgentActivity(id, req.user!.tenantId, limit);
      res.json(activity);
    } catch (error) {
      console.error('Error fetching agent activity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/agents/:id/status', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }
      
      const updatedAgent = await storage.updateAgentStatus(id, isActive, req.user!.tenantId);
      
      if (!updatedAgent) {
        return res.status(404).json({ error: 'Agent not found or access denied' });
      }
      
      res.json(updatedAgent);
    } catch (error) {
      console.error('Error updating agent status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/agents/:id/configuration', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const config = req.body;
      
      // Basic validation - could be enhanced with more detailed schema validation
      if (!config || typeof config !== 'object') {
        return res.status(400).json({ error: 'Invalid configuration data' });
      }
      
      const updatedAgent = await storage.updateAgentConfiguration(id, config, req.user!.tenantId);
      
      if (!updatedAgent) {
        return res.status(404).json({ error: 'Agent not found or access denied' });
      }
      
      res.json(updatedAgent);
    } catch (error) {
      console.error('Error updating agent configuration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Agents routes
  app.get('/api/agents', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const agents = await storage.getAgentsByTenant(req.user!.tenantId);
      res.json(agents);
    } catch (error) {
      console.error('Get agents error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/agents', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertAgentSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
        editedBy: req.user!.id,
      });
      
      // Create the agent
      const agent = await storage.createAgent(validatedData);
      
      // Auto-create default room for the agent
      const room = await storage.createRoom({
        tenantId: req.user!.tenantId,
        name: `${agent.name} - Default Room`,
        createdByAgentId: agent.id,
        status: 'active'
      });
      
      // Create room_agent entry linking the agent to the room as primary
      await storage.createRoomAgent({
        roomId: room.id,
        agentId: agent.id,
        role: 'primary'
      });
      
      res.status(201).json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create agent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/agents/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const agent = await storage.getAgent(req.params.id, req.user!.tenantId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error) {
      console.error('Get agent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/agents/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertAgentSchema.partial().parse({
        ...req.body,
        editedBy: req.user!.id,
      });
      
      const agent = await storage.updateAgent(req.params.id, validatedData, req.user!.tenantId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Update agent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/agents/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteAgent(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete agent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Agent Preferences routes
  app.get('/api/agents/:id/preferences', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const preferences = await storage.getAgentPreferences(req.params.id, req.user!.tenantId);
      if (!preferences) {
        return res.status(404).json({ error: 'Agent preferences not found' });
      }
      res.json(preferences);
    } catch (error) {
      console.error('Get agent preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/agents/:id/preferences', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertAgentPreferencesSchema.omit({ 
        agentId: true
      }).partial().parse(req.body);
      const preferences = await storage.updateAgentPreferences(req.params.id, validatedData, req.user!.tenantId);
      if (!preferences) {
        return res.status(404).json({ error: 'Agent not found or preferences not found' });
      }
      res.json(preferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Update agent preferences error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Workflows routes
  app.get('/api/workflows', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const workflows = await storage.getWorkflowsByTenant(req.user!.tenantId);
      res.json(workflows);
    } catch (error) {
      console.error('Get workflows error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/workflows', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/workflows/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id, req.user!.tenantId);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      res.json(workflow);
    } catch (error) {
      console.error('Get workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/workflows/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertWorkflowSchema.omit({ tenantId: true }).parse(req.body);
      
      const workflow = await storage.updateWorkflow(req.params.id, validatedData, req.user!.tenantId);
      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      res.json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Update workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/workflows/:id/toggle', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { isActive } = req.body;
      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ error: 'isActive must be a boolean' });
      }
      
      // Workflows don't have isActive property - this functionality may need to be implemented differently
      return res.status(400).json({ error: 'Workflow toggle not implemented - workflows do not have isActive property' });
    } catch (error) {
      console.error('Toggle workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/workflows/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const success = await storage.deleteWorkflow(req.params.id, req.user!.tenantId);
      if (!success) {
        return res.status(404).json({ error: 'Workflow not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete workflow error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Call Logs routes
  app.get('/api/call-logs', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { status, agentId, limit, offset } = req.query;
      const filters = {
        status: status as string,
        agentId: agentId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      
      const result = await storage.getCallLogsByTenant(req.user!.tenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Get call logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Chat Logs routes
  app.get('/api/chat-logs', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { status, agentId, limit, offset } = req.query;
      const filters = {
        status: status as string,
        agentId: agentId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      };
      
      const result = await storage.getChatLogsByTenant(req.user!.tenantId, filters);
      res.json(result);
    } catch (error) {
      console.error('Get chat logs error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Knowledge Base routes
  app.get('/api/knowledge', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const knowledgeItems = await storage.getKnowledgeBaseByTenant(req.user!.tenantId);
      res.json(knowledgeItems);
    } catch (error) {
      console.error('Get knowledge base error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/knowledge', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertKnowledgeBaseSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      
      const knowledgeItem = await storage.createKnowledgeBase(validatedData);
      res.status(201).json(knowledgeItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create knowledge base error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Webhooks routes
  app.get('/api/webhooks', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const webhooks = await storage.getWebhooksByTenant(req.user!.tenantId);
      res.json(webhooks);
    } catch (error) {
      console.error('Get webhooks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/webhooks', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertWebhookSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      
      const webhook = await storage.createWebhook(validatedData);
      res.status(201).json(webhook);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // API Keys routes
  app.get('/api/api-keys', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const apiKeys = await storage.getApiKeysByTenant(req.user!.tenantId);
      // Don't expose actual key values in list
      const sanitizedKeys = apiKeys.map(key => ({
        ...key,
        keyValue: '***' + key.keyValue.slice(-4)
      }));
      res.json(sanitizedKeys);
    } catch (error) {
      console.error('Get API keys error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/api-keys', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertApiKeySchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      
      const apiKey = await storage.createApiKey(validatedData);
      res.status(201).json({
        ...apiKey,
        keyValue: '***' + apiKey.keyValue.slice(-4)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create API key error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Conversations routes
  app.get('/api/conversations', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { agentId, search, limit, offset } = req.query;
      const conversations = await storage.getConversationsByTenant(req.user!.tenantId, {
        agentId: agentId as string,
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(conversations);
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/conversations', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertConversationSchema.parse({
        ...req.body,
        tenantId: req.user!.tenantId,
      });
      
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create conversation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/conversations/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id, req.user!.tenantId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/conversations/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertConversationSchema.omit({ 
        tenantId: true 
      }).partial().parse(req.body);
      
      const conversation = await storage.updateConversation(req.params.id, validatedData, req.user!.tenantId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Update conversation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Messages routes
  app.get('/api/conversations/:id/messages', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { search, limit, offset } = req.query;
      const messages = await storage.getMessagesByConversation(req.params.id, req.user!.tenantId, {
        search: search as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/conversations/:id/messages', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        conversationId: req.params.id,
        tenantId: req.user!.tenantId,
      });
      
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Create message error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Voice Call API endpoints
  
  // Admin API endpoints (require authentication)
  app.get('/api/calls', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { status, agentId, roomId, contactId, direction, limit, offset } = req.query;
      const calls = await storage.getCallsByTenant(req.user!.tenantId, {
        status: status as string,
        agentId: agentId as string,
        roomId: roomId as string,
        contactId: contactId as string,
        direction: direction as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(calls);
    } catch (error) {
      console.error('Get calls error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/calls/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const call = await storage.getCall(req.params.id, req.user!.tenantId);
      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }
      res.json(call);
    } catch (error) {
      console.error('Get call error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/calls/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      // Use restricted update schema to prevent modification of immutable fields
      const validatedData = updateCallSchema.parse(req.body);
      const call = await storage.updateCall(req.params.id, validatedData, req.user!.tenantId);
      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }
      res.json(call);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Update call error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/rooms', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { status, agentId, limit, offset } = req.query;
      const rooms = await storage.getRoomsByTenant(req.user!.tenantId, {
        status: status as string,
        agentId: agentId as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(rooms);
    } catch (error) {
      console.error('Get rooms error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/rooms/:id', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const room = await storage.getRoom(req.params.id, req.user!.tenantId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      console.error('Get room error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Test endpoint for agent conversations (using OpenAI)
  app.post('/api/agents/:id/test', requireTenantAccess, async (req: AuthRequest, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const agent = await storage.getAgent(req.params.id, req.user!.tenantId);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // This would integrate with OpenAI API for real testing
      // For now, return a mock response
      const response = {
        message: `Hello! I'm ${agent.name}, ready to assist you!`,
        agent: agent.name,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Test agent error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

}