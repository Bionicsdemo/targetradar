import { NextRequest, NextResponse } from 'next/server';
import { generateDeepHypothesis } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const analysis = await generateDeepHypothesis(profile);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('AI deep hypothesis error:', err);
    return NextResponse.json(
      { error: 'Failed to generate hypothesis', analysis: '' },
      { status: 500 }
    );
  }
}
