import { NextRequest, NextResponse } from 'next/server';
import { OPEN_TARGETS_GRAPHQL_URL } from '@/lib/constants';
import { fetchWithRetry } from '@/lib/utils/api-client';
import { cacheGet, cacheSet } from '@/lib/utils/cache';

const DISEASE_SEARCH_QUERY = `
  query SearchDisease($q: String!) {
    search(queryString: $q, entityNames: ["disease"], page: { size: 8, index: 0 }) {
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

interface SearchHit {
  id: string;
  entity: string;
  name: string;
  description: string;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `disease-search-${q}`;
  const cached = cacheGet<Array<{ id: string; name: string; description: string }>>(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached });
  }

  try {
    const response = await fetchWithRetry(OPEN_TARGETS_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: DISEASE_SEARCH_QUERY, variables: { q } }),
    });

    const data = (await response.json()) as {
      data: { search: { hits: SearchHit[] } };
    };

    const results = (data.data?.search?.hits ?? [])
      .filter((h) => h.entity === 'disease')
      .map((h) => ({
        id: h.id,
        name: h.name,
        description: h.description || '',
      }));

    cacheSet(cacheKey, results);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Disease search error:', err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
