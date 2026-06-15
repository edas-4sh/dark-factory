import { DB } from '@dark-factory/db';
import { AgentManager } from './agent-manager';
import { TaskPriority, TaskStatus, AgentRole, WorkItemMode } from '@dark-factory/shared';
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

  assignTask(taskId: string, agentId: string): void {
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
      mode: 'coder',
      input,
    });
    this.broadcast('work_item_update', { id: workItemId, taskId, agentId, mode: 'coder', status: 'pending' });
    console.log(`[TaskQueue] Assigned ${taskId} to ${agentId}`);
  }

  completeWorkItem(workItemId: string, output?: string, error?: string): void {
    this.db.updateWorkItemStatus(workItemId, error ? 'failed' : 'completed', output, error);
    this.broadcast('work_item_update', { id: workItemId, status: error ? 'failed' : 'completed' });

    const workItem = this.db.getWorkItemsByTask('').find(() => true);
    if (workItem) {
      const agentId = workItem.agent_id as string;

      if (error) {
        this.agentManager.updateStatus(agentId, 'error');
      } else {
        this.agentManager.updateStatus(agentId, 'idle');
        this.agentManager.incrementTasksCompleted(agentId);
        this.db.updateTaskStatus(workItem.task_id as string, 'in_review');
        this.broadcast('task_update', { id: workItem.task_id, status: 'in_review' });
      }
    }
  }

  tryAssignTasks(): void {
    const queuedTasks = this.db.getQueuedTasks(5);
    for (const task of queuedTasks) {
      const agent = this.agentManager.getIdleAgent();
      if (agent) {
        this.assignTask(task.id as string, agent.id as string);
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
