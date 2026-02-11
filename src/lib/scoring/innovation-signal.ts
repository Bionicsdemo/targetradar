import type { DimensionScore, ScoreComponent } from '../types/scoring';
import type { BioRxivData } from '../types/target-profile';
import { linearScale } from '../utils/format';

// Innovation signal tracks the "temperature" of a target in the research community
// via preprints — the leading indicator of scientific interest 6-12 months before
// peer-reviewed papers appear. Gets lowest weight (8%) due to noise in preprints.
export function scoreInnovationSignal(data: BioRxivData | null): DimensionScore {
  if (!data) {
    return {
      dimension: 'innovationSignal',
      label: 'Innovation Signal',
      score: 0,
      components: [],
      description: 'No preprint data available.',
    };
  }

  // 90-day window captures medium-term trend; 20 preprints in 3 months is exceptional
  // and indicates a target at the peak of research interest (e.g., post-CRISPR-screen hit)
  const preprint90dScore = linearScale(data.preprints90d, 20, 35);
  // 30-day window captures immediate buzz — 8 preprints/month is a "hot" target.
  // This short window detects emerging targets before they appear in PubMed.
  const preprint30dScore = linearScale(data.preprints30d, 8, 25);

  // Velocity trend compares 30d vs 60-90d rates: "increasing" means accelerating
  // research attention — the strongest signal that a target is about to break out
  let velocityScore: number;
  switch (data.velocityTrend) {
    case 'increasing': velocityScore = 25; break;
    case 'stable': velocityScore = 15; break;
    case 'decreasing': velocityScore = 8; break;
  }

  // Unique research groups measures independent validation — 10+ groups working on
  // the same target independently is strong convergent evidence of genuine biology
  const noveltyScore = linearScale(data.uniqueGroups, 10, 15);

  const components: ScoreComponent[] = [
    { name: 'Preprints (90 days)', value: preprint90dScore, maxValue: 35, description: `${data.preprints90d} preprints (cap: 20)` },
    { name: 'Preprints (30 days)', value: preprint30dScore, maxValue: 25, description: `${data.preprints30d} preprints (cap: 8)` },
    { name: 'Velocity Trend', value: velocityScore, maxValue: 25, description: `Trend: ${data.velocityTrend}` },
    { name: 'Novelty Indicators', value: noveltyScore, maxValue: 15, description: `${data.uniqueGroups} unique research groups (cap: 10)` },
  ];

  const score = Math.round(components.reduce((sum, c) => sum + c.value, 0));

  return {
    dimension: 'innovationSignal',
    label: 'Innovation Signal',
    score: Math.min(100, score),
    components,
    description: `${data.preprints90d} preprints in 90 days, trend: ${data.velocityTrend}, ${data.uniqueGroups} groups.`,
  };
}
