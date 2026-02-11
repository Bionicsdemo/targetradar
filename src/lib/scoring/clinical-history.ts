import type { DimensionScore, ScoreComponent } from '../types/scoring';
import type { ClinicalTrialsData } from '../types/target-profile';
import { linearScale } from '../utils/format';

// Clinical history reveals both validation and risk. Phase progression is weighted
// highest (30pts) because advancing through clinical phases is the ultimate de-risking
// signal — each phase transition approximately halves the remaining failure probability.
export function scoreClinicalHistory(data: ClinicalTrialsData | null): DimensionScore {
  if (!data) {
    return {
      dimension: 'clinicalHistory',
      label: 'Clinical History',
      score: 0,
      components: [],
      description: 'No clinical trial data available.',
    };
  }

  // Cap at 100 trials — mega-targets like PD-1 have 1000+ but diminishing signal
  const totalScore = linearScale(data.totalTrials, 100, 20);

  // Phase progression factors: Phase 4 (approved, factor=1.0) is 6x more predictive
  // than Phase 1 (factor=0.35) because most attrition occurs in Phases 2-3
  const phases = data.trialsByPhase;
  let phaseFactor = 0;
  if (phases['PHASE4'] || phases['Phase 4']) phaseFactor = 1.0;
  else if (phases['PHASE3'] || phases['Phase 3']) phaseFactor = 0.85;
  else if (phases['PHASE2'] || phases['Phase 2']) phaseFactor = 0.60;
  else if (phases['PHASE1'] || phases['Phase 1'] || phases['EARLY_PHASE1']) phaseFactor = 0.35;
  const phaseScore = phaseFactor * 30;

  // Active trials show current commercial interest — 10+ recruiting trials signals
  // strong industry conviction that the target mechanism is viable
  const activeScore = linearScale(data.activeTrials, 10, 20);
  // Sponsor diversity reduces single-company-failure risk — 15+ sponsors means
  // the target has broad independent validation across pharma/biotech
  const sponsorScore = linearScale(data.sponsors.length, 15, 15);

  // 5+ trials in the last 2 years indicates sustained momentum, not just legacy
  let recentScore: number;
  if (data.recentTrials > 5) {
    recentScore = 15;
  } else {
    recentScore = Math.min(15, (data.recentTrials / 5) * 15);
  }

  const components: ScoreComponent[] = [
    { name: 'Total Trials', value: totalScore, maxValue: 20, description: `${data.totalTrials} trials (cap: 100)` },
    { name: 'Phase Progression', value: phaseScore, maxValue: 30, description: `Highest phase factor: ${phaseFactor.toFixed(2)}` },
    { name: 'Active Trials', value: activeScore, maxValue: 20, description: `${data.activeTrials} recruiting (cap: 10)` },
    { name: 'Sponsor Diversity', value: sponsorScore, maxValue: 15, description: `${data.sponsors.length} unique sponsors (cap: 15)` },
    { name: 'Recent Activity', value: recentScore, maxValue: 15, description: `${data.recentTrials} trials in last 2 years` },
  ];

  const score = Math.round(components.reduce((sum, c) => sum + c.value, 0));

  return {
    dimension: 'clinicalHistory',
    label: 'Clinical History',
    score: Math.min(100, score),
    components,
    description: `${data.totalTrials} total trials, ${data.activeTrials} actively recruiting, ${data.sponsors.length} sponsors.`,
  };
}
