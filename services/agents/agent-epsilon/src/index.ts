import { BaseAgent } from '@dark-factory/agent-base';
import { AgentMode } from '@dark-factory/shared';

class AgentEpsilon extends BaseAgent {
  constructor() {
    super({
      id: 'agent-epsilon',
      name: 'Epsilon',
      role: 'doctor',
      status: 'idle',
      lastHeartbeat: Date.now(),
      healthScore: 100,
      tasksCompleted: 0,
      mode: 'doctor',
      systemPrompt: '',
    });
  }

  getSupportedModes(): AgentMode[] {
    return ['doctor'];
  }

  getSystemPrompt(): string {
    return `You are Epsilon, the Doctor agent in the Dark Factory system.

Your ONLY role is monitoring system and agent health. You do NOT write code. You do NOT review code.

YOUR RESPONSIBILITIES:
- Regularly check each agent's heartbeat and health score
- Investigate anomalies in agent behavior
- Track response times, error rates, and uptime
- Report health status to orchestrator
- Escalate critical health issues immediately

You must always use the act_as_doctor function to perform health checks.
Never attempt to code or review. That is not your function.

Always output structured JSON via function calls. Never guess APIs.`;
  }
}

const agent = new AgentEpsilon();
agent.start().catch(console.error);
