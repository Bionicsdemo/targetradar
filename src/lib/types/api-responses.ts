import { z } from 'zod';

// ── Open Targets ──────────────────────────────────────────────────────────────

export const OpenTargetsSearchHitSchema = z.object({
  id: z.string(),
  entity: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const OpenTargetsSearchSchema = z.object({
  data: z.object({
    search: z.object({
      hits: z.array(OpenTargetsSearchHitSchema),
      total: z.number().optional(),
    }),
  }),
});

export const OpenTargetsTractabilitySchema = z.object({
  label: z.string(),
  modality: z.string(),
  value: z.boolean(),
});

export const OpenTargetsDatasourceScoreSchema = z.object({
  id: z.string(),
  score: z.number(),
});

export const OpenTargetsDiseaseRowSchema = z.object({
  disease: z.object({
    id: z.string(),
    name: z.string(),
  }),
  score: z.number(),
  datasourceScores: z.array(OpenTargetsDatasourceScoreSchema),
});

export const OpenTargetsTargetSchema = z.object({
  data: z.object({
    target: z.object({
      approvedSymbol: z.string(),
      approvedName: z.string(),
      biotype: z.string().optional(),
      tractability: z.array(OpenTargetsTractabilitySchema).optional(),
      associatedDiseases: z.object({
        count: z.number(),
        rows: z.array(OpenTargetsDiseaseRowSchema),
      }).optional(),
    }),
  }),
});

export type OpenTargetsSearchHit = z.infer<typeof OpenTargetsSearchHitSchema>;
export type OpenTargetsTarget = z.infer<typeof OpenTargetsTargetSchema>;

// ── ChEMBL ────────────────────────────────────────────────────────────────────

export const ChEMBLTargetSchema = z.object({
  target_chembl_id: z.string(),
  pref_name: z.string().nullable().optional(),
  target_type: z.string().optional(),
  organism: z.string().optional(),
});

export const ChEMBLTargetSearchSchema = z.object({
  targets: z.array(ChEMBLTargetSchema),
  page_meta: z.object({ total_count: z.number() }),
});

export const ChEMBLMechanismSchema = z.object({
  mechanism_of_action: z.string().nullable().optional(),
  molecule_chembl_id: z.string(),
  max_phase: z.number().nullable().optional(),
  action_type: z.string().nullable().optional(),
});

export const ChEMBLMechanismSearchSchema = z.object({
  mechanisms: z.array(ChEMBLMechanismSchema),
  page_meta: z.object({ total_count: z.number() }),
});

export const ChEMBLActivitySchema = z.object({
  molecule_chembl_id: z.string(),
  pchembl_value: z.union([z.number(), z.string()]).nullable().optional(),
  standard_type: z.string().nullable().optional(),
  standard_value: z.union([z.number(), z.string()]).nullable().optional(),
});

export const ChEMBLActivitySearchSchema = z.object({
  activities: z.array(ChEMBLActivitySchema),
  page_meta: z.object({ total_count: z.number() }),
});

export type ChEMBLTarget = z.infer<typeof ChEMBLTargetSchema>;
export type ChEMBLMechanism = z.infer<typeof ChEMBLMechanismSchema>;
export type ChEMBLActivity = z.infer<typeof ChEMBLActivitySchema>;

export const ChEMBLMoleculePropertiesSchema = z.object({
  molecular_weight: z.union([z.number(), z.string()]).nullable().optional(),
  full_mwt: z.union([z.number(), z.string()]).nullable().optional(),
  alogp: z.union([z.number(), z.string()]).nullable().optional(),
  psa: z.union([z.number(), z.string()]).nullable().optional(),
  hba: z.number().nullable().optional(),
  hbd: z.number().nullable().optional(),
  num_ro5_violations: z.number().nullable().optional(),
  aromatic_rings: z.number().nullable().optional(),
  rtb: z.number().nullable().optional(),
  full_molformula: z.string().nullable().optional(),
});

export const ChEMBLMoleculeSchema = z.object({
  molecule_chembl_id: z.string(),
  pref_name: z.string().nullable().optional(),
  molecule_type: z.string().nullable().optional(),
  max_phase: z.number().nullable().optional(),
  molecule_structures: z.object({
    canonical_smiles: z.string().nullable().optional(),
  }).nullable().optional(),
  molecule_properties: ChEMBLMoleculePropertiesSchema.nullable().optional(),
});

export type ChEMBLMolecule = z.infer<typeof ChEMBLMoleculeSchema>;

// ── PubMed ────────────────────────────────────────────────────────────────────

export const PubMedSearchSchema = z.object({
  esearchresult: z.object({
    count: z.string(),
    idlist: z.array(z.string()).optional(),
  }),
});

export type PubMedSearch = z.infer<typeof PubMedSearchSchema>;

// ── ClinicalTrials.gov ────────────────────────────────────────────────────────

export const ClinicalTrialStudySchema = z.object({
  protocolSection: z.object({
    identificationModule: z.object({
      nctId: z.string(),
      briefTitle: z.string(),
      organization: z.object({
        fullName: z.string(),
      }).optional(),
    }).optional(),
    designModule: z.object({
      phases: z.array(z.string()).optional(),
    }).optional(),
    statusModule: z.object({
      overallStatus: z.string(),
      startDateStruct: z.object({
        date: z.string().optional(),
      }).optional(),
    }).optional(),
  }),
});

export const ClinicalTrialsSearchSchema = z.object({
  totalCount: z.number(),
  studies: z.array(ClinicalTrialStudySchema),
});

export type ClinicalTrialStudy = z.infer<typeof ClinicalTrialStudySchema>;

// ── bioRxiv ───────────────────────────────────────────────────────────────────

export const BioRxivArticleSchema = z.object({
  doi: z.string(),
  title: z.string(),
  authors: z.string().optional(),
  date: z.string(),
  category: z.string().optional(),
  abstract: z.string().optional(),
  author_corresponding_institution: z.string().optional(),
});

export const BioRxivSearchSchema = z.object({
  messages: z.array(z.object({
    status: z.string().optional(),
    count: z.number().optional(),
    total: z.number().optional(),
  })).optional(),
  collection: z.array(BioRxivArticleSchema),
});

export type BioRxivArticle = z.infer<typeof BioRxivArticleSchema>;

// ── AlphaFold + PDB ──────────────────────────────────────────────────────────

export const AlphaFoldPredictionSchema = z.object({
  entryId: z.string(),
  uniprotAccession: z.string().optional(),
  uniprotId: z.string().optional(),
  pdbUrl: z.string().optional(),
  confidenceAvgLocalScore: z.number().optional(),
  globalMetricValue: z.number().optional(),
});

export const PDBSearchResultSchema = z.object({
  result_set: z.array(z.object({
    identifier: z.string(),
    score: z.number().optional(),
  })).optional(),
  total_count: z.number().optional(),
});

export const UniProtEntrySchema = z.object({
  primaryAccession: z.string(),
  uniProtkbId: z.string().optional(),
  genes: z.array(z.object({
    geneName: z.object({ value: z.string() }).optional(),
  })).optional(),
});

export const UniProtSearchSchema = z.object({
  results: z.array(UniProtEntrySchema),
});

export type AlphaFoldPrediction = z.infer<typeof AlphaFoldPredictionSchema>;
export type UniProtEntry = z.infer<typeof UniProtEntrySchema>;
