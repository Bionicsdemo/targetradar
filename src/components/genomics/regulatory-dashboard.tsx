'use client';

import { cn } from '@/lib/utils';
import type { AlphaGenomeData } from '@/lib/types/target-profile';
import { RegulatoryFeatureBar } from '@/components/charts/regulatory-feature-bar';
import { RegulatoryPie } from '@/components/charts/regulatory-pie';
import { GenomicLandscapeRadar } from '@/components/charts/genomic-landscape-radar';
import { ConservationGauge } from '@/components/charts/conservation-gauge';

interface RegulatoryDashboardProps {
  data: AlphaGenomeData;
  geneName: string;
  chromosome?: string;
  className?: string;
}

export function RegulatoryDashboard({
  data,
  geneName,
  className,
}: RegulatoryDashboardProps) {
  const totalFeatures = data.regulatoryFeatureCount;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h2 className="text-base sm:text-lg font-semibold text-white">Regulatory Genomics</h2>
        <span className="px-2 py-0.5 text-xs bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20">
          AlphaGenome
        </span>
        <span className="px-2 py-0.5 text-xs bg-slate-500/10 text-slate-400 rounded-full border border-slate-500/20">
          {totalFeatures} features in ±50kb
        </span>
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Enhancers" value={data.enhancerCount} color="#8B5CF6" />
        <StatCard label="Promoters" value={data.promoterCount} color="#3B82F6" />
        <StatCard label="CTCF Sites" value={data.ctcfCount} color="#10B981" />
        <StatCard label="Constrained" value={data.constrainedElementCount} color="#10B981" />
        <StatCard label="Transcripts" value={data.transcriptCount} color="#F59E0B" />
        <StatCard label="Expression" value={data.expressionBreadth} color="#3B82F6" suffix="%" />
      </div>

      {/* Charts grid — 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genomic landscape radar */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Regulatory Landscape</h3>
          <p className="text-[10px] text-slate-500 mb-3">
            Normalized profile of {geneName} regulatory architecture
          </p>
          <GenomicLandscapeRadar
            enhancerCount={data.enhancerCount}
            promoterCount={data.promoterCount}
            ctcfCount={data.ctcfCount}
            openChromatinCount={data.openChromatinCount}
            constrainedElementCount={data.constrainedElementCount}
            transcriptCount={data.transcriptCount}
            expressionBreadth={data.expressionBreadth}
          />
        </div>

        {/* Feature type distribution pie */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Feature Distribution</h3>
          <p className="text-[10px] text-slate-500 mb-3">
            Regulatory element types in ±50kb region
          </p>
          <RegulatoryPie
            enhancerCount={data.enhancerCount}
            promoterCount={data.promoterCount}
            ctcfCount={data.ctcfCount}
            openChromatinCount={data.openChromatinCount}
          />
        </div>

        {/* Feature counts bar chart */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Regulatory Feature Counts</h3>
          <p className="text-[10px] text-slate-500 mb-3">
            Absolute counts per feature type
          </p>
          <RegulatoryFeatureBar
            enhancerCount={data.enhancerCount}
            promoterCount={data.promoterCount}
            ctcfCount={data.ctcfCount}
            openChromatinCount={data.openChromatinCount}
          />
        </div>

        {/* Conservation & complexity gauges */}
        <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Conservation & Complexity</h3>
          <p className="text-[10px] text-slate-500 mb-3">
            Evolutionary pressure and regulatory architecture
          </p>
          <ConservationGauge
            constrainedElementCount={data.constrainedElementCount}
            regulatoryFeatureCount={data.regulatoryFeatureCount}
            expressionBreadth={data.expressionBreadth}
            regulatoryComplexity={data.regulatoryComplexity}
            geneLength={data.geneLength}
            transcriptCount={data.transcriptCount}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg bg-[var(--surface-1)] border border-white/5 p-3 text-center">
      <div className="text-lg font-bold font-mono" style={{ color }}>
        {value.toLocaleString()}{suffix ?? ''}
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
