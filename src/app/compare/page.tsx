'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { RadarChartComponent } from '@/components/radar/radar-chart';
import { ComparisonNarrative } from '@/components/ai/comparison-narrative';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { TargetProfile } from '@/lib/types/target-profile';
import type { DimensionName } from '@/lib/types/scoring';
import { DIMENSION_LABELS } from '@/lib/types/scoring';
import { getScoreColor } from '@/lib/constants';

const DIMENSION_ORDER: DimensionName[] = [
  'geneticEvidence', 'chemicalTractability', 'structuralReadiness',
  'clinicalHistory', 'regulatoryGenomics', 'literatureDepth', 'innovationSignal',
];

export default function ComparePageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="text-white text-center py-16">Loading comparison...</div>
        </main>
        <Footer />
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}

function ComparePageInner() {
  const searchParams = useSearchParams();
  const [geneA, setGeneA] = useState(searchParams.get('a') ?? '');
  const [geneB, setGeneB] = useState(searchParams.get('b') ?? '');
  const [profileA, setProfileA] = useState<TargetProfile | null>(null);
  const [profileB, setProfileB] = useState<TargetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (gene: string): Promise<TargetProfile> => {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gene }),
    });
    if (!res.ok) {
      const data = await res.json() as { error: string };
      throw new Error(data.error || `Failed to analyze ${gene}`);
    }
    return res.json() as Promise<TargetProfile>;
  };

  const handleCompare = async () => {
    if (!geneA.trim() || !geneB.trim()) return;
    setIsLoading(true);
    setError(null);
    setProfileA(null);
    setProfileB(null);

    try {
      const [a, b] = await Promise.all([
        fetchProfile(geneA.trim().toUpperCase()),
        fetchProfile(geneB.trim().toUpperCase()),
      ]);
      setProfileA(a);
      setProfileB(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-compare if both params present
  useEffect(() => {
    if (searchParams.get('a') && searchParams.get('b')) {
      handleCompare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-2xl font-bold text-white mb-6">Compare Targets</h1>

        {/* Input */}
        <div className="flex flex-col sm:flex-row items-end gap-3 mb-8">
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">Target A</label>
            <Input
              id="target-a"
              name="target-a"
              placeholder="e.g., EGFR"
              value={geneA}
              onChange={(e) => setGeneA(e.target.value.toUpperCase())}
              className="bg-[var(--surface-1)] border-white/10 text-white font-mono"
            />
          </div>
          <span className="text-slate-500 text-sm pb-2">vs</span>
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1 block">Target B</label>
            <Input
              id="target-b"
              name="target-b"
              placeholder="e.g., KRAS"
              value={geneB}
              onChange={(e) => setGeneB(e.target.value.toUpperCase())}
              className="bg-[var(--surface-1)] border-white/10 text-white font-mono"
            />
          </div>
          <Button
            onClick={handleCompare}
            disabled={isLoading || !geneA.trim() || !geneB.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              'Compare'
            )}
          </Button>
        </div>

        {error && (
          <div className="text-red-400 text-sm mb-6 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
            {error}
          </div>
        )}

        {profileA && profileB && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Overall scores */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[profileA, profileB].map((p, i) => (
                <div key={p.gene} className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-3 sm:p-6 text-center">
                  <p className="text-lg sm:text-2xl font-bold font-mono text-white">{p.gene}</p>
                  <p className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3 truncate">{p.approvedName}</p>
                  <p
                    className="text-2xl sm:text-4xl font-bold font-mono"
                    style={{ color: getScoreColor(p.scores.overall) }}
                  >
                    {p.scores.overall}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Overall Score</p>
                  <div className={`mt-2 inline-block w-3 h-3 rounded-full ${i === 0 ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                </div>
              ))}
            </div>

            {/* Overlaid radar chart */}
            <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-3 sm:p-6">
              <div className="flex items-center justify-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-300 font-mono">{profileA.gene}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-sm text-slate-300 font-mono">{profileB.gene}</span>
                </div>
              </div>
              <RadarChartComponent
                dimensions={profileA.scores.dimensions}
                comparisonDimensions={profileB.scores.dimensions}
                comparisonLabel={profileB.gene}
              />
            </div>

            {/* Dimension comparison table */}
            <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs sm:text-sm font-medium text-slate-400 px-3 sm:px-6 py-3">Dimension</th>
                    <th className="text-center text-xs sm:text-sm font-medium text-blue-400 px-3 sm:px-6 py-3 font-mono">{profileA.gene}</th>
                    <th className="text-center text-xs sm:text-sm font-medium text-indigo-400 px-3 sm:px-6 py-3 font-mono">{profileB.gene}</th>
                    <th className="text-center text-xs sm:text-sm font-medium text-slate-400 px-3 sm:px-6 py-3">Delta</th>
                  </tr>
                </thead>
                <tbody>
                  {DIMENSION_ORDER.map((dim) => {
                    const scoreA = profileA.scores.dimensions[dim].score;
                    const scoreB = profileB.scores.dimensions[dim].score;
                    const delta = scoreA - scoreB;
                    return (
                      <tr key={dim} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm text-slate-300">{DIMENSION_LABELS[dim]}</td>
                        <td className="px-3 sm:px-6 py-3 text-center">
                          <span className="font-mono font-bold" style={{ color: getScoreColor(scoreA) }}>
                            {scoreA}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 text-center">
                          <span className="font-mono font-bold" style={{ color: getScoreColor(scoreB) }}>
                            {scoreB}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 text-center">
                          <span className={`font-mono text-sm ${
                            delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-slate-500'
                          }`}>
                            {delta > 0 ? '+' : ''}{delta}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-white/[0.02]">
                    <td className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-bold text-white">Overall</td>
                    <td className="px-3 sm:px-6 py-3 text-center">
                      <span className="font-mono font-bold text-base sm:text-lg" style={{ color: getScoreColor(profileA.scores.overall) }}>
                        {profileA.scores.overall}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-center">
                      <span className="font-mono font-bold text-base sm:text-lg" style={{ color: getScoreColor(profileB.scores.overall) }}>
                        {profileB.scores.overall}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 text-center">
                      <span className={`font-mono font-bold ${
                        profileA.scores.overall - profileB.scores.overall > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {profileA.scores.overall - profileB.scores.overall > 0 ? '+' : ''}
                        {profileA.scores.overall - profileB.scores.overall}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* AI Comparative Analysis */}
            <ComparisonNarrative profileA={profileA} profileB={profileB} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
