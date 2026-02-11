import { NextRequest, NextResponse } from 'next/server';
import { generateTrialDesign } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const analysis = await generateTrialDesign(profile);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('AI trial design error:', err);
    return NextResponse.json(
      { error: 'Failed to generate trial design', analysis: '' },
      { status: 500 }
    );
  }
}
