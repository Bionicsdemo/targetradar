import { NextRequest, NextResponse } from 'next/server';
import { generateTargetNarrative } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const narrative = await generateTargetNarrative(profile);
    return NextResponse.json({ narrative });
  } catch (err) {
    console.error('AI narrative error:', err);
    return NextResponse.json(
      { error: 'Failed to generate narrative', narrative: '' },
      { status: 500 }
    );
  }
}
