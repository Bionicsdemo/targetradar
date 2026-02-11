import { describe, it, expect } from 'vitest';

import { scoreGeneticEvidence } from '../genetic-evidence';
import { scoreChemicalTractability } from '../chemical-tractability';
import { scoreStructuralReadiness } from '../structural-readiness';
import { scoreClinicalHistory } from '../clinical-history';
import { scoreRegulatoryGenomics } from '../regulatory-genomics';
import { scoreLiteratureDepth } from '../literature-depth';
import { scoreInnovationSignal } from '../innovation-signal';
import { calculateScores } from '../engine';
import { DIMENSION_WEIGHTS } from '../../types/scoring';
import { linearScale } from '../../utils/format';

import type { OpenTargetsData, ChEMBLData, AlphaFoldData, ClinicalTrialsData, AlphaGenomeData, PubMedData, BioRxivData } from '../../types/target-profile';
import type { DimensionScore, DimensionName } from '../../types/scoring';

// ─────────────────────────────────────────────
// Mock data factories
// ─────────────────────────────────────────────

function makeOpenTargetsData(overrides: Partial<OpenTargetsData> = {}): OpenTargetsData {
  return {
    ensemblId: 'ENSG00000146648',
    approvedSymbol: 'EGFR',
    approvedName: 'epidermal growth factor receptor',
    biotype: 'protein_coding',
    diseaseAssociationCount: 60,
    topDiseaseAssociations: [
      { diseaseId: 'EFO_0001071', diseaseName: 'lung carcinoma', score: 0.93, datasourceDiversity: 10 },
      { diseaseId: 'EFO_0000228', diseaseName: 'glioblastoma', score: 0.87, datasourceDiversity: 8 },
      { diseaseId: 'EFO_0000616', diseaseName: 'head and neck cancer', score: 0.81, datasourceDiversity: 7 },
    ],
    tractability: [
      { label: 'Small Molecule Binding', modality: 'SM', value: true },
      { label: 'Antibody Accessible', modality: 'AB', value: true },
    ],
    ...overrides,
  };
}

function makeChEMBLData(overrides: Partial<ChEMBLData> = {}): ChEMBLData {
  return {
    targetChemblId: 'CHEMBL203',
    compoundCount: 120,
    mechanisms: [
      { mechanismOfAction: 'EGFR inhibitor', moleculeChemblId: 'CHEMBL553', maxPhase: 4, actionType: 'INHIBITOR' },
      { mechanismOfAction: 'Tyrosine kinase inhibitor', moleculeChemblId: 'CHEMBL1421', maxPhase: 4, actionType: 'INHIBITOR' },
      { mechanismOfAction: 'EGFR antagonist', moleculeChemblId: 'CHEMBL1201585', maxPhase: 4, actionType: 'ANTAGONIST' },
    ],
    maxClinicalPhase: 4,
    bioactivityCount: 600,
    potentCompoundCount: 25,
    topCompounds: [],
    topActivities: [],
    ...overrides,
  };
}

function makeAlphaFoldData(overrides: Partial<AlphaFoldData> = {}): AlphaFoldData {
  return {
    uniprotId: 'P00533',
    pdbCount: 25,
    avgPLDDT: 85.3,
    ligandBoundCount: 12,
    bestResolution: 1.8,
    pdbIds: ['4HJO', '5UG9'],
    hasAlphaFold: true,
    ...overrides,
  };
}

function makeClinicalTrialsData(overrides: Partial<ClinicalTrialsData> = {}): ClinicalTrialsData {
  return {
    totalTrials: 150,
    trialsByPhase: { 'PHASE1': 40, 'PHASE2': 50, 'PHASE3': 35, 'PHASE4': 25 },
    activeTrials: 12,
    sponsors: ['Pfizer', 'Novartis', 'Roche', 'AstraZeneca', 'BMS', 'Merck', 'Lilly', 'GSK', 'Takeda', 'Sanofi', 'Amgen', 'Johnson & Johnson', 'AbbVie', 'Bayer', 'Boehringer Ingelheim'],
    recentTrials: 8,
    studies: [],
    trialsByStatus: {},
    sponsorTrialCounts: [],
    ...overrides,
  };
}

