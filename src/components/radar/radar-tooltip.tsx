'use client';

import { getScoreColor, getScoreLabel } from '@/lib/constants';

interface RadarTooltipProps {
  dimensionName: string;
  score: number;
}

export function RadarTooltip({ dimensionName, score }: RadarTooltipProps) {
  return (
    <div className="bg-[var(--surface-1)] border border-white/10 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-sm font-medium text-white">{dimensionName}</p>
      <div className="flex items-center gap-2 mt-1">
        <span
          className="text-2xl font-bold font-mono"
          style={{ color: getScoreColor(score) }}
        >
          {score}
        </span>
        <span className="text-sm text-slate-400">/100</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: getScoreColor(score) + '20',
            color: getScoreColor(score),
          }}
        >
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
