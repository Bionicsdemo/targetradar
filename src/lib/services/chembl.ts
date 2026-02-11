import { CHEMBL_BASE_URL } from '../constants';
import { fetchWithRetry, createServiceResult, createErrorResult } from '../utils/api-client';
import { cacheGet, cacheSet } from '../utils/cache';
import { validateResponse } from '../utils/validate';
import { ChEMBLTargetSearchSchema, ChEMBLMechanismSearchSchema, ChEMBLActivitySearchSchema } from '../types/api-responses';
import type { ServiceResult, ChEMBLData, CompoundDetail, CompoundActivity } from '../types/target-profile';

async function chemblFetch(path: string): Promise<unknown> {
  const url = `${CHEMBL_BASE_URL}${path}`;
  const response = await fetchWithRetry(url);
  if (!response.ok) {
    throw new Error(`ChEMBL API error: ${response.status}`);
  }
  return response.json();
}

interface ChEMBLTargetResult {
  targets: Array<{
    target_chembl_id: string;
    pref_name: string | null;
    target_type: string;
    organism: string;
  }>;
  page_meta: { total_count: number };
}

interface ChEMBLMechanismResult {
  mechanisms: Array<{
    mechanism_of_action: string | null;
    molecule_chembl_id: string;
    max_phase: number | null;
    action_type: string | null;
  }>;
  page_meta: { total_count: number };
}

interface ChEMBLActivityResult {
  activities: Array<{
    molecule_chembl_id: string;
    pchembl_value: string | number | null;
    standard_type?: string | null;
    standard_value?: string | number | null;
  }>;
  page_meta: { total_count: number };
}

interface ChEMBLMoleculeResult {
  molecule_chembl_id: string;
  pref_name?: string | null;
  molecule_type?: string | null;
  max_phase?: number | null;
  molecule_structures?: {
    canonical_smiles?: string | null;
  } | null;
  molecule_properties?: {
    full_mwt?: string | null;
    alogp?: string | null;
    psa?: string | null;
    hba?: number | null;
    hbd?: number | null;
    num_ro5_violations?: number | null;
    aromatic_rings?: number | null;
    rtb?: number | null;
  } | null;
}

