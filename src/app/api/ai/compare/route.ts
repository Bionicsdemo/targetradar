import { NextRequest, NextResponse } from 'next/server';
import { generateComparisonAnalysis } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const { profileA, profileB } = await request.json() as {
      profileA: TargetProfile;
      profileB: TargetProfile;
    };
    const analysis = await generateComparisonAnalysis(profileA, profileB);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('AI comparison error:', err);
    return NextResponse.json(
      { error: 'Failed to generate comparison', analysis: '' },
      { status: 500 }
    );
  }
}
