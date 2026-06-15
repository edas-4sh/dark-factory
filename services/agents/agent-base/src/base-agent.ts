import { LLMClient } from '@dark-factory/llm-client';
import { GitHubClient } from '@dark-factory/github-client';
import { AgentConfig, AgentMode, LLMMessage, LLMFunction } from '@dark-factory/shared';
import { CoderMode } from './modes/coder';
import { ReviewerMode } from './modes/reviewer';
import { DoctorMode } from './modes/doctor';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected llm: LLMClient;
  protected github: GitHubClient;
  protected orchestratorUrl: string;
  protected coderMode: CoderMode;
  protected reviewerMode: ReviewerMode;
  protected doctorMode: DoctorMode;

  constructor(config: AgentConfig) {
    this.config = config;
    this.llm = new LLMClient();
    this.github = new GitHubClient();
    this.orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:3001';
    this.coderMode = new CoderMode(this.llm, this.github);
    this.reviewerMode = new ReviewerMode(this.llm, this.github);
    this.doctorMode = new DoctorMode(this.llm);
  }

  abstract getSystemPrompt(): string;

  async start(): Promise<void> {
    await this.register();
    await this.heartbeatLoop();
    await this.pollForWork();
  }

  private async register(): Promise<void> {
    try {
      await fetch(`${this.orchestratorUrl}/api/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.config.id,
          name: this.config.name,
          role: this.config.role,
        }),
      });
      console.log(`[${this.config.name}] Registered with orchestrator`);
    } catch (err) {
      console.error(`[${this.config.name}] Registration failed:`, err);
    }
  }

  private async heartbeatLoop(): Promise<void> {
    const sendHeartbeat = async () => {
      try {
        await fetch(`${this.orchestratorUrl}/api/agents/${this.config.id}/heartbeat`, {
          method: 'POST',
        });
      } catch {
        // Silently retry
      }
    };
    await sendHeartbeat();
    setInterval(sendHeartbeat, 30000);
  }

  private async pollForWork(): Promise<void> {
    const loop = async () => {
      try {
        const response = await fetch(`${this.orchestratorUrl}/api/tasks/queued`);
        const tasks = await response.json() as Array<Record<string, unknown>>;
        // Check if there's a task for this agent
        for (const task of tasks) {
          if (task.assigned_agent_id === this.config.id) {
            await this.handleTask(task as Record<string, unknown>);
          }
        }
      } catch {
        // Silently retry
      }
    };

    setInterval(loop, parseInt(process.env.AGENT_POLL_INTERVAL_MS || '30000'));
  }

  async handleTask(task: Record<string, unknown>): Promise<void> {
    console.log(`[${this.config.name}] Handling task: ${task.title}`);

    const systemPrompt = this.getSystemPrompt();
    const userMessage = `Task: ${task.title}\n\nDescription: ${task.description}\n\nSource: ${task.source_url || 'none'}`;

    const functions: LLMFunction[] = [
      {
        name: 'act_as_coder',
        description: 'Write code to implement the task',
        parameters: {
          type: 'object',
          properties: {
            branchName: { type: 'string', description: 'Git branch name' },
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  content: { type: 'string' },
                  commitMessage: { type: 'string' },
                },
              },
            },
            prTitle: { type: 'string', description: 'Pull request title' },
            prBody: { type: 'string', description: 'Pull request description' },
          },
          required: ['branchName', 'files', 'prTitle', 'prBody'],
        },
      },
      {
        name: 'act_as_reviewer',
        description: 'Review code changes',
        parameters: {
          type: 'object',
          properties: {
            prNumber: { type: 'number', description: 'PR number to review' },
            verdict: { type: 'string', enum: ['approve', 'request_changes', 'reject'] },
            comments: { type: 'string', description: 'Review comments' },
          },
          required: ['prNumber', 'verdict', 'comments'],
        },
      },
      {
        name: 'act_as_doctor',
        description: 'Perform health check on agent or system',
        parameters: {
          type: 'object',
          properties: {
            targetAgentId: { type: 'string', description: 'Agent to check' },
            diagnosis: { type: 'string', description: 'Health diagnosis' },
          },
          required: ['targetAgentId', 'diagnosis'],
        },
      },
    ];

    const response = await this.llm.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ], functions);

    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolCall = response.toolCalls[0];
      const args = JSON.parse(toolCall.function.arguments);

      switch (toolCall.function.name) {
        case 'act_as_coder':
          await this.coderMode.execute(args, task);
          break;
        case 'act_as_reviewer':
          await this.reviewerMode.execute(args, task);
          break;
        case 'act_as_doctor':
          await this.doctorMode.execute(args, task);
          break;
      }
    }

    console.log(`[${this.config.name}] Completed task: ${task.title}`);
  }
}
