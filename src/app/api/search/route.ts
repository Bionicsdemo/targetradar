import { NextRequest, NextResponse } from 'next/server';
import { searchGenes } from '@/lib/services/open-targets';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchGenes(query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ results: [] });
  }
}
