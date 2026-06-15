import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  StatCard, Badge, HealthBar, StatusDot, AgentAvatar,
  EmptyState, SkeletonCard, statusBadge, priorityBadge, roleGradient,
} from '../components/ui';

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
        <div className="page-header"><h1 className="page-title">Dashboard Overview</h1></div>
        <div className="grid-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <div className="grid-3" style={{ marginTop: 24 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard Overview</h1>
          <div className="page-subtitle">Real-time status of your Dark Factory agents and tasks</div>
        </div>
        <button className="btn btn-secondary" onClick={refresh}>🔄 Refresh</button>
      </div>

      <div className="grid-4">
        <StatCard icon="🤖" label="Agents Online" value={stats.agentsOnline as string || 0} trend={`of ${stats.totalAgents || 0} total`} color="#22c55e" />
        <StatCard icon="📋" label="Queued Tasks" value={stats.queuedTasks as string || 0} color="#eab308" />
        <StatCard icon="✅" label="Completed Today" value={stats.completedToday as string || 0} color="#3b82f6" />
        <StatCard icon="🏭" label="System Status" value={Number(stats.agentsOnline) === Number(stats.totalAgents) ? 'Operational' : 'Degraded'} color={Number(stats.agentsOnline) === Number(stats.totalAgents) ? '#22c55e' : '#f97316'} />
      </div>

      <div className="section-title" style={{ marginTop: 32 }}>🤖 Agents</div>
      <div className="grid-4">
        {agents.length === 0 && <EmptyState icon="🤖" title="No agents registered" description="Agents will appear here once they connect." />}
        {agents.map(agent => (
          <div
            key={agent.id as string}
            className="card"
            style={{ cursor: 'pointer', borderLeft: `3px solid ${['idle', 'busy', 'error', 'offline'].includes(agent.status as string) ? ({ idle: '#22c55e', busy: '#eab308', error: '#ef4444', offline: '#64748b' })[agent.status as string] : '#64748b'}` }}
            onClick={() => navigate(`/agents?id=${agent.id}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <AgentAvatar role={agent.role as string} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{agent.name as string}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{agent.role as string}</div>
              </div>
              <StatusDot status={agent.status as string} />
            </div>
            <HealthBar value={agent.health_score as number || 100} height={4} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Tasks: {(agent.tasks_completed as number) || 0}</span>
              <Badge variant={statusBadge(agent.status as string).variant}>{statusBadge(agent.status as string).label}</Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 32 }}>📋 Recent Tasks</div>
      {tasks.length === 0 ? (
        <EmptyState icon="📋" title="No tasks yet" description="Create a task or wait for GitHub issue discovery." />
      ) : (
        <div className="flex-col">
          {tasks.map(task => {
            const ps = priorityBadge(task.priority as string);
            const ss = statusBadge(task.status as string);
            return (
              <div key={task.id as string} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{task.title as string}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(task.description as string)?.slice(0, 80)}
                    {(task.description as string)?.length > 80 ? '...' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <Badge variant={ps.variant}>{ps.label}</Badge>
                  <Badge variant={ss.variant}>{ss.label}</Badge>
                  {task.assigned_agent_id && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: 4 }}>
                      {task.assigned_agent_id as string}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="section-title" style={{ marginTop: 32 }}>💊 Health Checks</div>
      {healthChecks.length === 0 ? (
        <EmptyState icon="💊" title="No health data yet" description="Health checks will run automatically every 60 seconds." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Response Time</th>
                <th>Error Rate</th>
              </tr>
            </thead>
            <tbody>
              {healthChecks.map(hc => (
                <tr key={hc.id as string}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date((hc.timestamp as number) * 1000).toLocaleTimeString()}
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StatusDot status={(hc.status as string) === 'healthy' ? 'idle' : 'error'} />
                      {hc.agent_id as string}
                    </span>
                  </td>
                  <td>
                    <Badge variant={statusBadge(hc.status as string).variant}>
                      {statusBadge(hc.status as string).label}
                    </Badge>
                  </td>
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
