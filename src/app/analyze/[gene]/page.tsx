'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { RadarChartComponent } from '@/components/radar/radar-chart';
import { DimensionGrid } from '@/components/dimensions/dimension-grid';
import { ScoreCounter } from '@/components/dimensions/score-counter';
import { TargetNarrative } from '@/components/ai/target-narrative';
import { NextSteps } from '@/components/ai/next-steps';
import { DrugHypothesis } from '@/components/ai/drug-hypothesis';
import { ExportButton } from '@/components/reports/export-button';
import { LiveLoadingState } from '@/components/analysis/live-loading-state';
import { ScoreMethodology } from '@/components/analysis/score-methodology';
import { SafetyProfile } from '@/components/analysis/safety-profile';
import { DiseaseAssociations } from '@/components/analysis/disease-associations';
import { StructurePanel } from '@/components/protein/structure-panel';
import { DockingPanel } from '@/components/protein/docking-panel';
import { CompoundGallery } from '@/components/compounds/compound-gallery';
import { DrugLikenessPanel } from '@/components/compounds/drug-likeness-panel';
import { BioactivityChart } from '@/components/charts/bioactivity-chart';
import { PropertyScatter } from '@/components/charts/property-scatter';
import { TrialsDashboard } from '@/components/clinical/trials-dashboard';
import { CompoundAnalysis } from '@/components/ai/compound-analysis';
import { PharmacologySafety } from '@/components/ai/pharmacology-safety';
import { CompetitiveIntelligence } from '@/components/ai/competitive-intelligence';
import { EvidenceConflicts } from '@/components/ai/evidence-conflicts';
import { DeepHypothesis } from '@/components/ai/deep-hypothesis';
import { MutationImpact } from '@/components/ai/mutation-impact';
import { PathwayCrosstalk } from '@/components/ai/pathway-crosstalk';
import { TrialDesign } from '@/components/ai/trial-design';
import { TargetChat } from '@/components/ai/target-chat';
import { RegulatoryDashboard } from '@/components/genomics/regulatory-dashboard';
import { TDLBadge } from '@/components/analysis/tdl-badge';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { useWatchlist } from '@/hooks/use-watchlist';
import type { TargetProfile, AnalysisProgress } from '@/lib/types/target-profile';
import { getScoreColor, getScoreLabel } from '@/lib/constants';
import { formatMs } from '@/lib/utils/format';

const SOURCES = ['Open Targets', 'ChEMBL', 'PubMed', 'ClinicalTrials.gov', 'bioRxiv', 'AlphaFold/PDB', 'AlphaGenome'];

function getTDL(profile: TargetProfile): string {
  const maxPhase = profile.rawData.chembl.data?.maxClinicalPhase ?? 0;
  const compoundCount = profile.rawData.chembl.data?.compoundCount ?? 0;
  const diseaseCount = profile.rawData.openTargets.data?.diseaseAssociationCount ?? 0;
  if (maxPhase >= 4) return 'Tclin';
  if (maxPhase >= 1 || compoundCount > 0) return 'Tchem';
  if (diseaseCount > 0) return 'Tbio';
  return 'Tdark';
}