async function resolveChemblTarget(gene: string): Promise<string | null> {
  const cacheKey = `chembl-resolve-${gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const raw = await chemblFetch(
    `/target/search.json?q=${encodeURIComponent(gene)}&limit=5`
  );
  const result = validateResponse(ChEMBLTargetSearchSchema, raw, 'ChEMBL target search') as ChEMBLTargetResult;

  const targets = result.targets ?? [];
  const humanTarget = targets.find(
    (t) => t.organism === 'Homo sapiens' && t.target_type === 'SINGLE PROTEIN'
  ) ?? targets[0];

  if (!humanTarget) return null;

  cacheSet(cacheKey, humanTarget.target_chembl_id);
  return humanTarget.target_chembl_id;
}

export async function fetchChEMBLData(gene: string): Promise<ServiceResult<ChEMBLData>> {
  const startTime = Date.now();
  const cacheKey = `chembl-data-${gene}`;
  const cached = cacheGet<ChEMBLData>(cacheKey);
  if (cached) return createServiceResult('ChEMBL', cached, startTime, true);

  try {
    const targetId = await resolveChemblTarget(gene);
    if (!targetId) {
      return createServiceResult<ChEMBLData>('ChEMBL', {
        targetChemblId: '',
        compoundCount: 0,
        mechanisms: [],
        maxClinicalPhase: 0,
        bioactivityCount: 0,
        potentCompoundCount: 0,
        topCompounds: [],
        topActivities: [],
      }, startTime);
    }

    // Step 1: Fetch mechanisms, activity counts, and top activities in parallel
    const [mechanismResult, activityResult, potentResult, topActivitiesResult] = await Promise.allSettled([
      chemblFetch(`/mechanism.json?target_chembl_id=${targetId}&limit=100`) as Promise<ChEMBLMechanismResult>,
      chemblFetch(`/activity.json?target_chembl_id=${targetId}&pchembl_value__gte=6&limit=1`) as Promise<ChEMBLActivityResult>,
      chemblFetch(`/activity.json?target_chembl_id=${targetId}&pchembl_value__gte=7&limit=1`) as Promise<ChEMBLActivityResult>,
      chemblFetch(`/activity.json?target_chembl_id=${targetId}&pchembl_value__gte=7&limit=20&format=json`) as Promise<ChEMBLActivityResult>,
    ]);

    // Validate mechanism and activity responses against Zod schemas (defensive — log but don't block)
    if (mechanismResult.status === 'fulfilled') {
      validateResponse(ChEMBLMechanismSearchSchema, mechanismResult.value, 'ChEMBL mechanisms');
    }
    if (activityResult.status === 'fulfilled') {
      validateResponse(ChEMBLActivitySearchSchema, activityResult.value, 'ChEMBL activities');
    }

    const mechanisms = mechanismResult.status === 'fulfilled'
      ? mechanismResult.value.mechanisms ?? []
      : [];

    const bioactivityCount = activityResult.status === 'fulfilled'
      ? activityResult.value.page_meta?.total_count ?? 0
      : 0;

    const potentCount = potentResult.status === 'fulfilled'
      ? potentResult.value.page_meta?.total_count ?? 0
      : 0;

    // Extract top activities with pChEMBL values
    const rawActivities = topActivitiesResult.status === 'fulfilled'
      ? topActivitiesResult.value.activities
      : [];

    const topActivities: CompoundActivity[] = rawActivities
      .filter((a) => a.pchembl_value !== null)
      .map((a) => {
        const pVal = typeof a.pchembl_value === 'string' ? parseFloat(a.pchembl_value) : a.pchembl_value;
        const sVal = typeof a.standard_value === 'string' ? parseFloat(a.standard_value) : a.standard_value;
        return {
          moleculeChemblId: a.molecule_chembl_id,
          pchemblValue: pVal && !isNaN(pVal) ? pVal : 0,
          standardType: a.standard_type ?? null,
          standardValue: sVal && !isNaN(sVal) ? sVal : null,
        };
      })
      .filter((a) => a.pchemblValue > 0);

    // Step 2: Collect unique molecule IDs — prioritize mechanisms (approved drugs) then fill with top activities
    const mechanismIds = [...new Set(mechanisms.map((m) => m.molecule_chembl_id))].slice(0, 5);
    const activityIds = [...new Set(rawActivities.map((a) => a.molecule_chembl_id))]
      .filter((id) => !mechanismIds.includes(id))
      .slice(0, 5);
    const uniqueMoleculeIds = [...mechanismIds, ...activityIds].slice(0, 10);

    // Step 3: Fetch molecule details in parallel
    const moleculeResults = await Promise.allSettled(
      uniqueMoleculeIds.map((id) =>
        chemblFetch(`/molecule/${id}.json`) as Promise<ChEMBLMoleculeResult>
      )
    );

    // Build activity lookup for best pChEMBL per molecule
    const bestActivity = new Map<string, { pchembl: number; type: string | null }>();
    for (const act of topActivities) {
      const existing = bestActivity.get(act.moleculeChemblId);
      if (!existing || act.pchemblValue > existing.pchembl) {
        bestActivity.set(act.moleculeChemblId, {
          pchembl: act.pchemblValue,
          type: act.standardType,
        });
      }
    }

    // Build CompoundDetail objects
    const topCompounds: CompoundDetail[] = moleculeResults
      .filter((r): r is PromiseFulfilledResult<ChEMBLMoleculeResult> => r.status === 'fulfilled')
      .map((r) => {
        const mol = r.value;
        const props = mol.molecule_properties;
        const activity = bestActivity.get(mol.molecule_chembl_id);
        const parseNum = (v: string | number | null | undefined): number | null => {
          if (v === null || v === undefined) return null;
          const n = typeof v === 'string' ? parseFloat(v) : v;
          return isNaN(n) ? null : n;
        };
        return {
          chemblId: mol.molecule_chembl_id,
          preferredName: mol.pref_name ?? null,
          moleculeType: mol.molecule_type ?? 'Unknown',
          maxPhase: mol.max_phase ?? 0,
          smiles: mol.molecule_structures?.canonical_smiles ?? null,
          molecularWeight: parseNum(props?.full_mwt),
          alogp: parseNum(props?.alogp),
          psa: parseNum(props?.psa),
          hba: props?.hba ?? null,
          hbd: props?.hbd ?? null,
          numRo5Violations: props?.num_ro5_violations ?? null,
          aromaticRings: props?.aromatic_rings ?? null,
          rotatableBonds: props?.rtb ?? null,
          structureImageUrl: mol.molecule_structures?.canonical_smiles
            ? `/api/compound/image?smiles=${encodeURIComponent(mol.molecule_structures.canonical_smiles)}&size=300`
            : '',
          pchemblValue: activity?.pchembl ?? null,
          activityType: activity?.type ?? null,
        };
      })
      // Sort by clinical phase desc, then pChEMBL desc
      .sort((a, b) => (b.maxPhase - a.maxPhase) || ((b.pchemblValue ?? 0) - (a.pchemblValue ?? 0)));

    const uniqueMolecules = new Set(mechanisms.map((m) => m.molecule_chembl_id));
    const maxPhase = Math.max(0, ...mechanisms.map((m) => m.max_phase ?? 0));

    const data: ChEMBLData = {
      targetChemblId: targetId,
      compoundCount: uniqueMolecules.size,
      mechanisms: mechanisms.slice(0, 50).map((m) => ({
        mechanismOfAction: m.mechanism_of_action ?? 'Unknown',
        moleculeChemblId: m.molecule_chembl_id,
        maxPhase: m.max_phase ?? 0,
        actionType: m.action_type ?? 'Unknown',
      })),
      maxClinicalPhase: maxPhase,
      bioactivityCount,
      potentCompoundCount: potentCount,
      topCompounds,
      topActivities,
    };

    cacheSet(cacheKey, data);
    return createServiceResult('ChEMBL', data, startTime);
  } catch (err) {
    return createErrorResult<ChEMBLData>(
      'ChEMBL',
      err instanceof Error ? err.message : 'Unknown error',
      startTime
    );
  }
}
