interface TaskCardProps {
  task: Record<string, unknown>;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  queued: '#6b7280',
  assigned: '#3b82f6',
  in_progress: '#eab308',
  in_review: '#a855f7',
  completed: '#22c55e',
  failed: '#ef4444',
};

const priorityColors: Record<string, string> = {
  low: '#6b7280',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const status = (task.status as string) || 'queued';
  const priority = (task.priority as string) || 'medium';

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#1f2937',
        borderRadius: '8px',
        padding: '12px',
        border: `1px solid #374151`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', flex: 1 }}>{task.title as string}</div>
        <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: priorityColors[priority] + '33',
            color: priorityColors[priority],
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}>
            {priority}
          </span>
          <span style={{
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: statusColors[status] + '33',
            color: statusColors[status],
            fontWeight: 'bold',
          }}>
            {status.replace('_', ' ')}
          </span>
        </div>
      </div>
      {(task.description as string) && (
        <div style={{ fontSize: '0.8rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {(task.description as string).slice(0, 100)}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginTop: '6px' }}>
        <span>Source: {(task.source as string) || 'manual'}</span>
        {(task.assigned_agent_id as string) && <span>Agent: {task.assigned_agent_id as string}</span>}
      </div>
    </div>
  );
}
