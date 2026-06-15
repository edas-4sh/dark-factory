export type AgentRole = 'architect' | 'builder' | 'reviewer' | 'devops' | 'doctor';
export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';
export type AgentMode = 'coder' | 'reviewer' | 'doctor';
export type TaskStatus = 'queued' | 'assigned' | 'in_progress' | 'in_review' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type WorkItemStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type WorkItemMode = AgentMode;
export type ReviewVerdict = 'approve' | 'request_changes' | 'reject';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  status: AgentStatus;
  lastHeartbeat: number;
  healthScore: number;
  tasksCompleted: number;
  mode: AgentMode;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  source: 'github_issue' | 'manual' | 'scheduled' | 'health_check';
  sourceUrl?: string;
  assignedAgentId?: string;
  createdAt: number;
  updatedAt: number;
  dependantTaskIds: string[];
  metadata?: Record<string, string>;
}

export interface WorkItem {
  id: string;
  taskId: string;
  agentId: string;
  mode: WorkItemMode;
  status: WorkItemStatus;
  input: string;
  output?: string;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface Review {
  id: string;
  workItemId: string;
  reviewerId: string;
  verdict: ReviewVerdict;
  comments: string;
  createdAt: number;
}

export interface HealthCheck {
  id: string;
  agentId: string;
  checkedBy: string;
  timestamp: number;
  responseTime: number;
  errorRate: number;
  uptime: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: Record<string, number | string>;
}

export interface DashboardEvent {
  type: 'agent_update' | 'task_update' | 'work_item_update' | 'review_update' | 'health_update';
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface LLMConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface LLMFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

export interface OrchestratorConfig {
  port: number;
  dbPath: string;
  pollIntervalMs: number;
  workDiscoveryIntervalMs: number;
  healthCheckIntervalMs: number;
}

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  notificationEmail: string;
}
