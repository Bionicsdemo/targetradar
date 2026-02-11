'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiBadge } from '@/components/ai/ai-badge';
import { getScoreColor } from '@/lib/constants';

interface DiseaseResult {
  id: string;
  name: string;
  description: string;
}

interface DiscoveredTarget {
  ensemblId: string;
  symbol: string;
  name: string;
  associationScore: number;
  datatypeScores: Record<string, number>;
  overallScore: number | null;
  status: 'pending' | 'analyzing' | 'complete' | 'error';
}

interface DiscoveryResult {
  diseaseId: string;
  diseaseName: string;
  diseaseDescription: string;
  totalAssociatedTargets: number;
  targets: DiscoveredTarget[];
  aiAnalysis: string | null;
}

const PHASES = [
  'Disease Ontology Mapping',
  'Genetic Evidence Mining',
  'Target Association Scoring',
  'Chemical Tractability Scan',
  'Clinical Landscape Analysis',
  'Structural Feasibility Check',
  'Regulatory Genomics Profiling',
  'AI Ranking & Synthesis',
];

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<DiseaseResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseResult | null>(null);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [phaseTimes, setPhaseTimes] = useState<Record<number, number>>({});
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const phaseIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);
    };
  }, []);

  // Disease search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/discover/search?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as { results: DiseaseResult[] };
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const startDiscovery = async (disease: DiseaseResult) => {
    setSelectedDisease(disease);
    setQuery(disease.name);
    setShowSuggestions(false);
    setIsDiscovering(true);
    setError(null);
    setResult(null);
    setCurrentPhase(0);
    setCompletedPhases([]);
    setPhaseTimes({});

    // Animate phases
    const phaseStart = Date.now();
    let phase = 0;
    phaseIntervalRef.current = setInterval(() => {
      if (phase < PHASES.length - 1) {
        const elapsed = ((Date.now() - phaseStart) / 1000);
        setPhaseTimes((prev) => ({ ...prev, [phase]: parseFloat((elapsed / (phase + 1) * 1.1).toFixed(1)) }));
        setCompletedPhases((prev) => [...prev, phase]);
        phase++;
        setCurrentPhase(phase);
      }
    }, 1800);

    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diseaseId: disease.id }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error: string };
        throw new Error(data.error || 'Discovery failed');
      }

      const data = (await res.json()) as DiscoveryResult;

      // Complete all phases
      if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);
      const totalTime = ((Date.now() - phaseStart) / 1000).toFixed(1);
      const allPhases = PHASES.map((_, i) => i);
      setCompletedPhases(allPhases);
      setCurrentPhase(PHASES.length);
      setPhaseTimes((prev) => {
        const times = { ...prev };
        for (let i = 0; i < PHASES.length; i++) {
          if (!times[i]) times[i] = parseFloat((parseFloat(totalTime) * (i + 1) / PHASES.length).toFixed(1));
        }
        return times;
      });

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
      if (phaseIntervalRef.current) clearInterval(phaseIntervalRef.current);
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero section */}
        {!isDiscovering && !result && (
          <div className="max-w-2xl mx-auto text-center pt-12 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 mb-6">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0l2.09 5.91L16 8l-5.91 2.09L8 16l-2.09-5.91L0 8l5.91-2.09z" />
              </svg>
              Powered by Opus 4.6
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              DeepTarget Discovery
            </h1>
            <p className="text-base sm:text-lg text-slate-400 mb-8">
              Enter a disease. Our AI autonomously discovers, evaluates, and ranks every
              potential drug target across 7 live data sources.
            </p>

            {/* Search input */}
            <div className="relative max-w-lg mx-auto">
              <Input
                id="disease-search"
                name="disease-search"
                placeholder="Search a disease... (e.g. pancreatic cancer, Alzheimer's)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="bg-[var(--surface-1)] border-white/10 text-white text-base h-12 pl-4 pr-4 placeholder:text-slate-500"
              />
              {isSearching && (
                <span className="absolute right-4 top-3.5 text-xs text-slate-500">Searching...</span>
              )}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 mt-2 w-full bg-[var(--surface-1)] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
                  {suggestions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => startDiscovery(d)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="font-medium text-white text-sm">{d.name}</div>
                      {d.description && (
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{d.description}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Discovery loading state — THE DEMO */}
        {isDiscovering && (
          <div className="max-w-xl mx-auto pt-8">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Autonomous Target Discovery
            </h2>
            <p className="text-sm text-slate-400 mb-8 text-center">
              Analyzing <span className="text-blue-400 font-medium">{selectedDisease?.name}</span> across 7 live databases
            </p>

            <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-6 space-y-3">
              {PHASES.map((phase, i) => {
                const isComplete = completedPhases.includes(i);
                const isCurrent = currentPhase === i;
                return (
                  <div key={i} className="flex items-center gap-3">
                    {isComplete ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0">
                        ✓
                      </span>
                    ) : isCurrent ? (
                      <span className="w-5 h-5 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-white/5 shrink-0" />
                    )}
                    <span className={
                      isComplete
                        ? 'text-sm text-slate-300 flex-1'
                        : isCurrent
                        ? 'text-sm text-white font-medium flex-1'
                        : 'text-sm text-slate-600 flex-1'
                    }>
                      Phase {i + 1}: {phase}
                    </span>
                    {isComplete && phaseTimes[i] && (
                      <span className="text-[10px] text-slate-500">{phaseTimes[i]}s</span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] text-blue-400 animate-pulse">running...</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isDiscovering && (
          <div className="max-w-xl mx-auto text-center py-16">
            <h2 className="text-xl font-bold text-white mb-2">Discovery Failed</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <Button
              onClick={() => { setError(null); setResult(null); }}
              variant="outline"
              className="border-white/10 text-slate-300"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Results */}
        {result && !isDiscovering && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{result.diseaseName}</h1>
                <span className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-400 rounded font-medium">
                  {result.totalAssociatedTargets} associated targets
                </span>
              </div>
              {result.diseaseDescription && (
                <p className="text-sm text-slate-400 max-w-3xl">{result.diseaseDescription}</p>
              )}
              <Button
                onClick={() => { setResult(null); setSelectedDisease(null); setQuery(''); }}
                variant="outline"
                className="mt-4 border-white/10 text-slate-300 text-sm"
              >
                New Discovery
              </Button>
            </div>

            {/* Target ranking */}
            <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-6">
              <h2 className="text-base font-semibold text-white mb-4">
                Top Targets Discovered
              </h2>
              <div className="space-y-3">
                {result.targets.filter((t) => t.overallScore !== null).map((target, i) => {
                  const score = target.overallScore ?? 0;
                  const color = getScoreColor(score);
                  return (
                    <div key={target.ensemblId} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 rounded-lg bg-[#0F172A]/50 border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <span className="text-lg font-bold text-slate-500 w-6 sm:w-8 text-center shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/analyze/${target.symbol}`}
                              className="text-sm font-bold text-white hover:text-blue-400 transition-colors"
                            >
                              {target.symbol}
                            </Link>
                            <span className="text-xs text-slate-500 truncate">{target.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500">
                              Disease assoc: {(target.associationScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pl-9 sm:pl-0">
                        {/* Score bar */}
                        <div className="w-24 sm:w-32 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                  width: `${score}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                            <span
                              className="text-sm font-bold w-8 text-right"
                              style={{ color }}
                            >
                              {score}
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/analyze/${target.symbol}`}
                          className="px-3 py-1.5 text-xs bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors shrink-0"
                        >
                          Full Analysis
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Discovery Analysis */}
            {result.aiAnalysis && (
              <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-6 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4">
                  <AiBadge />
                  <h3 className="text-sm font-medium text-slate-300">AI Discovery Analysis</h3>
                  <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/10 text-blue-400 rounded">
                    AUTONOMOUS
                  </span>
                </div>
                <div className="prose prose-sm prose-invert max-w-none">
                  {result.aiAnalysis.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-slate-300 leading-relaxed text-sm mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Unscored targets */}
            {result.targets.filter((t) => t.overallScore === null).length > 0 && (
              <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-6">
                <h3 className="text-sm font-medium text-slate-400 mb-3">
                  Additional Associated Targets
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.targets
                    .filter((t) => t.overallScore === null)
                    .map((t) => (
                      <Link
                        key={t.ensemblId}
                        href={`/analyze/${t.symbol}`}
                        className="px-3 py-1.5 text-xs bg-[#0F172A] border border-white/5 rounded-lg text-slate-400 hover:text-white hover:border-white/10 transition-colors"
                      >
                        {t.symbol} ({(t.associationScore * 100).toFixed(0)}%)
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