export default function AnalyzePage() {
  const params = useParams();
  const gene = (params.gene as string).toUpperCase();
  const { addSearch } = useRecentSearches();
  const { addTarget, removeTarget, isInWatchlist } = useWatchlist();

  const [profile, setProfile] = useState<TargetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress[]>(
    SOURCES.map((source) => ({ source, status: 'pending' }))
  );

  useEffect(() => {
    addSearch(gene);

    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      // Set all to loading
      setProgress(SOURCES.map((source) => ({ source, status: 'loading' })));

      try {
        // 60-second timeout — analysis can take up to 20s for cold queries
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gene }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) {
          const data = await res.json() as { error: string };
          throw new Error(data.error || 'Analysis failed');
        }

        const data = await res.json() as TargetProfile;
        setProfile(data);

        // Update progress with real results
        setProgress([
          {
            source: 'Open Targets',
            status: data.rawData.openTargets.success ? 'complete' : 'error',
            responseTimeMs: data.rawData.openTargets.responseTimeMs,
            dataCount: data.rawData.openTargets.data?.diseaseAssociationCount,
            dataLabel: 'disease associations found',
          },
          {
            source: 'ChEMBL',
            status: data.rawData.chembl.success ? 'complete' : 'error',
            responseTimeMs: data.rawData.chembl.responseTimeMs,
            dataCount: data.rawData.chembl.data?.compoundCount,
            dataLabel: 'active compounds found',
          },
          {
            source: 'PubMed',
            status: data.rawData.pubmed.success ? 'complete' : 'error',
            responseTimeMs: data.rawData.pubmed.responseTimeMs,
            dataCount: data.rawData.pubmed.data?.totalPublications,
            dataLabel: 'publications found',
          },
          {
            source: 'ClinicalTrials.gov',
            status: data.rawData.clinicalTrials.success ? 'complete' : 'error',
            responseTimeMs: data.rawData.clinicalTrials.responseTimeMs,
            dataCount: data.rawData.clinicalTrials.data?.totalTrials,
            dataLabel: 'trials found',
          },
          {
            source: 'bioRxiv',
            status: data.rawData.biorxiv.success ? 'complete' : 'error',
            responseTimeMs: data.rawData.biorxiv.responseTimeMs,
            dataCount: data.rawData.biorxiv.data?.preprints90d,
            dataLabel: 'preprints (90d)',
          },
          {
            source: 'AlphaFold/PDB',
            status: data.rawData.alphafold.success ? 'complete' : 'error',
            responseTimeMs: data.rawData.alphafold.responseTimeMs,
            dataCount: data.rawData.alphafold.data?.pdbCount,
            dataLabel: 'structures found',
          },
          {
            source: 'AlphaGenome',
            status: data.rawData.alphagenome.success ? 'complete' : 'error',
            responseTimeMs: data.rawData.alphagenome.responseTimeMs,
            dataCount: data.rawData.alphagenome.data?.regulatoryFeatureCount,
            dataLabel: 'regulatory features',
          },
        ]);
      } catch (err) {
        const msg = err instanceof Error
          ? err.name === 'AbortError'
            ? 'Analysis timed out. Please try again.'
            : err.message === 'Failed to fetch' || err.message === 'fetch failed'
              ? 'Network error — please check your connection and try again.'
              : err.message
          : 'Analysis failed';
        setError(msg);
        setProgress((prev) =>
          prev.map((p) =>
            p.status === 'loading' ? { ...p, status: 'error' as const } : p
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gene]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Loading state — THE DEMO */}
        {isLoading && (
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Analyzing <span className="font-mono text-blue-400">{gene}</span>...
            </h2>
            <p className="text-sm text-slate-400 mb-8 text-center">
              Querying 7 live data sources in parallel
            </p>
            <LiveLoadingState progress={progress} />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="max-w-xl mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
              &larr; Back to search
            </Link>
          </div>
        )}

        {/* Results */}
        {profile && !isLoading && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Header with overall score */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono">{profile.gene}</h1>
                  <span
                    className="px-3 py-1 rounded-lg text-sm font-bold"
                    style={{
                      backgroundColor: getScoreColor(profile.scores.overall) + '20',
                      color: getScoreColor(profile.scores.overall),
                    }}
                  >
                    {getScoreLabel(profile.scores.overall)}
                  </span>
                  <TDLBadge profile={profile} />
                </div>
                <p className="text-slate-400">{profile.approvedName}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {profile.metadata.servicesCompleted}/7 sources &middot;{' '}
                  {formatMs(profile.metadata.totalResponseTimeMs)} &middot;{' '}
                  {profile.ensemblId}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center relative">
                  <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Overall Score</div>
                  <div
                    className="relative"
                    style={{
                      filter: `drop-shadow(0 0 20px ${getScoreColor(profile.scores.overall)}40)`,
                    }}
                  >
                    <ScoreCounter
                      target={profile.scores.overall}
                      color={getScoreColor(profile.scores.overall)}
                      duration={1500}
                      className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight"
                    />
                  </div>
                  <div
                    className="text-xs font-semibold mt-1 tracking-wide"
                    style={{ color: getScoreColor(profile.scores.overall) }}
                  >
                    {getScoreLabel(profile.scores.overall)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ExportButton profile={profile} />
                  <button
                    onClick={() => {
                      if (isInWatchlist(profile.gene)) {
                        removeTarget(profile.gene);
                      } else {
                        addTarget({
                          gene: profile.gene,
                          approvedName: profile.approvedName,
                          overallScore: profile.scores.overall,
                          tdl: getTDL(profile),
                          addedAt: Date.now(),
                        });
                      }
                    }}
                    className={`px-3 py-2 text-sm border rounded-lg transition-colors flex items-center gap-1.5 ${
                      isInWatchlist(profile.gene)
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                    title={isInWatchlist(profile.gene) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  >
                    {isInWatchlist(profile.gene) ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">
                      {isInWatchlist(profile.gene) ? 'In Watchlist' : 'Watchlist'}
                    </span>
                  </button>
                  <Link
                    href={`/compare?a=${profile.gene}`}
                    className="px-3 py-2 text-sm border border-white/10 rounded-lg text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    Compare
                  </Link>
                </div>
              </div>
            </div>

            {/* Score methodology — expandable explanation */}
            <ScoreMethodology profile={profile} />

            {/* Data source completion summary */}
            <div className="rounded-xl border border-white/5 p-3 sm:p-5" style={{ backgroundColor: 'var(--surface-1)' }}>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {progress.map((p) => (
                  <div key={p.source} className="flex items-center gap-2 text-xs">
                    {p.status === 'complete' ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">✓</span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs">✗</span>
                    )}
                    <span className="text-slate-400">{p.source}</span>
                    {p.responseTimeMs && (
                      <span className="hidden sm:inline text-slate-600 font-mono font-tabular">{formatMs(p.responseTimeMs)}</span>
                    )}
                    {p.dataCount !== undefined && (
                      <span className="hidden sm:inline text-slate-500 font-tabular">
                        ({p.dataCount.toLocaleString()} {p.dataLabel})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Radar + Dimensions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="rounded-xl border border-white/5 p-5" style={{ backgroundColor: 'var(--surface-1)' }}>
                <RadarChartComponent dimensions={profile.scores.dimensions} />
              </div>
              <DimensionGrid dimensions={profile.scores.dimensions} />
            </div>

            {/* Safety Assessment & Disease Associations */}
            <SafetyProfile profile={profile} />
            <DiseaseAssociations profile={profile} />

            {/* ── Section divider ── */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

            {/* 3D Protein Structure */}
            <StructurePanel
              pdbId={profile.rawData.alphafold?.data?.pdbIds?.[0]}
              uniprotId={profile.rawData.alphafold?.data?.uniprotId}
              geneName={profile.gene}
              pdbCount={profile.rawData.alphafold?.data?.pdbCount}
              bestResolution={profile.rawData.alphafold?.data?.bestResolution}
              avgPLDDT={profile.rawData.alphafold?.data?.avgPLDDT}
              ligandBound={profile.rawData.alphafold?.data?.ligandBoundCount}
            />

            {/* ── Section divider ── */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

            {/* Protein-Ligand Docking */}
            <DockingPanel
              pdbId={profile.rawData.alphafold?.data?.pdbIds?.[0]}
              uniprotId={profile.rawData.alphafold?.data?.uniprotId}
              geneName={profile.gene}
              ligandBoundCount={profile.rawData.alphafold?.data?.ligandBoundCount}
              compounds={profile.rawData.chembl.data?.topCompounds}
            />

            {/* ── Section divider ── */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

            {/* Compound Landscape */}
            {profile.rawData.chembl.data?.topCompounds && profile.rawData.chembl.data.topCompounds.length > 0 && (
              <>
                <CompoundGallery compounds={profile.rawData.chembl.data.topCompounds} />

                <DrugLikenessPanel compounds={profile.rawData.chembl.data.topCompounds} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <BioactivityChart activities={profile.rawData.chembl.data.topActivities ?? []} />
                  <PropertyScatter compounds={profile.rawData.chembl.data.topCompounds} />
                </div>
              </>
            )}

            {/* Clinical Trials Dashboard */}
            {profile.rawData.clinicalTrials.data && profile.rawData.clinicalTrials.data.totalTrials > 0 && (
              <TrialsDashboard data={profile.rawData.clinicalTrials.data} />
            )}

            {/* Regulatory Genomics Dashboard */}
            {profile.rawData.alphagenome.data && profile.rawData.alphagenome.data.regulatoryFeatureCount > 0 && (
              <RegulatoryDashboard
                data={profile.rawData.alphagenome.data}
                geneName={profile.gene}
              />
            )}

            {/* ── Section divider ── */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

            {/* AI Sections */}
            <TargetNarrative profile={profile} />
            <NextSteps profile={profile} />
            <DrugHypothesis profile={profile} />
            <CompoundAnalysis profile={profile} />
            <PharmacologySafety profile={profile} />
            <MutationImpact profile={profile} />
            <PathwayCrosstalk profile={profile} />
            <CompetitiveIntelligence profile={profile} />
            <EvidenceConflicts profile={profile} />
            <DeepHypothesis profile={profile} />
            <TrialDesign profile={profile} />

            {/* ── Section divider ── */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

            {/* AI Chat — Ask Anything */}
            <TargetChat profile={profile} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
