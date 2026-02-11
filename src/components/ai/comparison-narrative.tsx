'use client';

import { useState, useEffect } from 'react';
import { AiBadge } from './ai-badge';
import type { TargetProfile } from '@/lib/types/target-profile';

interface ComparisonNarrativeProps {
  profileA: TargetProfile;
  profileB: TargetProfile;
}

export function ComparisonNarrative({ profileA, profileB }: ComparisonNarrativeProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch('/api/ai/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileA, profileB }),
    })
      .then((res) => res.json())
      .then((data: { analysis: string }) => {
        if (!cancelled) setAnalysis(data.analysis || '');
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [profileA, profileB]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-6">
        <div className="flex items-center gap-2 mb-3">
          <AiBadge />
          <h3 className="text-sm font-medium text-slate-300">Comparative Analysis</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-white/5 rounded animate-pulse" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-4/6" />
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-6 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        <AiBadge />
        <h3 className="text-sm font-medium text-slate-300">
          Comparative Analysis: {profileA.gene} vs {profileB.gene}
        </h3>
      </div>
      <div className="prose prose-sm prose-invert max-w-none">
        {analysis.split('\n\n').map((paragraph, i) => (
          <p key={i} className="text-slate-300 leading-relaxed text-sm mb-3 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
