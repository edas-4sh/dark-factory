import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  IconDashboard, IconAgents, IconQueue, IconCheck, IconActivity,
  IconRefresh, IconHealth, IconClock, IconStatusIdle, IconStatusBusy,
  IconStatusError, IconStatusOffline,
} from '../components/icons';
import {
  Badge, HealthBar, AgentAvatar, EmptyState, SkeletonCard,
  StatCard, statusBadge, priorityBadge,
} from '../components/ui';

function StatusIndicator({ status }: { status: string }) {
  const Icon = status === 'idle' ? IconStatusIdle
    : status === 'busy' ? IconStatusBusy
    : status === 'error' ? IconStatusError
    : IconStatusOffline;
  return <Icon size={8} />;
}

export default function Overview() {
  const [agents, setAgents] = useState<Array<Record<string, unknown>>>([]);
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [healthChecks, setHealthChecks] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const [agentsData, tasksData, statsData, healthData] = await Promise.all([
        api.getAgents(),
        api.getTasks(),
        api.getStats(),
        api.getHealthChecks(),
      ]);
      setAgents(agentsData);
      setTasks(tasksData.slice(0, 6));
      setStats(statsData);
      setHealthChecks(healthData.slice(0, 8));
    } catch (err) {
      console.error('Failed to load:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useWebSocket(() => { refresh(); });

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1 className="page-title"><IconDashboard size={20} /> Dashboard</h1></div>
        <div className="grid-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>
        <div className="grid-3" style={{ marginTop: 24 }}>{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
      </div>
    );
  }

  const onlineCount = Number(stats.agentsOnline) || 0;
  const totalCount = Number(stats.totalAgents) || 0;
  const systemOk = onlineCount === totalCount && totalCount > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title"><IconDashboard size={20} /> Dashboard</h1>
          <div className="page-subtitle">Factory overview and system status</div>
        </div>
        <button className="btn btn-ghost" onClick={refresh}><IconRefresh size={14} /> Refresh</button>
      </div>

      <div className="grid-4">
        <StatCard
          icon={<IconAgents size={22} />}
          label="Agents Online"
          value={`${onlineCount} / ${totalCount}`}
          color="#22c55e"
        />
        <StatCard
          icon={<IconQueue size={22} />}
          label="Queued Tasks"
          value={String(stats.queuedTasks || 0)}
          color="#ca8a04"
        />
        <StatCard
          icon={<IconCheck size={22} />}
          label="Completed Today"
          value={String(stats.completedToday || 0)}
          color="#3b82f6"
        />
        <StatCard
          icon={<IconActivity size={22} />}
          label="System Status"
          value={systemOk ? 'Operational' : 'Degraded'}
          color={systemOk ? '#22c55e' : '#ea580c'}
        />
      </div>

      <hr className="section-divider" />

      <div className="section-title"><IconAgents size={16} /> Agents</div>
      {agents.length === 0 ? (
        <EmptyState
          icon={<IconAgents size={32} />}
          title="No agents registered"
          description="Agents will appear here once they connect to the orchestrator."
        />
      ) : (
        <div className="grid-4">
          {agents.map(agent => (
            <div
              key={agent.id as string}
              className="card"
              style={{ cursor: 'pointer', padding: 16 }}
              onClick={() => navigate(`/agents?id=${agent.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <AgentAvatar role={agent.role as string} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{agent.name as string}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{agent.role as string}</div>
                </div>
                <StatusIndicator status={agent.status as string} />
              </div>
              <HealthBar value={agent.health_score as number || 100} height={3} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Tasks: {(agent.tasks_completed as number) || 0}</span>
                <Badge variant={statusBadge(agent.status as string).variant}>{statusBadge(agent.status as string).label}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <hr className="section-divider" />

      <div className="section-title"><IconQueue size={16} /> Recent Tasks</div>
      {tasks.length === 0 ? (
        <EmptyState
          icon={<IconQueue size={32} />}
          title="No tasks"
          description="Create a task or configure GitHub issue discovery."
        />
      ) : (
        <div className="flex-col">
          {tasks.map(task => {
            const ps = priorityBadge(task.priority as string);
            const ss = statusBadge(task.status as string);
            return (
              <div key={task.id as string} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem', marginBottom: 2 }}>{task.title as string}</div>
                  {task.description as string && (
                    <div className="text-muted text-sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(task.description as string).slice(0, 80)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  <Badge variant={ps.variant}>{ps.label}</Badge>
                  <Badge variant={ss.variant}>{ss.label}</Badge>
                  {task.assigned_agent_id as string && (
                    <span className="text-xs text-muted" style={{ marginLeft: 4 }}>
                      {task.assigned_agent_id as string}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <hr className="section-divider" />

      <div className="section-title"><IconHealth size={16} /> Health Checks</div>
      {healthChecks.length === 0 ? (
        <EmptyState
          icon={<IconHealth size={32} />}
          title="No health data"
          description="Health checks run automatically every 60 seconds."
        />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Response</th>
                <th>Error Rate</th>
              </tr>
            </thead>
            <tbody>
              {healthChecks.map(hc => (
                <tr key={hc.id as string}>
                  <td className="text-xs text-muted">{new Date((hc.timestamp as number) * 1000).toLocaleTimeString()}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StatusIndicator status={(hc.status as string) === 'healthy' ? 'idle' : 'error'} />
                      {hc.agent_id as string}
                    </span>
                  </td>
                  <td><Badge variant={statusBadge(hc.status as string).variant}>{statusBadge(hc.status as string).label}</Badge></td>
                  <td>{(hc.response_time as number)?.toFixed(0)}ms</td>
                  <td>{(hc.error_rate as number)?.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
