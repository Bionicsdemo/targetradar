import { BIORXIV_BASE_URL } from '../constants';
import { fetchWithRetry, createServiceResult, createErrorResult } from '../utils/api-client';
import { cacheGet, cacheSet } from '../utils/cache';
import type { ServiceResult, BioRxivData } from '../types/target-profile';
import { daysAgo } from '../utils/format';

interface BioRxivResponse {
  messages?: Array<{ status?: string; count?: number; total?: number }>;
  collection: Array<{
    doi: string;
    title: string;
    authors: string;
    date: string;
    category?: string;
    abstract?: string;
    author_corresponding_institution?: string;
  }>;
}

async function fetchBioRxivPage(startDate: string, endDate: string, cursor: number = 0): Promise<BioRxivResponse> {
  const url = `${BIORXIV_BASE_URL}/details/biorxiv/${startDate}/${endDate}/${cursor}`;
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`bioRxiv API error: ${response.status}`);
  return response.json() as Promise<BioRxivResponse>;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesGene(text: string, gene: string): boolean {
  const geneUpper = gene.toUpperCase();
  const textUpper = text.toUpperCase();
  const pattern = new RegExp(`\\b${escapeRegex(geneUpper)}\\b`, 'i');
  return pattern.test(textUpper);
}

export async function fetchBioRxivData(gene: string): Promise<ServiceResult<BioRxivData>> {
  const startTime = Date.now();
  const cacheKey = `biorxiv-data-${gene}`;
  const cached = cacheGet<BioRxivData>(cacheKey);
  if (cached) return createServiceResult('bioRxiv', cached, startTime, true);

  try {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysAgo = daysAgo(90);
    const thirtyDaysAgo = daysAgo(30);
    const sixtyDaysAgo = daysAgo(60);

    // Fetch multiple pages in parallel for better coverage (16K+ preprints/90d)
    let collection: BioRxivResponse['collection'] = [];
    try {
      const pages = await Promise.allSettled([
        fetchBioRxivPage(ninetyDaysAgo, today, 0),
        fetchBioRxivPage(ninetyDaysAgo, today, 100),
        fetchBioRxivPage(ninetyDaysAgo, today, 200),
        fetchBioRxivPage(ninetyDaysAgo, today, 300),
        fetchBioRxivPage(ninetyDaysAgo, today, 400),
      ]);
      for (const page of pages) {
        if (page.status === 'fulfilled' && page.value.collection) {
          collection = collection.concat(page.value.collection);
        }
      }
    } catch {
      // bioRxiv API can be flaky — return empty data gracefully
      collection = [];
    }

    // Filter for gene mentions
    const matching = collection.filter(
      (p) => matchesGene(p.title, gene) || matchesGene(p.abstract ?? '', gene)
    );

    const preprints90d = matching.length;
    const preprints30d = matching.filter((p) => p.date >= thirtyDaysAgo).length;
    const preprints60to30 = matching.filter(
      (p) => p.date >= sixtyDaysAgo && p.date < thirtyDaysAgo
    ).length;

    // Determine velocity trend
    let velocityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (preprints30d > preprints60to30 * 1.5) {
      velocityTrend = 'increasing';
    } else if (preprints30d < preprints60to30 * 0.5 && preprints60to30 > 0) {
      velocityTrend = 'decreasing';
    }

    const institutions = new Set(
      matching
        .map((p) => p.author_corresponding_institution)
        .filter((i): i is string => !!i)
    );

    const data: BioRxivData = {
      preprints90d,
      preprints30d,
      velocityTrend,
      uniqueGroups: institutions.size,
      recentPreprints: matching.slice(0, 10).map((p) => ({
        doi: p.doi,
        title: p.title,
        date: p.date,
        authors: p.authors ?? '',
        institution: p.author_corresponding_institution ?? '',
      })),
    };

    cacheSet(cacheKey, data);
    return createServiceResult('bioRxiv', data, startTime);
  } catch (err) {
    return createErrorResult<BioRxivData>(
      'bioRxiv',
      err instanceof Error ? err.message : 'Unknown error',
      startTime
    );
  }
}
