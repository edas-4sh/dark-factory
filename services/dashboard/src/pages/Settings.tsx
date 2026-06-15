import { useState } from 'react';
import { api } from '../services/api';
import { AgentAvatar, roleGradient } from '../components/ui';

const AGENTS = [
  { id: 'agent-alpha', name: 'Alpha', role: 'architect', desc: 'System design, architecture, planning' },
  { id: 'agent-beta', name: 'Beta', role: 'builder', desc: 'Feature implementation, bug fixes' },
  { id: 'agent-gamma', name: 'Gamma', role: 'reviewer', desc: 'Code quality, approvals, standards' },
  { id: 'agent-delta', name: 'Delta', role: 'devops', desc: 'CI/CD, Docker, infrastructure' },
  { id: 'agent-epsilon', name: 'Epsilon', role: 'doctor', desc: 'Health monitoring, metrics, alerts' },
];

export default function Settings() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState('medium');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [creating, setCreating] = useState(false);

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateTask = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.createTask(title.trim(), desc.trim(), priority);
      showMessage(`Task "${title}" created and queued!`, 'success');
      setTitle('');
      setDesc('');
      setPriority('medium');
    } catch {
      showMessage('Failed to create task', 'error');
    }
    setCreating(false);
  };

  const handleDiscover = async () => {
    try {
      await api.triggerDiscovery();
      showMessage('GitHub discovery triggered — checking for new issues', 'info');
    } catch {
      showMessage('Discovery trigger failed', 'error');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Settings</h1>
          <div className="page-subtitle">Configure your Dark Factory agents and system</div>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          fontSize: '0.9rem',
          background: message.type === 'success' ? 'rgba(34,197,94,0.15)' : message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
          color: message.type === 'success' ? 'var(--accent-green)' : message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-blue)',
        }}>
          {message.text}
        </div>
      )}

      <div className="grid-2">
        {/* Quick Task Creator */}
        <div className="card">
          <div className="card-header"><div className="card-title">📝 Quick Task Creator</div></div>
          <input className="input" placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 8 }} />
          <textarea className="textarea" placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select" value={priority} onChange={e => setPriority(e.target.value)} style={{ maxWidth: 160 }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button className="btn btn-primary" onClick={handleCreateTask} disabled={creating}>
              {creating ? 'Creating...' : '+ Create Task'}
            </button>
          </div>
        </div>

        {/* Agent Registry */}
        <div className="card">
          <div className="card-header"><div className="card-title">🤖 Agent Registry</div></div>
          <div className="flex-col" style={{ gap: 10 }}>
            {AGENTS.map(agent => (
              <div key={agent.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
              }}>
                <AgentAvatar role={agent.role} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{agent.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'capitalize' }}>— {agent.role}</span></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{agent.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GitHub Discovery */}
        <div className="card">
          <div className="card-header"><div className="card-title">🔍 GitHub Discovery</div></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Automatically scan your configured GitHub repository for new issues and create tasks for each one.
          </p>
          <button className="btn btn-secondary" onClick={handleDiscover}>
            🔍 Trigger Discovery Now
          </button>
        </div>

        {/* Environment Config */}
        <div className="card">
          <div className="card-header"><div className="card-title">🔧 Environment Configuration</div></div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Configure via environment variables or the <code style={{ background: 'var(--bg-primary)', padding: '2px 6px', borderRadius: 4, fontSize: '0.8rem' }}>.env</code> file.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
            {[
              { key: 'OPENROUTER_API_KEY', desc: 'AI model access via OpenRouter (free tier available)' },
              { key: 'GITHUB_TOKEN', desc: 'Repository access token with repo scope' },
              { key: 'SMTP_HOST / SMTP_USER / SMTP_PASS', desc: 'Email notification credentials' },
              { key: 'GITHUB_OWNER / GITHUB_REPO', desc: 'Target repository for work discovery' },
              { key: 'PORT', desc: 'Server port (default: 3001)' },
            ].map(c => (
              <div key={c.key} style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>{c.key}</code>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
