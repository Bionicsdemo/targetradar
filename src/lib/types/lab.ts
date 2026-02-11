import type { CompoundDetail } from './target-profile';

export interface LabMolecule {
  id: string;
  name: string;
  smiles: string;
  moleculeType: string;
  maxPhase: number;
  molecularWeight: number | null;
  alogp: number | null;
  psa: number | null;
  hba: number | null;
  hbd: number | null;
  rotatableBonds: number | null;
  targetGene: string;
  resolvedFromPubChem: boolean;
  createdAt: number;
}

export interface LabFormState {
  name: string;
  smiles: string;
  moleculeType: string;
  maxPhase: string;
  molecularWeight: string;
  alogp: string;
  psa: string;
  hba: string;
  hbd: string;
  rotatableBonds: string;
  targetGene: string;
}

export function labMoleculeToCompoundDetail(mol: LabMolecule): CompoundDetail {
  return {
    chemblId: mol.id,
    preferredName: mol.name || null,
    moleculeType: mol.moleculeType,
    maxPhase: mol.maxPhase,
    smiles: mol.smiles || null,
    molecularWeight: mol.molecularWeight,
    alogp: mol.alogp,
    psa: mol.psa,
    hba: mol.hba,
    hbd: mol.hbd,
    numRo5Violations: null,
    aromaticRings: null,
    rotatableBonds: mol.rotatableBonds,
    structureImageUrl: '',
    pchemblValue: null,
    activityType: null,
  };
}
