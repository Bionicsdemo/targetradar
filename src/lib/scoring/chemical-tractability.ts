import type { DimensionScore, ScoreComponent } from '../types/scoring';
import type { ChEMBLData } from '../types/target-profile';
import { linearScale } from '../utils/format';

// Chemical tractability measures whether a drug can actually be made for this target.
// This dimension gets the highest weight (22%) because without a molecule,
// even the best-validated target remains academically interesting but clinically useless.
export function scoreChemicalTractability(data: ChEMBLData | null): DimensionScore {
  if (!data) {
    return {
      dimension: 'chemicalTractability',
      label: 'Chemical Tractability',
      score: 0,
      components: [],
      description: 'No chemical tractability data available.',
    };
  }

  // Max clinical phase is the strongest signal — Phase 4 (approved) is 30 points.
  // A target that already has an approved drug is de-risked for further investment.
  const maxPhaseScore = (data.maxClinicalPhase / 4) * 30;
  // Cap at 100 compounds — beyond this, the target is well-explored chemically
  const compoundCountScore = linearScale(data.compoundCount, 100, 20);

  const uniqueMechanisms = new Set(data.mechanisms.map((m) => m.mechanismOfAction)).size;
  const mechanismDiversityScore = linearScale(uniqueMechanisms, 5, 15);

  // pChEMBL >= 6 (IC50 <= 1uM) is the standard medicinal chemistry threshold
  // for a "hit" — 500 activities represents a deeply explored chemical space
  const bioactivityScore = linearScale(data.bioactivityCount, 500, 20);
  // pChEMBL >= 7 (IC50 <= 100nM) identifies genuinely potent compounds
  // that are candidates for lead optimization — 20 such compounds is exceptional
  const potentScore = linearScale(data.potentCompoundCount, 20, 15);

  const components: ScoreComponent[] = [
    { name: 'Max Clinical Phase', value: maxPhaseScore, maxValue: 30, description: `Phase ${data.maxClinicalPhase} reached` },
    { name: 'Compound Count', value: compoundCountScore, maxValue: 20, description: `${data.compoundCount} unique compounds (cap: 100)` },
    { name: 'Mechanism Diversity', value: mechanismDiversityScore, maxValue: 15, description: `${uniqueMechanisms} distinct mechanisms (cap: 5)` },
    { name: 'Bioactivity Density', value: bioactivityScore, maxValue: 20, description: `${data.bioactivityCount} activities with pChEMBL ≥ 6 (cap: 500)` },
    { name: 'Potent Compounds', value: potentScore, maxValue: 15, description: `${data.potentCompoundCount} with pChEMBL ≥ 7 (cap: 20)` },
  ];

  const score = Math.round(components.reduce((sum, c) => sum + c.value, 0));

  return {
    dimension: 'chemicalTractability',
    label: 'Chemical Tractability',
    score: Math.min(100, score),
    components,
    description: `${data.compoundCount} compounds, max Phase ${data.maxClinicalPhase}, ${uniqueMechanisms} mechanisms.`,
  };
}
