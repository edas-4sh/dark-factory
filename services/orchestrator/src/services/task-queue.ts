import { DB } from '@dark-factory/db';
import { AgentManager } from './agent-manager';
import { TaskPriority } from '@dark-factory/shared';
import { v4 as uuid } from 'uuid';

type BroadcastFn = (event: string, payload: Record<string, unknown>) => void;

export class TaskQueue {
  private db: DB;
  private agentManager: AgentManager;
  private broadcast: BroadcastFn = () => {};

  constructor(db: DB, agentManager: AgentManager) {
    this.db = db;
    this.agentManager = agentManager;
  }

  setBroadcast(fn: BroadcastFn): void {
    this.broadcast = fn;
  }

  createTask(params: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    source?: string;
    sourceUrl?: string;
    dependantTaskIds?: string[];
  }): string {
    const id = `task-${uuid().slice(0, 8)}`;
    this.db.createTask({
      id,
      title: params.title,
      description: params.description || '',
      priority: params.priority || 'medium',
      source: params.source || 'manual',
      sourceUrl: params.sourceUrl,
    });
    this.broadcast('task_update', { id, title: params.title, status: 'queued' });
    console.log(`[TaskQueue] Created task: ${params.title} (${id})`);
    this.tryAssignTasks();
    return id;
  }

  assignTask(taskId: string, agentId: string, mode: 'coder' | 'reviewer' = 'coder'): void {
    this.db.updateTaskStatus(taskId, 'assigned', agentId);
    this.agentManager.updateStatus(agentId, 'busy');
    this.broadcast('task_update', { id: taskId, status: 'assigned', agentId });

    const task = this.db.getTask(taskId);
    const input = `Task: ${task?.title}\n\n${task?.description || ''}`;

    const workItemId = `work-${uuid().slice(0, 8)}`;
    this.db.createWorkItem({
      id: workItemId,
      taskId,
      agentId,
      mode,
      input,
    });
    this.broadcast('work_item_update', { id: workItemId, taskId, agentId, mode, status: 'pending' });
    console.log(`[TaskQueue] Assigned ${taskId} (${mode}) to ${agentId}`);
  }

  completeWorkItem(workItemId: string, taskId: string, output?: string, error?: string): void {
    this.db.updateWorkItemStatus(workItemId, error ? 'failed' : 'completed', output, error);
    this.broadcast('work_item_update', { id: workItemId, status: error ? 'failed' : 'completed' });

    if (error) {
      const workItem = this.db.getWorkItemsByTask(taskId).find(wi => wi.id === workItemId);
      if (workItem) {
        this.agentManager.updateStatus(workItem.agent_id as string, 'error');
        this.db.updateTaskStatus(taskId, 'failed');
      }
      return;
    }

    const workItems = this.db.getWorkItemsByTask(taskId);
    const completedItem = workItems.find(wi => wi.id === workItemId);
    if (!completedItem) return;

    const coderId = completedItem.agent_id as string;
    const mode = completedItem.mode as string;

    if (mode === 'coder') {
      this.agentManager.updateStatus(coderId, 'idle');
      this.agentManager.incrementTasksCompleted(coderId);
      this.db.updateTaskStatus(taskId, 'in_review');
      this.broadcast('task_update', { id: taskId, status: 'in_review' });

      // Assign review to a different agent
      const reviewer = this.agentManager.getIdleAgent();
      if (reviewer && reviewer.id !== coderId) {
        this.assignTask(taskId, reviewer.id as string, 'reviewer');
      } else {
        console.log(`[TaskQueue] No other idle agent available to review ${taskId}`);
      }
    } else if (mode === 'reviewer') {
      this.agentManager.updateStatus(coderId, 'idle');
      this.agentManager.incrementTasksCompleted(coderId);
      this.db.updateTaskStatus(taskId, 'completed');
      this.broadcast('task_update', { id: taskId, status: 'completed' });
      console.log(`[TaskQueue] Task ${taskId} completed after review by ${coderId}`);
    }
  }

  tryAssignTasks(): void {
    const queuedTasks = this.db.getQueuedTasks(5);
    for (const task of queuedTasks) {
      const agent = this.agentManager.getIdleAgent();
      if (agent) {
        this.assignTask(task.id as string, agent.id as string, 'coder');
      } else {
        break;
      }
    }
  }

  getQueuedTasks(): Array<Record<string, unknown>> {
    return this.db.getQueuedTasks(20);
  }

  getAllTasks(): Array<Record<string, unknown>> {
    return this.db.getAllTasks();
  }
}
