import { NextRequest, NextResponse } from 'next/server';
import { resolveGeneToEnsembl, fetchOpenTargetsData } from '@/lib/services/open-targets';
import { fetchChEMBLData } from '@/lib/services/chembl';
import { fetchPubMedData } from '@/lib/services/pubmed';
import { fetchClinicalTrialsData } from '@/lib/services/clinical-trials';
import { fetchBioRxivData } from '@/lib/services/biorxiv';
import { fetchAlphaFoldData, resolveUniProtId } from '@/lib/services/alphafold';
import { fetchAlphaGenomeData } from '@/lib/services/alphagenome';
import { calculateScores } from '@/lib/scoring/engine';
import { resolveGeneAlias } from '@/lib/utils/gene-aliases';
import { cacheGet, cacheSet } from '@/lib/utils/cache';
import type { TargetProfile } from '@/lib/types/target-profile';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json() as { gene: string };
    const gene = resolveGeneAlias(body.gene || '');

    if (!gene) {
      return NextResponse.json({ error: 'Gene symbol is required' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `analysis-${gene}`;
    const cached = cacheGet<TargetProfile>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Resolve gene to Ensembl ID
    const resolved = await resolveGeneToEnsembl(gene);
    if (!resolved) {
      return NextResponse.json(
        { error: `Could not resolve gene symbol: ${gene}` },
        { status: 404 }
      );
    }

    const ensemblId = resolved.id;

    // Resolve UniProt ID
    const uniprotId = await resolveUniProtId(gene) ?? '';

    // Fetch all 7 data sources in parallel
    const [openTargets, chembl, pubmed, clinicalTrials, biorxiv, alphafold, alphagenome] =
      await Promise.allSettled([
        fetchOpenTargetsData(gene, ensemblId),
        fetchChEMBLData(gene),
        fetchPubMedData(gene),
        fetchClinicalTrialsData(gene),
        fetchBioRxivData(gene),
        fetchAlphaFoldData(gene),
        fetchAlphaGenomeData(ensemblId),
      ]);

    const otResult = openTargets.status === 'fulfilled' ? openTargets.value : { success: false, data: null, error: 'Service failed', source: 'Open Targets', timestamp: Date.now(), cached: false, responseTimeMs: 0 };
    const chemblResult = chembl.status === 'fulfilled' ? chembl.value : { success: false, data: null, error: 'Service failed', source: 'ChEMBL', timestamp: Date.now(), cached: false, responseTimeMs: 0 };
    const pubmedResult = pubmed.status === 'fulfilled' ? pubmed.value : { success: false, data: null, error: 'Service failed', source: 'PubMed', timestamp: Date.now(), cached: false, responseTimeMs: 0 };
    const ctResult = clinicalTrials.status === 'fulfilled' ? clinicalTrials.value : { success: false, data: null, error: 'Service failed', source: 'ClinicalTrials.gov', timestamp: Date.now(), cached: false, responseTimeMs: 0 };
    const biorxivResult = biorxiv.status === 'fulfilled' ? biorxiv.value : { success: false, data: null, error: 'Service failed', source: 'bioRxiv', timestamp: Date.now(), cached: false, responseTimeMs: 0 };
    const alphafoldResult = alphafold.status === 'fulfilled' ? alphafold.value : { success: false, data: null, error: 'Service failed', source: 'AlphaFold/PDB', timestamp: Date.now(), cached: false, responseTimeMs: 0 };
    const alphagenomeResult = alphagenome.status === 'fulfilled' ? alphagenome.value : { success: false, data: null, error: 'Service failed', source: 'AlphaGenome', timestamp: Date.now(), cached: false, responseTimeMs: 0 };

    // Calculate scores
    const scores = calculateScores({
      openTargets: otResult.data,
      chembl: chemblResult.data,
      pubmed: pubmedResult.data,
      clinicalTrials: ctResult.data,
      biorxiv: biorxivResult.data,
      alphafold: alphafoldResult.data,
      alphagenome: alphagenomeResult.data,
    });

    const results = [otResult, chemblResult, pubmedResult, ctResult, biorxivResult, alphafoldResult, alphagenomeResult];
    const servicesCompleted = results.filter((r) => r.success).length;

    const profile: TargetProfile = {
      gene,
      ensemblId,
      uniprotId,
      approvedName: otResult.data?.approvedName ?? gene,
      scores: {
        overall: scores.value,
        dimensions: scores.dimensions,
      },
      rawData: {
        openTargets: otResult,
        chembl: chemblResult,
        pubmed: pubmedResult,
        clinicalTrials: ctResult,
        biorxiv: biorxivResult,
        alphafold: alphafoldResult,
        alphagenome: alphagenomeResult,
      },
      metadata: {
        analysisTimestamp: Date.now(),
        totalResponseTimeMs: Date.now() - startTime,
        servicesCompleted,
        servicesFailed: 7 - servicesCompleted,
      },
    };

    cacheSet(cacheKey, profile);
    return NextResponse.json(profile);
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
