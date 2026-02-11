import { ENSEMBL_REST_URL } from '../constants';
import { fetchWithRetry, createServiceResult, createErrorResult } from '../utils/api-client';
import { cacheGet, cacheSet } from '../utils/cache';
import type { ServiceResult, AlphaGenomeData } from '../types/target-profile';

interface EnsemblLookup {
  id: string;
  display_name: string;
  biotype: string;
  seq_region_name: string;
  start: number;
  end: number;
  strand: number;
  Transcript?: Array<{ id: string }>;
}

interface RegulatoryFeature {
  feature_type: string;
  description?: string;
  regulatory_feature_id?: string;
}

interface ConstrainedElement {
  id: string;
  score?: number;
}

async function fetchEnsemblJSON<T>(path: string): Promise<T | null> {
  try {
    const response = await fetchWithRetry(`${ENSEMBL_REST_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    return response.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function fetchGeneInfo(ensemblId: string): Promise<EnsemblLookup | null> {
  return fetchEnsemblJSON<EnsemblLookup>(`/lookup/id/${ensemblId}?expand=1`);
}

async function fetchRegulatoryFeatures(
  chr: string,
  start: number,
  end: number,
): Promise<RegulatoryFeature[]> {
  // Extend region by 50kb upstream/downstream for regulatory elements
  const extStart = Math.max(1, start - 50000);
  const extEnd = end + 50000;
  const features = await fetchEnsemblJSON<RegulatoryFeature[]>(
    `/overlap/region/homo_sapiens/${chr}:${extStart}-${extEnd}?feature=regulatory`,
  );
  return features ?? [];
}

async function fetchConstrainedElements(
  chr: string,
  start: number,
  end: number,
): Promise<ConstrainedElement[]> {
  const extStart = Math.max(1, start - 10000);
  const extEnd = end + 10000;
  const elements = await fetchEnsemblJSON<ConstrainedElement[]>(
    `/overlap/region/homo_sapiens/${chr}:${extStart}-${extEnd}?feature=constrained`,
  );
  return elements ?? [];
}

export async function fetchAlphaGenomeData(
  ensemblId: string,
): Promise<ServiceResult<AlphaGenomeData>> {
  const startTime = Date.now();
  const cacheKey = `alphagenome-data-${ensemblId}`;
  const cached = cacheGet<AlphaGenomeData>(cacheKey);
  if (cached) return createServiceResult('AlphaGenome', cached, startTime, true);

  try {
    // Step 1: Get gene coordinates from Ensembl
    const geneInfo = await fetchGeneInfo(ensemblId);
    if (!geneInfo) {
      return createErrorResult<AlphaGenomeData>(
        'AlphaGenome',
        'Could not resolve gene coordinates',
        startTime,
      );
    }

    const chr = geneInfo.seq_region_name;
    const geneStart = geneInfo.start;
    const geneEnd = geneInfo.end;
    const geneLength = geneEnd - geneStart;
    const transcriptCount = geneInfo.Transcript?.length ?? 1;

    // Step 2: Fetch regulatory features + constrained elements in parallel
    const [regulatoryFeatures, constrainedElements] = await Promise.allSettled([
      fetchRegulatoryFeatures(chr, geneStart, geneEnd),
      fetchConstrainedElements(chr, geneStart, geneEnd),
    ]);

    const regFeatures =
      regulatoryFeatures.status === 'fulfilled' ? regulatoryFeatures.value : [];
    const constrained =
      constrainedElements.status === 'fulfilled' ? constrainedElements.value : [];

    // Step 3: Categorize regulatory features
    // Ensembl returns feature_type="regulatory" with actual type in description
    const classifyFeature = (f: RegulatoryFeature): string => {
      const text = `${f.feature_type ?? ''} ${f.description ?? ''}`.toLowerCase();
      return text;
    };
    const promoterCount = regFeatures.filter(
      (f) => classifyFeature(f).includes('promoter'),
    ).length;
    const enhancerCount = regFeatures.filter(
      (f) => classifyFeature(f).includes('enhancer'),
    ).length;
    const ctcfCount = regFeatures.filter(
      (f) => classifyFeature(f).includes('ctcf'),
    ).length;
    const openChromatinCount = regFeatures.filter(
      (f) => classifyFeature(f).includes('open_chromatin') || classifyFeature(f).includes('open chromatin'),
    ).length;

    // Step 4: Determine regulatory complexity
    const totalReg = regFeatures.length;
    const diverseTypes = [promoterCount > 0, enhancerCount > 0, ctcfCount > 0, openChromatinCount > 0].filter(Boolean).length;
    let regulatoryComplexity: 'high' | 'moderate' | 'low' = 'low';
    if (totalReg > 30 || (enhancerCount > 5 && promoterCount >= 1) || diverseTypes >= 3) {
      regulatoryComplexity = 'high';
    } else if (totalReg > 10 || enhancerCount > 2 || diverseTypes >= 2) {
      regulatoryComplexity = 'moderate';
    }

    // Step 5: Estimate expression breadth from transcript count and gene length
    // Genes with many transcripts and regulatory elements tend to be broadly expressed
    let expressionBreadth = 0;
    if (transcriptCount > 10 && totalReg > 20) expressionBreadth = 90;
    else if (transcriptCount > 5 && totalReg > 10) expressionBreadth = 70;
    else if (transcriptCount > 3 || totalReg > 5) expressionBreadth = 50;
    else if (transcriptCount > 1) expressionBreadth = 30;
    else expressionBreadth = 15;

    const data: AlphaGenomeData = {
      regulatoryFeatureCount: totalReg,
      promoterCount,
      enhancerCount,
      ctcfCount,
      openChromatinCount,
      constrainedElementCount: constrained.length,
      geneLength,
      chromosome: chr,
      biotype: geneInfo.biotype ?? 'protein_coding',
      transcriptCount,
      regulatoryComplexity,
      expressionBreadth,
    };

    cacheSet(cacheKey, data);
    return createServiceResult('AlphaGenome', data, startTime);
  } catch (err) {
    return createErrorResult<AlphaGenomeData>(
      'AlphaGenome',
      err instanceof Error ? err.message : 'Unknown error',
      startTime,
    );
  }
}
