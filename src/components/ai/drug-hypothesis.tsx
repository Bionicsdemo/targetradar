'use client';

import { useState, useEffect } from 'react';
import { AiSection } from './ai-section';
import type { TargetProfile } from '@/lib/types/target-profile';

interface DrugHypothesisProps {
  profile: TargetProfile;
}

export function DrugHypothesis({ profile }: DrugHypothesisProps) {
  const [hypothesis, setHypothesis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chemScore = profile.scores.dimensions.chemicalTractability.score;

  useEffect(() => {
    if (chemScore < 50) return;

    let cancelled = false;
    setIsLoading(true);

    fetch('/api/ai/hypothesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data: { hypothesis: string }) => {
        if (!cancelled) setHypothesis(data.hypothesis || '');
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [profile, chemScore]);

  if (chemScore < 50) return null;

  return (
    <AiSection
      title="Drug Design Hypothesis"
      borderColor="indigo-500/10"
      content={hypothesis}
      isLoading={isLoading}
    />
  );
}
