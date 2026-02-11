export const API_TIMEOUT_MS = 15_000;
export const API_RETRY_COUNT = 1;
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const OPEN_TARGETS_GRAPHQL_URL = 'https://api.platform.opentargets.org/api/v4/graphql';
export const CHEMBL_BASE_URL = 'https://www.ebi.ac.uk/chembl/api/data';
export const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
export const CLINICAL_TRIALS_BASE_URL = 'https://clinicaltrials.gov/api/v2';
export const BIORXIV_BASE_URL = 'https://api.biorxiv.org';
export const ALPHAFOLD_BASE_URL = 'https://alphafold.ebi.ac.uk/api';
export const PDB_SEARCH_URL = 'https://search.rcsb.org/rcsbsearch/v2/query';
export const UNIPROT_BASE_URL = 'https://rest.uniprot.org/uniprotkb';
export const ENSEMBL_REST_URL = 'https://rest.ensembl.org';

export const SCORE_COLORS = {
  excellent: '#10B981', // >= 80
  good: '#3B82F6',      // >= 60
  moderate: '#F59E0B',  // >= 40
  low: '#F97316',       // >= 20
  veryLow: '#EF4444',   // < 20
} as const;

export function getScoreColor(score: number): string {
  if (score >= 80) return SCORE_COLORS.excellent;
  if (score >= 60) return SCORE_COLORS.good;
  if (score >= 40) return SCORE_COLORS.moderate;
  if (score >= 20) return SCORE_COLORS.low;
  return SCORE_COLORS.veryLow;
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Low';
  return 'Very Low';
}

export const DIMENSION_COLORS: Record<string, string> = {
  geneticEvidence: '#3B82F6',       // Blue — trust, data
  chemicalTractability: '#14B8A6',  // Teal — chemistry
  structuralReadiness: '#8B5CF6',   // Violet — 3D structure
  clinicalHistory: '#F59E0B',       // Amber — clinical
  regulatoryGenomics: '#10B981',    // Emerald — genomics
  literatureDepth: '#F97316',       // Orange — publication energy
  innovationSignal: '#EC4899',      // Rose — emerging
} as const;

export function getDimensionColor(dimension: string): string {
  return DIMENSION_COLORS[dimension] ?? '#3B82F6';
}

export const DEMO_TARGETS = ['EGFR', 'KRAS', 'BRCA1'] as const;

export const CHEMBL_IMAGE_BASE_URL = 'https://www.ebi.ac.uk/chembl/api/data/image';

export const PHASE_COLORS: Record<number, string> = {
  4: '#10B981',
  3: '#3B82F6',
  2: '#F59E0B',
  1: '#64748B',
  0: '#475569',
};

export function getPhaseColor(phase: number): string {
  return PHASE_COLORS[phase] ?? PHASE_COLORS[0]!;
}

export function getPhaseLabel(phase: number): string {
  if (phase === 4) return 'Approved';
  if (phase >= 1) return `Phase ${phase}`;
  return 'Preclinical';
}
