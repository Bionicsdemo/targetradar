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

interface RegulatoryFeatureBarProps {
  enhancerCount: number;
  promoterCount: number;
  ctcfCount: number;
  openChromatinCount: number;
}

const FEATURE_CONFIG = [
  { key: 'enhancers', label: 'Enhancers', color: '#8B5CF6' },
  { key: 'promoters', label: 'Promoters', color: '#3B82F6' },
  { key: 'ctcf', label: 'CTCF Sites', color: '#10B981' },
  { key: 'openChromatin', label: 'Open Chromatin', color: '#F59E0B' },
] as const;

export function RegulatoryFeatureBar({
  enhancerCount,
  promoterCount,
  ctcfCount,
  openChromatinCount,
}: RegulatoryFeatureBarProps) {
  const data = [
    { name: 'Enhancers', count: enhancerCount, color: '#8B5CF6' },
    { name: 'Promoters', count: promoterCount, color: '#3B82F6' },
    { name: 'CTCF Sites', count: ctcfCount, color: '#10B981' },
    { name: 'Open Chromatin', count: openChromatinCount, color: '#F59E0B' },
  ].filter((d) => d.count > 0);

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
            dataKey="name"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0} features`, 'Count']}
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
