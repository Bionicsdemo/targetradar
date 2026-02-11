import { NextRequest, NextResponse } from 'next/server';

const BUFFER_LIGANDS = new Set([
  'HOH','WAT','GOL','PEG','SO4','PO4','ACT','EDO','CL','NA',
  'MG','CA','ZN','MN','NAG','MAN','BGC','DMS','TRS','FMT',
  'IMD','BME','MPD','EPE','MES','CIT','AZI','SCN','NO3','BR',
  'IOD','FLC','CD','PE4','BU1','BEN','1PE','P6G','MLI',
]);

interface DockingResult {
  pdbId: string;
  ligandId: string | null;
  ligandName: string | null;
  resolution: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const { uniprotId } = (await request.json()) as { uniprotId: string };
    if (!uniprotId) {
      return NextResponse.json({ error: 'uniprotId required' }, { status: 400 });
    }

    // Search RCSB for structures with ligands, sorted by resolution (best first)
    const searchRes = await fetch('https://search.rcsb.org/rcsbsearch/v2/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: {
          type: 'group', logical_operator: 'and',
          nodes: [
            { type: 'terminal', service: 'text', parameters: {
              attribute: 'rcsb_polymer_entity_container_identifiers.reference_sequence_identifiers.database_accession',
              operator: 'in', value: [uniprotId],
            }},
            { type: 'terminal', service: 'text', parameters: {
              attribute: 'rcsb_entry_info.nonpolymer_entity_count',
              operator: 'greater', value: 0,
            }},
          ],
        },
        return_type: 'entry',
        request_options: {
          sort: [{ sort_by: 'rcsb_entry_info.resolution_combined', direction: 'asc' }],
          paginate: { start: 0, rows: 15 },
        },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!searchRes.ok) {
      return NextResponse.json({ error: 'RCSB search failed' }, { status: 502 });
    }

    const searchData = await searchRes.json() as { result_set?: Array<{ identifier: string }> };
    const pdbIds = (searchData.result_set ?? []).map(r => r.identifier);

    if (pdbIds.length === 0) {
      return NextResponse.json({ error: 'No structures found' }, { status: 404 });
    }

    // Check each PDB for drug-like ligands via RCSB GraphQL
    for (const pdbId of pdbIds) {
      try {
        const gqlRes = await fetch('https://data.rcsb.org/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `{
              entry(entry_id: "${pdbId}") {
                rcsb_entry_info { resolution_combined }
                nonpolymer_entities {
                  pdbx_entity_nonpoly { comp_id name }
                  nonpolymer_comp { chem_comp { formula_weight } }
                }
              }
            }`,
          }),
          signal: AbortSignal.timeout(5000),
        });

        const gqlData = await gqlRes.json() as {
          data?: {
            entry?: {
              rcsb_entry_info?: { resolution_combined?: number[] };
              nonpolymer_entities?: Array<{
                pdbx_entity_nonpoly?: { comp_id?: string; name?: string };
                nonpolymer_comp?: { chem_comp?: { formula_weight?: number } };
              }>;
            };
          };
        };

        const entry = gqlData.data?.entry;
        if (!entry) continue;

        const resolution = entry.rcsb_entry_info?.resolution_combined?.[0] ?? 99;

        for (const ent of entry.nonpolymer_entities ?? []) {
          const compId = ent.pdbx_entity_nonpoly?.comp_id;
          const name = ent.pdbx_entity_nonpoly?.name ?? '';
          const mw = ent.nonpolymer_comp?.chem_comp?.formula_weight ?? 0;

          // Drug-like: MW > 200 and not a buffer/salt
          if (compId && !BUFFER_LIGANDS.has(compId) && mw > 200) {
            const result: DockingResult = { pdbId, ligandId: compId, ligandName: name, resolution };
            return NextResponse.json(result, {
              headers: { 'Cache-Control': 'public, max-age=3600' },
            });
          }
        }
      } catch {
        continue; // Skip this PDB, try next
      }
    }

    // No drug-like ligand found -- return the first PDB anyway
    return NextResponse.json({
      pdbId: pdbIds[0],
      ligandId: null,
      ligandName: null,
      resolution: null,
    } satisfies DockingResult, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Docking structure search failed' },
      { status: 500 },
    );
  }
}
