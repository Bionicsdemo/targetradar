import { NextRequest, NextResponse } from 'next/server';
import { generateCompetitiveIntelligence } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const analysis = await generateCompetitiveIntelligence(profile);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('AI competitive intelligence error:', err);
    return NextResponse.json(
      { error: 'Failed to generate competitive intelligence', analysis: '' },
      { status: 500 }
    );
  }
}
