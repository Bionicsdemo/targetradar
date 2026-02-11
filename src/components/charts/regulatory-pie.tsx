'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface RegulatoryPieProps {
  enhancerCount: number;
  promoterCount: number;
  ctcfCount: number;
  openChromatinCount: number;
}

export function RegulatoryPie({
  enhancerCount,
  promoterCount,
  ctcfCount,
  openChromatinCount,
}: RegulatoryPieProps) {
  const data = [
    { name: 'Enhancers', value: enhancerCount, color: '#8B5CF6' },
    { name: 'Promoters', value: promoterCount, color: '#3B82F6' },
    { name: 'CTCF Sites', value: ctcfCount, color: '#10B981' },
    { name: 'Open Chromatin', value: openChromatinCount, color: '#F59E0B' },
  ].filter((d) => d.value > 0);

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
            paddingAngle={3}
            dataKey="value"
            animationDuration={800}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0} features`, 'Count']}
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
