import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.6.0',
    services: [
      'Open Targets',
      'ChEMBL',
      'PubMed',
      'ClinicalTrials.gov',
      'bioRxiv',
      'AlphaFold/PDB',
      'AlphaGenome/Ensembl',
    ],
  });
}
