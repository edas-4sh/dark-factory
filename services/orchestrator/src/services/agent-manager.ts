import { DB } from '@dark-factory/db';
import { AgentConfig, AgentRole, AgentStatus } from '@dark-factory/shared';

type BroadcastFn = (event: string, payload: Record<string, unknown>) => void;

export class AgentManager {
  private db: DB;
  private broadcast: BroadcastFn = () => {};

  constructor(db: DB) {
    this.db = db;
  }

  setBroadcast(fn: BroadcastFn): void {
    this.broadcast = fn;
  }

  registerAgent(id: string, name: string, role: string): void {
    this.db.upsertAgent({ id, name, role });
    this.broadcast('agent_update', { id, name, role, status: 'idle' });
    console.log(`[AgentManager] Registered ${name} (${role})`);
  }

  updateStatus(id: string, status: AgentStatus, healthScore?: number): void {
    this.db.updateAgentStatus(id, status, healthScore);
    this.broadcast('agent_update', { id, status, healthScore });
  }

  heartbeat(id: string): void {
    this.db.updateAgentStatus(id, 'idle', undefined);
  }

  getAgent(id: string): Record<string, unknown> | undefined {
    return this.db.getAgent(id);
  }

  getAllAgents(): Array<Record<string, unknown>> {
    return this.db.getAllAgents();
  }

  getIdleAgent(preferredRole?: AgentRole): Record<string, unknown> | undefined {
    const agents = this.db.getAllAgents();
    const idle = agents.filter(a => a.status === 'idle');
    if (preferredRole) {
      const preferred = idle.find(a => a.role === preferredRole);
      if (preferred) return preferred;
    }
    return idle.length > 0 ? idle[0] : undefined;
  }

  incrementTasksCompleted(id: string): void {
    this.db.incrementAgentTasksCompleted(id);
  }
}
