'use client';

import { useState, useEffect } from 'react';
import { AiSection } from './ai-section';
import type { TargetProfile } from '@/lib/types/target-profile';

interface PathwayCrosstalkProps {
  profile: TargetProfile;
}

export function PathwayCrosstalk({ profile }: PathwayCrosstalkProps) {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch('/api/ai/pathway', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data: { analysis: string; error?: string }) => {
        if (!cancelled) {
          if (data.error && !data.analysis) {
            setError('Pathway analysis unavailable. Set ANTHROPIC_API_KEY to enable.');
          } else {
            setAnalysis(data.analysis);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to generate pathway analysis.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [profile]);

  return (
    <AiSection
      title="Pathway Crosstalk Discovery"
      badge="SYSTEMS BIOLOGY"
      badgeColor="cyan"
      borderColor="cyan-500/20"
      content={analysis}
      isLoading={isLoading}
      error={error}
      loadingMessage={`Mapping signaling networks for ${profile.gene}...`}
    />
  );
}
