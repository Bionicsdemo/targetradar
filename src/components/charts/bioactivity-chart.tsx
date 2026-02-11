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
import { cn } from '@/lib/utils';
import type { CompoundActivity } from '@/lib/types/target-profile';

interface BioactivityChartProps {
  activities: CompoundActivity[];
  className?: string;
}

const RANGES = [
  { label: '5-6', min: 5, max: 6, color: '#64748B' },
  { label: '6-7', min: 6, max: 7, color: '#3B82F6' },
  { label: '7-8', min: 7, max: 8, color: '#6366F1' },
  { label: '8-9', min: 8, max: 9, color: '#8B5CF6' },
  { label: '9+', min: 9, max: 100, color: '#10B981' },
];

export function BioactivityChart({ activities, className }: BioactivityChartProps) {
  if (activities.length === 0) return null;

  const data = RANGES.map((range) => ({
    range: range.label,
    count: activities.filter(
      (a) => a.pchemblValue >= range.min && a.pchemblValue < range.max
    ).length,
    color: range.color,
  }));

  return (
    <div className={cn('rounded-xl bg-[var(--surface-1)] border border-white/5 p-5', className)}>
      <h3 className="text-sm font-semibold text-white mb-1">Bioactivity Distribution</h3>
      <p className="text-[10px] text-slate-500 mb-4">pChEMBL value ranges ({activities.length} activities)</p>

      <div>
        <ResponsiveContainer width="100%" height={192}>
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="range"
              tick={{ fill: '#94A3B8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              label={{ value: 'pChEMBL', position: 'insideBottom', offset: -2, fill: '#64748B', fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              formatter={(value: number | undefined) => [`${value ?? 0} activities`, 'Count']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
