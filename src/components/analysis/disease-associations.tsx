'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TargetProfile } from '@/lib/types/target-profile';

type SortField = 'score' | 'name' | 'diversity';
type SortDir = 'asc' | 'desc';

interface DiseaseAssociationsProps {
  profile: TargetProfile;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 0.7) return '#10B981';
  if (score >= 0.4) return '#3B82F6';
  if (score >= 0.2) return '#F59E0B';
  return '#6B7280';
}

const DEFAULT_VISIBLE = 5;

export function DiseaseAssociations({ profile, className }: DiseaseAssociationsProps) {
  const [showAll, setShowAll] = useState(false);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const diseases = profile.rawData.openTargets.data?.topDiseaseAssociations ?? [];
  const totalCount = profile.rawData.openTargets.data?.diseaseAssociationCount ?? 0;

  const sorted = useMemo(() => {
    const copy = [...diseases];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'score') cmp = a.score - b.score;
      else if (sortField === 'name') cmp = a.diseaseName.localeCompare(b.diseaseName);
      else cmp = a.datasourceDiversity - b.datasourceDiversity;
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return copy;
  }, [diseases, sortField, sortDir]);

  const visible = showAll ? sorted : sorted.slice(0, DEFAULT_VISIBLE);

  if (diseases.length === 0) return null;

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    const isActive = sortField === field;
    return (
      <svg
        className={cn('w-3 h-3 ml-1 inline-block transition-transform', isActive ? 'text-blue-400' : 'text-slate-600', isActive && sortDir === 'asc' && 'rotate-180')}
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div
      className={cn('rounded-xl border border-white/5 overflow-hidden', className)}
      style={{ backgroundColor: 'var(--surface-1)' }}
    >
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Disease icon */}
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Disease Associations & Repurposing Opportunities</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {diseases.length} of {totalCount.toLocaleString()} total associations
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20 font-mono">
          {totalCount.toLocaleString()}
        </span>
      </div>

      {/* Table */}
      <div className="px-4 sm:px-5 pb-4">
        <div className="rounded-lg border border-white/5 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_80px] sm:grid-cols-[1fr_140px_100px] bg-white/[0.03] px-3 py-2">
            <button
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left hover:text-slate-300 transition-colors"
              onClick={() => handleSort('name')}
            >
              Disease<SortIcon field="name" />
            </button>
            <button
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-left hover:text-slate-300 transition-colors"
              onClick={() => handleSort('score')}
            >
              Score<SortIcon field="score" />
            </button>
            <button
              className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right hover:text-slate-300 transition-colors"
              onClick={() => handleSort('diversity')}
            >
              Sources<SortIcon field="diversity" />
            </button>
          </div>

          {/* Rows */}
          {visible.map((disease, i) => (
            <a
              key={disease.diseaseId}
              href={`https://platform.opentargets.org/disease/${disease.diseaseId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'grid grid-cols-[1fr_120px_80px] sm:grid-cols-[1fr_140px_100px] px-3 py-2.5 items-center group hover:bg-white/[0.04] transition-colors',
                i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]',
              )}
            >
              {/* Disease name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-slate-300 truncate group-hover:text-white transition-colors">
                  {disease.diseaseName}
                </span>
                <svg
                  className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path d="M3.5 8.5l5-5m0 0H4m4.5 0V8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Score with bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${disease.score * 100}%`,
                      backgroundColor: scoreColor(disease.score),
                    }}
                  />
                </div>
                <span
                  className="text-[11px] font-mono w-8 text-right shrink-0"
                  style={{ color: scoreColor(disease.score) }}
                >
                  {disease.score.toFixed(2)}
                </span>
              </div>

              {/* Evidence sources count */}
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400">{disease.datasourceDiversity}</span>
                <span className="text-[10px] text-slate-600 ml-1 hidden sm:inline">sources</span>
              </div>
            </a>
          ))}
        </div>

        {/* Show more / less */}
        {sorted.length > DEFAULT_VISIBLE && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-3 w-full py-2 text-xs text-blue-400 hover:text-blue-300 border border-white/5 rounded-lg hover:bg-white/[0.03] transition-colors flex items-center justify-center gap-1.5"
          >
            {showAll ? (
              <>
                Show less
                <svg className="w-3 h-3 rotate-180" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            ) : (
              <>
                Show all {sorted.length} diseases
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        )}

        {/* Note about total */}
        {totalCount > diseases.length && (
          <p className="text-[10px] text-slate-600 mt-2 leading-relaxed">
            Showing top {diseases.length} associations by score. The full {totalCount.toLocaleString()} associations
            are available on the{' '}
            <a
              href={`https://platform.opentargets.org/target/${profile.ensemblId}/associations`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400/60 hover:text-blue-400 transition-colors"
            >
              Open Targets Platform
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
