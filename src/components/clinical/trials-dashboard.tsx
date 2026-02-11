'use client';

import { cn } from '@/lib/utils';
import { PhaseFunnel } from '@/components/charts/phase-funnel';
import { TrialStatusPie } from '@/components/charts/trial-status-pie';
import { SponsorBar } from '@/components/charts/sponsor-bar';
import { TrialTimeline } from '@/components/charts/trial-timeline';
import { getPhaseColor } from '@/lib/constants';
import type { ClinicalTrialsData } from '@/lib/types/target-profile';

interface TrialsDashboardProps {
  data: ClinicalTrialsData;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  RECRUITING: '#10B981',
  ACTIVE_NOT_RECRUITING: '#3B82F6',
  COMPLETED: '#64748B',
  TERMINATED: '#EF4444',
  NOT_YET_RECRUITING: '#8B5CF6',
};

function statusLabel(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export function TrialsDashboard({ data, className }: TrialsDashboardProps) {
  if (data.totalTrials === 0) return null;

  const topTrials = data.studies.slice(0, 5);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-white">Clinical Trials Dashboard</h2>
        <span className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
          {data.totalTrials.toLocaleString()} trials
        </span>
        <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
          {data.activeTrials} recruiting
        </span>
      </div>

      {/* 2x2 chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-4">
          <h3 className="text-xs font-medium text-slate-300 mb-2">Phase Progression</h3>
          <PhaseFunnel trialsByPhase={data.trialsByPhase} />
        </div>
        <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-4">
          <h3 className="text-xs font-medium text-slate-300 mb-2">Trial Status Distribution</h3>
          <TrialStatusPie trialsByStatus={data.trialsByStatus} />
        </div>
        <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-4">
          <h3 className="text-xs font-medium text-slate-300 mb-2">Top Sponsors</h3>
          <SponsorBar sponsorTrialCounts={data.sponsorTrialCounts} />
        </div>
        <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-4">
          <h3 className="text-xs font-medium text-slate-300 mb-2">Trial Activity Over Time</h3>
          <TrialTimeline studies={data.studies} />
        </div>
      </div>

      {/* Top trial cards */}
      {topTrials.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-slate-300">Recent Trials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topTrials.map((trial) => (
              <div
                key={trial.nctId}
                className="rounded-lg bg-[var(--surface-1)] border border-white/5 p-3 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-xs font-mono text-blue-400">{trial.nctId}</span>
                  <span
                    className="px-1.5 py-0.5 text-xs rounded"
                    style={{
                      backgroundColor: (getPhaseColor(
                        trial.phase.includes('4') ? 4 :
                        trial.phase.includes('3') ? 3 :
                        trial.phase.includes('2') ? 2 :
                        trial.phase.includes('1') ? 1 : 0
                      )) + '20',
                      color: getPhaseColor(
                        trial.phase.includes('4') ? 4 :
                        trial.phase.includes('3') ? 3 :
                        trial.phase.includes('2') ? 2 :
                        trial.phase.includes('1') ? 1 : 0
                      ),
                    }}
                  >
                    {trial.phase}
                  </span>
                  <span
                    className="px-1.5 py-0.5 text-xs rounded"
                    style={{
                      backgroundColor: (STATUS_COLORS[trial.status] || '#475569') + '20',
                      color: STATUS_COLORS[trial.status] || '#94A3B8',
                    }}
                  >
                    {statusLabel(trial.status)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">{trial.title}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{trial.sponsor}</span>
                  {trial.enrollment && <span>{trial.enrollment.toLocaleString()} enrolled</span>}
                  {trial.startDate && <span>{trial.startDate}</span>}
                </div>
                {trial.conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {trial.conditions.slice(0, 3).map((cond, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-xs bg-white/5 text-slate-400 rounded">
                        {cond}
                      </span>
                    ))}
                  </div>
                )}
                {trial.interventions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {trial.interventions.slice(0, 2).map((intv, i) => (
                      <span key={i} className="px-1.5 py-0.5 text-xs bg-violet-500/10 text-violet-400 rounded">
                        {intv}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
