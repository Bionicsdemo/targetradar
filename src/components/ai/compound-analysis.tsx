'use client';

import { useState, useEffect } from 'react';
import { AiSection } from './ai-section';
import type { TargetProfile } from '@/lib/types/target-profile';

interface CompoundAnalysisProps {
  profile: TargetProfile;
}

export function CompoundAnalysis({ profile }: CompoundAnalysisProps) {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasCompounds = (profile.rawData.chembl.data?.topCompounds?.length ?? 0) > 0;

  useEffect(() => {
    if (!hasCompounds) return;

    let cancelled = false;
    setIsLoading(true);

    fetch('/api/ai/compounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
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
  }, [profile, hasCompounds]);

  if (!hasCompounds) return null;

  return (
    <AiSection
      title="Compound Portfolio Analysis"
      borderColor="indigo-500/10"
      content={analysis}
      isLoading={isLoading}
    />
  );
}
