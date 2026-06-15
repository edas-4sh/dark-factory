import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import AgentCard from '../components/AgentCard';
import TaskCard from '../components/TaskCard';

export default function Agents() {
  const [agents, setAgents] = useState<Array<Record<string, unknown>>>([]);
  const [selectedAgent, setSelectedAgent] = useState<Record<string, unknown> | null>(null);
  const [healthChecks, setHealthChecks] = useState<Array<Record<string, unknown>>>([]);
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('id');

  const refresh = useCallback(async () => {
    try {
      const agentsData = await api.getAgents();
      setAgents(agentsData);

      if (agentId) {
        const agent = agentsData.find(a => a.id === agentId);
        setSelectedAgent(agent || null);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  }, [agentId]);

  useEffect(() => { refresh(); }, [refresh]);

  useWebSocket(() => { refresh(); });

  useEffect(() => {
    if (selectedAgent?.id) {
      api.getHealthChecks().then(hc => {
        const filtered = hc.filter(c => c.agent_id === selectedAgent.id);
        setHealthChecks(filtered.slice(0, 20));
      }).catch(() => {});
    }
  }, [selectedAgent]);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px' }}>Agents</h1>

      <div style={{ display: 'grid', gridTemplateColumns: selectedAgent ? '1fr 1fr' : '1fr', gap: '24px' }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {agents.map(agent => (
              <AgentCard
                key={agent.id as string}
                agent={agent}
                onClick={() => setSelectedAgent(agent)}
              />
            ))}
          </div>
        </div>

        {selectedAgent && (
          <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>{selectedAgent.name as string}</h2>
              <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>ID: {selectedAgent.id as string}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Role</div>
                <div style={{ textTransform: 'capitalize' }}>{(selectedAgent.role as string) || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Status</div>
                <div>{(selectedAgent.status as string) || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Health Score</div>
                <div>{(selectedAgent.health_score as number)?.toFixed(1) || '-'}%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Tasks Completed</div>
                <div>{(selectedAgent.tasks_completed as number) || 0}</div>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>Health History</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {healthChecks.map(hc => (
                <div key={hc.id as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #374151', fontSize: '0.85rem' }}>
                  <span style={{ color: '#9ca3af' }}>{new Date((hc.timestamp as number) * 1000).toLocaleString()}</span>
                  <span style={{ color: hc.status === 'healthy' ? '#22c55e' : '#eab308' }}>{(hc.status as string)?.toUpperCase()}</span>
                  <span>RT: {(hc.response_time as number)?.toFixed(0)}ms</span>
                </div>
              ))}
              {healthChecks.length === 0 && <div style={{ color: '#6b7280', textAlign: 'center', padding: '12px' }}>No health data yet</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
