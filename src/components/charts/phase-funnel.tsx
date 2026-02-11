'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface PhaseFunnelProps {
  trialsByPhase: Record<string, number>;
}

const PHASE_ORDER = [
  { key: 'EARLY_PHASE1', label: 'Early Ph1', color: '#475569' },
  { key: 'PHASE1', label: 'Phase 1', color: '#64748B' },
  { key: 'PHASE2', label: 'Phase 2', color: '#F59E0B' },
  { key: 'PHASE3', label: 'Phase 3', color: '#3B82F6' },
  { key: 'PHASE4', label: 'Phase 4', color: '#10B981' },
];

export function PhaseFunnel({ trialsByPhase }: PhaseFunnelProps) {
  const data = PHASE_ORDER.map((p) => ({
    phase: p.label,
    count: trialsByPhase[p.key] || 0,
    color: p.color,
  })).filter((d) => d.count > 0);

  if (data.length === 0) return null;

  return (
    <div>
      <ResponsiveContainer width="100%" height={192}>
        <BarChart data={data} layout="vertical" barCategoryGap="20%">
          <XAxis
            type="number"
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="phase"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={65}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0} trials`, 'Count']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
