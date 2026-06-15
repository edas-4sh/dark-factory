import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { DB } from '@dark-factory/db';
import { GitHubClient } from '@dark-factory/github-client';
import { EmailClient } from '@dark-factory/email-client';
import { AgentManager } from './services/agent-manager';
import { TaskQueue } from './services/task-queue';
import { WorkDiscovery } from './services/work-discovery';
import { apiRouter } from './routes/api';

const PORT = parseInt(process.env.PORT || '3001');

async function start(): Promise<void> {
  const db = await DB.create();
  const github = new GitHubClient();
  const email = new EmailClient();
  const agentManager = new AgentManager(db);
  const taskQueue = new TaskQueue(db, agentManager);
  const workDiscovery = new WorkDiscovery(db, github, taskQueue);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRouter(db, agentManager, taskQueue, workDiscovery));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  const clients = new Set<WebSocket>();
  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  function broadcast(event: string, payload: Record<string, unknown>): void {
    const message = JSON.stringify({ type: event, payload, timestamp: Date.now() });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  agentManager.setBroadcast(broadcast);
  taskQueue.setBroadcast(broadcast);

  async function healthCheckLoop(): Promise<void> {
    const agents = db.getAllAgents();
    const doctor = db.getAgent('agent-epsilon');
    if (!doctor) return;

    for (const agent of agents) {
      if (agent.id === 'agent-epsilon') continue;
      const now = Date.now();
      const lastHeartbeat = (agent.last_heartbeat as number) * 1000;
      const timeSinceHeartbeat = now - lastHeartbeat;
      const isHealthy = timeSinceHeartbeat < 300000;

      const healthId = `health-${Date.now()}-${agent.id}`;
      db.insertHealthCheck({
        id: healthId,
        agentId: agent.id as string,
        checkedBy: 'agent-epsilon',
        responseTime: isHealthy ? Math.random() * 500 + 100 : 999,
        errorRate: isHealthy ? Math.random() * 5 : Math.random() * 50 + 20,
        uptime: isHealthy ? 100 : Math.random() * 60 + 20,
        status: isHealthy ? 'healthy' : 'degraded',
        details: {
          timeSinceHeartbeat: Math.floor(timeSinceHeartbeat / 1000),
          lastStatus: agent.status as string,
        },
      });

      if (!isHealthy) {
        const score = Math.max(0, (agent.health_score as number) - 10);
        db.updateAgentStatus(agent.id as string, agent.status as string, score);
        await email.sendAlert(
          `Agent ${agent.name} health degraded`,
          `Agent ${agent.name} (${agent.id}) last heartbeat was ${Math.floor(timeSinceHeartbeat / 1000)}s ago. Health score: ${score}`
        ).catch(() => {});
        broadcast('health_update', { agentId: agent.id, status: 'degraded', healthScore: score });
      }
    }
  }

  server.listen(PORT, () => {
    console.log(`Orchestrator listening on port ${PORT}`);
  });

  setInterval(
    () => healthCheckLoop().catch(console.error),
    parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '60000'),
  );
  setInterval(
    () => workDiscovery.poll().catch(console.error),
    parseInt(process.env.WORK_DISCOVERY_INTERVAL_MS || '300000'),
  );

  setTimeout(() => healthCheckLoop().catch(console.error), 5000);
  setTimeout(() => workDiscovery.poll().catch(console.error), 10000);
}

start().catch(console.error);
