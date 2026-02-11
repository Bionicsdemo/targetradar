import { NextResponse } from 'next/server';

interface PubChemProperty {
  MolecularWeight: number;
  XLogP: number;
  TPSA: number;
  HBondDonorCount: number;
  HBondAcceptorCount: number;
  RotatableBondCount: number;
}

interface PubChemResponse {
  PropertyTable: {
    Properties: PubChemProperty[];
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { smiles?: string };
    const smiles = body.smiles?.trim();

    if (!smiles) {
      return NextResponse.json(
        { success: false, error: 'SMILES string is required' },
        { status: 400 }
      );
    }

    const encoded = encodeURIComponent(smiles);
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encoded}/property/MolecularWeight,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount/JSON`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { success: false, error: `PubChem error: ${res.status} — ${text.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as PubChemResponse;
    const props = data.PropertyTable?.Properties?.[0];

    if (!props) {
      return NextResponse.json(
        { success: false, error: 'No properties found for this SMILES' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      properties: {
        molecularWeight: props.MolecularWeight,
        alogp: props.XLogP,
        psa: props.TPSA,
        hba: props.HBondAcceptorCount,
        hbd: props.HBondDonorCount,
        rotatableBonds: props.RotatableBondCount,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
