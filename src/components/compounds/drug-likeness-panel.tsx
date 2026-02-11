'use client';

import { useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import { assessDrugLikeness, normalizeForRadar } from '@/lib/utils/drug-likeness';
import type { CompoundDetail } from '@/lib/types/target-profile';

interface DrugLikenessPanelProps {
  compounds: CompoundDetail[];
  className?: string;
}

function LipinskiRule({ label, value, limit, pass }: {
  label: string;
  value: string;
  limit: string;
  pass: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        'w-2 h-2 rounded-full shrink-0',
        pass ? 'bg-emerald-500' : 'bg-red-500'
      )} />
      <span className="text-[11px] text-slate-400 flex-1">{label}</span>
      <span className="text-[11px] font-mono text-slate-300">{value}</span>
      <span className="text-[10px] text-slate-600">{limit}</span>
    </div>
  );
}

export function DrugLikenessPanel({ compounds, className }: DrugLikenessPanelProps) {
  // Filter to small molecules only — RO5 doesn't apply to antibodies/biologics
  const smallMolecules = compounds.filter(
    (c) => c.moleculeType === 'Small molecule' && c.molecularWeight !== null
  );
  // Sort: fewest RO5 violations first, then by phase desc
  const sorted = [...smallMolecules].sort((a, b) => {
    const va = assessDrugLikeness(a).lipinskiViolations;
    const vb = assessDrugLikeness(b).lipinskiViolations;
    return va - vb || (b.maxPhase - a.maxPhase);
  });

  const [selectedIdx, setSelectedIdx] = useState(0);
  if (sorted.length === 0) return null;

  const compound = sorted[selectedIdx];
  const assessment = assessDrugLikeness(compound);
  const radarData = normalizeForRadar(compound);

  return (
    <div className={cn('rounded-xl bg-[var(--surface-1)] border border-white/5 p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Drug-Likeness Assessment</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {sorted.filter((c) => assessDrugLikeness(c).lipinskiPass).length}/{sorted.length} small molecules pass RO5
          </p>
        </div>
        <span
          className={cn(
            'px-2 py-0.5 text-[10px] font-bold rounded',
            assessment.lipinskiPass
              ? 'bg-emerald-500/20 text-emerald-400'
              : assessment.lipinskiViolations === 1
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-red-500/20 text-red-400'
          )}
        >
          {assessment.lipinskiPass
            ? 'RO5 PASS'
            : `RO5: ${assessment.lipinskiViolations} violations`}
        </span>
      </div>

      {/* Compound tabs */}
      {sorted.length > 1 && (
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {sorted.map((c, i) => (
            <button
              key={c.chemblId}
              onClick={() => setSelectedIdx(i)}
              className={cn(
                'px-2 py-0.5 text-[10px] rounded whitespace-nowrap transition-colors',
                i === selectedIdx
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {c.preferredName ?? c.chemblId}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mini radar chart */}
        <div>
          <ResponsiveContainer width="100%" height={208}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
              <PolarGrid stroke="rgba(255,255,255,0.08)" gridType="polygon" />
              <PolarAngleAxis
                dataKey="property"
                tick={{ fill: '#94A3B8', fontSize: 11 }}
              />
              <PolarRadiusAxis
                domain={[0, 150]}
                tick={false}
                axisLine={false}
              />
              {/* Ideal zone */}
              <Radar
                name="Drug-Like Zone"
                dataKey="ideal"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.08}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {/* Compound values */}
              <Radar
                name={compound.chemblId}
                dataKey="value"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.2}
                strokeWidth={2}
                animationDuration={800}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Lipinski + Veber rules */}
        <div className="space-y-3">
          <div>
            <h4 className="text-[11px] font-medium text-slate-300 mb-2">
              Lipinski Rule of 5 ({4 - assessment.lipinskiViolations}/4 pass)
            </h4>
            <div className="space-y-1.5">
              <LipinskiRule
                label="Molecular Weight"
                value={compound.molecularWeight?.toFixed(0) ?? 'N/A'}
                limit="≤ 500"
                pass={compound.molecularWeight === null || compound.molecularWeight <= 500}
              />
              <LipinskiRule
                label="LogP"
                value={compound.alogp?.toFixed(1) ?? 'N/A'}
                limit="≤ 5"
                pass={compound.alogp === null || compound.alogp <= 5}
              />
              <LipinskiRule
                label="H-Bond Acceptors"
                value={compound.hba?.toString() ?? 'N/A'}
                limit="≤ 10"
                pass={compound.hba === null || compound.hba <= 10}
              />
              <LipinskiRule
                label="H-Bond Donors"
                value={compound.hbd?.toString() ?? 'N/A'}
                limit="≤ 5"
                pass={compound.hbd === null || compound.hbd <= 5}
              />
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-medium text-slate-300 mb-2">Veber Rules</h4>
            <div className="space-y-1.5">
              <LipinskiRule
                label="Polar Surface Area"
                value={compound.psa?.toFixed(1) ?? 'N/A'}
                limit="< 140"
                pass={compound.psa === null || compound.psa < 140}
              />
              <LipinskiRule
                label="Rotatable Bonds"
                value={compound.rotatableBonds?.toString() ?? 'N/A'}
                limit="≤ 10"
                pass={compound.rotatableBonds === null || compound.rotatableBonds <= 10}
              />
            </div>
          </div>

          {assessment.flags.length > 0 && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-amber-400">
                Flags: {assessment.flags.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
