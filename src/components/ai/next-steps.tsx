'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AiSection } from './ai-section';
import type { TargetProfile } from '@/lib/types/target-profile';

interface ComparisonTarget {
  gene: string;
  reason: string;
}

interface NextStepsResponse {
  steps: string[];
  comparisons: ComparisonTarget[];
}

interface NextStepsProps {
  profile: TargetProfile;
}

export function NextSteps({ profile }: NextStepsProps) {
  const [steps, setSteps] = useState<string[]>([]);
  const [comparisons, setComparisons] = useState<ComparisonTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch('/api/ai/next-steps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data: NextStepsResponse) => {
        if (!cancelled) {
          setSteps(data.steps || []);
          setComparisons(data.comparisons || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [profile]);

  if (!isLoading && steps.length === 0) return null;

  return (
    <AiSection
      title="What Would You Investigate Next?"
      content=""
      isLoading={isLoading}
      defaultExpanded={true}
    >
      {steps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.slice(0, 3).map((step, i) => (
            <div
              key={i}
              className="rounded-lg p-4 border border-white/5"
              style={{ backgroundColor: 'var(--surface-2)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold font-tabular flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-[1.6]">{step}</p>
            </div>
          ))}
        </div>
      )}

      {/* Related Targets to Compare -- multi-turn follow-up */}
      {comparisons.length > 0 && (
        <div className="mt-4 rounded-lg p-4 border border-purple-500/10" style={{ backgroundColor: 'var(--surface-2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
              Related Targets to Compare
            </span>
          </div>
          <div className="space-y-2">
            {comparisons.slice(0, 3).map((comp) => (
              <Link
                key={comp.gene}
                href={`/compare?a=${encodeURIComponent(profile.gene)}&b=${encodeURIComponent(comp.gene)}`}
                className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-purple-500/10 group"
              >
                <span className="font-mono font-bold text-purple-400 text-sm min-w-[60px] group-hover:text-purple-300">
                  {comp.gene}
                </span>
                <span className="text-xs text-slate-400 group-hover:text-slate-300 leading-snug">
                  {comp.reason}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 ml-auto flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}
    </AiSection>
  );
}
