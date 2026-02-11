'use client';

import { useState, useEffect } from 'react';
import { AiSection } from './ai-section';
import type { TargetProfile } from '@/lib/types/target-profile';

interface DeepHypothesisProps {
  profile: TargetProfile;
}

export function DeepHypothesis({ profile }: DeepHypothesisProps) {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch('/api/ai/deep-hypothesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data: { analysis: string; error?: string }) => {
        if (!cancelled) {
          if (data.error && !data.analysis) {
            setError('Hypothesis generation unavailable. Set ANTHROPIC_API_KEY to enable.');
          } else {
            setAnalysis(data.analysis);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to generate hypotheses.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [profile]);

  return (
    <AiSection
      title="AI Hypothesis Generator"
      badge="NOVEL IDEATION"
      badgeColor="purple"
      borderColor="purple-500/20"
      content={analysis}
      isLoading={isLoading}
      error={error}
      loadingMessage={`Generating novel hypotheses for ${profile.gene}...`}
    />
  );
}
