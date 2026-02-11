import { PUBMED_BASE_URL } from '../constants';
import { fetchWithRetry, createServiceResult, createErrorResult } from '../utils/api-client';
import { cacheGet, cacheSet } from '../utils/cache';
import type { ServiceResult, PubMedData } from '../types/target-profile';
import { daysAgo } from '../utils/format';

function buildPubMedUrl(term: string, extras: string = ''): string {
  const apiKey = process.env.NCBI_API_KEY;
  const keyParam = apiKey ? `&api_key=${apiKey}` : '';
  return `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=0&retmode=json${extras}${keyParam}`;
}

async function getCount(term: string, extras: string = ''): Promise<number> {
  const url = buildPubMedUrl(term, extras);
  const response = await fetchWithRetry(url);
  if (!response.ok) throw new Error(`PubMed API error: ${response.status}`);
  const json = await response.json() as { esearchresult?: { count?: string } };
  return parseInt(json.esearchresult?.count ?? '0', 10) || 0;
}

export async function fetchPubMedData(gene: string): Promise<ServiceResult<PubMedData>> {
  const startTime = Date.now();
  const cacheKey = `pubmed-data-${gene}`;
  const cached = cacheGet<PubMedData>(cacheKey);
  if (cached) return createServiceResult('PubMed', cached, startTime, true);

  try {
    const twoYearsAgo = daysAgo(730);
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const dateFilter = `&mindate=${twoYearsAgo.replace(/-/g, '/')}&maxdate=${today}&datetype=pdat`;

    const [total, recent, drugFocused, reviews] = await Promise.allSettled([
      getCount(gene),
      getCount(gene, dateFilter),
      getCount(`${gene} AND (drug OR therapeutic OR inhibitor OR treatment)`),
      getCount(`${gene} AND review[pt]`),
    ]);

    const data: PubMedData = {
      totalPublications: total.status === 'fulfilled' ? total.value : 0,
      recentPublications: recent.status === 'fulfilled' ? recent.value : 0,
      drugFocusedPublications: drugFocused.status === 'fulfilled' ? drugFocused.value : 0,
      reviewArticles: reviews.status === 'fulfilled' ? reviews.value : 0,
    };

    cacheSet(cacheKey, data);
    return createServiceResult('PubMed', data, startTime);
  } catch (err) {
    return createErrorResult<PubMedData>(
      'PubMed',
      err instanceof Error ? err.message : 'Unknown error',
      startTime
    );
  }
}
