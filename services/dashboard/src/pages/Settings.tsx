import { useState } from 'react';
import { api } from '../services/api';

export default function Settings() {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState('');

  const handleCreateTask = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.createTask(title.trim(), desc.trim(), priority);
      setMessage(`Task "${title}" created!`);
      setTitle('');
      setDesc('');
      setPriority('medium');
    } catch (err) {
      setMessage('Failed to create task');
    }
    setCreating(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Quick task creator */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px' }}>Quick Task Creator</h2>
          <input
            placeholder="Task title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle}
          />
          <textarea
            placeholder="Description"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
          <select value={priority} onChange={e => setPriority(e.target.value)} style={selectStyle}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <button
            onClick={handleCreateTask}
            disabled={creating}
            style={{
              ...buttonStyle,
              backgroundColor: '#2563eb',
              opacity: creating ? 0.7 : 1,
              marginTop: '8px',
            }}
          >
            {creating ? 'Creating...' : 'Create Task'}
          </button>
          {message && <div style={{ marginTop: '8px', color: '#22c55e', fontSize: '0.9rem' }}>{message}</div>}
        </div>

        {/* Config */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px' }}>System Configuration</h2>
          <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '8px' }}>
            Configure via environment variables or the <code>.env</code> file.
          </div>
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>OPENROUTER_API_KEY</strong> — AI model access</div>
            <div><strong>GITHUB_TOKEN</strong> — Repository access</div>
            <div><strong>SMTP_HOST / SMTP_USER / SMTP_PASS</strong> — Email notifications</div>
            <div><strong>PORT</strong> — Server port (default: 3001)</div>
          </div>
        </div>

        {/* GitHub Discovery */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px' }}>GitHub Discovery</h2>
          <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '12px' }}>
            Automatically scan GitHub for new issues and create tasks.
          </div>
          <button onClick={() => api.triggerDiscovery().then(() => setMessage('Discovery triggered!')).catch(() => setMessage('Discovery failed'))} style={{ ...buttonStyle, backgroundColor: '#374151' }}>
            Trigger Discovery Now
          </button>
        </div>

        {/* Agent info */}
        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px' }}>Agent Registry</h2>
          <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div>🏗️ <strong>Alpha</strong> — Architect</div>
            <div>🔧 <strong>Beta</strong> — Builder</div>
            <div>👁️ <strong>Gamma</strong> — Reviewer</div>
            <div>🚀 <strong>Delta</strong> — DevOps</div>
            <div>💊 <strong>Epsilon</strong> — Doctor</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const buttonStyle: Record<string, string> = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  color: '#f3f4f6',
  fontSize: '0.9rem',
  cursor: 'pointer',
  width: '100%',
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
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #374151',
  backgroundColor: '#111827',
  color: '#f3f4f6',
  fontSize: '0.9rem',
  marginBottom: '8px',
};
