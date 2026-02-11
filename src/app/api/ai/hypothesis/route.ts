import { NextRequest, NextResponse } from 'next/server';
import { generateDrugHypothesis } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const hypothesis = await generateDrugHypothesis(profile);
    return NextResponse.json({ hypothesis });
  } catch (err) {
    console.error('AI hypothesis error:', err);
    return NextResponse.json(
      { error: 'Failed to generate hypothesis', hypothesis: '' },
      { status: 500 }
    );
  }
}