function makeAlphaGenomeData(overrides: Partial<AlphaGenomeData> = {}): AlphaGenomeData {
  return {
    regulatoryFeatureCount: 40,
    promoterCount: 5,
    enhancerCount: 8,
    ctcfCount: 6,
    openChromatinCount: 10,
    constrainedElementCount: 20,
    geneLength: 188307,
    chromosome: '7',
    biotype: 'protein_coding',
    transcriptCount: 8,
    regulatoryComplexity: 'high',
    expressionBreadth: 75,
    ...overrides,
  };
}

function makePubMedData(overrides: Partial<PubMedData> = {}): PubMedData {
  return {
    totalPublications: 6000,
    recentPublications: 600,
    drugFocusedPublications: 1200,
    reviewArticles: 120,
    ...overrides,
  };
}

function makeBioRxivData(overrides: Partial<BioRxivData> = {}): BioRxivData {
  return {
    preprints90d: 25,
    preprints30d: 10,
    velocityTrend: 'increasing',
    uniqueGroups: 12,
    recentPreprints: [],
    ...overrides,
  };
}

// ─────────────────────────────────────────────
// Helper: validate DimensionScore shape
// ─────────────────────────────────────────────

function assertValidDimensionScore(result: DimensionScore, expectedDimension: DimensionName) {
  expect(result.dimension).toBe(expectedDimension);
  expect(typeof result.label).toBe('string');
  expect(result.label.length).toBeGreaterThan(0);
  expect(typeof result.score).toBe('number');
  expect(result.score).toBeGreaterThanOrEqual(0);
  expect(result.score).toBeLessThanOrEqual(100);
  expect(typeof result.description).toBe('string');
  expect(Array.isArray(result.components)).toBe(true);

  // Each component's value must not exceed its maxValue
  for (const comp of result.components) {
    expect(comp.value).toBeLessThanOrEqual(comp.maxValue);
    expect(comp.value).toBeGreaterThanOrEqual(0);
  }
}

// ═════════════════════════════════════════════
// 1. linearScale utility
// ═════════════════════════════════════════════

describe('linearScale', () => {
  it('returns 0 when cap is 0', () => {
    expect(linearScale(10, 0, 25)).toBe(0);
  });

  it('returns 0 when value is 0', () => {
    expect(linearScale(0, 50, 25)).toBe(0);
  });

  it('caps at maxScore when value exceeds cap', () => {
    expect(linearScale(100, 50, 25)).toBe(25);
  });

  it('scales linearly within range', () => {
    expect(linearScale(25, 50, 20)).toBe(10);
  });

  it('returns maxScore when value equals cap', () => {
    expect(linearScale(50, 50, 25)).toBe(25);
  });

  it('handles negative cap by returning 0', () => {
    expect(linearScale(10, -5, 25)).toBe(0);
  });
});

// ═════════════════════════════════════════════
// 2. Genetic Evidence Scorer
// ═════════════════════════════════════════════

describe('scoreGeneticEvidence', () => {
  it('returns score 0 with empty components when passed null', () => {
    const result = scoreGeneticEvidence(null);
    expect(result.score).toBe(0);
    expect(result.components).toHaveLength(0);
    expect(result.dimension).toBe('geneticEvidence');
  });

  it('returns a valid DimensionScore shape', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData());
    assertValidDimensionScore(result, 'geneticEvidence');
  });

  it('scores high for EGFR-like data', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData());
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('produces exactly 5 components', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData());
    expect(result.components).toHaveLength(5);
  });

  it('no component exceeds its maxValue', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData());
    for (const c of result.components) {
      expect(c.value).toBeLessThanOrEqual(c.maxValue);
    }
  });

  it('scores 15 for tractability when small molecule is present', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData());
    const tractComp = result.components.find(c => c.name === 'Tractability Bucket');
    expect(tractComp?.value).toBe(15);
  });

  it('scores 10 for tractability when only antibody present', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData({
      tractability: [{ label: 'Ab', modality: 'AB', value: true }],
    }));
    const tractComp = result.components.find(c => c.name === 'Tractability Bucket');
    expect(tractComp?.value).toBe(10);
  });

  it('scores 0 for tractability when no tractability data', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData({ tractability: [] }));
    const tractComp = result.components.find(c => c.name === 'Tractability Bucket');
    expect(tractComp?.value).toBe(0);
  });

  it('caps diseaseAssociationCount at 50', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData({ diseaseAssociationCount: 200 }));
    const dacComp = result.components.find(c => c.name === 'Disease Association Count');
    expect(dacComp?.value).toBe(25);
  });

  it('assigns geneticConstraint=15 when associations > 20', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData({ diseaseAssociationCount: 25 }));
    const gc = result.components.find(c => c.name === 'Genetic Constraint');
    expect(gc?.value).toBe(15);
  });

  it('assigns geneticConstraint=3 when associations <= 3', () => {
    const result = scoreGeneticEvidence(makeOpenTargetsData({
      diseaseAssociationCount: 2,
    }));
    const gc = result.components.find(c => c.name === 'Genetic Constraint');
    expect(gc?.value).toBe(3);
  });
});

