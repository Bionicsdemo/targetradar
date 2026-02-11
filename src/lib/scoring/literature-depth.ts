import type { DimensionScore, ScoreComponent } from '../types/scoring';
import type { PubMedData } from '../types/target-profile';
import { linearScale } from '../utils/format';

// Literature depth captures the community's accumulated knowledge about a target.
// Well-published targets have more reagents, validated assays, and known biology —
// reducing technical risk. Gets lower weight (9%) because publications lag behind action.
export function scoreLiteratureDepth(data: PubMedData | null): DimensionScore {
  if (!data) {
    return {
      dimension: 'literatureDepth',
      label: 'Literature Depth',
      score: 0,
      components: [],
      description: 'No literature data available.',
    };
  }

  // 5,000 publications is the saturation point — targets like TP53 (~100K papers)
  // are no more "lit-ready" than those with 5K. Beyond this, diminishing returns.
  const totalScore = linearScale(data.totalPublications, 5000, 25);
  // Recent publications (last 2 years) signal that the target is still actively
  // researched — stale targets with no recent work may have hidden problems
  const recentScore = linearScale(data.recentPublications, 500, 25);
  // Drug-focused publications specifically track pharmacological relevance —
  // a target can have 10K papers but few drug-related, indicating basic-science-only
  const drugScore = linearScale(data.drugFocusedPublications, 1000, 20);
  // Review articles indicate sufficient maturity for expert synthesis
  const reviewScore = linearScale(data.reviewArticles, 100, 15);

  // Recency ratio >10% means the target is gaining momentum, not just legacy bulk.
  // A target with 10K total but only 50 recent papers is likely declining in interest.
  const recencyRatio = data.totalPublications > 0
    ? data.recentPublications / data.totalPublications
    : 0;
  const recencyScore = recencyRatio > 0.10 ? 15 : 8;

  const components: ScoreComponent[] = [
    { name: 'Total Publications', value: totalScore, maxValue: 25, description: `${data.totalPublications.toLocaleString()} papers (cap: 5,000)` },
    { name: 'Recent Publications', value: recentScore, maxValue: 25, description: `${data.recentPublications.toLocaleString()} in last 2 years (cap: 500)` },
    { name: 'Drug-Focused', value: drugScore, maxValue: 20, description: `${data.drugFocusedPublications.toLocaleString()} drug/therapeutic papers (cap: 1,000)` },
    { name: 'Review Articles', value: reviewScore, maxValue: 15, description: `${data.reviewArticles.toLocaleString()} reviews (cap: 100)` },
    { name: 'Recency Ratio', value: recencyScore, maxValue: 15, description: `${(recencyRatio * 100).toFixed(1)}% recent (threshold: 10%)` },
  ];

  const score = Math.round(components.reduce((sum, c) => sum + c.value, 0));

  return {
    dimension: 'literatureDepth',
    label: 'Literature Depth',
    score: Math.min(100, score),
    components,
    description: `${data.totalPublications.toLocaleString()} publications, ${data.recentPublications.toLocaleString()} recent, ${data.drugFocusedPublications.toLocaleString()} drug-focused.`,
  };
}
