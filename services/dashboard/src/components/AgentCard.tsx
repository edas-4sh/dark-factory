const statusColors: Record<string, string> = {
  idle: '#22c55e',
  busy: '#eab308',
  error: '#ef4444',
  offline: '#6b7280',
};

const roleIcons: Record<string, string> = {
  architect: '🏗️',
  builder: '🔧',
  reviewer: '👁️',
  devops: '🚀',
  doctor: '💊',
};

interface AgentCardProps {
  agent: Record<string, unknown>;
  onClick?: () => void;
}

export default function AgentCard({ agent, onClick }: AgentCardProps) {
  const status = (agent.status as string) || 'offline';
  const health = agent.health_score as number;
  const healthColor = health > 80 ? '#22c55e' : health > 50 ? '#eab308' : '#ef4444';

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        padding: '16px',
        border: `1px solid ${statusColors[status] || '#374151'}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.3s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>{roleIcons[agent.role as string] || '🤖'}</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{agent.name as string}</div>
            <div style={{ fontSize: '0.8rem', color: '#9ca3af', textTransform: 'capitalize' }}>{agent.role as string}</div>
          </div>
        </div>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: statusColors[status],
            boxShadow: `0 0 6px ${statusColors[status]}`,
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#d1d5db' }}>
        <span>Status: <strong>{status}</strong></span>
        <span>Tasks: <strong>{agent.tasks_completed as number || 0}</strong></span>
      </div>
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af' }}>
          <span>Health</span>
          <span style={{ color: healthColor }}>{health?.toFixed(0)}%</span>
        </div>
        <div style={{ backgroundColor: '#374151', borderRadius: '4px', height: '6px', marginTop: '4px' }}>
          <div style={{ backgroundColor: healthColor, borderRadius: '4px', height: '100%', width: `${health}%`, transition: 'width 0.5s' }} />
        </div>
      </div>
    </div>
  );
}
