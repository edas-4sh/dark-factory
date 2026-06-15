import { DB } from './index';

async function main() {
  const db = await DB.create();

  const agents = [
    { id: 'agent-alpha', name: 'Alpha', role: 'architect' },
    { id: 'agent-beta', name: 'Beta', role: 'builder' },
    { id: 'agent-gamma', name: 'Gamma', role: 'reviewer' },
    { id: 'agent-delta', name: 'Delta', role: 'devops' },
    { id: 'agent-epsilon', name: 'Epsilon', role: 'doctor' },
  ];

  for (const agent of agents) {
    db.upsertAgent(agent);
    db.updateAgentStatus(agent.id, 'idle', 100);
    console.log(`Registered ${agent.name} (${agent.role})`);
  }

  const tasks = [
    { id: 'task-1', title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', priority: 'high', source: 'manual' },
    { id: 'task-2', title: 'Add input validation to API endpoints', description: 'Implement request validation for all orchestrator API routes', priority: 'medium', source: 'manual' },
    { id: 'task-3', title: 'Create system health dashboard endpoint', description: 'Build a REST endpoint that returns current system health metrics', priority: 'medium', source: 'manual' },
  ];

  for (const task of tasks) {
    db.createTask(task);
    console.log(`Created task: ${task.title}`);
  }

  console.log('\nSeed complete!');
  db.close();
}

main().catch(console.error);
