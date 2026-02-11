import { NextRequest, NextResponse } from 'next/server';
import { generateEvidenceConflicts } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const analysis = await generateEvidenceConflicts(profile);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('AI evidence conflicts error:', err);
    return NextResponse.json(
      { error: 'Failed to generate evidence conflict analysis', analysis: '' },
      { status: 500 }
    );
  }
}
