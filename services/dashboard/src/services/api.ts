const BASE = '/api';

async function fetchJSON(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJSON(path: string, body?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getStats: () => fetchJSON('/stats') as Promise<Record<string, unknown>>,
  getAgents: () => fetchJSON('/agents') as Promise<Array<Record<string, unknown>>>,
  getAgent: (id: string) => fetchJSON(`/agents/${id}`) as Promise<Record<string, unknown>>,
  getTasks: () => fetchJSON('/tasks') as Promise<Array<Record<string, unknown>>>,
  getQueuedTasks: () => fetchJSON('/tasks/queued') as Promise<Array<Record<string, unknown>>>,
  getTask: (id: string) => fetchJSON(`/tasks/${id}`) as Promise<Record<string, unknown>>,
  createTask: (title: string, description?: string, priority?: string) =>
    postJSON('/tasks', { title, description, priority }),
  getHealthChecks: () => fetchJSON('/health-checks') as Promise<Array<Record<string, unknown>>>,
  triggerDiscovery: () => postJSON('/discover'),
  submitReview: (workItemId: string, reviewerId: string, verdict: string, comments: string) =>
    postJSON('/reviews', { workItemId, reviewerId, verdict, comments }),
};
