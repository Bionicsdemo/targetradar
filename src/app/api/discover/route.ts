import { NextRequest, NextResponse } from 'next/server';
import { OPEN_TARGETS_GRAPHQL_URL } from '@/lib/constants';
import { fetchWithRetry } from '@/lib/utils/api-client';
import { cacheGet, cacheSet } from '@/lib/utils/cache';

const DISEASE_TARGETS_QUERY = `
  query DiseaseTargets($efoId: String!) {
    disease(efoId: $efoId) {
      id
      name
      description
      associatedTargets(page: { size: 25, index: 0 }) {
        count
        rows {
          target {
            id
            approvedSymbol
            approvedName
          }
          score
        }
      }
    }
  }
`;

interface TargetRow {
  target: {
    id: string;
    approvedSymbol: string;
    approvedName: string;
  };
  score: number;
}

export interface DiscoveredTarget {
  ensemblId: string;
  symbol: string;
  name: string;
  associationScore: number;
  datatypeScores: Record<string, number>;
  overallScore: number | null;
  status: 'pending' | 'analyzing' | 'complete' | 'error';
}

export interface DiscoveryResult {
  diseaseId: string;
  diseaseName: string;
  diseaseDescription: string;
  totalAssociatedTargets: number;
  targets: DiscoveredTarget[];
  aiAnalysis: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { diseaseId: string };
    const diseaseId = body.diseaseId?.trim();

    if (!diseaseId) {
      return NextResponse.json({ error: 'Disease ID is required' }, { status: 400 });
    }

    const cacheKey = `discover-${diseaseId}`;
    const cached = cacheGet<DiscoveryResult>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Step 1: Get associated targets from Open Targets
    const response = await fetchWithRetry(OPEN_TARGETS_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: DISEASE_TARGETS_QUERY,
        variables: { efoId: diseaseId },
      }),
    });

    if (!response.ok) {
      throw new Error(`Open Targets API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      data: {
        disease: {
          id: string;
          name: string;
          description: string;
          associatedTargets: {
            count: number;
            rows: TargetRow[];
          };
        };
      };
    };

    const disease = data.data?.disease;
    if (!disease) {
      return NextResponse.json({ error: 'Disease not found' }, { status: 404 });
    }

    // Step 2: Map top targets
    const targets: DiscoveredTarget[] = (disease.associatedTargets?.rows ?? [])
      .slice(0, 15)
      .map((row) => ({
        ensemblId: row.target.id,
        symbol: row.target.approvedSymbol,
        name: row.target.approvedName,
        associationScore: row.score,
        datatypeScores: {},
        overallScore: null,
        status: 'pending' as const,
      }));

    // Step 3: Score top 8 targets via our analyze endpoint
    const baseUrl = request.nextUrl.origin;
    const topTargets = targets.slice(0, 8);

    const analyzeResults = await Promise.allSettled(
      topTargets.map(async (t) => {
        const res = await fetch(`${baseUrl}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gene: t.symbol }),
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) return null;
        return res.json() as Promise<{ scores: { overall: number } }>;
      })
    );

    // Merge scores
    for (let i = 0; i < topTargets.length; i++) {
      const result = analyzeResults[i];
      if (result.status === 'fulfilled' && result.value) {
        targets[i].overallScore = result.value.scores.overall;
        targets[i].status = 'complete';
      } else {
        targets[i].status = 'error';
      }
    }

    // Sort by overall score (scored targets first), then association score
    targets.sort((a, b) => {
      if (a.overallScore !== null && b.overallScore !== null) {
        return b.overallScore - a.overallScore;
      }
      if (a.overallScore !== null) return -1;
      if (b.overallScore !== null) return 1;
      return b.associationScore - a.associationScore;
    });

    // Step 4: Generate AI analysis
    let aiAnalysis: string | null = null;
    try {
      const { generateDiscoveryAnalysis } = await import('@/lib/services/ai-analysis');
      const targetSummaries = targets
        .filter((t) => t.overallScore !== null)
        .map((t) =>
          `${t.symbol} (${t.name}): Overall ${t.overallScore}/100, Disease association ${(t.associationScore * 100).toFixed(0)}%`
        )
        .join('\n');
      aiAnalysis = await generateDiscoveryAnalysis(disease.name, targetSummaries);
    } catch {
      // AI unavailable — continue without
    }

    const result: DiscoveryResult = {
      diseaseId: disease.id,
      diseaseName: disease.name,
      diseaseDescription: disease.description,
      totalAssociatedTargets: disease.associatedTargets?.count ?? 0,
      targets,
      aiAnalysis,
    };

    cacheSet(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Discovery error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Discovery failed' },
      { status: 500 }
    );
  }
}
