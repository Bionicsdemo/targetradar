import type { DimensionScore, ScoreComponent } from '../types/scoring';
import type { AlphaFoldData } from '../types/target-profile';
import { linearScale } from '../utils/format';

// Structural readiness determines feasibility of structure-based drug design (SBDD).
// Experimental structures with bound ligands are the gold standard for rational
// medicinal chemistry — they reveal binding pockets, conformational states, and SAR.
export function scoreStructuralReadiness(data: AlphaFoldData | null): DimensionScore {
  if (!data) {
    return {
      dimension: 'structuralReadiness',
      label: 'Structural Readiness',
      score: 0,
      components: [],
      description: 'No structural data available.',
    };
  }

  // Cap at 20 PDB entries — additional structures beyond 20 indicate a well-studied
  // target but provide diminishing returns for drug design readiness
  const experimentalScore = linearScale(data.pdbCount, 20, 30);
  // AlphaFold pLDDT > 90 is "highly confident" and useful for drug design;
  // < 50 suggests disordered regions unlikely to form stable binding pockets
  const alphafoldScore = (data.avgPLDDT / 100) * 25;
  // Ligand-bound structures are critical — they reveal druggable conformations
  // that apo structures miss. 10+ ligand-bound structures = fully explored target.
  const ligandBoundScore = linearScale(data.ligandBoundCount, 10, 25);

  // Resolution thresholds: <2.0A enables atomic-level ligand placement for SBDD,
  // <3.0A is adequate for molecular docking, >3.0A has limited drug design utility
  let resolutionScore = 5;
  if (data.bestResolution < 2.0) resolutionScore = 20;
  else if (data.bestResolution < 3.0) resolutionScore = 12;

  const components: ScoreComponent[] = [
    { name: 'Experimental Structures', value: experimentalScore, maxValue: 30, description: `${data.pdbCount} PDB entries (cap: 20)` },
    { name: 'AlphaFold Confidence', value: alphafoldScore, maxValue: 25, description: `pLDDT: ${data.avgPLDDT.toFixed(1)}` },
    { name: 'Ligand-Bound Structures', value: ligandBoundScore, maxValue: 25, description: `~${data.ligandBoundCount} ligand-bound (cap: 10)` },
    { name: 'Resolution Quality', value: resolutionScore, maxValue: 20, description: data.bestResolution < 99 ? `Best: ${data.bestResolution.toFixed(1)}Å` : 'No structures' },
  ];

  const score = Math.round(components.reduce((sum, c) => sum + c.value, 0));

  return {
    dimension: 'structuralReadiness',
    label: 'Structural Readiness',
    score: Math.min(100, score),
    components,
    description: `${data.pdbCount} structures, ${data.hasAlphaFold ? 'AlphaFold available' : 'no AlphaFold'}, best resolution: ${data.bestResolution < 99 ? data.bestResolution.toFixed(1) + 'Å' : 'N/A'}.`,
  };
}
