import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  IconAgents, IconHealth, IconClock, IconRefresh,
  IconStatusIdle, IconStatusBusy, IconStatusError, IconStatusOffline,
  IconUser,
} from '../components/icons';
import {
  AgentAvatar, Badge, HealthBar, EmptyState, SkeletonCard,
  statusBadge, roleGradient,
} from '../components/ui';

function StatusIndicator({ status }: { status: string }) {
  const Icon = status === 'idle' ? IconStatusIdle
    : status === 'busy' ? IconStatusBusy
    : status === 'error' ? IconStatusError
    : IconStatusOffline;
  return <Icon size={8} />;
}

export default function Agents() {
  const [agents, setAgents] = useState<Array<Record<string, unknown>>>([]);
  const [selectedAgent, setSelectedAgent] = useState<Record<string, unknown> | null>(null);
  const [healthChecks, setHealthChecks] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = searchParams.get('id');

  const refresh = useCallback(async () => {
    try {
      const agentsData = await api.getAgents();
      setAgents(agentsData);
      if (agentId) {
        setSelectedAgent(agentsData.find(a => a.id === agentId) || null);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);
  useWebSocket(() => { refresh(); });

  useEffect(() => {
    if (selectedAgent?.id) {
      api.getHealthChecks().then(hc =>
        setHealthChecks(hc.filter(c => c.agent_id === selectedAgent.id).slice(0, 30))
      ).catch(() => {});
    }
  }, [selectedAgent]);

  const selectAgent = (a: Record<string, unknown>) => {
    setSelectedAgent(a);
    setSearchParams({ id: a.id as string });
  };

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title"><IconAgents size={20} /> Agents</h1></div>
        <div className="grid-4">{[1,2,3,4,5].map(i => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><IconAgents size={20} /> Agents</h1>
          <div className="page-subtitle">{agents.length} registered agents</div>
        </div>
        <button className="btn btn-ghost" onClick={refresh}><IconRefresh size={14} /> Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedAgent ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>
        <div className="grid-4">
          {agents.length === 0 ? (
            <EmptyState
              icon={<IconAgents size={32} />}
              title="No agents connected"
              description="Agents will appear here when they register with the orchestrator."
            />
          ) : agents.map(agent => {
            const selected = selectedAgent?.id === agent.id;
            return (
              <div
                key={agent.id as string}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: 16,
                  borderColor: selected ? 'var(--accent-blue)' : undefined,
                  boxShadow: selected ? '0 0 0 1px var(--accent-blue)' : undefined,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={() => selectAgent(agent)}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: roleGradient(agent.role as string),
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 }}>
                  <AgentAvatar role={agent.role as string} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{agent.name as string}</div>
                    <div className="text-sm text-secondary" style={{ textTransform: 'capitalize' }}>{agent.role as string}</div>
                  </div>
                  <StatusIndicator status={agent.status as string} />
                </div>
                <HealthBar value={agent.health_score as number || 100} height={3} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>Tasks: {(agent.tasks_completed as number) || 0}</span>
                  <Badge variant={statusBadge(agent.status as string).variant}>{statusBadge(agent.status as string).label}</Badge>
                </div>
              </div>
            );
          })}
        </div>

        {selectedAgent && (
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <AgentAvatar role={selectedAgent.role as string} size={48} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedAgent.name as string}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8, textTransform: 'capitalize' }}>
                    <IconUser size={12} /> {selectedAgent.role as string}
                    <Badge variant={statusBadge(selectedAgent.status as string).variant}>
                      {statusBadge(selectedAgent.status as string).label}
                    </Badge>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Health', value: `${(selectedAgent.health_score as number)?.toFixed(1) || '100'}%`, color: (selectedAgent.health_score as number) > 80 ? '#22c55e' : '#ca8a04' },
                  { label: 'Tasks Completed', value: (selectedAgent.tasks_completed as number) || 0, color: '#3b82f6' },
                  { label: 'Agent ID', value: selectedAgent.id as string, color: '#64748b' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '10px', textAlign: 'center' }}>
                    <div className="text-xs text-muted" style={{ marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <HealthBar value={selectedAgent.health_score as number || 100} height={6} />
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <IconHealth size={14} /> Health History
              </div>
              {healthChecks.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No health data recorded. Checks run every 60 seconds.
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Response</th>
                      <th>Error Rate</th>
                      <th>Uptime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthChecks.map(hc => (
                      <tr key={hc.id as string}>
                        <td className="text-xs text-muted">{new Date((hc.timestamp as number) * 1000).toLocaleString()}</td>
                        <td><Badge variant={statusBadge(hc.status as string).variant}>{statusBadge(hc.status as string).label}</Badge></td>
                        <td>{(hc.response_time as number)?.toFixed(0)}ms</td>
                        <td>{(hc.error_rate as number)?.toFixed(1)}%</td>
                        <td>{(hc.uptime as number)?.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
