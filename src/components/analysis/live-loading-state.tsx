'use client';

import type { AnalysisProgress } from '@/lib/types/target-profile';
import { formatMs, formatNumber } from '@/lib/utils/format';

interface LiveLoadingStateProps {
  progress: AnalysisProgress[];
}

const SOURCE_ICONS: Record<string, string> = {
  'Open Targets': '🧬',
  'ChEMBL': '⚗️',
  'PubMed': '📚',
  'ClinicalTrials.gov': '🏥',
  'bioRxiv': '📄',
  'AlphaFold/PDB': '🔬',
  'AlphaGenome': '🧪',
};

export function LiveLoadingState({ progress }: LiveLoadingStateProps) {
  const completed = progress.filter((p) => p.status === 'complete').length;
  const total = progress.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 text-center">
        {completed}/{total} sources complete
      </p>

      {/* Source list */}
      <div className="space-y-2">
        {progress.map((p, i) => (
          <div
            key={p.source}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
              p.status === 'complete'
                ? 'bg-emerald-500/5 border border-emerald-500/10'
                : p.status === 'error'
                ? 'bg-red-500/5 border border-red-500/10'
                : 'bg-white/[0.02] border border-white/5'
            } ${p.status === 'loading' ? 'animate-pulse-glow' : ''}`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Status icon */}
            <div className="flex-shrink-0 w-8 text-center">
              {p.status === 'complete' && (
                <span className="text-emerald-400 text-sm font-bold">✓</span>
              )}
              {p.status === 'loading' && (
                <div className="w-4 h-4 mx-auto border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              )}
              {p.status === 'error' && (
                <span className="text-red-400 text-sm font-bold">✗</span>
              )}
              {p.status === 'pending' && (
                <span className="text-slate-600 text-sm">○</span>
              )}
            </div>

            {/* Source name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{SOURCE_ICONS[p.source] ?? '📊'}</span>
                <span className={`text-sm font-medium ${
                  p.status === 'complete' ? 'text-white' : 'text-slate-400'
                }`}>
                  {p.source}
                </span>
              </div>
            </div>

            {/* Response time */}
            <div className="text-right flex-shrink-0">
              {p.responseTimeMs && (
                <span className="text-xs text-slate-500 font-mono">
                  {formatMs(p.responseTimeMs)}
                </span>
              )}
            </div>

            {/* Data count */}
            <div className="text-right flex-shrink-0 min-w-[140px]">
              {p.status === 'complete' && p.dataCount !== undefined && (
                <span className="text-xs text-slate-400">
                  {formatNumber(p.dataCount)} {p.dataLabel}
                </span>
              )}
              {p.status === 'loading' && (
                <span className="text-xs text-slate-600">loading...</span>
              )}
              {p.status === 'error' && (
                <span className="text-xs text-red-400">unavailable</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
