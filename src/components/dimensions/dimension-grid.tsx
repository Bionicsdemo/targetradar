'use client';

import type { DimensionName, DimensionScore } from '@/lib/types/scoring';
import { DimensionCard } from './dimension-card';

const DIMENSION_ORDER: DimensionName[] = [
  'geneticEvidence',
  'chemicalTractability',
  'structuralReadiness',
  'clinicalHistory',
  'regulatoryGenomics',
  'literatureDepth',
  'innovationSignal',
];

interface DimensionGridProps {
  dimensions: Record<DimensionName, DimensionScore>;
  animate?: boolean;
}

export function DimensionGrid({ dimensions, animate = true }: DimensionGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {DIMENSION_ORDER.map((dim, index) => (
        <DimensionCard
          key={dim}
          dimension={dimensions[dim]}
          dimensionKey={dim}
          index={index}
          animate={animate}
        />
      ))}
    </div>
  );
}
