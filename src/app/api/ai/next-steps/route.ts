import { NextRequest, NextResponse } from 'next/server';
import { generateNextSteps } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const result = await generateNextSteps(profile);
    return NextResponse.json({
      steps: result.steps,
      comparisons: result.comparisons,
    });
  } catch (err) {
    console.error('AI next-steps error:', err);
    return NextResponse.json(
      { error: 'Failed to generate next steps', steps: [], comparisons: [] },
      { status: 500 }
    );
  }
}
