import { Router, Request, Response } from 'express';
import { DB } from '@dark-factory/db';
import { AgentManager } from '../services/agent-manager';
import { TaskQueue } from '../services/task-queue';
import { WorkDiscovery } from '../services/work-discovery';

export function apiRouter(db: DB, agentManager: AgentManager, taskQueue: TaskQueue, workDiscovery: WorkDiscovery): Router {
  const router = Router();

  // Health
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Dashboard stats
  router.get('/stats', (_req: Request, res: Response) => {
    res.json(db.getDashboardStats());
  });

  // Agent routes
  router.get('/agents', (_req: Request, res: Response) => {
    res.json(db.getAllAgents());
  });

  router.get('/agents/:id', (req: Request, res: Response) => {
    const agent = db.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });
    res.json(agent);
  });

  router.post('/agents/:id/heartbeat', (req: Request, res: Response) => {
    agentManager.heartbeat(req.params.id);
    res.json({ status: 'ok' });
  });

  router.post('/agents/register', (req: Request, res: Response) => {
    const { id, name, role } = req.body;
    if (!id || !name || !role) return res.status(400).json({ error: 'Missing id, name, or role' });
    agentManager.registerAgent(id, name, role);
    res.json({ status: 'registered', id });
  });

  // Task routes
  router.get('/tasks', (_req: Request, res: Response) => {
    res.json(db.getAllTasks());
  });

  router.get('/tasks/queued', (_req: Request, res: Response) => {
    res.json(db.getQueuedTasks(20));
  });

  router.get('/tasks/:id', (req: Request, res: Response) => {
    const task = db.getTask(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    const workItems = db.getWorkItemsByTask(req.params.id);
    res.json({ ...task, workItems });
  });

  router.post('/tasks', (req: Request, res: Response) => {
    const { title, description, priority } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    const id = taskQueue.createTask({ title, description, priority });
    res.json({ status: 'created', id });
  });

  // Work item routes
  router.get('/work-items/:taskId', (req: Request, res: Response) => {
    res.json(db.getWorkItemsByTask(req.params.taskId));
  });

  router.post('/work-items/:id/complete', (req: Request, res: Response) => {
    const { output, error } = req.body;
    taskQueue.completeWorkItem(req.params.id, output, error);
    res.json({ status: 'ok' });
  });

  // Review routes
  router.post('/reviews', (req: Request, res: Response) => {
    const { workItemId, reviewerId, verdict, comments } = req.body;
    if (!workItemId || !reviewerId || !verdict) return res.status(400).json({ error: 'Missing fields' });
    const id = `review-${Date.now()}`;
    db.createReview({ id, workItemId, reviewerId, verdict, comments });
    res.json({ status: 'created', id });
  });

  router.get('/reviews/:workItemId', (req: Request, res: Response) => {
    res.json(db.getReviewsByWorkItem(req.params.workItemId));
  });

  // Health check routes
  router.get('/health-checks', (_req: Request, res: Response) => {
    res.json(db.getLatestHealthChecks(50));
  });

  // Work discovery
  router.post('/discover', (_req: Request, res: Response) => {
    workDiscovery.manualDiscover();
    res.json({ status: 'discovery triggered' });
  });

  return router;
}
