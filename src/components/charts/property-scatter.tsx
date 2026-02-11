'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { getPhaseColor } from '@/lib/constants';
import type { CompoundDetail } from '@/lib/types/target-profile';

interface PropertyScatterProps {
  compounds: CompoundDetail[];
  className?: string;
}

export function PropertyScatter({ compounds, className }: PropertyScatterProps) {
  const plotData = compounds
    .filter((c) => c.molecularWeight !== null && c.alogp !== null)
    .map((c) => ({
      mw: c.molecularWeight!,
      logp: c.alogp!,
      name: c.preferredName ?? c.chemblId,
      phase: c.maxPhase,
    }));

  if (plotData.length === 0) return null;

  return (
    <div className={cn('rounded-xl bg-[var(--surface-1)] border border-white/5 p-5', className)}>
      <h3 className="text-sm font-semibold text-white mb-1">Chemical Space</h3>
      <p className="text-[10px] text-slate-500 mb-4">MW vs LogP — green zone = drug-like</p>

      <div>
        <ResponsiveContainer width="100%" height={192}>
          <ScatterChart margin={{ top: 5, right: 5, bottom: 20, left: 5 }}>
            <XAxis
              dataKey="mw"
              type="number"
              name="MW"
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              label={{ value: 'MW (Da)', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 10 }}
              domain={[0, 'auto']}
            />
            <YAxis
              dataKey="logp"
              type="number"
              name="LogP"
              tick={{ fill: '#64748B', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={35}
              label={{ value: 'LogP', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }}
              domain={['auto', 'auto']}
            />
            {/* Drug-like zone */}
            <ReferenceArea
              x1={150}
              x2={500}
              y1={-0.5}
              y2={5}
              fill="#10B981"
              fillOpacity={0.06}
              stroke="#10B981"
              strokeOpacity={0.15}
              strokeDasharray="4 4"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              formatter={(value: number | undefined, name: string | undefined) => [(value ?? 0).toFixed(1), name ?? '']}
              labelFormatter={(_, payload) => {
                const item = payload?.[0]?.payload as { name: string; phase: number } | undefined;
                return item ? `${item.name} (Phase ${item.phase})` : '';
              }}
            />
            <Scatter data={plotData} animationDuration={800}>
              {plotData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={getPhaseColor(entry.phase)}
                  fillOpacity={0.9}
                  r={6}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-2 justify-center">
        {[4, 3, 2, 1, 0].map((phase) => (
          <span key={phase} className="flex items-center gap-1 text-[10px] text-slate-500">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: getPhaseColor(phase) }}
            />
            {phase === 0 ? 'Preclinical' : phase === 4 ? 'Approved' : `Phase ${phase}`}
          </span>
        ))}
      </div>
    </div>
  );
}
