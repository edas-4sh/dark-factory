import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  IconReviews, IconCheck, IconX, IconAlert, IconRefresh,
  IconGitPullRequest, IconArrowRight, IconUser,
} from '../components/icons';
import { Badge, AgentAvatar, EmptyState, statusBadge, priorityBadge } from '../components/ui';

export default function Reviews() {
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [agents, setAgents] = useState<Array<Record<string, unknown>>>([]);
  const [selectedTask, setSelectedTask] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [tasksData, agentsData] = await Promise.all([
        api.getTasks(),
        api.getAgents(),
      ]);
      setTasks(tasksData.filter(t => t.status === 'in_review'));
      setAgents(agentsData);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useWebSocket(() => { refresh(); });

  const handleReview = async (verdict: string) => {
    if (!selectedTask) return;
    const reviewer = agents.find(a => a.id !== selectedTask.assigned_agent_id);
    if (!reviewer) {
      setMessage({ text: 'No other agent available to review', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    try {
      await api.submitReview(
        `work-${selectedTask.id}`,
        reviewer.id as string,
        verdict,
        `Automated ${verdict} by ${reviewer.name}`
      );
      setMessage({
        text: `Review submitted: ${reviewer.name} ${verdict === 'approve' ? 'approved' : verdict === 'request_changes' ? 'requested changes' : 'rejected'}`,
        type: 'success',
      });
      refresh();
      setSelectedTask(null);
    } catch {
      setMessage({ text: 'Review submission failed', type: 'error' });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title"><IconReviews size={20} /> Reviews</h1></div>
        <div className="card" style={{ height: 200 }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /><div className="skeleton skeleton-text" style={{ width: '60%' }} /></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><IconReviews size={20} /> Reviews</h1>
          <div className="page-subtitle">{tasks.length} task{tasks.length !== 1 ? 's' : ''} pending peer review</div>
        </div>
        <button className="btn btn-ghost" onClick={refresh}><IconRefresh size={14} /> Refresh</button>
      </div>

      {message && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          fontSize: '0.85rem',
          background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : message.type === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(59,130,246,0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : message.type === 'error' ? 'rgba(220,38,38,0.2)' : 'rgba(59,130,246,0.2)'}`,
          color: message.type === 'success' ? 'var(--accent-green)' : message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-blue)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          {message.type === 'success' ? <IconCheck size={14} /> : message.type === 'error' ? <IconX size={14} /> : <IconAlert size={14} />}
          {message.text}
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon={<IconCheck size={32} />}
          title="All reviews complete"
          description="No tasks are currently waiting for peer review."
        />
      ) : (
        <div className="flex-col">
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {coderAgent && <AgentAvatar role={coderAgent.role as string} size={32} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem', marginBottom: 2 }}>{task.title as string}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <IconUser size={10} /> {task.assigned_agent_id as string}
                      <span style={{ color: 'var(--text-muted)' }}>&middot;</span>
                      <Badge variant={ps.variant}>{ps.label}</Badge>
                    </div>
                  </div>
                  <Badge variant="purple">In Review</Badge>
                </div>

                {selectedTask?.id === task.id && (
                  <div style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}>
                    <span className="text-sm text-secondary" style={{ marginRight: 4 }}>Review as:</span>
                    <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); handleReview('approve'); }}>
                      <IconCheck size={12} /> Approve
                    </button>
                    <button className="btn btn-warning btn-sm" onClick={(e) => { e.stopPropagation(); handleReview('request_changes'); }}>
                      Request Changes
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleReview('reject'); }}>
                      <IconX size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ marginTop: 32 }}>
        <div className="card-header"><div className="card-title"><IconGitPullRequest size={14} /> Review Workflow</div></div>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: <IconCode size={14} />, label: 'Code Written', color: '#3b82f6' },
            { icon: <IconUser size={14} />, label: 'Peer Review', color: '#8b5cf6' },
            { icon: <IconCheck size={14} />, label: 'Approved', color: '#22c55e' },
            { icon: <IconGitPullRequest size={14} />, label: 'Merged', color: '#06b6d4' },
          ].map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                background: `${step.color}08`,
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${step.color}20`,
              }}>
                {step.icon}
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{step.label}</span>
              </div>
              {i < 3 && <IconArrowRight size={14} style={{ color: 'var(--border)', margin: '0 4px' }} />}
            </div>
          ))}
        </div>
        <div className="text-xs text-muted" style={{ marginTop: 10 }}>
          No agent may approve their own work. Every PR requires a review by a different agent.
        </div>
      </div>
    </div>
  );
}

// Small inline icon helper for the workflow
function IconCode({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
  );
}
