import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import AgentCard from '../components/AgentCard';
import TaskCard from '../components/TaskCard';

export default function Overview() {
  const [agents, setAgents] = useState<Array<Record<string, unknown>>>([]);
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [healthChecks, setHealthChecks] = useState<Array<Record<string, unknown>>>([]);
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
      setTasks(tasksData.slice(0, 5));
      setStats(statsData);
      setHealthChecks(healthData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useWebSocket(() => { refresh(); });

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>Dashboard Overview</h1>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Agents Online', value: stats.agentsOnline as string || '0' },
          { label: 'Total Agents', value: stats.totalAgents as string || '0' },
          { label: 'Queued Tasks', value: stats.queuedTasks as string || '0' },
          { label: 'Completed Today', value: stats.completedToday as string || '0' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: '#1f2937', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#3b82f6' }}>{s.value}</div>
            <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Agents */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px' }}>Agents</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {agents.map(agent => (
          <AgentCard
            key={agent.id as string}
            agent={agent}
            onClick={() => navigate(`/agents?id=${agent.id}`)}
          />
        ))}
      </div>

      {/* Recent tasks */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px' }}>Recent Tasks</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {tasks.map(task => (
          <TaskCard key={task.id as string} task={task} onClick={() => navigate('/queue')} />
        ))}
      </div>

      {/* Health checks */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px' }}>Recent Health Checks</h2>
      <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '12px' }}>
        {healthChecks.map(hc => (
          <div key={hc.id as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #374151', fontSize: '0.9rem' }}>
            <span>Agent: <strong>{hc.agent_id as string}</strong></span>
            <span style={{ color: hc.status === 'healthy' ? '#22c55e' : '#eab308' }}>{(hc.status as string)?.toUpperCase()}</span>
            <span style={{ color: '#9ca3af' }}>RT: {(hc.response_time as number)?.toFixed(0)}ms</span>
          </div>
        ))}
        {healthChecks.length === 0 && <div style={{ color: '#6b7280', textAlign: 'center', padding: '12px' }}>No health checks yet</div>}
      </div>
    </div>
  );
}
