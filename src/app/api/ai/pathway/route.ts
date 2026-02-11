import { NextRequest, NextResponse } from 'next/server';
import { generatePathwayCrosstalk } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const analysis = await generatePathwayCrosstalk(profile);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('AI pathway crosstalk error:', err);
    return NextResponse.json(
      { error: 'Failed to generate pathway analysis', analysis: '' },
      { status: 500 }
    );
  }
}
