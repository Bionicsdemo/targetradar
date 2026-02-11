import { NextRequest, NextResponse } from 'next/server';
import { generateMutationImpact } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { profile: TargetProfile; mutation: string };
    if (!body.mutation?.trim()) {
      return NextResponse.json({ error: 'Mutation is required', analysis: '' }, { status: 400 });
    }
    const analysis = await generateMutationImpact(body.profile, body.mutation.trim());
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error('AI mutation impact error:', err);
    return NextResponse.json(
      { error: 'Failed to generate mutation impact analysis', analysis: '' },
      { status: 500 }
    );
  }
}
