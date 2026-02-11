export type DimensionName =
  | 'geneticEvidence'
  | 'chemicalTractability'
  | 'structuralReadiness'
  | 'clinicalHistory'
  | 'literatureDepth'
  | 'innovationSignal'
  | 'regulatoryGenomics';

export interface ScoreComponent {
  name: string;
  value: number;
  maxValue: number;
  description: string;
}

export interface DimensionScore {
  dimension: DimensionName;
  label: string;
  score: number;
  components: ScoreComponent[];
  description: string;
}

export interface OverallScore {
  value: number;
  dimensions: Record<DimensionName, DimensionScore>;
  weights: Record<DimensionName, number>;
}

export const DIMENSION_WEIGHTS: Record<DimensionName, number> = {
  chemicalTractability: 0.22,
  geneticEvidence: 0.18,
  clinicalHistory: 0.18,
  structuralReadiness: 0.13,
  regulatoryGenomics: 0.12,
  literatureDepth: 0.09,
  innovationSignal: 0.08,
};

export const DIMENSION_LABELS: Record<DimensionName, string> = {
  geneticEvidence: 'Genetic Evidence',
  chemicalTractability: 'Chemical Tractability',
  structuralReadiness: 'Structural Readiness',
  clinicalHistory: 'Clinical History',
  literatureDepth: 'Literature Depth',
  innovationSignal: 'Innovation Signal',
  regulatoryGenomics: 'Regulatory Genomics',
};

export const DIMENSION_DESCRIPTIONS: Record<DimensionName, string> = {
  geneticEvidence: 'Strength of genetic links to disease, from GWAS, rare variants, and functional genomics.',
  chemicalTractability: 'Availability of drug-like compounds, existing drugs, and chemical starting points.',
  structuralReadiness: 'Quality and availability of 3D protein structures for drug design.',
  clinicalHistory: 'Track record in clinical trials — phases reached, active studies, and sponsor diversity.',
  literatureDepth: 'Volume and recency of scientific publications and drug-focused research.',
  innovationSignal: 'Recent preprint activity indicating emerging research momentum.',
  regulatoryGenomics: 'Regulatory landscape complexity — enhancers, promoters, constrained elements, and gene expression breadth via AlphaGenome-inspired analysis.',
};
