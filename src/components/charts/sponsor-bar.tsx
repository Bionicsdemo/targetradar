'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SponsorBarProps {
  sponsorTrialCounts: Array<{ sponsor: string; count: number }>;
}

export function SponsorBar({ sponsorTrialCounts }: SponsorBarProps) {
  const data = sponsorTrialCounts.slice(0, 5).map((s) => ({
    sponsor: s.sponsor.length > 20 ? s.sponsor.slice(0, 18) + '...' : s.sponsor,
    fullName: s.sponsor,
    count: s.count,
  }));

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
            dataKey="sponsor"
            tick={{ fill: '#94A3B8', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value: number | undefined) => [`${value ?? 0} trials`, 'Count']}
            labelFormatter={(_, payload) => {
              const item = payload?.[0]?.payload as { fullName: string } | undefined;
              return item?.fullName ?? '';
            }}
          />
          <Bar dataKey="count" fill="#6366F1" fillOpacity={0.7} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
