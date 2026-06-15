import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import TaskCard from '../components/TaskCard';

export default function Queue() {
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  const refresh = useCallback(async () => {
    try {
      const [allTasks] = await Promise.all([
        api.getTasks(),
      ]);
      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
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

  const statusGroups = ['queued', 'assigned', 'in_progress', 'in_review', 'completed', 'failed'];
  const grouped = Object.fromEntries(statusGroups.map(s => [s, tasks.filter(t => t.status === s)]));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Task Queue</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => api.triggerDiscovery()} style={buttonStyle}>
            Discover GitHub Issues
          </button>
          <button onClick={() => setShowCreate(!showCreate)} style={{ ...buttonStyle, backgroundColor: '#2563eb' }}>
            {showCreate ? 'Cancel' : 'Create Task'}
          </button>
        </div>
      </div>

      {showCreate && (
        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <input
            placeholder="Task title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={inputStyle}
          />
          <textarea
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={selectStyle}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button onClick={handleCreate} style={{ ...buttonStyle, backgroundColor: '#22c55e' }}>Create</button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {statusGroups.map(status => (
          <div key={status}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '8px', textTransform: 'capitalize', color: '#9ca3af' }}>
              {status.replace('_', ' ')} ({grouped[status].length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {grouped[status].map(task => (
                <TaskCard key={task.id as string} task={task} />
              ))}
              {grouped[status].length === 0 && (
                <div style={{ color: '#6b7280', fontSize: '0.85rem', padding: '8px' }}>No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const buttonStyle: Record<string, string> = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#374151',
  color: '#f3f4f6',
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const inputStyle: Record<string, string> = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #374151',
  backgroundColor: '#111827',
  color: '#f3f4f6',
  fontSize: '0.9rem',
  marginBottom: '8px',
  boxSizing: 'border-box',
};

const selectStyle: Record<string, string> = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #374151',
  backgroundColor: '#111827',
  color: '#f3f4f6',
  fontSize: '0.9rem',
};
