import { NextRequest, NextResponse } from 'next/server';
import { generateCompoundAnalysis } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const analysis = await generateCompoundAnalysis(profile);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('AI compound analysis error:', err);
    return NextResponse.json(
      { error: 'Failed to generate compound analysis', analysis: '' },
      { status: 500 }
    );
  }
}
