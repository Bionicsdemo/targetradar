'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TrialStatusPieProps {
  trialsByStatus: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  RECRUITING: '#10B981',
  ACTIVE_NOT_RECRUITING: '#3B82F6',
  COMPLETED: '#64748B',
  TERMINATED: '#EF4444',
  WITHDRAWN: '#F97316',
  NOT_YET_RECRUITING: '#8B5CF6',
  SUSPENDED: '#F59E0B',
  ENROLLING_BY_INVITATION: '#06B6D4',
  UNKNOWN: '#475569',
};

function statusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export function TrialStatusPie({ trialsByStatus }: TrialStatusPieProps) {
  const data = Object.entries(trialsByStatus)
    .map(([status, count]) => ({
      name: statusLabel(status),
      value: count,
      color: STATUS_COLORS[status] || '#475569',
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={192}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={65}
            paddingAngle={2}
            dataKey="value"
            animationDuration={800}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0} trials`, 'Count']}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px' }}
            formatter={(value: string) => (
              <span style={{ color: '#94A3B8' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
