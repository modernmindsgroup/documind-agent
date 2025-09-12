import type { Express } from "express";
import { createServer, type Server } from "http";
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
  insertAgentPreferencesSchema
} from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      
      const agent = await storage.createAgent(validatedData);
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
        agentId: true, 
        createdAt: true 
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

  const httpServer = createServer(app);
  return httpServer;
}