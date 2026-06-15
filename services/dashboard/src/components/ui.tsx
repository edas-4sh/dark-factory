const ROLE_CONFIG: Record<string, { icon: string; color: string }> = {
  architect: { icon: '🏗️', color: '#3b82f6' },
  builder: { icon: '🔧', color: '#22c55e' },
  reviewer: { icon: '👁️', color: '#a855f7' },
  devops: { icon: '🚀', color: '#f97316' },
  doctor: { icon: '💊', color: '#06b6d4' },
};

const STATUS_COLORS: Record<string, string> = {
  idle: '#22c55e',
  busy: '#eab308',
  error: '#ef4444',
  offline: '#64748b',
};

interface AgentAvatarProps {
  role: string;
  size?: number;
}

export function AgentAvatar({ role, size = 40 }: AgentAvatarProps) {
  const config = ROLE_CONFIG[role] || { icon: '🤖', color: '#64748b' };
  return (
    <div
      className="agent-avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: `${config.color}20`,
        border: `1px solid ${config.color}40`,
      }}
      title={role}
    >
      {config.icon}
    </div>
  );
}

export function StatusDot({ status }: { status: string }) {
  return <span className={`status-dot ${status}`} />;
}

interface BadgeProps {
  variant: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray' | 'orange' | 'cyan';
  children: React.ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function statusBadge(status: string): { variant: BadgeProps['variant']; label: string } {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    idle: { variant: 'green', label: 'Idle' },
    busy: { variant: 'yellow', label: 'Busy' },
    error: { variant: 'red', label: 'Error' },
    offline: { variant: 'gray', label: 'Offline' },
    queued: { variant: 'gray', label: 'Queued' },
    assigned: { variant: 'blue', label: 'Assigned' },
    in_progress: { variant: 'yellow', label: 'In Progress' },
    in_review: { variant: 'purple', label: 'In Review' },
    completed: { variant: 'green', label: 'Completed' },
    failed: { variant: 'red', label: 'Failed' },
    healthy: { variant: 'green', label: 'Healthy' },
    degraded: { variant: 'orange', label: 'Degraded' },
    unhealthy: { variant: 'red', label: 'Unhealthy' },
  };
  return map[status] || { variant: 'gray', label: status };
}

export function priorityBadge(priority: string): { variant: BadgeProps['variant']; label: string } {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    low: { variant: 'gray', label: 'Low' },
    medium: { variant: 'yellow', label: 'Medium' },
    high: { variant: 'orange', label: 'High' },
    critical: { variant: 'red', label: 'Critical' },
  };
  return map[priority] || { variant: 'gray', label: priority };
}

interface HealthBarProps {
  value: number;
  height?: number;
  showLabel?: boolean;
}

export function HealthBar({ value, height = 6, showLabel = true }: HealthBarProps) {
  const color = value > 80 ? '#22c55e' : value > 50 ? '#eab308' : '#ef4444';
  return (
    <div>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Health</span>
          <span style={{ color, fontWeight: 600 }}>{value.toFixed(0)}%</span>
        </div>
      )}
      <div className="health-bar" style={{ height }}>
        <div className="health-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  color?: string;
}

export function StatCard({ icon, label, value, trend, color = '#3b82f6' }: StatCardProps) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{value}</div>
          {trend && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{trend}</div>}
        </div>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-md)',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-desc">{description}</div>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card skeleton-card">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" style={{ width: '40%' }} />
    </div>
  );
}

const ROLE_GRADIENTS: Record<string, string> = {
  architect: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  builder: 'linear-gradient(135deg, #22c55e, #16a34a)',
  reviewer: 'linear-gradient(135deg, #a855f7, #9333ea)',
  devops: 'linear-gradient(135deg, #f97316, #ea580c)',
  doctor: 'linear-gradient(135deg, #06b6d4, #0891b2)',
};

export function roleGradient(role: string): string {
  return ROLE_GRADIENTS[role] || 'linear-gradient(135deg, #64748b, #475569)';
}

export function roleIcon(role: string): string {
  return ROLE_CONFIG[role]?.icon || '🤖';
}