// ═════════════════════════════════════════════
// 3. Chemical Tractability Scorer
// ═════════════════════════════════════════════

describe('scoreChemicalTractability', () => {
  it('returns score 0 with empty components when passed null', () => {
    const result = scoreChemicalTractability(null);
    expect(result.score).toBe(0);
    expect(result.components).toHaveLength(0);
    expect(result.dimension).toBe('chemicalTractability');
  });

  it('returns a valid DimensionScore shape', () => {
    const result = scoreChemicalTractability(makeChEMBLData());
    assertValidDimensionScore(result, 'chemicalTractability');
  });

  it('scores high for EGFR-like data', () => {
    const result = scoreChemicalTractability(makeChEMBLData());
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it('maxClinicalPhase 4 gives 30 points', () => {
    const result = scoreChemicalTractability(makeChEMBLData({ maxClinicalPhase: 4 }));
    const comp = result.components.find(c => c.name === 'Max Clinical Phase');
    expect(comp?.value).toBe(30);
  });

  it('maxClinicalPhase 0 gives 0 points', () => {
    const result = scoreChemicalTractability(makeChEMBLData({ maxClinicalPhase: 0 }));
    const comp = result.components.find(c => c.name === 'Max Clinical Phase');
    expect(comp?.value).toBe(0);
  });

  it('compound count caps at 100', () => {
    const result = scoreChemicalTractability(makeChEMBLData({ compoundCount: 500 }));
    const comp = result.components.find(c => c.name === 'Compound Count');
    expect(comp?.value).toBe(20);
  });

  it('mechanism diversity counts unique mechanisms', () => {
    const result = scoreChemicalTractability(makeChEMBLData({
      mechanisms: [
        { mechanismOfAction: 'EGFR inhibitor', moleculeChemblId: 'C1', maxPhase: 4, actionType: 'INHIBITOR' },
        { mechanismOfAction: 'EGFR inhibitor', moleculeChemblId: 'C2', maxPhase: 4, actionType: 'INHIBITOR' },
      ],
    }));
    const comp = result.components.find(c => c.name === 'Mechanism Diversity');
    // 1 unique mechanism / 5 cap * 15 = 3
    expect(comp?.value).toBe(3);
  });

  it('produces exactly 5 components', () => {
    const result = scoreChemicalTractability(makeChEMBLData());
    expect(result.components).toHaveLength(5);
  });
});

// ═════════════════════════════════════════════
// 4. Structural Readiness Scorer
// ═════════════════════════════════════════════

describe('scoreStructuralReadiness', () => {
  it('returns score 0 with empty components when passed null', () => {
    const result = scoreStructuralReadiness(null);
    expect(result.score).toBe(0);
    expect(result.components).toHaveLength(0);
    expect(result.dimension).toBe('structuralReadiness');
  });

  it('returns a valid DimensionScore shape', () => {
    const result = scoreStructuralReadiness(makeAlphaFoldData());
    assertValidDimensionScore(result, 'structuralReadiness');
  });

  it('scores high for EGFR-like data', () => {
    const result = scoreStructuralReadiness(makeAlphaFoldData());
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it('resolution < 2.0 gives 20 points', () => {
    const result = scoreStructuralReadiness(makeAlphaFoldData({ bestResolution: 1.5 }));
    const comp = result.components.find(c => c.name === 'Resolution Quality');
    expect(comp?.value).toBe(20);
  });

  it('resolution between 2.0 and 3.0 gives 12 points', () => {
    const result = scoreStructuralReadiness(makeAlphaFoldData({ bestResolution: 2.5 }));
    const comp = result.components.find(c => c.name === 'Resolution Quality');
    expect(comp?.value).toBe(12);
  });

  it('resolution >= 3.0 gives 5 points', () => {
    const result = scoreStructuralReadiness(makeAlphaFoldData({ bestResolution: 4.0 }));
    const comp = result.components.find(c => c.name === 'Resolution Quality');
    expect(comp?.value).toBe(5);
  });

  it('pdbCount caps at 20', () => {
    const result = scoreStructuralReadiness(makeAlphaFoldData({ pdbCount: 50 }));
    const comp = result.components.find(c => c.name === 'Experimental Structures');
    expect(comp?.value).toBe(30);
  });

  it('alphafold confidence scales with pLDDT', () => {
    const result = scoreStructuralReadiness(makeAlphaFoldData({ avgPLDDT: 100 }));
    const comp = result.components.find(c => c.name === 'AlphaFold Confidence');
    expect(comp?.value).toBe(25);
  });

  it('produces exactly 4 components', () => {
    const result = scoreStructuralReadiness(makeAlphaFoldData());
    expect(result.components).toHaveLength(4);
  });
});

// ═════════════════════════════════════════════
// 5. Clinical History Scorer
// ═════════════════════════════════════════════

describe('scoreClinicalHistory', () => {
  it('returns score 0 with empty components when passed null', () => {
    const result = scoreClinicalHistory(null);
    expect(result.score).toBe(0);
    expect(result.components).toHaveLength(0);
    expect(result.dimension).toBe('clinicalHistory');
  });

  it('returns a valid DimensionScore shape', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData());
    assertValidDimensionScore(result, 'clinicalHistory');
  });

  it('scores high for EGFR-like data', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData());
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('PHASE4 gives factor 1.0 => 30 points', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData({
      trialsByPhase: { 'PHASE4': 5 },
    }));
    const comp = result.components.find(c => c.name === 'Phase Progression');
    expect(comp?.value).toBe(30);
  });

  it('PHASE3 only gives factor 0.85 => 25.5 points', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData({
      trialsByPhase: { 'PHASE3': 10 },
    }));
    const comp = result.components.find(c => c.name === 'Phase Progression');
    expect(comp?.value).toBeCloseTo(25.5);
  });

  it('PHASE2 only gives factor 0.60 => 18 points', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData({
      trialsByPhase: { 'PHASE2': 10 },
    }));
    const comp = result.components.find(c => c.name === 'Phase Progression');
    expect(comp?.value).toBe(18);
  });

  it('PHASE1 only gives factor 0.35 => 10.5 points', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData({
      trialsByPhase: { 'PHASE1': 5 },
    }));
    const comp = result.components.find(c => c.name === 'Phase Progression');
    expect(comp?.value).toBeCloseTo(10.5);
  });

  it('no phase data gives 0 points for phase progression', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData({
      trialsByPhase: {},
    }));
    const comp = result.components.find(c => c.name === 'Phase Progression');
    expect(comp?.value).toBe(0);
  });

  it('recentTrials > 5 gives 15 points', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData({ recentTrials: 10 }));
    const comp = result.components.find(c => c.name === 'Recent Activity');
    expect(comp?.value).toBe(15);
  });

  it('recentTrials = 3 gives 9 points', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData({ recentTrials: 3 }));
    const comp = result.components.find(c => c.name === 'Recent Activity');
    expect(comp?.value).toBe(9);
  });

  it('produces exactly 5 components', () => {
    const result = scoreClinicalHistory(makeClinicalTrialsData());
    expect(result.components).toHaveLength(5);
  });
});

