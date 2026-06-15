import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { IconQueue, IconPlus, IconSearch, IconRefresh } from '../components/icons';
import { Badge, EmptyState, SkeletonCard, statusBadge, priorityBadge } from '../components/ui';

const COLUMNS = [
  { key: 'queued', label: 'Queued', color: '#64748b' },
  { key: 'assigned', label: 'Assigned', color: '#3b82f6' },
  { key: 'in_progress', label: 'In Progress', color: '#ca8a04' },
  { key: 'in_review', label: 'In Review', color: '#8b5cf6' },
  { key: 'completed', label: 'Completed', color: '#22c55e' },
  { key: 'failed', label: 'Failed', color: '#dc2626' },
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
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useWebSocket(() => { refresh(); });

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await api.createTask(newTitle.trim(), newDesc.trim(), newPriority);
    setNewTitle(''); setNewDesc(''); setNewPriority('medium');
    setShowCreate(false);
    refresh();
  };

  const grouped = Object.fromEntries(COLUMNS.map(c => [c.key, tasks.filter(t => t.status === c.key)]));

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title"><IconQueue size={20} /> Queue</h1></div>
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
          <h1 className="page-title"><IconQueue size={20} /> Queue</h1>
          <div className="page-subtitle">{tasks.length} total tasks</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost" onClick={() => api.triggerDiscovery()}><IconSearch size={14} /> Discover</button>
          <button className="btn btn-ghost" onClick={refresh}><IconRefresh size={14} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <IconPlus size={14} /> New Task
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><div className="card-title"><IconPlus size={14} /> Create Task</div></div>
          <input className="input" placeholder="Task title" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ marginBottom: 8 }} />
          <textarea className="textarea" placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select" value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{ maxWidth: 150 }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button className="btn btn-primary" onClick={handleCreate}>Create</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {COLUMNS.map(col => {
          const items = grouped[col.key] as Array<Record<string, unknown>>;
          return (
            <div key={col.key}>
              <div className="column-header" style={{ borderLeft: `3px solid ${col.color}` }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', flex: 1 }}>{col.label}</span>
                <span className="column-count">{items.length}</span>
              </div>
              <div className="flex-col" style={{ gap: 6 }}>
                {items.length === 0 && (
                  <div style={{ padding: '14px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    No items
                  </div>
                )}
                {items.map(task => {
                  const ps = priorityBadge(task.priority as string);
                  return (
                    <div key={task.id as string} className="card" style={{ padding: '10px 12px', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 500, marginBottom: 6, lineHeight: 1.3 }}>{task.title as string}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                        {task.source as string && <Badge variant="gray">{(task.source as string).replace('_', ' ')}</Badge>}
                      </div>
                      <div className="text-xs text-muted" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        {task.assigned_agent_id ? <span>{task.assigned_agent_id as string}</span> : <span>Unassigned</span>}
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
