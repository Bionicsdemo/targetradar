'use client';

import { useState, useEffect } from 'react';
import { AiSection } from './ai-section';
import type { TargetProfile } from '@/lib/types/target-profile';

interface TrialDesignProps {
  profile: TargetProfile;
}

export function TrialDesign({ profile }: TrialDesignProps) {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch('/api/ai/trial-design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data: { analysis: string; error?: string }) => {
        if (!cancelled) {
          if (data.error && !data.analysis) {
            setError('Trial design unavailable. Set ANTHROPIC_API_KEY to enable.');
          } else {
            setAnalysis(data.analysis);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to generate trial design.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [profile]);

  return (
    <AiSection
      title="Clinical Trial Design Assistant"
      badge="TRIAL ARCHITECT"
      badgeColor="emerald"
      borderColor="emerald-500/20"
      content={analysis}
      isLoading={isLoading}
      error={error}
      loadingMessage={`Designing optimal Phase I/II trial for ${profile.gene}...`}
    />
  );
}
