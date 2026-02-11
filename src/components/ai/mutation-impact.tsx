'use client';

import { useState } from 'react';
import { AiBadge } from './ai-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TargetProfile } from '@/lib/types/target-profile';

interface MutationImpactProps {
  profile: TargetProfile;
}

export function MutationImpact({ profile }: MutationImpactProps) {
  const [mutation, setMutation] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!mutation.trim()) return;
    setIsLoading(true);
    setError(null);
    setAnalysis('');

    try {
      const res = await fetch('/api/ai/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, mutation: mutation.trim() }),
      });
      const data = (await res.json()) as { analysis: string; error?: string };
      if (data.error && !data.analysis) {
        setError('Mutation analysis unavailable. Set ANTHROPIC_API_KEY to enable.');
      } else {
        setAnalysis(data.analysis);
      }
    } catch {
      setError('Failed to analyze mutation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-red-500/20 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AiBadge />
        <h3 className="text-sm font-medium text-slate-300">Mutation Impact Analyzer</h3>
        <span className="px-2 py-0.5 text-xs font-bold bg-red-500/10 text-red-400 rounded">
          STRUCTURAL + CLINICAL
        </span>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <Input
          id="mutation-input"
          name="mutation-input"
          placeholder={`e.g. V600E, G12C, T790M`}
          value={mutation}
          onChange={(e) => setMutation(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          className="bg-[#0F172A] border-white/10 text-white font-mono text-sm placeholder:text-slate-600"
        />
        <Button
          onClick={handleAnalyze}
          disabled={!mutation.trim() || isLoading}
          className="shrink-0 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Mutation'}
        </Button>
      </div>

      <p className="text-xs text-slate-600 mb-4">
        Enter a mutation in {profile.gene} to get structural, clinical, and drug resistance analysis
      </p>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
            Analyzing {profile.gene} {mutation} across structure, clinical, and compound data...
          </div>
          <div className="h-4 bg-red-500/5 rounded animate-pulse" />
          <div className="h-4 bg-red-500/5 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-red-500/5 rounded animate-pulse w-4/6" />
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-slate-500">{error}</p>}

      {/* Result */}
      {analysis && !isLoading && (
        <div className="prose prose-sm prose-invert max-w-none animate-fade-in-up">
          {analysis.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-slate-300 leading-relaxed text-sm mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
