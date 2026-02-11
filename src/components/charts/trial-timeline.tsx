'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrialTimelineProps {
  studies: Array<{ startDate: string }>;
}

export function TrialTimeline({ studies }: TrialTimelineProps) {
  // Group by year
  const yearCounts = new Map<number, number>();
  for (const s of studies) {
    if (!s.startDate) continue;
    const year = parseInt(s.startDate.slice(0, 4), 10);
    if (isNaN(year) || year < 1990) continue;
    yearCounts.set(year, (yearCounts.get(year) || 0) + 1);
  }

  if (yearCounts.size === 0) return null;

  const minYear = Math.min(...yearCounts.keys());
  const maxYear = Math.max(...yearCounts.keys());

  const data: Array<{ year: string; trials: number }> = [];
  for (let y = minYear; y <= maxYear; y++) {
    data.push({ year: y.toString(), trials: yearCounts.get(y) || 0 });
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={192}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trialGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            tick={{ fill: '#64748B', fontSize: 10 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            interval="preserveStartEnd"
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
            formatter={(value: number | undefined) => [`${value ?? 0} trials started`, 'Count']}
          />
          <Area
            type="monotone"
            dataKey="trials"
            stroke="#8B5CF6"
            strokeWidth={2}
            fill="url(#trialGrad)"
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
