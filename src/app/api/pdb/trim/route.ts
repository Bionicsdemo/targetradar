import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/pdb/trim?pdbId=7Z87&ligand=1IX&radius=20
 *
 * Server-side PDB trimming for large structures.
 * Downloads the full PDB, extracts only atoms within `radius` angstroms
 * of the specified ligand, and returns a lightweight PDB.
 * Browser never sees the multi-MB file.
 */
export async function GET(request: NextRequest) {
  const pdbId = request.nextUrl.searchParams.get('pdbId')?.trim();
  const ligand = request.nextUrl.searchParams.get('ligand')?.trim();
  const radiusStr = request.nextUrl.searchParams.get('radius') ?? '20';
  const radius = parseFloat(radiusStr) || 20;

  if (!pdbId) {
    return NextResponse.json({ error: 'pdbId required' }, { status: 400 });
  }

  try {
    // Download PDB server-side
    const res = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `PDB ${pdbId} not found` }, { status: 404 });
    }

    const fullPdb = await res.text();
    const lines = fullPdb.split('\n');
    const MAX_ATOMS = 8000; // 3Dmol.js handles ~8K atoms smoothly

    // Small PDB — return as-is (just strip water)
    if (fullPdb.length < 800_000) {
      const stripped = lines.filter(l =>
        !(l.startsWith('HETATM') && (l.substring(17, 20).trim() === 'HOH' || l.substring(17, 20).trim() === 'WAT'))
      ).join('\n');
      return new Response(stripped, {
        headers: { 'Content-Type': 'chemical/x-pdb', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    // Large PDB without ligand — keep only chain A, cap at MAX_ATOMS
    if (!ligand) {
      let atomCount = 0;
      const chainA = lines.filter(l => {
        if (!l.startsWith('ATOM') && !l.startsWith('HETATM')) return true;
        const resn = l.substring(17, 20).trim();
        if (resn === 'HOH' || resn === 'WAT') return false;
        const chain = l.substring(21, 22);
        if (chain !== 'A' && chain !== ' ') return false;
        atomCount++;
        return atomCount <= MAX_ATOMS;
      }).join('\n');
      return new Response(chainA, {
        headers: { 'Content-Type': 'chemical/x-pdb', 'Cache-Control': 'public, max-age=86400' },
      });
    }

    // Find ligand atoms and their coordinates
    const ligandCoords: Array<[number, number, number]> = [];
    const ligandLines: string[] = [];
    const headerLines: string[] = [];
    const atomLines: Array<{ line: string; x: number; y: number; z: number }> = [];

    for (const line of lines) {
      if (line.startsWith('HETATM') || line.startsWith('ATOM  ')) {
        const resn = line.substring(17, 20).trim();
        const x = parseFloat(line.substring(30, 38));
        const y = parseFloat(line.substring(38, 46));
        const z = parseFloat(line.substring(46, 54));

        if (isNaN(x) || isNaN(y) || isNaN(z)) continue;

        if (resn === ligand) {
          ligandCoords.push([x, y, z]);
          ligandLines.push(line);
        } else if (resn !== 'HOH' && resn !== 'WAT') {
          atomLines.push({ line, x, y, z });
        }
      } else if (
        line.startsWith('HEADER') ||
        line.startsWith('TITLE') ||
        line.startsWith('COMPND') ||
        line.startsWith('REMARK') ||
        line.startsWith('SEQRES') ||
        line.startsWith('END')
      ) {
        headerLines.push(line);
      }
    }

    // If ligand not found, return chain A only
    if (ligandCoords.length === 0) {
      const chainA = lines.filter(l => {
        if (!l.startsWith('ATOM') && !l.startsWith('HETATM')) return true;
        const resn = l.substring(17, 20).trim();
        if (resn === 'HOH' || resn === 'WAT') return false;
        return l.substring(21, 22) === 'A' || l.startsWith('HETATM');
      }).join('\n');
      return new Response(chainA, {
        headers: {
          'Content-Type': 'chemical/x-pdb',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Calculate ligand center
    const n = ligandCoords.length;
    const cx = ligandCoords.reduce((s, c) => s + c[0], 0) / n;
    const cy = ligandCoords.reduce((s, c) => s + c[1], 0) / n;
    const cz = ligandCoords.reduce((s, c) => s + c[2], 0) / n;
    const r2 = radius * radius;

    // Keep atoms within radius of ligand center
    const nearbyLines = atomLines
      .filter(({ x, y, z }) => {
        const dx = x - cx, dy = y - cy, dz = z - cz;
        return (dx * dx + dy * dy + dz * dz) <= r2;
      })
      .map(a => a.line);

    // Keep only essential headers (not all REMARK lines)
    const essentialHeaders = headerLines.filter(l =>
      l.startsWith('HEADER') || l.startsWith('TITLE') || l.startsWith('END')
    );

    const trimmedPdb = [...essentialHeaders, ...nearbyLines, ...ligandLines, 'END'].join('\n');

    return new Response(trimmedPdb, {
      headers: {
        'Content-Type': 'chemical/x-pdb',
        'Cache-Control': 'public, max-age=86400',
        'X-Original-Size': String(fullPdb.length),
        'X-Trimmed-Size': String(trimmedPdb.length),
        'X-Atoms-Kept': String(nearbyLines.length + ligandLines.length),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch PDB' },
      { status: 500 },
    );
  }
}
