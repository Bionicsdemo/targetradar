'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface GenomicLandscapeRadarProps {
  enhancerCount: number;
  promoterCount: number;
  ctcfCount: number;
  openChromatinCount: number;
  constrainedElementCount: number;
  transcriptCount: number;
  expressionBreadth: number;
}

export function GenomicLandscapeRadar({
  enhancerCount,
  promoterCount,
  ctcfCount,
  openChromatinCount,
  constrainedElementCount,
  transcriptCount,
  expressionBreadth,
}: GenomicLandscapeRadarProps) {
  // Normalize each axis to 0-100 scale based on typical ranges
  const data = [
    {
      axis: 'Enhancers',
      value: Math.min(100, (enhancerCount / 80) * 100),
      raw: enhancerCount,
    },
    {
      axis: 'Promoters',
      value: Math.min(100, (promoterCount / 10) * 100),
      raw: promoterCount,
    },
    {
      axis: 'CTCF',
      value: Math.min(100, (ctcfCount / 25) * 100),
      raw: ctcfCount,
    },
    {
      axis: 'Conservation',
      value: Math.min(100, (constrainedElementCount / 200) * 100),
      raw: constrainedElementCount,
    },
    {
      axis: 'Transcripts',
      value: Math.min(100, (transcriptCount / 20) * 100),
      raw: transcriptCount,
    },
    {
      axis: 'Expression',
      value: expressionBreadth,
      raw: expressionBreadth,
    },
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={224}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: '#94A3B8', fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Regulatory Landscape"
            dataKey="value"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.2}
            strokeWidth={2}
            animationDuration={1000}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0F172A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(0)}%`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
