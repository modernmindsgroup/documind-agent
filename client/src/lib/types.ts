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

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'conversation_flow' | 'single_prompt' | 'multi_prompt' | 'custom_llm';
  category: string;
  icon: string;
  config: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  type: 'lead_qualification' | 'scheduler' | 'survey' | 'blank';
  category: string;
  nodes: any[];
  edges: any[];
}

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  type: 'faq' | 'url' | 'file' | 'folder';
  parentId?: string;
  lastSynced?: string;
  children?: KnowledgeBaseItem[];
}

export interface CallLogFilter {
  status: 'all' | 'transferred' | 'success' | 'failed';
  dateRange: string;
  agentId?: string;
}

export interface WebhookConfig {
  id: string;
  name: string;
  eventType: string;
  url: string;
  secret: string;
  isActive: boolean;
  lastTriggered?: string;
}

export interface ApiKeyConfig {
  id: string;
  name: string;
  provider: string;
  keyValue: string;
  isActive: boolean;
  createdAt: string;
}