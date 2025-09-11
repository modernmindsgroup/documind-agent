import { DashboardMetrics, RecentActivity, AgentTemplate, WorkflowTemplate } from './types';

// TODO: remove mock functionality
export const mockDashboardMetrics: DashboardMetrics = {
  totalAgents: 24,
  totalWorkflows: 8,
  totalCalls: 1247,
  totalChats: 892,
  monthlyCallCost: 2847,
  monthlyCallMinutes: 14235,
};

// TODO: remove mock functionality
export const mockRecentActivity: RecentActivity[] = [
  {
    id: '1',
    type: 'agent_created',
    title: 'New Agent Created',
    description: 'Customer Support Agent v2.1 has been created',
    timestamp: '2 minutes ago',
    user: 'Sarah Chen',
  },
  {
    id: '2',
    type: 'call_completed',
    title: 'Call Completed',
    description: 'Lead qualification call finished successfully',
    timestamp: '5 minutes ago',
    user: 'System',
  },
  {
    id: '3',
    type: 'workflow_updated',
    title: 'Workflow Updated',
    description: 'Sales Pipeline workflow has been modified',
    timestamp: '1 hour ago',
    user: 'Mike Johnson',
  },
  {
    id: '4',
    type: 'chat_ended',
    title: 'Chat Session Ended',
    description: 'Customer inquiry chat completed',
    timestamp: '2 hours ago',
    user: 'System',
  },
];

// TODO: remove mock functionality
export const mockAgentTemplates: AgentTemplate[] = [
  {
    id: 'template-1',
    name: 'Customer Support',
    description: 'Handle customer inquiries and provide support',
    type: 'conversation_flow',
    category: 'Support',
    icon: 'headphones',
    config: { voice: 'alloy', language: 'en' },
  },
  {
    id: 'template-2',
    name: 'Lead Qualification',
    description: 'Qualify potential customers and gather information',
    type: 'multi_prompt',
    category: 'Sales',
    icon: 'target',
    config: { voice: 'nova', language: 'en' },
  },
  {
    id: 'template-3',
    name: 'Appointment Scheduler',
    description: 'Schedule appointments and manage calendars',
    type: 'conversation_flow',
    category: 'Scheduling',
    icon: 'calendar',
    config: { voice: 'shimmer', language: 'en' },
  },
  {
    id: 'template-4',
    name: 'Survey Conductor',
    description: 'Conduct surveys and collect feedback',
    type: 'single_prompt',
    category: 'Research',
    icon: 'clipboard-list',
    config: { voice: 'echo', language: 'en' },
  },
  {
    id: 'template-5',
    name: 'Real Estate Assistant',
    description: 'Assist with property inquiries and showings',
    type: 'conversation_flow',
    category: 'Real Estate',
    icon: 'home',
    config: { voice: 'fable', language: 'en' },
  },
  {
    id: 'template-6',
    name: 'Healthcare Triage',
    description: 'Initial patient screening and appointment booking',
    type: 'multi_prompt',
    category: 'Healthcare',
    icon: 'stethoscope',
    config: { voice: 'onyx', language: 'en' },
  },
];

// TODO: remove mock functionality
export const mockWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'workflow-1',
    name: 'Lead Qualification Flow',
    description: 'Comprehensive lead scoring and qualification process',
    type: 'lead_qualification',
    category: 'Sales',
    nodes: [
      { id: 'start', type: 'start', position: { x: 100, y: 100 } },
      { id: 'qualify', type: 'condition', position: { x: 300, y: 100 } },
      { id: 'score', type: 'tool', position: { x: 500, y: 100 } },
      { id: 'end', type: 'end', position: { x: 700, y: 100 } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'qualify' },
      { id: 'e2', source: 'qualify', target: 'score' },
      { id: 'e3', source: 'score', target: 'end' },
    ],
  },
  {
    id: 'workflow-2',
    name: 'Appointment Scheduler',
    description: 'Smart appointment booking with availability checking',
    type: 'scheduler',
    category: 'Scheduling',
    nodes: [
      { id: 'start', type: 'start', position: { x: 100, y: 100 } },
      { id: 'check-availability', type: 'tool', position: { x: 300, y: 100 } },
      { id: 'book', type: 'tool', position: { x: 500, y: 100 } },
      { id: 'confirm', type: 'condition', position: { x: 700, y: 100 } },
      { id: 'end', type: 'end', position: { x: 900, y: 100 } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'check-availability' },
      { id: 'e2', source: 'check-availability', target: 'book' },
      { id: 'e3', source: 'book', target: 'confirm' },
      { id: 'e4', source: 'confirm', target: 'end' },
    ],
  },
  {
    id: 'workflow-3',
    name: 'Customer Feedback Survey',
    description: 'Multi-step customer satisfaction survey with scoring',
    type: 'survey',
    category: 'Research',
    nodes: [
      { id: 'start', type: 'start', position: { x: 100, y: 100 } },
      { id: 'welcome', type: 'conversation', position: { x: 300, y: 100 } },
      { id: 'questions', type: 'conversation', position: { x: 500, y: 100 } },
      { id: 'score', type: 'tool', position: { x: 700, y: 100 } },
      { id: 'end', type: 'end', position: { x: 900, y: 100 } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'welcome' },
      { id: 'e2', source: 'welcome', target: 'questions' },
      { id: 'e3', source: 'questions', target: 'score' },
      { id: 'e4', source: 'score', target: 'end' },
    ],
  },
];

// TODO: remove mock functionality
export const mockCallLogs = [
  {
    id: 'call-1',
    callId: 'CL-001-2024',
    agent: 'Customer Support v2.1',
    fromNumber: '+1 (555) 123-4567',
    toNumber: '+1 (555) 987-6543',
    type: 'inbound',
    status: 'completed',
    reason: 'Customer inquiry resolved',
    evaluation: 'Excellent',
    startTime: '2024-01-15T10:30:00Z',
    duration: 325,
    cost: 48,
  },
  {
    id: 'call-2',
    callId: 'CL-002-2024',
    agent: 'Lead Qualification Bot',
    fromNumber: '+1 (555) 234-5678',
    toNumber: '+1 (555) 876-5432',
    type: 'outbound',
    status: 'transferred',
    reason: 'Qualified lead - transferred to sales',
    evaluation: 'Good',
    startTime: '2024-01-15T11:45:00Z',
    duration: 187,
    cost: 28,
  },
  {
    id: 'call-3',
    callId: 'CL-003-2024',
    agent: 'Appointment Scheduler',
    fromNumber: '+1 (555) 345-6789',
    toNumber: '+1 (555) 765-4321',
    type: 'inbound',
    status: 'failed',
    reason: 'Call dropped',
    evaluation: 'Poor',
    startTime: '2024-01-15T14:20:00Z',
    duration: 45,
    cost: 7,
  },
];