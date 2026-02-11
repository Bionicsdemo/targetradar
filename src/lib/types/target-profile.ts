import type { DimensionName, DimensionScore } from './scoring';

export interface ServiceResult<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  source: string;
  timestamp: number;
  cached: boolean;
  responseTimeMs: number;
}

export interface OpenTargetsData {
  ensemblId: string;
  approvedSymbol: string;
  approvedName: string;
  biotype: string;
  diseaseAssociationCount: number;
  topDiseaseAssociations: Array<{
    diseaseId: string;
    diseaseName: string;
    score: number;
    datasourceDiversity: number;
  }>;
  tractability: Array<{
    label: string;
    modality: string;
    value: boolean;
  }>;
}

export interface CompoundDetail {
  chemblId: string;
  preferredName: string | null;
  moleculeType: string;
  maxPhase: number;
  smiles: string | null;
  molecularWeight: number | null;
  alogp: number | null;
  psa: number | null;
  hba: number | null;
  hbd: number | null;
  numRo5Violations: number | null;
  aromaticRings: number | null;
  rotatableBonds: number | null;
  structureImageUrl: string;
  pchemblValue: number | null;
  activityType: string | null;
}

export interface CompoundActivity {
  moleculeChemblId: string;
  pchemblValue: number;
  standardType: string | null;
  standardValue: number | null;
}

export interface ChEMBLData {
  targetChemblId: string;
  compoundCount: number;
  mechanisms: Array<{
    mechanismOfAction: string;
    moleculeChemblId: string;
    maxPhase: number;
    actionType: string;
  }>;
  maxClinicalPhase: number;
  bioactivityCount: number;
  potentCompoundCount: number;
  topCompounds: CompoundDetail[];
  topActivities: CompoundActivity[];
}

export interface PubMedData {
  totalPublications: number;
  recentPublications: number;
  drugFocusedPublications: number;
  reviewArticles: number;
}

export interface ClinicalTrialsData {
  totalTrials: number;
  trialsByPhase: Record<string, number>;
  activeTrials: number;
  sponsors: string[];
  recentTrials: number;
  studies: Array<{
    nctId: string;
    title: string;
    phase: string;
    status: string;
    sponsor: string;
    startDate: string;
    enrollment: number | null;
    conditions: string[];
    interventions: string[];
  }>;
  trialsByStatus: Record<string, number>;
  sponsorTrialCounts: Array<{ sponsor: string; count: number }>;
}

export interface BioRxivData {
  preprints90d: number;
  preprints30d: number;
  velocityTrend: 'increasing' | 'stable' | 'decreasing';
  uniqueGroups: number;
  recentPreprints: Array<{
    doi: string;
    title: string;
    date: string;
    authors: string;
    institution: string;
  }>;
}

export interface AlphaFoldData {
  uniprotId: string;
  pdbCount: number;
  avgPLDDT: number;
  ligandBoundCount: number;
  bestResolution: number;
  pdbIds: string[];
  hasAlphaFold: boolean;
}

export interface AlphaGenomeData {
  regulatoryFeatureCount: number;
  promoterCount: number;
  enhancerCount: number;
  ctcfCount: number;
  openChromatinCount: number;
  constrainedElementCount: number;
  geneLength: number;
  chromosome: string;
  biotype: string;
  transcriptCount: number;
  regulatoryComplexity: 'high' | 'moderate' | 'low';
  expressionBreadth: number;
}

export interface TargetProfile {
  gene: string;
  ensemblId: string;
  uniprotId: string;
  approvedName: string;
  scores: {
    overall: number;
    dimensions: Record<DimensionName, DimensionScore>;
  };
  rawData: {
    openTargets: ServiceResult<OpenTargetsData>;
    chembl: ServiceResult<ChEMBLData>;
    pubmed: ServiceResult<PubMedData>;
    clinicalTrials: ServiceResult<ClinicalTrialsData>;
    biorxiv: ServiceResult<BioRxivData>;
    alphafold: ServiceResult<AlphaFoldData>;
    alphagenome: ServiceResult<AlphaGenomeData>;
  };
  metadata: {
    analysisTimestamp: number;
    totalResponseTimeMs: number;
    servicesCompleted: number;
    servicesFailed: number;
  };
}

export interface AnalysisProgress {
  source: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
  responseTimeMs?: number;
  dataCount?: number;
  dataLabel?: string;
  error?: string;
}
