'use client';

import { cn } from '@/lib/utils';

interface ConservationGaugeProps {
  constrainedElementCount: number;
  regulatoryFeatureCount: number;
  expressionBreadth: number;
  regulatoryComplexity: 'high' | 'moderate' | 'low';
  geneLength: number;
  transcriptCount: number;
  className?: string;
}

function GaugeBar({
  label,
  value,
  max,
  color,
  unit,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  unit?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-mono">
          {value.toLocaleString()}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function ConservationGauge({
  constrainedElementCount,
  regulatoryFeatureCount,
  expressionBreadth,
  regulatoryComplexity,
  geneLength,
  transcriptCount,
  className,
}: ConservationGaugeProps) {
  const complexityColor =
    regulatoryComplexity === 'high'
      ? 'text-violet-400 bg-violet-500/10 border-violet-500/20'
      : regulatoryComplexity === 'moderate'
        ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
        : 'text-slate-400 bg-slate-500/10 border-slate-500/20';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Complexity badge */}
      <div className="flex items-center gap-3">
        <span className={cn('px-2.5 py-1 text-xs font-semibold rounded-lg border', complexityColor)}>
          {regulatoryComplexity.toUpperCase()} COMPLEXITY
        </span>
        <span className="text-[10px] text-slate-600">
          {(geneLength / 1000).toFixed(0)}kb gene &middot; chr{' '}
        </span>
      </div>

      {/* Gauge bars */}
      <div className="space-y-3">
        <GaugeBar
          label="Constrained Elements"
          value={constrainedElementCount}
          max={200}
          color="#10B981"
          unit="conserved"
        />
        <GaugeBar
          label="Regulatory Features"
          value={regulatoryFeatureCount}
          max={100}
          color="#8B5CF6"
          unit="in ±50kb"
        />
        <GaugeBar
          label="Expression Breadth"
          value={expressionBreadth}
          max={100}
          color="#3B82F6"
          unit="%"
        />
        <GaugeBar
          label="Transcript Isoforms"
          value={transcriptCount}
          max={30}
          color="#F59E0B"
        />
      </div>
    </div>
  );
}
