'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getScoreColor, getScoreLabel } from '@/lib/constants';
import { DIMENSION_WEIGHTS, DIMENSION_LABELS } from '@/lib/types/scoring';
import type { TargetProfile } from '@/lib/types/target-profile';
import type { DimensionName } from '@/lib/types/scoring';

const WEIGHT_EXPLANATIONS: Record<DimensionName, string> = {
  chemicalTractability: 'Can we make a drug against it? Existing compounds, mechanisms, and bioactivity density.',
  geneticEvidence: 'Is modulating this target linked to disease? Disease associations and evidence diversity.',
  clinicalHistory: 'Has this target been tested in humans? Trial count, phase progression, and activity.',
  structuralReadiness: 'Can we design drugs using 3D structure? PDB structures, resolution, AlphaFold confidence.',
  regulatoryGenomics: 'How is this gene regulated? Enhancers, promoters, CTCF sites, constrained elements.',
  literatureDepth: 'How well-studied is this target? Publication count, recency, drug-focused papers.',
  innovationSignal: 'Is interest growing? Recent preprint velocity and research group diversity.',
};

const SCORE_RANGES = [
  { min: 80, label: 'Excellent', desc: 'Top-tier target — strong evidence across most dimensions, ready for drug development investment.', color: '#10B981' },
  { min: 60, label: 'Good', desc: 'Promising target — solid foundation with some dimensions needing further validation.', color: '#3B82F6' },
  { min: 40, label: 'Moderate', desc: 'Emerging target — limited data in several dimensions, requires significant de-risking.', color: '#F59E0B' },
  { min: 20, label: 'Low', desc: 'Challenging target — sparse evidence, high risk, may need novel approaches.', color: '#EF4444' },
  { min: 0, label: 'Very Low', desc: 'Insufficient data — target is either very novel or poorly characterized.', color: '#6B7280' },
];

interface ScoreMethodologyProps {
  profile: TargetProfile;
}

export function ScoreMethodology({ profile }: ScoreMethodologyProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const overall = profile.scores.overall;
  const dims = profile.scores.dimensions;

  // Sort dimensions by weight (highest first)
  const sortedDims = (Object.entries(DIMENSION_WEIGHTS) as [DimensionName, number][])
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="rounded-xl border border-white/5 overflow-hidden" style={{ backgroundColor: 'var(--surface-1)' }}>
      {/* Clickable header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 sm:px-5 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4m0-4h.01" strokeLinecap="round" />
          </svg>
          <span className="text-sm text-slate-300">
            How is the <span className="text-white font-semibold">Overall Score of {overall}</span> calculated?
          </span>
          <span
            className="px-2 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: getScoreColor(overall) + '20', color: getScoreColor(overall) }}
          >
            {getScoreLabel(overall)}
          </span>
        </div>
        <svg
          className={cn('w-4 h-4 text-slate-500 transition-transform duration-200', isExpanded && 'rotate-180')}
          viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-4 sm:px-5 pb-5 space-y-5 animate-fade-in-up">
          {/* Formula */}
          <div className="rounded-lg bg-[#0F172A] border border-white/5 p-4">
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Weighted Average Formula</h4>
            <div className="font-mono text-sm text-slate-300 leading-relaxed">
              <span className="text-white font-bold">Overall Score</span> = {sortedDims.map(([dim, weight], i) => (
                <span key={dim}>
                  {i > 0 && <span className="text-slate-600"> + </span>}
                  <span className="text-slate-500">{DIMENSION_LABELS[dim]}</span>
                  <span className="text-slate-600"> x </span>
                  <span className="text-blue-400">{(weight * 100).toFixed(0)}%</span>
                </span>
              ))}
            </div>
            <div className="mt-3 font-mono text-sm text-slate-500">
              = {sortedDims.map(([dim, weight], i) => (
                <span key={dim}>
                  {i > 0 && ' + '}
                  <span style={{ color: getScoreColor(dims[dim].score) }}>{dims[dim].score}</span>
                  <span className="text-slate-600"> x {(weight * 100).toFixed(0)}%</span>
                </span>
              ))}
              {' '}= <span className="text-white font-bold">{overall}</span>
            </div>
          </div>

          {/* Dimension breakdown with weight bars */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Dimension Weights & Scores</h4>
            <div className="space-y-2">
              {sortedDims.map(([dim, weight]) => {
                const score = dims[dim].score;
                const contribution = Math.round(score * weight);
                const color = getScoreColor(score);
                return (
                  <div key={dim} className="group">
                    <div className="flex items-center gap-3">
                      {/* Weight percentage */}
                      <span className="text-[11px] font-mono text-blue-400 w-8 text-right shrink-0">
                        {(weight * 100).toFixed(0)}%
                      </span>
                      {/* Label */}
                      <span className="text-xs text-slate-300 w-32 sm:w-40 shrink-0 truncate">
                        {DIMENSION_LABELS[dim]}
                      </span>
                      {/* Score bar */}
                      <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${score}%`, backgroundColor: color + 'CC' }}
                        />
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-mono text-white/80">
                          {score}/100
                        </span>
                      </div>
                      {/* Contribution */}
                      <span className="text-[10px] font-mono text-slate-500 w-8 text-right shrink-0">
                        +{contribution}
                      </span>
                    </div>
                    {/* Explanation on hover/focus */}
                    <p className="text-[10px] text-slate-600 ml-11 sm:ml-[4.5rem] mt-0.5 hidden group-hover:block">
                      {WEIGHT_EXPLANATIONS[dim]}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* Total */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
              <span className="text-[11px] font-mono text-slate-400 w-8 text-right shrink-0">100%</span>
              <span className="text-xs text-white font-semibold w-32 sm:w-40 shrink-0">Total</span>
              <div className="flex-1" />
              <span className="text-sm font-bold font-mono" style={{ color: getScoreColor(overall) }}>
                = {overall}/100
              </span>
            </div>
          </div>

          {/* Score ranges legend */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Score Interpretation</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SCORE_RANGES.map((range) => (
                <div
                  key={range.label}
                  className={cn(
                    'flex items-start gap-2 p-2 rounded-lg border',
                    overall >= range.min && (range.min === 0 || overall < (SCORE_RANGES[SCORE_RANGES.indexOf(range) - 1]?.min ?? 101))
                      ? 'border-white/10 bg-white/[0.03]'
                      : 'border-transparent opacity-50',
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: range.color }}
                  />
                  <div>
                    <span className="text-[11px] font-semibold" style={{ color: range.color }}>
                      {range.min}+ &mdash; {range.label}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{range.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data transparency note */}
          <p className="text-[10px] text-slate-600 leading-relaxed">
            All scores are computed from live data queried from 7 public databases at the time of analysis.
            Scoring functions are deterministic and transparent &mdash; each dimension score is the sum of
            4-5 named components with documented caps and thresholds. No black-box algorithms.
            Full methodology is documented in the project&apos;s CLAUDE.md (Section 6).
          </p>
        </div>
      )}
    </div>
  );
}