// ═════════════════════════════════════════════
// 6. Regulatory Genomics Scorer
// ═════════════════════════════════════════════

describe('scoreRegulatoryGenomics', () => {
  it('returns score 0 with empty components when passed null', () => {
    const result = scoreRegulatoryGenomics(null);
    expect(result.score).toBe(0);
    expect(result.components).toHaveLength(0);
    expect(result.dimension).toBe('regulatoryGenomics');
  });

  it('returns a valid DimensionScore shape', () => {
    const result = scoreRegulatoryGenomics(makeAlphaGenomeData());
    assertValidDimensionScore(result, 'regulatoryGenomics');
  });

  it('scores in a reasonable range for EGFR-like data', () => {
    const result = scoreRegulatoryGenomics(makeAlphaGenomeData());
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('expressionBreadth 100 gives 15 points', () => {
    const result = scoreRegulatoryGenomics(makeAlphaGenomeData({ expressionBreadth: 100 }));
    const comp = result.components.find(c => c.name === 'Expression Breadth');
    expect(comp?.value).toBe(15);
  });

  it('expressionBreadth 0 gives 0 points', () => {
    const result = scoreRegulatoryGenomics(makeAlphaGenomeData({ expressionBreadth: 0 }));
    const comp = result.components.find(c => c.name === 'Expression Breadth');
    expect(comp?.value).toBe(0);
  });

  it('regulatoryFeatureCount caps at 50', () => {
    const result = scoreRegulatoryGenomics(makeAlphaGenomeData({ regulatoryFeatureCount: 100 }));
    const comp = result.components.find(c => c.name === 'Regulatory Features');
    expect(comp?.value).toBe(25);
  });

  it('produces exactly 5 components', () => {
    const result = scoreRegulatoryGenomics(makeAlphaGenomeData());
    expect(result.components).toHaveLength(5);
  });

  it('handles minimal data (all zeros)', () => {
    const result = scoreRegulatoryGenomics(makeAlphaGenomeData({
      regulatoryFeatureCount: 0,
      promoterCount: 0,
      enhancerCount: 0,
      constrainedElementCount: 0,
      expressionBreadth: 0,
      transcriptCount: 0,
    }));
    expect(result.score).toBe(0);
  });
});

// ═════════════════════════════════════════════
// 7. Literature Depth Scorer
// ═════════════════════════════════════════════

describe('scoreLiteratureDepth', () => {
  it('returns score 0 with empty components when passed null', () => {
    const result = scoreLiteratureDepth(null);
    expect(result.score).toBe(0);
    expect(result.components).toHaveLength(0);
    expect(result.dimension).toBe('literatureDepth');
  });

  it('returns a valid DimensionScore shape', () => {
    const result = scoreLiteratureDepth(makePubMedData());
    assertValidDimensionScore(result, 'literatureDepth');
  });

  it('scores high for well-published targets', () => {
    const result = scoreLiteratureDepth(makePubMedData());
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('recencyRatio > 10% gives 15 points', () => {
    const result = scoreLiteratureDepth(makePubMedData({
      totalPublications: 1000,
      recentPublications: 200, // 20%
    }));
    const comp = result.components.find(c => c.name === 'Recency Ratio');
    expect(comp?.value).toBe(15);
  });

  it('recencyRatio <= 10% gives 8 points', () => {
    const result = scoreLiteratureDepth(makePubMedData({
      totalPublications: 5000,
      recentPublications: 100, // 2%
    }));
    const comp = result.components.find(c => c.name === 'Recency Ratio');
    expect(comp?.value).toBe(8);
  });

  it('totalPublications = 0 still works (recencyRatio fallback)', () => {
    const result = scoreLiteratureDepth(makePubMedData({
      totalPublications: 0,
      recentPublications: 0,
      drugFocusedPublications: 0,
      reviewArticles: 0,
    }));
    expect(result.score).toBe(8); // only recencyRatio contributes 8
  });

  it('produces exactly 5 components', () => {
    const result = scoreLiteratureDepth(makePubMedData());
    expect(result.components).toHaveLength(5);
  });
});

// ═════════════════════════════════════════════
// 8. Innovation Signal Scorer
// ═════════════════════════════════════════════

describe('scoreInnovationSignal', () => {
  it('returns score 0 with empty components when passed null', () => {
    const result = scoreInnovationSignal(null);
    expect(result.score).toBe(0);
    expect(result.components).toHaveLength(0);
    expect(result.dimension).toBe('innovationSignal');
  });

  it('returns a valid DimensionScore shape', () => {
    const result = scoreInnovationSignal(makeBioRxivData());
    assertValidDimensionScore(result, 'innovationSignal');
  });

  it('scores high for active preprint targets', () => {
    const result = scoreInnovationSignal(makeBioRxivData());
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('increasing velocity gives 25 points', () => {
    const result = scoreInnovationSignal(makeBioRxivData({ velocityTrend: 'increasing' }));
    const comp = result.components.find(c => c.name === 'Velocity Trend');
    expect(comp?.value).toBe(25);
  });

  it('stable velocity gives 15 points', () => {
    const result = scoreInnovationSignal(makeBioRxivData({ velocityTrend: 'stable' }));
    const comp = result.components.find(c => c.name === 'Velocity Trend');
    expect(comp?.value).toBe(15);
  });

  it('decreasing velocity gives 8 points', () => {
    const result = scoreInnovationSignal(makeBioRxivData({ velocityTrend: 'decreasing' }));
    const comp = result.components.find(c => c.name === 'Velocity Trend');
    expect(comp?.value).toBe(8);
  });

  it('preprints90d caps at 20', () => {
    const result = scoreInnovationSignal(makeBioRxivData({ preprints90d: 50 }));
    const comp = result.components.find(c => c.name === 'Preprints (90 days)');
    expect(comp?.value).toBe(35);
  });

  it('uniqueGroups caps at 10', () => {
    const result = scoreInnovationSignal(makeBioRxivData({ uniqueGroups: 20 }));
    const comp = result.components.find(c => c.name === 'Novelty Indicators');
    expect(comp?.value).toBe(15);
  });

  it('produces exactly 4 components', () => {
    const result = scoreInnovationSignal(makeBioRxivData());
    expect(result.components).toHaveLength(4);
  });

  it('minimal data scores low', () => {
    const result = scoreInnovationSignal(makeBioRxivData({
      preprints90d: 0,
      preprints30d: 0,
      velocityTrend: 'decreasing',
      uniqueGroups: 0,
    }));
    expect(result.score).toBe(8); // only velocity decreasing contributes 8
  });
});

// ═════════════════════════════════════════════
// 9. Engine — calculateScores
// ═════════════════════════════════════════════

describe('calculateScores (engine)', () => {
  it('returns 0 overall when all data is null', () => {
    const result = calculateScores({
      openTargets: null,
      chembl: null,
      pubmed: null,
      clinicalTrials: null,
      biorxiv: null,
      alphafold: null,
      alphagenome: null,
    });
    expect(result.value).toBe(0);
    expect(result.dimensions.geneticEvidence.score).toBe(0);
    expect(result.dimensions.chemicalTractability.score).toBe(0);
    expect(result.dimensions.structuralReadiness.score).toBe(0);
    expect(result.dimensions.clinicalHistory.score).toBe(0);
    expect(result.dimensions.literatureDepth.score).toBe(0);
    expect(result.dimensions.innovationSignal.score).toBe(0);
    expect(result.dimensions.regulatoryGenomics.score).toBe(0);
  });

  it('has all 7 dimension keys', () => {
    const result = calculateScores({
      openTargets: null,
      chembl: null,
      pubmed: null,
      clinicalTrials: null,
      biorxiv: null,
      alphafold: null,
      alphagenome: null,
    });
    const keys = Object.keys(result.dimensions);
    expect(keys).toHaveLength(7);
    expect(keys).toContain('geneticEvidence');
    expect(keys).toContain('chemicalTractability');
    expect(keys).toContain('structuralReadiness');
    expect(keys).toContain('clinicalHistory');
    expect(keys).toContain('literatureDepth');
    expect(keys).toContain('innovationSignal');
    expect(keys).toContain('regulatoryGenomics');
  });

  it('weights sum to 1.00', () => {
    const sum = Object.values(DIMENSION_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  it('correctly applies weights in weighted average', () => {
    const result = calculateScores({
      openTargets: makeOpenTargetsData(),
      chembl: makeChEMBLData(),
      pubmed: makePubMedData(),
      clinicalTrials: makeClinicalTrialsData(),
      biorxiv: makeBioRxivData(),
      alphafold: makeAlphaFoldData(),
      alphagenome: makeAlphaGenomeData(),
    });

    // Manually compute weighted average from dimension scores
    const dims = result.dimensions;
    const expected = Math.round(
      dims.geneticEvidence.score * DIMENSION_WEIGHTS.geneticEvidence +
      dims.chemicalTractability.score * DIMENSION_WEIGHTS.chemicalTractability +
      dims.structuralReadiness.score * DIMENSION_WEIGHTS.structuralReadiness +
      dims.clinicalHistory.score * DIMENSION_WEIGHTS.clinicalHistory +
      dims.literatureDepth.score * DIMENSION_WEIGHTS.literatureDepth +
      dims.innovationSignal.score * DIMENSION_WEIGHTS.innovationSignal +
      dims.regulatoryGenomics.score * DIMENSION_WEIGHTS.regulatoryGenomics
    );

    expect(result.value).toBe(expected);
  });

  it('returns high overall for EGFR-like data', () => {
    const result = calculateScores({
      openTargets: makeOpenTargetsData(),
      chembl: makeChEMBLData(),
      pubmed: makePubMedData(),
      clinicalTrials: makeClinicalTrialsData(),
      biorxiv: makeBioRxivData(),
      alphafold: makeAlphaFoldData(),
      alphagenome: makeAlphaGenomeData(),
    });
    expect(result.value).toBeGreaterThanOrEqual(70);
  });

  it('returns weights matching DIMENSION_WEIGHTS', () => {
    const result = calculateScores({
      openTargets: null,
      chembl: null,
      pubmed: null,
      clinicalTrials: null,
      biorxiv: null,
      alphafold: null,
      alphagenome: null,
    });
    expect(result.weights).toEqual(DIMENSION_WEIGHTS);
  });

  it('overall score is between 0 and 100', () => {
    const result = calculateScores({
      openTargets: makeOpenTargetsData(),
      chembl: makeChEMBLData(),
      pubmed: makePubMedData(),
      clinicalTrials: makeClinicalTrialsData(),
      biorxiv: makeBioRxivData(),
      alphafold: makeAlphaFoldData(),
      alphagenome: makeAlphaGenomeData(),
    });
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(100);
  });

  it('partial data still produces valid scores', () => {
    const result = calculateScores({
      openTargets: makeOpenTargetsData(),
      chembl: null,
      pubmed: null,
      clinicalTrials: null,
      biorxiv: null,
      alphafold: null,
      alphagenome: null,
    });
    expect(result.dimensions.geneticEvidence.score).toBeGreaterThan(0);
    expect(result.dimensions.chemicalTractability.score).toBe(0);
    expect(result.value).toBeGreaterThan(0);
    expect(result.value).toBeLessThanOrEqual(100);
  });
});

// ═════════════════════════════════════════════
// 10. Cross-cutting: score range validation
// ═════════════════════════════════════════════

describe('Score range validation across all scorers', () => {
  const scorers = [
    { name: 'geneticEvidence', fn: () => scoreGeneticEvidence(makeOpenTargetsData()), dim: 'geneticEvidence' as DimensionName },
    { name: 'chemicalTractability', fn: () => scoreChemicalTractability(makeChEMBLData()), dim: 'chemicalTractability' as DimensionName },
    { name: 'structuralReadiness', fn: () => scoreStructuralReadiness(makeAlphaFoldData()), dim: 'structuralReadiness' as DimensionName },
    { name: 'clinicalHistory', fn: () => scoreClinicalHistory(makeClinicalTrialsData()), dim: 'clinicalHistory' as DimensionName },
    { name: 'regulatoryGenomics', fn: () => scoreRegulatoryGenomics(makeAlphaGenomeData()), dim: 'regulatoryGenomics' as DimensionName },
    { name: 'literatureDepth', fn: () => scoreLiteratureDepth(makePubMedData()), dim: 'literatureDepth' as DimensionName },
    { name: 'innovationSignal', fn: () => scoreInnovationSignal(makeBioRxivData()), dim: 'innovationSignal' as DimensionName },
  ];

  for (const scorer of scorers) {
    it(`${scorer.name} score is in [0, 100]`, () => {
      const result = scorer.fn();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it(`${scorer.name} components sum to <= 100`, () => {
      const result = scorer.fn();
      const sum = result.components.reduce((a, c) => a + c.maxValue, 0);
      expect(sum).toBeLessThanOrEqual(100);
    });
  }
});
