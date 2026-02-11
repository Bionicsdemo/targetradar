import { OPEN_TARGETS_GRAPHQL_URL } from '../constants';
import { fetchWithRetry, createServiceResult, createErrorResult } from '../utils/api-client';
import { cacheGet, cacheSet } from '../utils/cache';
import { validateResponse } from '../utils/validate';
import { OpenTargetsSearchSchema, OpenTargetsTargetSchema } from '../types/api-responses';
import type { ServiceResult, OpenTargetsData } from '../types/target-profile';

const SEARCH_QUERY = `
  query SearchTarget($q: String!) {
    search(queryString: $q, entityNames: ["target"], page: { size: 5, index: 0 }) {
      hits {
        id
        entity
        name
        description
      }
      total
    }
  }
`;

const TARGET_QUERY = `
  query TargetInfo($ensemblId: String!) {
    target(ensemblId: $ensemblId) {
      approvedSymbol
      approvedName
      biotype
      tractability {
        label
        modality
        value
      }
      associatedDiseases(page: { size: 50, index: 0 }) {
        count
        rows {
          disease {
            id
            name
          }
          score
          datasourceScores {
            id
            score
          }
        }
      }
    }
  }
`;

async function graphqlFetch(query: string, variables: Record<string, string>): Promise<unknown> {
  const response = await fetchWithRetry(OPEN_TARGETS_GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`Open Targets API error: ${response.status}`);
  }
  const json = await response.json() as { errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(`Open Targets GraphQL error: ${json.errors[0].message}`);
  }
  return json;
}

export async function resolveGeneToEnsembl(gene: string): Promise<{ id: string; name: string } | null> {
  const cacheKey = `ot-resolve-${gene}`;
  const cached = cacheGet<{ id: string; name: string }>(cacheKey);
  if (cached) return cached;

  const raw = await graphqlFetch(SEARCH_QUERY, { q: gene });
  const result = validateResponse(OpenTargetsSearchSchema, raw, 'Open Targets search') as {
    data: {
      search: {
        hits: Array<{ id: string; entity: string; name: string }>;
      };
    };
  };

  const hits = result.data?.search?.hits;
  if (!hits) return null;

  const targetHit = hits.find(
    (h) => h.entity === 'target'
  );
  if (!targetHit) return null;

  const resolved = { id: targetHit.id, name: targetHit.name || gene };
  cacheSet(cacheKey, resolved);
  return resolved;
}

export async function searchGenes(query: string): Promise<Array<{ id: string; name: string; symbol: string }>> {
  const cacheKey = `ot-search-${query}`;
  const cached = cacheGet<Array<{ id: string; name: string; symbol: string }>>(cacheKey);
  if (cached) return cached;

  const result = await graphqlFetch(SEARCH_QUERY, { q: query }) as {
    data: {
      search: {
        hits: Array<{ id: string; entity: string; name: string; description: string }>;
      };
    };
  };

  const targets = (result.data?.search?.hits ?? [])
    .filter((h) => h.entity === 'target')
    .map((h) => ({
      id: h.id,
      name: h.description || h.name || '',
      symbol: h.name || h.id,
    }));

  cacheSet(cacheKey, targets);
  return targets;
}

export async function fetchOpenTargetsData(gene: string, ensemblId: string): Promise<ServiceResult<OpenTargetsData>> {
  const startTime = Date.now();
  const cacheKey = `ot-data-${ensemblId}`;
  const cached = cacheGet<OpenTargetsData>(cacheKey);
  if (cached) return createServiceResult('Open Targets', cached, startTime, true);

  try {
    const raw = await graphqlFetch(TARGET_QUERY, { ensemblId });
    const result = validateResponse(OpenTargetsTargetSchema, raw, 'Open Targets target') as {
      data: {
        target: {
          approvedSymbol: string;
          approvedName: string;
          biotype?: string;
          tractability?: Array<{ label: string; modality: string; value: boolean }>;
          associatedDiseases?: {
            count: number;
            rows: Array<{
              disease: { id: string; name: string };
              score: number;
              datasourceScores: Array<{ id: string; score: number }>;
            }>;
          };
        };
      };
    };

    const target = result.data?.target;
    if (!target) throw new Error('Target not found in Open Targets');
    const rows = target.associatedDiseases?.rows ?? [];

    const data: OpenTargetsData = {
      ensemblId,
      approvedSymbol: target.approvedSymbol,
      approvedName: target.approvedName,
      biotype: target.biotype ?? 'protein_coding',
      diseaseAssociationCount: target.associatedDiseases?.count ?? 0,
      topDiseaseAssociations: rows.slice(0, 20).map((r) => ({
        diseaseId: r.disease.id,
        diseaseName: r.disease.name,
        score: r.score,
        datasourceDiversity: r.datasourceScores.filter((d) => d.score > 0).length,
      })),
      tractability: target.tractability ?? [],
    };

    cacheSet(cacheKey, data);
    return createServiceResult('Open Targets', data, startTime);
  } catch (err) {
    return createErrorResult<OpenTargetsData>(
      'Open Targets',
      err instanceof Error ? err.message : 'Unknown error',
      startTime
    );
  }
}
