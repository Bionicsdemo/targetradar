'use client';

import { useState, useEffect } from 'react';
import { AiSection } from './ai-section';
import type { TargetProfile } from '@/lib/types/target-profile';

interface EvidenceConflictsProps {
  profile: TargetProfile;
}

export function EvidenceConflicts({ profile }: EvidenceConflictsProps) {
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch('/api/ai/conflicts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data: { analysis: string; error?: string }) => {
        if (!cancelled) {
          if (data.error && !data.analysis) {
            setError('Conflict analysis unavailable. Set ANTHROPIC_API_KEY to enable.');
          } else {
            setAnalysis(data.analysis);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to generate conflict analysis.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [profile]);

  return (
    <AiSection
      title="Evidence Conflict Resolution"
      badge="CROSS-DIMENSIONAL"
      badgeColor="amber"
      borderColor="amber-500/20"
      content={analysis}
      isLoading={isLoading}
      error={error}
      loadingMessage={`Resolving evidence conflicts for ${profile.gene}...`}
    />
  );
}
