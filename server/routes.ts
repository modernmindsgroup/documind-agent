import type { Express } from "express";
import { storage } from "./storage";
import { authenticateToken, generateToken, hashPassword, comparePassword, requireTenantAccess, type AuthRequest } from "./auth";
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
  widgetCallResponseSchema
} from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

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

  // Widget API endpoints (no authentication required)
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
      
      // Return sanitized response with callToken for client authentication
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
        room: { id: room.id, name: room.name } // Only return safe room fields
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
      // Validate callId format
      if (!req.params.callId || typeof req.params.callId !== 'string') {
        return res.status(400).json({ error: 'Invalid call ID' });
      }

      // Require callToken for authentication
      const callToken = req.headers.authorization?.replace('Bearer ', '') || req.query.callToken as string;
      if (!callToken) {
        return res.status(401).json({ error: 'Call token required. Provide via Authorization header or callToken query parameter.' });
      }

      // Find call by ID and validate callToken for security
      const calls = await storage.getCallsByTenant('', { limit: 1000 });
      const call = calls.calls.find(c => c.id === req.params.callId);
      
      if (!call) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify callToken matches for security
      if (call.callToken !== callToken) {
        return res.status(403).json({ error: 'Invalid call token' });
      }
      
      // Return sanitized response without sensitive fields
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Get widget call error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/widget/calls/:callId', async (req, res) => {
    try {
      // Validate callId format
      if (!req.params.callId || typeof req.params.callId !== 'string') {
        return res.status(400).json({ error: 'Invalid call ID' });
      }

      // Require callToken for authentication
      const callToken = req.headers.authorization?.replace('Bearer ', '') || req.query.callToken as string;
      if (!callToken) {
        return res.status(401).json({ error: 'Call token required. Provide via Authorization header or callToken query parameter.' });
      }

      // Validate request body with restricted widget schema
      const validatedData = widgetCallUpdateSchema.parse(req.body);

      // Find call without tenant scoping first
      const calls = await storage.getCallsByTenant('', { limit: 1000 });
      const existingCall = calls.calls.find(c => c.id === req.params.callId);
      
      if (!existingCall) {
        return res.status(404).json({ error: 'Call not found' });
      }

      // Verify callToken matches for security
      if (existingCall.callToken !== callToken) {
        return res.status(403).json({ error: 'Invalid call token' });
      }

      // Convert endedAt string to Date if provided for type compatibility
      const updateData: any = { ...validatedData };
      if (updateData.endedAt) {
        updateData.endedAt = new Date(updateData.endedAt);
      }

      // Update the call using the original tenant and restricted fields only
      const call = await storage.updateCall(req.params.callId, updateData, existingCall.tenantId);
      
      if (!call) {
        return res.status(404).json({ error: 'Call not found after update' });
      }

      // Return sanitized response without sensitive fields
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Update widget call error:', error);
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