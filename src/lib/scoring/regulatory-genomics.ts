import type { DimensionScore, ScoreComponent } from '../types/scoring';
import type { AlphaGenomeData } from '../types/target-profile';
import { linearScale } from '../utils/format';

// Regulatory genomics captures the complexity of gene regulation — critical for
// understanding tissue-specific expression and predicting off-target effects.
// This data complements AlphaGenome's predictions of variant-to-expression impacts.
export function scoreRegulatoryGenomics(data: AlphaGenomeData | null): DimensionScore {
  if (!data) {
    return {
      dimension: 'regulatoryGenomics',
      label: 'Regulatory Genomics',
      score: 0,
      components: [],
      description: 'No regulatory genomics data available.',
    };
  }

  // Regulatory feature density (0-25): 50+ features in ±50kb indicates a complex
  // regulatory landscape — more opportunities for tissue-selective modulation but
  // also more risk of unpredictable off-target regulatory effects
  const regFeatureScore = linearScale(data.regulatoryFeatureCount, 50, 25);

  // Enhancer/promoter count (0-25): the core regulatory machinery. Genes with many
  // enhancers can be driven by different tissues — key for precision medicine approaches
  const enhPromoScore = linearScale(data.enhancerCount + data.promoterCount, 15, 25);

  // Constrained elements (0-20): evolutionary conservation from 29 mammals alignment.
  // High conservation = strong purifying selection = functional importance validated
  // across millions of years of evolution, far more reliable than in vitro assays
  const constrainedScore = linearScale(data.constrainedElementCount, 30, 20);

  // Expression breadth (0-15): broadly expressed genes (housekeeping) score higher
  // because they're better characterized, but this also signals potential toxicity
  const expressionScore = data.expressionBreadth / 100 * 15;

  // Transcript complexity (0-15): 10+ transcripts indicates sophisticated post-
  // transcriptional regulation — potential for isoform-selective therapeutic strategies
  const transcriptScore = linearScale(data.transcriptCount, 10, 15);

  const components: ScoreComponent[] = [
    {
      name: 'Regulatory Features',
      value: regFeatureScore,
      maxValue: 25,
      description: `${data.regulatoryFeatureCount} features in ±50kb (cap: 50)`,
    },
    {
      name: 'Enhancer/Promoter Landscape',
      value: enhPromoScore,
      maxValue: 25,
      description: `${data.enhancerCount} enhancers + ${data.promoterCount} promoters (cap: 15)`,
    },
    {
      name: 'Constrained Elements',
      value: constrainedScore,
      maxValue: 20,
      description: `${data.constrainedElementCount} conserved elements (cap: 30)`,
    },
    {
      name: 'Expression Breadth',
      value: Math.round(expressionScore * 10) / 10,
      maxValue: 15,
      description: `Estimated breadth: ${data.expressionBreadth}%`,
    },
    {
      name: 'Transcript Complexity',
      value: transcriptScore,
      maxValue: 15,
      description: `${data.transcriptCount} transcripts (cap: 10)`,
    },
  ];

  const score = Math.round(components.reduce((sum, c) => sum + c.value, 0));

  return {
    dimension: 'regulatoryGenomics',
    label: 'Regulatory Genomics',
    score: Math.min(100, score),
    components,
    description: `${data.regulatoryFeatureCount} regulatory features, ${data.constrainedElementCount} constrained elements, complexity: ${data.regulatoryComplexity}.`,
  };
}
