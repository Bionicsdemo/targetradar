import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const smiles = request.nextUrl.searchParams.get('smiles')?.trim();
  if (!smiles) {
    return NextResponse.json({ error: 'SMILES required' }, { status: 400 });
  }

  try {
    const encoded = encodeURIComponent(smiles);

    // Try 3D conformer first
    const url3d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encoded}/SDF?record_type=3d`;
    const res3d = await fetch(url3d, { signal: AbortSignal.timeout(8000) });

    if (res3d.ok) {
      const sdf = await res3d.text();
      // Verify it's actually 3D by checking the header (PubChem puts "3D" in line 4)
      const is3d = sdf.includes('3D') || !sdf.includes('2D');
      if (sdf.trim().length > 50) {
        return NextResponse.json({ sdf, is3d }, {
          headers: { 'Cache-Control': 'public, max-age=86400' },
        });
      }
    }

    // Fallback to 2D SDF
    const url2d = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encoded}/SDF`;
    const res2d = await fetch(url2d, { signal: AbortSignal.timeout(8000) });
    if (!res2d.ok) {
      return NextResponse.json({ error: 'No SDF available' }, { status: 404 });
    }
    const sdf2d = await res2d.text();
    if (sdf2d.trim().length < 50) {
      return NextResponse.json({ error: 'Empty SDF returned' }, { status: 404 });
    }
    return NextResponse.json({ sdf: sdf2d, is3d: false }, {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch SDF' },
      { status: 500 }
    );
  }
}
