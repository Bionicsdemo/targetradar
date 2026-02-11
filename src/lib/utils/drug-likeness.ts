import type { CompoundDetail } from '../types/target-profile';

export interface DrugLikenessAssessment {
  lipinskiViolations: number;
  lipinskiPass: boolean;
  veberPass: boolean;
  overallScore: number;
  flags: string[];
}

export function assessDrugLikeness(compound: CompoundDetail): DrugLikenessAssessment {
  const flags: string[] = [];
  let violations = 0;

  if (compound.molecularWeight !== null && compound.molecularWeight > 500) {
    violations++;
    flags.push('MW > 500');
  }
  if (compound.alogp !== null && compound.alogp > 5) {
    violations++;
    flags.push('LogP > 5');
  }
  if (compound.hba !== null && compound.hba > 10) {
    violations++;
    flags.push('HBA > 10');
  }
  if (compound.hbd !== null && compound.hbd > 5) {
    violations++;
    flags.push('HBD > 5');
  }

  const veberTPSA = compound.psa === null || compound.psa < 140;
  const veberRB = compound.rotatableBonds === null || compound.rotatableBonds <= 10;
  const veberPass = veberTPSA && veberRB;
  if (!veberTPSA) flags.push('TPSA >= 140');
  if (!veberRB) flags.push('RotBonds > 10');

  let score = 100;
  score -= violations * 15;
  if (!veberPass) score -= 10;

  return {
    lipinskiViolations: violations,
    lipinskiPass: violations <= 1,
    veberPass,
    overallScore: Math.max(0, score),
    flags,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeForRadar(compound: CompoundDetail): Array<{
  property: string;
  value: number;
  ideal: number;
}> {
  return [
    {
      property: 'MW',
      value: clamp(((compound.molecularWeight ?? 0) / 500) * 100, 0, 150),
      ideal: 100,
    },
    {
      property: 'LogP',
      value: clamp((((compound.alogp ?? 0) + 2) / 7) * 100, 0, 150),
      ideal: 100,
    },
    {
      property: 'TPSA',
      value: clamp(((compound.psa ?? 0) / 140) * 100, 0, 150),
      ideal: 100,
    },
    {
      property: 'HBD',
      value: clamp(((compound.hbd ?? 0) / 5) * 100, 0, 150),
      ideal: 100,
    },
    {
      property: 'HBA',
      value: clamp(((compound.hba ?? 0) / 10) * 100, 0, 150),
      ideal: 100,
    },
  ];
}
