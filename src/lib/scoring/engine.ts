import type { DimensionName, DimensionScore, OverallScore } from '../types/scoring';
import { DIMENSION_WEIGHTS } from '../types/scoring';
import type {
  OpenTargetsData,
  ChEMBLData,
  PubMedData,
  ClinicalTrialsData,
  BioRxivData,
  AlphaFoldData,
  AlphaGenomeData,
} from '../types/target-profile';
import { scoreGeneticEvidence } from './genetic-evidence';
import { scoreChemicalTractability } from './chemical-tractability';
import { scoreStructuralReadiness } from './structural-readiness';
import { scoreClinicalHistory } from './clinical-history';
import { scoreLiteratureDepth } from './literature-depth';
import { scoreInnovationSignal } from './innovation-signal';
import { scoreRegulatoryGenomics } from './regulatory-genomics';

interface RawDataInputs {
  openTargets: OpenTargetsData | null;
  chembl: ChEMBLData | null;
  pubmed: PubMedData | null;
  clinicalTrials: ClinicalTrialsData | null;
  biorxiv: BioRxivData | null;
  alphafold: AlphaFoldData | null;
  alphagenome: AlphaGenomeData | null;
}

// Score each dimension independently, then combine via weighted average.
// Each scoring function is a pure function: (rawData) => DimensionScore (0-100).
// Null inputs gracefully return score 0 — if one API fails, the others still work.
export function calculateScores(raw: RawDataInputs): OverallScore {
  const dimensions: Record<DimensionName, DimensionScore> = {
    geneticEvidence: scoreGeneticEvidence(raw.openTargets),
    chemicalTractability: scoreChemicalTractability(raw.chembl),
    structuralReadiness: scoreStructuralReadiness(raw.alphafold),
    clinicalHistory: scoreClinicalHistory(raw.clinicalTrials),
    literatureDepth: scoreLiteratureDepth(raw.pubmed),
    innovationSignal: scoreInnovationSignal(raw.biorxiv),
    regulatoryGenomics: scoreRegulatoryGenomics(raw.alphagenome),
  };

  // Weighted average: Chemical Tractability (22%) is highest because a target without
  // a feasible drug molecule is academic, not actionable. Genetic Evidence and Clinical
  // History (18% each) are the two strongest de-risking signals. Innovation Signal (8%)
  // is lowest because preprints are noisy leading indicators.
  const overall = Object.entries(DIMENSION_WEIGHTS).reduce(
    (sum, [dim, weight]) => sum + dimensions[dim as DimensionName].score * weight,
    0
  );

  return {
    value: Math.round(overall),
    dimensions,
    weights: DIMENSION_WEIGHTS,
  };
}
