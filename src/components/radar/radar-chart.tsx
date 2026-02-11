'use client';

import { useState, useEffect } from 'react';
import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { DimensionName, DimensionScore } from '@/lib/types/scoring';
import { DIMENSION_LABELS } from '@/lib/types/scoring';
import { getScoreColor, getDimensionColor } from '@/lib/constants';

interface RadarChartProps {
  dimensions: Record<DimensionName, DimensionScore>;
  comparisonDimensions?: Record<DimensionName, DimensionScore>;
  comparisonLabel?: string;
  animate?: boolean;
}

const DIMENSION_ORDER: DimensionName[] = [
  'geneticEvidence',
  'chemicalTractability',
  'structuralReadiness',
  'clinicalHistory',
  'regulatoryGenomics',
  'literatureDepth',
  'innovationSignal',
];

interface ChartDataPoint {
  dimension: string;
  fullName: string;
  dimensionKey: DimensionName;
  score: number;
  comparisonScore?: number;
}

// Custom tick renderer for per-dimension colored axis labels
function renderAxisTick(
  props: Record<string, unknown>,
  data: ChartDataPoint[],
) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const payload = props.payload as { value: string; index: number } | undefined;
  if (!payload) return <text />;
  const point = data[payload.index];
  const color = point ? getDimensionColor(point.dimensionKey) : '#94A3B8';
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill={color}
      fontSize={10}
      fontWeight={500}
      style={{ fontFamily: 'var(--font-geist-sans)' }}
    >
      {payload.value}
    </text>
  );
}

export function RadarChartComponent({
  dimensions,
  comparisonDimensions,
  comparisonLabel,
  animate = true,
}: RadarChartProps) {
  const [isVisible, setIsVisible] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const data: ChartDataPoint[] = DIMENSION_ORDER.map((dim) => ({
    dimension: DIMENSION_LABELS[dim].split(' ')[0],
    fullName: DIMENSION_LABELS[dim],
    dimensionKey: dim,
    score: dimensions[dim].score,
    ...(comparisonDimensions ? { comparisonScore: comparisonDimensions[dim].score } : {}),
  }));

  return (
    <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
      <div className="h-[300px] sm:h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid
            stroke="rgba(255,255,255,0.06)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="dimension"
            tick={(props: Record<string, unknown>) =>
              renderAxisTick(props, data)
            }
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#475569', fontSize: 9 }}
            tickCount={5}
            axisLine={false}
          />
          {/* Reference rings at 25/50/75 */}
          <PolarGrid
            stroke="rgba(255,255,255,0.03)"
            gridType="polygon"
            radialLines={false}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.15}
            strokeWidth={2}
            isAnimationActive={animate}
            animationDuration={1200}
            animationEasing="ease-out"
          />
          {comparisonDimensions && (
            <Radar
              name={comparisonLabel ?? 'Comparison'}
              dataKey="comparisonScore"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 5"
              isAnimationActive={animate}
              animationDuration={1400}
              animationEasing="ease-out"
            />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as ChartDataPoint;
              const dimColor = getDimensionColor(point.dimensionKey);
              return (
                <div className="border border-white/10 rounded-lg px-4 py-3 shadow-xl" style={{ backgroundColor: 'var(--surface-2)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dimColor }} />
                    <p className="text-sm font-medium text-white">{point.fullName}</p>
                  </div>
                  <p className="text-lg font-bold font-mono font-tabular" style={{ color: getScoreColor(point.score) }}>
                    {point.score}<span className="text-xs text-slate-500 font-normal">/100</span>
                  </p>
                  {point.comparisonScore !== undefined && (
                    <p className="text-sm text-indigo-400 mt-1 font-mono font-tabular">
                      vs {point.comparisonScore}/100
                    </p>
                  )}
                </div>
              );
            }}
          />
        </RechartsRadar>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
