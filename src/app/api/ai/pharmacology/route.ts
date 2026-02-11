import { NextRequest, NextResponse } from 'next/server';
import { generatePharmacologySafety } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;
    const analysis = await generatePharmacologySafety(profile);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('AI pharmacology error:', err);
    return NextResponse.json(
      { error: 'Failed to generate pharmacology analysis', analysis: '' },
      { status: 500 }
    );
  }
}
