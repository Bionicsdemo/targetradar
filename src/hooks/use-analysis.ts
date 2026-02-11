'use client';

import { useState, useCallback } from 'react';
import type { TargetProfile, AnalysisProgress } from '@/lib/types/target-profile';

const SOURCES = ['Open Targets', 'ChEMBL', 'PubMed', 'ClinicalTrials.gov', 'bioRxiv', 'AlphaFold/PDB'];

export function useAnalysis() {
  const [profile, setProfile] = useState<TargetProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress[]>([]);

  const analyze = useCallback(async (gene: string) => {
    setIsLoading(true);
    setError(null);
    setProfile(null);

    // Initialize progress
    const initialProgress: AnalysisProgress[] = SOURCES.map((source) => ({
      source,
      status: 'loading',
    }));
    setProgress(initialProgress);

    // Simulate progressive loading for demo effect
    const startTime = Date.now();
    const simulateProgress = () => {
      const elapsed = Date.now() - startTime;
      setProgress((prev) =>
        prev.map((p) => {
          if (p.status === 'complete' || p.status === 'error') return p;
          // Stagger completion times for visual effect
          const sourceIndex = SOURCES.indexOf(p.source);
          const threshold = 500 + sourceIndex * 400;
          if (elapsed > threshold && p.status === 'loading') {
            return { ...p, status: 'loading' as const };
          }
          return p;
        })
      );
    };

    const interval = setInterval(simulateProgress, 200);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gene }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const data = await res.json() as { error: string };
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await res.json() as TargetProfile;
      setProfile(data);

      // Update progress with real data
      const rawData = data.rawData;
      setProgress([
        {
          source: 'Open Targets',
          status: rawData.openTargets.success ? 'complete' : 'error',
          responseTimeMs: rawData.openTargets.responseTimeMs,
          dataCount: rawData.openTargets.data?.diseaseAssociationCount,
          dataLabel: 'disease associations',
          error: rawData.openTargets.error ?? undefined,
        },
        {
          source: 'ChEMBL',
          status: rawData.chembl.success ? 'complete' : 'error',
          responseTimeMs: rawData.chembl.responseTimeMs,
          dataCount: rawData.chembl.data?.compoundCount,
          dataLabel: 'compounds found',
          error: rawData.chembl.error ?? undefined,
        },
        {
          source: 'PubMed',
          status: rawData.pubmed.success ? 'complete' : 'error',
          responseTimeMs: rawData.pubmed.responseTimeMs,
          dataCount: rawData.pubmed.data?.totalPublications,
          dataLabel: 'publications',
          error: rawData.pubmed.error ?? undefined,
        },
        {
          source: 'ClinicalTrials.gov',
          status: rawData.clinicalTrials.success ? 'complete' : 'error',
          responseTimeMs: rawData.clinicalTrials.responseTimeMs,
          dataCount: rawData.clinicalTrials.data?.totalTrials,
          dataLabel: 'trials found',
          error: rawData.clinicalTrials.error ?? undefined,
        },
        {
          source: 'bioRxiv',
          status: rawData.biorxiv.success ? 'complete' : 'error',
          responseTimeMs: rawData.biorxiv.responseTimeMs,
          dataCount: rawData.biorxiv.data?.preprints90d,
          dataLabel: 'preprints (90d)',
          error: rawData.biorxiv.error ?? undefined,
        },
        {
          source: 'AlphaFold/PDB',
          status: rawData.alphafold.success ? 'complete' : 'error',
          responseTimeMs: rawData.alphafold.responseTimeMs,
          dataCount: rawData.alphafold.data?.pdbCount,
          dataLabel: 'structures',
          error: rawData.alphafold.error ?? undefined,
        },
      ]);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setProgress((prev) =>
        prev.map((p) =>
          p.status === 'loading' ? { ...p, status: 'error' as const } : p
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { profile, isLoading, error, progress, analyze };
}
