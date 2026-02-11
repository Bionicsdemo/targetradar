'use client';

import type { TargetProfile } from '@/lib/types/target-profile';

interface ReportPreviewProps {
  profile: TargetProfile;
}

export function ReportPreview({ profile }: ReportPreviewProps) {
  return (
    <div className="text-xs text-slate-500">
      Report includes: Executive Summary, Radar Chart, Score Breakdown,
      7 Dimension Deep Dives (incl. AlphaGenome Regulatory Genomics), Methodology, and Data Sources.
      <br />
      Analysis completed at {new Date(profile.metadata.analysisTimestamp).toLocaleString()}.
    </div>
  );
}
