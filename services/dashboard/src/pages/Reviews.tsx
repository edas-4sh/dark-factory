import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge, EmptyState, AgentAvatar, statusBadge, priorityBadge } from '../components/ui';

export default function Reviews() {
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [agents, setAgents] = useState<Array<Record<string, unknown>>>([]);
  const [selectedTask, setSelectedTask] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [tasksData, agentsData] = await Promise.all([
        api.getTasks(),
        api.getAgents(),
      ]);
      setTasks(tasksData.filter(t => t.status === 'in_review'));
      setAgents(agentsData);
    } catch (err) {
      console.error('Failed to load:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useWebSocket(() => { refresh(); });

  const handleReview = async (verdict: string) => {
    if (!selectedTask) return;
    const reviewer = agents.find(a => a.id !== selectedTask.assigned_agent_id);
    if (!reviewer) {
      setMessage('No other agent available to review');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      await api.submitReview(
        `work-${selectedTask.id}`,
        reviewer.id as string,
        verdict,
        `Automated ${verdict} by ${reviewer.name}`
      );
      setMessage(`${reviewer.name} ${verdict === 'approve' ? 'approved' : verdict === 'request_changes' ? 'requested changes on' : 'rejected'} this task`);
      refresh();
      setSelectedTask(null);
    } catch {
      setMessage('Review submission failed');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const getStatusCounts = () => {
    const all = api.getTasks();
    return all;
  };

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Code Reviews</h1></div>
        <div className="card" style={{ height: 200 }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👁️ Code Reviews</h1>
          <div className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} waiting for peer review</div>
        </div>
        <button className="btn btn-secondary" onClick={refresh}>🔄 Refresh</button>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          fontSize: '0.9rem',
          color: 'var(--accent-blue)',
        }}>
          {message}
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon="✅"
          title="All caught up!"
          description="No tasks are currently waiting for review. New tasks will appear here once coding is complete."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tasks.map(task => {
            const coderAgent = agents.find(a => a.id === task.assigned_agent_id);
            const ps = priorityBadge(task.priority as string);
            return (
              <div
                key={task.id as string}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: selectedTask?.id === task.id ? 'var(--accent-purple)' : undefined,
                  boxShadow: selectedTask?.id === task.id ? '0 0 0 1px var(--accent-purple)' : undefined,
                }}
                onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {coderAgent && <AgentAvatar role={coderAgent.role as string} size={36} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
                      {task.title as string}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>By: <strong>{task.assigned_agent_id as string}</strong></span>
                      <span>•</span>
                      <Badge variant={ps.variant}>{ps.label}</Badge>
                    </div>
                  </div>
                  <Badge variant="purple">In Review</Badge>
                </div>

                {selectedTask?.id === task.id && (
                  <div style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: 8 }}>
                      👤 Review as:
                    </span>
                    <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); handleReview('approve'); }}>
                      ✅ Approve
                    </button>
                    <button className="btn btn-warning btn-sm" onClick={(e) => { e.stopPropagation(); handleReview('request_changes'); }}>
                      🔄 Request Changes
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleReview('reject'); }}>
                      ❌ Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Workflow visualization */}
      <div className="card" style={{ marginTop: 32 }}>
        <div className="card-header"><div className="card-title">📋 Review Workflow</div></div>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: '📝', label: 'Code Written', color: '#3b82f6' },
            { icon: '👁️', label: 'Peer Review', color: '#a855f7' },
            { icon: '✅', label: 'Approved', color: '#22c55e' },
            { icon: '🚀', label: 'Merged', color: '#06b6d4' },
          ].map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: `${step.color}10`,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${step.color}30`,
              }}>
                <span>{step.icon}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{step.label}</span>
              </div>
              {i < 3 && (
                <div style={{
                  width: 24,
                  height: 2,
                  background: 'var(--border)',
                  margin: '0 4px',
                }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          🔒 No agent can approve their own code — every PR must be reviewed by a different agent.
        </div>
      </div>
    </div>
  );
}
