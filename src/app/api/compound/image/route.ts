import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/compound/image?smiles=...&size=300
 *
 * Server-side proxy for 2D structure images with multi-source fallback:
 *   1. PubChem PUG REST (PNG) — best quality, but only for known compounds
 *   2. CDK Depict (SVG) — open-source, handles any valid SMILES
 * Cached for 7 days (immutable molecular structures).
 */
export async function GET(request: NextRequest) {
  const smiles = request.nextUrl.searchParams.get('smiles')?.trim();
  if (!smiles) {
    return NextResponse.json({ error: 'SMILES required' }, { status: 400 });
  }

  const size = parseInt(request.nextUrl.searchParams.get('size') ?? '300', 10);
  const imgSize = isNaN(size) ? 300 : Math.min(Math.max(size, 100), 500);
  const encoded = encodeURIComponent(smiles);

  const cacheHeaders = {
    'Cache-Control': 'public, max-age=604800, immutable',
  };

  // Source 1: PubChem (PNG) — high quality, but only for compounds in PubChem DB
  try {
    const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encoded}/PNG?image_size=${imgSize}x${imgSize}`;
    const res = await fetch(pubchemUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength > 100) {
        return new Response(buffer, {
          headers: { 'Content-Type': 'image/png', ...cacheHeaders },
        });
      }
    }
  } catch {
    // PubChem failed — try CDK Depict
  }

  // Source 2: CDK Depict (SVG) — works for ANY valid SMILES, open source
  try {
    const cdkUrl = `https://www.simolecule.com/cdkdepict/depict/bow/svg?smi=${encoded}&w=${imgSize}&h=${imgSize}&zoom=1.5&annotate=colmap`;
    const res = await fetch(cdkUrl, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const svg = await res.text();
      if (svg.includes('<svg')) {
        return new Response(svg, {
          headers: { 'Content-Type': 'image/svg+xml', ...cacheHeaders },
        });
      }
    }
  } catch {
    // CDK Depict also failed
  }

  return new Response('Image not available', { status: 404 });
}
