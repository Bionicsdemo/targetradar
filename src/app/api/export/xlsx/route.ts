import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import type { TargetProfile } from '@/lib/types/target-profile';
import type { DimensionName } from '@/lib/types/scoring';
import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from '@/lib/types/scoring';

const DIMENSION_ORDER: DimensionName[] = [
  'geneticEvidence', 'chemicalTractability', 'structuralReadiness',
  'clinicalHistory', 'regulatoryGenomics', 'literatureDepth', 'innovationSignal',
];

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TargetRadar';
    workbook.created = new Date();

    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
      alignment: { horizontal: 'center' },
    };

    // Sheet 1: Summary
    const summary = workbook.addWorksheet('Summary');
    summary.columns = [
      { header: 'Field', key: 'field', width: 25 },
      { header: 'Value', key: 'value', width: 40 },
    ];
    summary.getRow(1).eachCell((cell) => { Object.assign(cell, { style: headerStyle }); });
    summary.addRow({ field: 'Gene Symbol', value: profile.gene });
    summary.addRow({ field: 'Approved Name', value: profile.approvedName });
    summary.addRow({ field: 'Ensembl ID', value: profile.ensemblId });
    summary.addRow({ field: 'UniProt ID', value: profile.uniprotId });
    summary.addRow({ field: 'Overall Score', value: profile.scores.overall });
    summary.addRow({ field: '' });
    DIMENSION_ORDER.forEach((dim) => {
      summary.addRow({
        field: DIMENSION_LABELS[dim],
        value: profile.scores.dimensions[dim].score,
      });
    });
    summary.addRow({ field: '' });
    summary.addRow({ field: 'Analysis Timestamp', value: new Date(profile.metadata.analysisTimestamp).toISOString() });
    summary.addRow({ field: 'Response Time (ms)', value: profile.metadata.totalResponseTimeMs });
    summary.addRow({ field: 'Services Completed', value: `${profile.metadata.servicesCompleted}/7` });

    // Sheet 2: Genetic Evidence
    const genetic = workbook.addWorksheet('Genetic Evidence');
    genetic.columns = [
      { header: 'Disease', key: 'disease', width: 40 },
      { header: 'Score', key: 'score', width: 12 },
      { header: 'Source Diversity', key: 'diversity', width: 15 },
    ];
    genetic.getRow(1).eachCell((cell) => { Object.assign(cell, { style: headerStyle }); });
    const otData = profile.rawData.openTargets.data;
    if (otData) {
      otData.topDiseaseAssociations.forEach((a) => {
        genetic.addRow({ disease: a.diseaseName, score: a.score.toFixed(3), diversity: a.datasourceDiversity });
      });
    }

    // Sheet 3: Compounds
    const compounds = workbook.addWorksheet('Compounds');
    compounds.columns = [
      { header: 'ChEMBL ID', key: 'id', width: 18 },
      { header: 'Mechanism', key: 'mechanism', width: 35 },
      { header: 'Max Phase', key: 'phase', width: 12 },
      { header: 'Action Type', key: 'action', width: 20 },
    ];
    compounds.getRow(1).eachCell((cell) => { Object.assign(cell, { style: headerStyle }); });
    const chemblData = profile.rawData.chembl.data;
    if (chemblData) {
      chemblData.mechanisms.forEach((m) => {
        compounds.addRow({ id: m.moleculeChemblId, mechanism: m.mechanismOfAction, phase: m.maxPhase, action: m.actionType });
      });
    }

    // Sheet 4: Clinical Trials
    const trials = workbook.addWorksheet('Clinical Trials');
    trials.columns = [
      { header: 'NCT ID', key: 'nct', width: 18 },
      { header: 'Title', key: 'title', width: 50 },
      { header: 'Phase', key: 'phase', width: 12 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Sponsor', key: 'sponsor', width: 30 },
    ];
    trials.getRow(1).eachCell((cell) => { Object.assign(cell, { style: headerStyle }); });
    const ctData = profile.rawData.clinicalTrials.data;
    if (ctData) {
      ctData.studies.forEach((s) => {
        trials.addRow({ nct: s.nctId, title: s.title, phase: s.phase, status: s.status, sponsor: s.sponsor });
      });
    }

    // Sheet 5: Publications
    const pubs = workbook.addWorksheet('Publications');
    pubs.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Count', key: 'count', width: 15 },
    ];
    pubs.getRow(1).eachCell((cell) => { Object.assign(cell, { style: headerStyle }); });
    const pubData = profile.rawData.pubmed.data;
    if (pubData) {
      pubs.addRow({ metric: 'Total Publications', count: pubData.totalPublications });
      pubs.addRow({ metric: 'Recent (2 years)', count: pubData.recentPublications });
      pubs.addRow({ metric: 'Drug-Focused', count: pubData.drugFocusedPublications });
      pubs.addRow({ metric: 'Review Articles', count: pubData.reviewArticles });
    }

    // Sheet 6: Preprints
    const preprints = workbook.addWorksheet('Preprints');
    preprints.columns = [
      { header: 'DOI', key: 'doi', width: 30 },
      { header: 'Title', key: 'title', width: 50 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Authors', key: 'authors', width: 30 },
    ];
    preprints.getRow(1).eachCell((cell) => { Object.assign(cell, { style: headerStyle }); });
    const bioData = profile.rawData.biorxiv.data;
    if (bioData) {
      bioData.recentPreprints.forEach((p) => {
        preprints.addRow({ doi: p.doi, title: p.title, date: p.date, authors: p.authors });
      });
    }

    // Sheet 7: Regulatory Genomics (AlphaGenome)
    const regulatory = workbook.addWorksheet('Regulatory Genomics');
    regulatory.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    regulatory.getRow(1).eachCell((cell) => { Object.assign(cell, { style: headerStyle }); });
    const agData = profile.rawData.alphagenome.data;
    if (agData) {
      regulatory.addRow({ metric: 'Regulatory Features (±50kb)', value: agData.regulatoryFeatureCount });
      regulatory.addRow({ metric: 'Promoters', value: agData.promoterCount });
      regulatory.addRow({ metric: 'Enhancers', value: agData.enhancerCount });
      regulatory.addRow({ metric: 'CTCF Binding Sites', value: agData.ctcfCount });
      regulatory.addRow({ metric: 'Open Chromatin Regions', value: agData.openChromatinCount });
      regulatory.addRow({ metric: 'Constrained Elements', value: agData.constrainedElementCount });
      regulatory.addRow({ metric: 'Gene Length (bp)', value: agData.geneLength });
      regulatory.addRow({ metric: 'Chromosome', value: agData.chromosome });
      regulatory.addRow({ metric: 'Biotype', value: agData.biotype });
      regulatory.addRow({ metric: 'Transcript Count', value: agData.transcriptCount });
      regulatory.addRow({ metric: 'Regulatory Complexity', value: agData.regulatoryComplexity });
      regulatory.addRow({ metric: 'Expression Breadth (%)', value: agData.expressionBreadth });
    }

    // Sheet 8: Scoring Methodology
    const methodology = workbook.addWorksheet('Scoring Methodology');
    methodology.columns = [
      { header: 'Dimension', key: 'dimension', width: 25 },
      { header: 'Weight', key: 'weight', width: 10 },
      { header: 'Component', key: 'component', width: 25 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Max', key: 'max', width: 10 },
      { header: 'Description', key: 'desc', width: 40 },
    ];
    methodology.getRow(1).eachCell((cell) => { Object.assign(cell, { style: headerStyle }); });
    DIMENSION_ORDER.forEach((dim) => {
      const score = profile.scores.dimensions[dim];
      score.components.forEach((c, i) => {
        methodology.addRow({
          dimension: i === 0 ? DIMENSION_LABELS[dim] : '',
          weight: i === 0 ? DIMENSION_WEIGHTS[dim] : '',
          component: c.name,
          score: c.value.toFixed(1),
          max: c.maxValue,
          desc: c.description,
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="TargetRadar_${profile.gene}_Data.xlsx"`,
      },
    });
  } catch (err) {
    console.error('XLSX export error:', err);
    return NextResponse.json({ error: 'Failed to generate spreadsheet' }, { status: 500 });
  }
}
