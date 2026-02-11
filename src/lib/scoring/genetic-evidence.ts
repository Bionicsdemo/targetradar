import type { DimensionScore, ScoreComponent } from '../types/scoring';
import type { OpenTargetsData } from '../types/target-profile';
import { linearScale } from '../utils/format';

// Genetic evidence is the strongest predictor of clinical success (Nelson et al.,
// Nature Genetics 2015). Targets with genetic links to disease have 2x the
// probability of reaching approval compared to targets without genetic support.
export function scoreGeneticEvidence(data: OpenTargetsData | null): DimensionScore {
  if (!data) {
    return {
      dimension: 'geneticEvidence',
      label: 'Genetic Evidence',
      score: 0,
      components: [],
      description: 'No genetic evidence data available.',
    };
  }

  // Cap at 50 diseases — targets with more associations are well-validated
  // but additional associations beyond 50 provide diminishing evidence value
  const diseaseCount = linearScale(data.diseaseAssociationCount, 50, 25);

  const topScore = data.topDiseaseAssociations.length > 0
    ? data.topDiseaseAssociations[0].score * 25
    : 0;

  // Datasource diversity rewards targets supported by multiple independent evidence
  // types (GWAS, functional genomics, rare disease) — convergent evidence is stronger
  const allSources = new Set<string>();
  data.topDiseaseAssociations.forEach((a) => {
    allSources.add(`disease-${a.diseaseId}`);
  });
  const sourceDiversity = data.topDiseaseAssociations.length > 0
    ? linearScale(
        Math.max(...data.topDiseaseAssociations.map((a) => a.datasourceDiversity)),
        12,
        20
      )
    : 0;

  // Tractability bucket gives bonus points for targets with known druggable modalities.
  // Small molecule (15pts) > antibody (10pts) because oral bioavailability broadens use.
  const hasSmallMolecule = data.tractability.some(
    (t) => t.modality === 'SM' && t.value
  );
  const hasAntibody = data.tractability.some(
    (t) => t.modality === 'AB' && t.value
  );
  const tractabilityBucket = hasSmallMolecule ? 15 : hasAntibody ? 10 : data.tractability.length > 0 ? 5 : 0;

  // Genetic constraint heuristic: highly constrained genes (many disease associations)
  // are less tolerant of mutations, suggesting strong biological function — ideal for targets
  const geneticConstraint = data.diseaseAssociationCount > 20 ? 15
    : data.diseaseAssociationCount > 10 ? 10
    : data.diseaseAssociationCount > 3 ? 7
    : 3;

  const components: ScoreComponent[] = [
    { name: 'Disease Association Count', value: diseaseCount, maxValue: 25, description: `${data.diseaseAssociationCount} associations (cap: 50)` },
    { name: 'Top Association Score', value: topScore, maxValue: 25, description: `Best score: ${data.topDiseaseAssociations[0]?.score.toFixed(2) ?? '0'}` },
    { name: 'Datasource Diversity', value: sourceDiversity, maxValue: 20, description: `Diverse evidence sources` },
    { name: 'Tractability Bucket', value: tractabilityBucket, maxValue: 15, description: hasSmallMolecule ? 'Small molecule tractable' : hasAntibody ? 'Antibody tractable' : 'Limited tractability data' },
    { name: 'Genetic Constraint', value: geneticConstraint, maxValue: 15, description: `Based on association breadth` },
  ];

  const score = Math.round(components.reduce((sum, c) => sum + c.value, 0));

  return {
    dimension: 'geneticEvidence',
    label: 'Genetic Evidence',
    score: Math.min(100, score),
    components,
    description: `${data.diseaseAssociationCount} disease associations across multiple evidence sources.`,
  };
}
