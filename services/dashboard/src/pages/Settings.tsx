import { useState } from 'react';
import { api } from '../services/api';
import { IconSettings, IconPlus, IconSearch, IconAgents, IconServer, IconShield } from '../components/icons';
import { AgentAvatar } from '../components/ui';

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

  const show = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateTask = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.createTask(title.trim(), desc.trim(), priority);
      show(`Task created and queued`, 'success');
      setTitle(''); setDesc(''); setPriority('medium');
    } catch { show('Failed to create task', 'error'); }
    setCreating(false);
  };

  const handleDiscover = async () => {
    try {
      await api.triggerDiscovery();
      show('GitHub discovery triggered', 'info');
    } catch { show('Discovery trigger failed', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><IconSettings size={20} /> Settings</h1>
          <div className="page-subtitle">Factory configuration and agent registry</div>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : message.type === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(59,130,246,0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.2)' : message.type === 'error' ? 'rgba(220,38,38,0.2)' : 'rgba(59,130,246,0.2)'}`,
          color: message.type === 'success' ? 'var(--accent-green)' : message.type === 'error' ? 'var(--accent-red)' : 'var(--accent-blue)',
        }}>
          {message.text}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title"><IconPlus size={14} /> Create Task</div></div>
          <input className="input" placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} style={{ marginBottom: 8 }} />
          <textarea className="textarea" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select" value={priority} onChange={e => setPriority(e.target.value)} style={{ maxWidth: 150 }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button className="btn btn-primary" onClick={handleCreateTask} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title"><IconAgents size={14} /> Agent Registry</div></div>
          <div className="flex-col" style={{ gap: 8 }}>
            {AGENTS.map(agent => (
              <div key={agent.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
              }}>
                <AgentAvatar role={agent.role} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    {agent.name} <span className="text-muted text-sm" style={{ fontWeight: 400 }}>&mdash; {agent.role}</span>
                  </div>
                  <div className="text-xs text-secondary">{agent.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title"><IconSearch size={14} /> GitHub Discovery</div></div>
          <p className="text-sm text-secondary" style={{ marginBottom: 14, lineHeight: 1.5 }}>
            Automatically scan the configured GitHub repository for new issues and create tasks.
          </p>
          <button className="btn btn-secondary" onClick={handleDiscover}>
            <IconSearch size={14} /> Trigger Discovery
          </button>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title"><IconServer size={14} /> Environment</div></div>
          <p className="text-sm text-secondary" style={{ marginBottom: 12, lineHeight: 1.5 }}>
            Configured via environment variables or the <code style={{ background: 'var(--bg-primary)', padding: '2px 5px', borderRadius: 4, fontSize: '0.75rem' }}>.env</code> file.
          </p>
          <div className="flex-col" style={{ gap: 5 }}>
            {[
              { key: 'OPENROUTER_API_KEY', desc: 'AI model API key (OpenRouter)' },
              { key: 'GITHUB_TOKEN', desc: 'Repository access token' },
              { key: 'SMTP_HOST / SMTP_USER / SMTP_PASS', desc: 'Email notification server' },
              { key: 'GITHUB_OWNER / GITHUB_REPO', desc: 'Target repository' },
            ].map(c => (
              <div key={c.key} style={{ padding: '7px 10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <code style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>{c.key}</code>
                <div className="text-xs text-muted">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
