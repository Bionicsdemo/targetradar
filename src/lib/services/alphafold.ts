import { ALPHAFOLD_BASE_URL, PDB_SEARCH_URL, UNIPROT_BASE_URL } from '../constants';
import { fetchWithRetry, createServiceResult, createErrorResult } from '../utils/api-client';
import { cacheGet, cacheSet } from '../utils/cache';
import { validateResponse } from '../utils/validate';
import { AlphaFoldPredictionSchema } from '../types/api-responses';
import type { ServiceResult, AlphaFoldData } from '../types/target-profile';

interface UniProtResult {
  results: Array<{
    primaryAccession: string;
  }>;
}

interface PDBSearchResponse {
  result_set?: Array<{ identifier: string; score?: number }>;
  total_count?: number;
}

interface AlphaFoldEntry {
  entryId: string;
  confidenceAvgLocalScore?: number;
  globalMetricValue?: number;
}

async function resolveUniProtId(gene: string): Promise<string | null> {
  const cacheKey = `uniprot-resolve-${gene}`;
  const cached = cacheGet<string>(cacheKey);
  if (cached) return cached;

  const url = `${UNIPROT_BASE_URL}/search?query=gene_exact:${encodeURIComponent(gene)}+AND+organism_id:9606+AND+reviewed:true&format=json&size=1`;
  const response = await fetchWithRetry(url);
  if (!response.ok) return null;

  const data = await response.json() as UniProtResult;
  const accession = data.results?.[0]?.primaryAccession ?? null;
  if (accession) cacheSet(cacheKey, accession);
  return accession;
}

async function searchPDB(queryBody: Record<string, unknown>): Promise<{ pdbIds: string[]; totalCount: number }> {
  const response = await fetchWithRetry(PDB_SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queryBody),
  });

  if (!response.ok) {
    if (response.status === 204) return { pdbIds: [], totalCount: 0 };
    throw new Error(`PDB Search error: ${response.status}`);
  }

  const text = await response.text();
  if (!text) return { pdbIds: [], totalCount: 0 };

  let data: PDBSearchResponse;
  try {
    data = JSON.parse(text) as PDBSearchResponse;
  } catch {
    return { pdbIds: [], totalCount: 0 };
  }
  const pdbIds = (data.result_set ?? []).map((r) => r.identifier);
  return { pdbIds, totalCount: data.total_count ?? pdbIds.length };
}

async function fetchPDBStructures(gene: string, uniprotId?: string | null): Promise<{ pdbIds: string[]; totalCount: number; ligandBoundIds: string[] }> {
  // Strategy: search by UniProt accession (precise) with preference for ligand-bound structures
  // This avoids returning antibody/DNA structures that just mention the gene name

  // Search 1: UniProt-linked structures with bound ligands (best for docking panel)
  let ligandBoundIds: string[] = [];
  if (uniprotId) {
    try {
      const ligandQuery = {
        query: {
          type: 'group',
          logical_operator: 'and',
          nodes: [
            { type: 'terminal', service: 'text', parameters: {
              attribute: 'rcsb_polymer_entity_container_identifiers.reference_sequence_identifiers.database_accession',
              operator: 'in', value: [uniprotId],
            }},
            { type: 'terminal', service: 'text', parameters: {
              attribute: 'rcsb_entry_info.nonpolymer_entity_count',
              operator: 'greater', value: 0,
            }},
          ],
        },
        return_type: 'entry',
        request_options: { paginate: { start: 0, rows: 20 }, scoring_strategy: 'combined' },
      };
      const result = await searchPDB(ligandQuery);
      ligandBoundIds = result.pdbIds;
    } catch {
      // Ligand search failed — continue with general search
    }
  }

  // Search 2: General text search for total count
  const generalQuery = {
    query: { type: 'terminal', service: 'full_text', parameters: { value: gene } },
    return_type: 'entry',
    request_options: { paginate: { start: 0, rows: 50 }, scoring_strategy: 'combined' },
  };
  const general = await searchPDB(generalQuery);

  // Merge: ligand-bound first, then general (deduplicated)
  const seen = new Set(ligandBoundIds);
  const merged = [...ligandBoundIds];
  for (const id of general.pdbIds) {
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(id);
    }
  }

  return {
    pdbIds: merged.slice(0, 20),
    totalCount: Math.max(general.totalCount, merged.length),
    ligandBoundIds,
  };
}

async function fetchAlphaFoldConfidence(uniprotId: string): Promise<number | null> {
  try {
    const url = `${ALPHAFOLD_BASE_URL}/prediction/${uniprotId}`;
    const response = await fetchWithRetry(url);
    if (!response.ok) return null;
    const data = await response.json() as AlphaFoldEntry[] | AlphaFoldEntry;
    const entry = Array.isArray(data) ? data[0] : data;
    if (entry) {
      validateResponse(AlphaFoldPredictionSchema, entry, 'AlphaFold prediction');
    }
    return entry?.globalMetricValue ?? entry?.confidenceAvgLocalScore ?? null;
  } catch {
    return null;
  }
}

export async function fetchAlphaFoldData(gene: string): Promise<ServiceResult<AlphaFoldData>> {
  const startTime = Date.now();
  const cacheKey = `alphafold-data-${gene}`;
  const cached = cacheGet<AlphaFoldData>(cacheKey);
  if (cached) return createServiceResult('AlphaFold/PDB', cached, startTime, true);

  try {
    const uniprotId = await resolveUniProtId(gene);
    const [pdbResult, alphaFoldResult] = await Promise.allSettled([
      fetchPDBStructures(gene, uniprotId),
      uniprotId ? fetchAlphaFoldConfidence(uniprotId) : Promise.resolve(null),
    ]);

    const pdbData = pdbResult.status === 'fulfilled'
      ? pdbResult.value
      : { pdbIds: [], totalCount: 0, ligandBoundIds: [] as string[] };
    const avgPLDDT = alphaFoldResult.status === 'fulfilled' && alphaFoldResult.value !== null
      ? alphaFoldResult.value
      : 0;

    // Use actual ligand-bound count from UniProt-based PDB search
    const ligandBoundCount = pdbData.ligandBoundIds.length > 0
      ? pdbData.ligandBoundIds.length
      : Math.round(pdbData.totalCount * 0.3); // fallback heuristic

    // Estimate best resolution based on structure count (heuristic)
    let bestResolution = 99;
    if (pdbData.totalCount > 10) bestResolution = 1.8;
    else if (pdbData.totalCount > 5) bestResolution = 2.2;
    else if (pdbData.totalCount > 0) bestResolution = 2.8;

    const data: AlphaFoldData = {
      uniprotId: uniprotId ?? '',
      pdbCount: pdbData.totalCount,
      avgPLDDT: avgPLDDT,
      ligandBoundCount,
      bestResolution,
      // Ligand-bound PDB IDs first (best for docking panel), then general
      pdbIds: pdbData.pdbIds.slice(0, 20),
      hasAlphaFold: avgPLDDT > 0,
    };

    cacheSet(cacheKey, data);
    return createServiceResult('AlphaFold/PDB', data, startTime);
  } catch (err) {
    return createErrorResult<AlphaFoldData>(
      'AlphaFold/PDB',
      err instanceof Error ? err.message : 'Unknown error',
      startTime
    );
  }
}

export { resolveUniProtId };
