import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Reviews() {
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [selectedTask, setSelectedTask] = useState<Record<string, unknown> | null>(null);
  const [agents, setAgents] = useState<Array<Record<string, unknown>>>([]);

  const refresh = useCallback(async () => {
    try {
      const [tasksData, agentsData] = await Promise.all([
        api.getTasks(),
        api.getAgents(),
      ]);
      setTasks(tasksData.filter(t => t.status === 'in_review'));
      setAgents(agentsData);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useWebSocket(() => { refresh(); });

  const handleReview = async (verdict: string) => {
    if (!selectedTask) return;
    const reviewer = agents.find(a => a.id !== selectedTask.assigned_agent_id);
    if (!reviewer) return;

    await api.submitReview(
      `work-${selectedTask.id}`,
      reviewer.id as string,
      verdict,
      `Automated ${verdict} by ${reviewer.name}`
    );
    refresh();
    setSelectedTask(null);
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>Code Reviews</h1>

      {tasks.length === 0 ? (
        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#6b7280' }}>
          No tasks pending review
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.map(task => (
            <div
              key={task.id as string}
              onClick={() => setSelectedTask(task)}
              style={{
                backgroundColor: '#1f2937',
                borderRadius: '8px',
                padding: '12px',
                border: selectedTask?.id === task.id ? '2px solid #a855f7' : '1px solid #374151',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{task.title as string}</div>
              <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                Agent: {task.assigned_agent_id as string} | Priority: {(task.priority as string)?.toUpperCase()}
              </div>
              {selectedTask?.id === task.id && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReview('approve'); }}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#22c55e', color: '#fff', cursor: 'pointer' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReview('request_changes'); }}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#eab308', color: '#000', cursor: 'pointer' }}
                  >
                    Request Changes
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReview('reject'); }}
                    style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer' }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
