import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { Badge, EmptyState, SkeletonCard, statusBadge, priorityBadge, AgentAvatar } from '../components/ui';

const COLUMNS = [
  { key: 'queued', label: 'Queued', icon: '📥', color: '#64748b' },
  { key: 'assigned', label: 'Assigned', icon: '📎', color: '#3b82f6' },
  { key: 'in_progress', label: 'In Progress', icon: '🔄', color: '#eab308' },
  { key: 'in_review', label: 'In Review', icon: '👁️', color: '#a855f7' },
  { key: 'completed', label: 'Completed', icon: '✅', color: '#22c55e' },
  { key: 'failed', label: 'Failed', icon: '❌', color: '#ef4444' },
];

export default function Queue() {
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  const refresh = useCallback(async () => {
    try {
      setTasks(await api.getTasks());
    } catch (err) {
      console.error('Failed to load:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useWebSocket(() => { refresh(); });

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await api.createTask(newTitle.trim(), newDesc.trim(), newPriority);
    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
    setShowCreate(false);
    refresh();
  };

  const grouped = Object.fromEntries(
    COLUMNS.map(c => [c.key, tasks.filter(t => t.status === c.key)])
  );

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title">Task Queue</h1></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Task Queue</h1>
          <div className="page-subtitle">{tasks.length} total tasks across all statuses</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => api.triggerDiscovery()}>🔍 Discover Issues</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '✕ Cancel' : '+ New Task'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><div className="card-title">Create Task</div></div>
          <input className="input" placeholder="Task title" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ marginBottom: 8 }} />
          <textarea className="textarea" placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select" value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button className="btn btn-success" onClick={handleCreate}>Create Task</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {COLUMNS.map(col => {
          const items = grouped[col.key] as Array<Record<string, unknown>>;
          return (
            <div key={col.key}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                marginBottom: 8,
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid var(--border)`,
                borderLeft: `3px solid ${col.color}`,
              }}>
                <span>{col.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>{col.label}</span>
                <span style={{
                  background: `${col.color}20`,
                  color: col.color,
                  padding: '2px 8px',
                  borderRadius: 100,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {items.length}
                </span>
              </div>
              <div className="flex-col" style={{ gap: 6 }}>
                {items.length === 0 && (
                  <div style={{ padding: '16px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    Empty
                  </div>
                )}
                {items.map(task => {
                  const ps = priorityBadge(task.priority as string);
                  return (
                    <div key={task.id as string} className="card" style={{ padding: '12px', fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{task.title as string}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                        {task.source as string && (
                          <Badge variant="gray">{(task.source as string).replace('_', ' ')}</Badge>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        {task.assigned_agent_id ? (
                          <span>👤 {task.assigned_agent_id as string}</span>
                        ) : (
                          <span>Unassigned</span>
                        )}
                        <span>{new Date((task.created_at as number) * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
