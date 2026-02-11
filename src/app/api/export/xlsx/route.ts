import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import type { TargetProfile, CompoundDetail } from '@/lib/types/target-profile';
import type { DimensionName } from '@/lib/types/scoring';
import { DIMENSION_LABELS, DIMENSION_WEIGHTS } from '@/lib/types/scoring';

const DIMENSION_ORDER: DimensionName[] = [
  'geneticEvidence', 'chemicalTractability', 'structuralReadiness',
  'clinicalHistory', 'regulatoryGenomics', 'literatureDepth', 'innovationSignal',
];

// ── Color constants ──────────────────────────────────────────────────
const BLUE_HEADER: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
const GREEN_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
const AMBER_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } };
const RED_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
const LIGHT_GREEN_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
const LIGHT_AMBER_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
const LIGHT_RED_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
const GRAY_STRIPE: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
const SECTION_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } };
const PHASE4_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22C55E' } };
const PHASE3_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
const PHASE2_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
const PHASE1_FILL: Partial<ExcelJS.Fill> = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } };

const headerStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
  fill: BLUE_HEADER as ExcelJS.Fill,
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: {
    bottom: { style: 'thin', color: { argb: 'FF1D4ED8' } },
  },
};

const sectionStyle: Partial<ExcelJS.Style> = {
  font: { bold: true, size: 11, color: { argb: 'FF1E40AF' } },
  fill: SECTION_FILL as ExcelJS.Fill,
  alignment: { horizontal: 'left' },
};

// ── Helper functions ─────────────────────────────────────────────────
function getScoreFill(score: number): Partial<ExcelJS.Fill> {
  if (score >= 70) return GREEN_FILL;
  if (score >= 40) return AMBER_FILL;
  return RED_FILL;
}

function getScoreFillLight(score: number): Partial<ExcelJS.Fill> {
  if (score >= 70) return LIGHT_GREEN_FILL;
  if (score >= 40) return LIGHT_AMBER_FILL;
  return LIGHT_RED_FILL;
}

function getOverallLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Moderate';
  if (score >= 35) return 'Fair';
  return 'Low';
}

function getPhaseFill(phase: number): Partial<ExcelJS.Fill> | undefined {
  if (phase >= 4) return PHASE4_FILL;
  if (phase >= 3) return PHASE3_FILL;
  if (phase >= 2) return PHASE2_FILL;
  if (phase >= 1) return PHASE1_FILL;
  return undefined;
}

function applyHeaderStyle(ws: ExcelJS.Worksheet): void {
  ws.getRow(1).eachCell((cell) => {
    Object.assign(cell, { style: headerStyle });
  });
}

function applyAlternatingRows(ws: ExcelJS.Worksheet, startRow: number): void {
  for (let r = startRow; r <= ws.rowCount; r++) {
    if (r % 2 === 0) {
      const row = ws.getRow(r);
      row.eachCell({ includeEmpty: true }, (cell) => {
        if (!cell.fill || (cell.fill as ExcelJS.FillPattern).pattern === 'none') {
          cell.fill = GRAY_STRIPE as ExcelJS.Fill;
        }
      });
    }
  }
}

function freezeAndFilter(ws: ExcelJS.Worksheet): void {
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0, activeCell: 'A2', topLeftCell: 'A2' }];
  if (ws.columnCount > 0 && ws.rowCount > 0) {
    const lastCol = String.fromCharCode(64 + Math.min(ws.columnCount, 26));
    ws.autoFilter = { from: 'A1', to: `${lastCol}${ws.rowCount}` };
  }
}

function freezeAndFilterFromRow(ws: ExcelJS.Worksheet, headerRow: number): void {
  ws.views = [{ state: 'frozen', ySplit: headerRow, xSplit: 0, activeCell: `A${headerRow + 1}`, topLeftCell: `A${headerRow + 1}` }];
}

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TargetRadar';
    workbook.created = new Date();

    // ══════════════════════════════════════════════════════════════════
    // Sheet 1: Summary — Enhanced with score bars, metadata, gene info
    // ══════════════════════════════════════════════════════════════════
    const summary = workbook.addWorksheet('Summary');
    summary.columns = [
      { header: 'Field', key: 'field', width: 30 },
      { header: 'Value', key: 'value', width: 30 },
      { header: 'Score Bar', key: 'bar', width: 14 },
      { header: 'Details', key: 'details', width: 35 },
    ];
    applyHeaderStyle(summary);

    // Section: Target Identity
    const identityRow = summary.addRow({ field: 'TARGET IDENTITY', value: '', bar: '', details: '' });
    identityRow.eachCell((cell) => { Object.assign(cell, { style: sectionStyle }); });
    summary.mergeCells(`A${identityRow.number}:D${identityRow.number}`);

    summary.addRow({ field: 'Gene Symbol', value: profile.gene, bar: '', details: '' });
    summary.addRow({ field: 'Approved Name', value: profile.approvedName, bar: '', details: '' });
    summary.addRow({ field: 'Ensembl ID', value: profile.ensemblId, bar: '', details: '' });
    summary.addRow({ field: 'UniProt ID', value: profile.uniprotId, bar: '', details: '' });

    // Chromosome & biotype from AlphaGenome data
    const agData = profile.rawData.alphagenome.data;
    if (agData) {
      summary.addRow({ field: 'Chromosome', value: agData.chromosome, bar: '', details: '' });
      summary.addRow({ field: 'Biotype', value: agData.biotype, bar: '', details: '' });
    }

    // Structural info from AlphaFold data
    const afData = profile.rawData.alphafold.data;
    if (afData) {
      summary.addRow({ field: 'PDB Structure Count', value: afData.pdbCount, bar: '', details: afData.pdbIds.slice(0, 5).join(', ') || 'None' });
      summary.addRow({ field: 'AlphaFold pLDDT', value: afData.avgPLDDT > 0 ? afData.avgPLDDT.toFixed(1) : 'N/A', bar: '', details: afData.hasAlphaFold ? 'Available' : 'Not available' });
      if (afData.bestResolution > 0) {
        summary.addRow({ field: 'Best Resolution (\u00C5)', value: afData.bestResolution.toFixed(2), bar: '', details: '' });
      }
    }

    // Section: Overall Score
    const overallRow = summary.addRow({ field: 'OVERALL SCORE', value: '', bar: '', details: '' });
    overallRow.eachCell((cell) => { Object.assign(cell, { style: sectionStyle }); });
    summary.mergeCells(`A${overallRow.number}:D${overallRow.number}`);

    const overallScoreRow = summary.addRow({
      field: 'Overall Score',
      value: profile.scores.overall.toFixed(1),
      bar: getOverallLabel(profile.scores.overall),
      details: '',
    });
    overallScoreRow.getCell('value').font = { bold: true, size: 14 };
    overallScoreRow.getCell('bar').fill = getScoreFill(profile.scores.overall) as ExcelJS.Fill;
    overallScoreRow.getCell('bar').font = { bold: true, color: { argb: 'FFFFFFFF' } };
    overallScoreRow.getCell('bar').alignment = { horizontal: 'center' };

    // Section: Dimension Scores
    const dimHeader = summary.addRow({ field: 'DIMENSION SCORES', value: '', bar: '', details: '' });
    dimHeader.eachCell((cell) => { Object.assign(cell, { style: sectionStyle }); });
    summary.mergeCells(`A${dimHeader.number}:D${dimHeader.number}`);

    // Dimension header sub-row
    const dimLabelRow = summary.addRow({ field: 'Dimension', value: 'Score', bar: 'Rating', details: 'Weighted Contribution' });
    dimLabelRow.eachCell((cell) => { cell.font = { bold: true, italic: true }; });

    DIMENSION_ORDER.forEach((dim) => {
      const score = profile.scores.dimensions[dim].score;
      const weight = DIMENSION_WEIGHTS[dim];
      const weighted = score * weight;
      const row = summary.addRow({
        field: DIMENSION_LABELS[dim],
        value: score.toFixed(1),
        bar: '',
        details: `${weighted.toFixed(1)} (${(weight * 100).toFixed(0)}% weight)`,
      });
      row.getCell('bar').fill = getScoreFill(score) as ExcelJS.Fill;
      row.getCell('value').numFmt = '0.0';
      row.getCell('value').alignment = { horizontal: 'center' };
    });

    // Section: Analysis Metadata
    const metaRow = summary.addRow({ field: 'ANALYSIS METADATA', value: '', bar: '', details: '' });
    metaRow.eachCell((cell) => { Object.assign(cell, { style: sectionStyle }); });
    summary.mergeCells(`A${metaRow.number}:D${metaRow.number}`);

    summary.addRow({ field: 'Analysis Timestamp', value: new Date(profile.metadata.analysisTimestamp).toISOString(), bar: '', details: '' });
    summary.addRow({ field: 'Response Time (ms)', value: profile.metadata.totalResponseTimeMs, bar: '', details: '' });
    summary.addRow({ field: 'Services Completed', value: `${profile.metadata.servicesCompleted}/7`, bar: '', details: '' });
    summary.addRow({ field: 'Services Failed', value: `${profile.metadata.servicesFailed}/7`, bar: '', details: '' });

    applyAlternatingRows(summary, 2);
    summary.views = [{ state: 'frozen', ySplit: 1, xSplit: 0, activeCell: 'A2', topLeftCell: 'A2' }];

    // ══════════════════════════════════════════════════════════════════
    // Sheet 2: Genetic Evidence
    // ══════════════════════════════════════════════════════════════════
    const genetic = workbook.addWorksheet('Genetic Evidence');
    genetic.columns = [
      { header: 'Disease', key: 'disease', width: 40 },
      { header: 'Disease ID', key: 'diseaseId', width: 18 },
      { header: 'Score', key: 'score', width: 12 },
      { header: 'Source Diversity', key: 'diversity', width: 16 },
    ];
    applyHeaderStyle(genetic);
    const otData = profile.rawData.openTargets.data;
    if (otData) {
      otData.topDiseaseAssociations.forEach((a) => {
        const row = genetic.addRow({
          disease: a.diseaseName,
          diseaseId: a.diseaseId,
          score: a.score,
          diversity: a.datasourceDiversity,
        });
        row.getCell('score').numFmt = '0.000';
        // Color score cells
        const scoreVal = a.score * 100;
        row.getCell('score').fill = getScoreFillLight(scoreVal) as ExcelJS.Fill;
      });
    }
    applyAlternatingRows(genetic, 2);
    freezeAndFilter(genetic);

    // ══════════════════════════════════════════════════════════════════
    // Sheet 3: Compounds — Full compound data with molecular properties
    // ══════════════════════════════════════════════════════════════════
    const compounds = workbook.addWorksheet('Compounds');
    compounds.columns = [
      { header: 'ChEMBL ID', key: 'id', width: 16 },
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Type', key: 'type', width: 16 },
      { header: 'Max Phase', key: 'phase', width: 11 },
      { header: 'MW', key: 'mw', width: 10 },
      { header: 'LogP', key: 'logp', width: 8 },
      { header: 'TPSA', key: 'tpsa', width: 8 },
      { header: 'HBA', key: 'hba', width: 6 },
      { header: 'HBD', key: 'hbd', width: 6 },
      { header: 'RO5 Violations', key: 'ro5', width: 14 },
      { header: 'Aromatic Rings', key: 'arom', width: 14 },
      { header: 'Rotatable Bonds', key: 'rotb', width: 15 },
      { header: 'pChEMBL', key: 'pchembl', width: 10 },
      { header: 'Activity Type', key: 'actType', width: 14 },
      { header: 'SMILES', key: 'smiles', width: 40 },
    ];
    applyHeaderStyle(compounds);

    const chemblData = profile.rawData.chembl.data;
    if (chemblData) {
      const topCompounds: CompoundDetail[] = chemblData.topCompounds ?? [];

      if (topCompounds.length > 0) {
        topCompounds.forEach((c) => {
          const row = compounds.addRow({
            id: c.chemblId,
            name: c.preferredName ?? '',
            type: c.moleculeType,
            phase: c.maxPhase,
            mw: c.molecularWeight != null ? c.molecularWeight : '',
            logp: c.alogp != null ? c.alogp : '',
            tpsa: c.psa != null ? c.psa : '',
            hba: c.hba != null ? c.hba : '',
            hbd: c.hbd != null ? c.hbd : '',
            ro5: c.numRo5Violations != null ? c.numRo5Violations : '',
            arom: c.aromaticRings != null ? c.aromaticRings : '',
            rotb: c.rotatableBonds != null ? c.rotatableBonds : '',
            pchembl: c.pchemblValue != null ? c.pchemblValue : '',
            actType: c.activityType ?? '',
            smiles: c.smiles ?? '',
          });

          // Phase coloring
          const phaseFill = getPhaseFill(c.maxPhase);
          if (phaseFill) {
            row.getCell('phase').fill = phaseFill as ExcelJS.Fill;
            row.getCell('phase').font = { color: { argb: c.maxPhase >= 3 ? 'FFFFFFFF' : 'FF000000' }, bold: true };
          }

          // RO5 violations coloring
          if (c.numRo5Violations != null) {
            if (c.numRo5Violations <= 1) {
              row.getCell('ro5').fill = LIGHT_GREEN_FILL as ExcelJS.Fill;
            } else if (c.numRo5Violations === 2) {
              row.getCell('ro5').fill = LIGHT_AMBER_FILL as ExcelJS.Fill;
            } else {
              row.getCell('ro5').fill = LIGHT_RED_FILL as ExcelJS.Fill;
            }
          }

          // Number formats
          if (c.molecularWeight != null) row.getCell('mw').numFmt = '0.0';
          if (c.alogp != null) row.getCell('logp').numFmt = '0.00';
          if (c.psa != null) row.getCell('tpsa').numFmt = '0.0';
          if (c.pchemblValue != null) row.getCell('pchembl').numFmt = '0.00';
        });
      } else {
        // Fallback to mechanisms if no topCompounds
        chemblData.mechanisms.forEach((m) => {
          compounds.addRow({
            id: m.moleculeChemblId,
            name: '',
            type: '',
            phase: m.maxPhase,
            mw: '', logp: '', tpsa: '', hba: '', hbd: '',
            ro5: '', arom: '', rotb: '', pchembl: '',
            actType: m.actionType,
            smiles: '',
          });
        });
      }
    }
    applyAlternatingRows(compounds, 2);
    freezeAndFilter(compounds);

    // ══════════════════════════════════════════════════════════════════
    // Sheet 4: Clinical Trials — With summary stats at top
    // ══════════════════════════════════════════════════════════════════
    const trials = workbook.addWorksheet('Clinical Trials');
    const ctData = profile.rawData.clinicalTrials.data;

    // Summary section at top
    trials.columns = [
      { header: 'NCT ID', key: 'nct', width: 18 },
      { header: 'Title', key: 'title', width: 50 },
      { header: 'Phase', key: 'phase', width: 12 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Sponsor', key: 'sponsor', width: 30 },
      { header: 'Start Date', key: 'startDate', width: 14 },
      { header: 'Enrollment', key: 'enrollment', width: 12 },
      { header: 'Conditions', key: 'conditions', width: 35 },
      { header: 'Interventions', key: 'interventions', width: 35 },
    ];

    // Build summary rows BEFORE the header
    // We'll use a different approach: put summary at top, then a header row, then data
    // First clear automatic header
    trials.spliceRows(1, 1); // Remove auto header row

    // Summary section header
    const trialSummaryTitle = trials.addRow(['CLINICAL TRIALS SUMMARY', '', '', '', '', '', '', '', '']);
    trialSummaryTitle.eachCell((cell) => { Object.assign(cell, { style: sectionStyle }); });
    trials.mergeCells(`A${trialSummaryTitle.number}:I${trialSummaryTitle.number}`);

    if (ctData) {
      const statsRow1 = trials.addRow([
        'Total Trials', ctData.totalTrials,
        'Active Trials', ctData.activeTrials,
        'Max Phase', chemblData?.maxClinicalPhase ?? 'N/A',
        'Recent Trials', ctData.recentTrials,
        '',
      ]);
      statsRow1.getCell(1).font = { bold: true };
      statsRow1.getCell(3).font = { bold: true };
      statsRow1.getCell(5).font = { bold: true };
      statsRow1.getCell(7).font = { bold: true };

      // Trials by phase breakdown
      const phaseLabel = trials.addRow(['TRIALS BY PHASE', '', '', '', '', '', '', '', '']);
      phaseLabel.eachCell((cell) => { Object.assign(cell, { style: sectionStyle }); });
      trials.mergeCells(`A${phaseLabel.number}:I${phaseLabel.number}`);

      const phaseEntries = Object.entries(ctData.trialsByPhase);
      if (phaseEntries.length > 0) {
        const phaseHeaders: string[] = [];
        const phaseValues: (string | number)[] = [];
        phaseEntries.forEach(([phase, count]) => {
          phaseHeaders.push(phase);
          phaseValues.push(count);
        });
        // Pad to 9 columns
        while (phaseHeaders.length < 9) { phaseHeaders.push(''); phaseValues.push(''); }
        const phRow = trials.addRow(phaseHeaders);
        phRow.eachCell((cell) => { cell.font = { bold: true, italic: true }; });
        trials.addRow(phaseValues);
      }

      // Trials by status breakdown
      const statusLabel = trials.addRow(['TRIALS BY STATUS', '', '', '', '', '', '', '', '']);
      statusLabel.eachCell((cell) => { Object.assign(cell, { style: sectionStyle }); });
      trials.mergeCells(`A${statusLabel.number}:I${statusLabel.number}`);

      const statusEntries = Object.entries(ctData.trialsByStatus);
      if (statusEntries.length > 0) {
        const statusHeaders: string[] = [];
        const statusValues: (string | number)[] = [];
        statusEntries.forEach(([status, count]) => {
          statusHeaders.push(status);
          statusValues.push(count);
        });
        while (statusHeaders.length < 9) { statusHeaders.push(''); statusValues.push(''); }
        const stRow = trials.addRow(statusHeaders);
        stRow.eachCell((cell) => { cell.font = { bold: true, italic: true }; });
        trials.addRow(statusValues);
      }

      // Blank row separator
      trials.addRow([]);

      // Column header row for individual studies
      const trialHeaderRow = trials.addRow(['NCT ID', 'Title', 'Phase', 'Status', 'Sponsor', 'Start Date', 'Enrollment', 'Conditions', 'Interventions']);
      trialHeaderRow.eachCell((cell) => { Object.assign(cell, { style: headerStyle }); });

      const dataStartRow = trialHeaderRow.number + 1;

      // Individual studies
      ctData.studies.forEach((s) => {
        const row = trials.addRow([
          s.nctId,
          s.title,
          s.phase,
          s.status,
          s.sponsor,
          s.startDate,
          s.enrollment ?? '',
          s.conditions.join('; '),
          s.interventions.join('; '),
        ]);

        // Status coloring
        const statusLower = s.status.toLowerCase();
        if (statusLower.includes('recruiting') || statusLower.includes('active')) {
          row.getCell(4).fill = LIGHT_GREEN_FILL as ExcelJS.Fill;
        } else if (statusLower.includes('completed')) {
          row.getCell(4).fill = LIGHT_AMBER_FILL as ExcelJS.Fill;
        } else if (statusLower.includes('terminated') || statusLower.includes('withdrawn')) {
          row.getCell(4).fill = LIGHT_RED_FILL as ExcelJS.Fill;
        }
      });

      applyAlternatingRows(trials, dataStartRow);
      freezeAndFilterFromRow(trials, trialHeaderRow.number);
    } else {
      trials.addRow(['No clinical trial data available']);
    }

    // ══════════════════════════════════════════════════════════════════
    // Sheet 5: Publications
    // ══════════════════════════════════════════════════════════════════
    const pubs = workbook.addWorksheet('Publications');
    pubs.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Count', key: 'count', width: 15 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];
    applyHeaderStyle(pubs);
    const pubData = profile.rawData.pubmed.data;
    if (pubData) {
      pubs.addRow({ metric: 'Total Publications', count: pubData.totalPublications, notes: 'PubMed indexed' });
      pubs.addRow({ metric: 'Recent (2 years)', count: pubData.recentPublications, notes: 'Last 24 months' });
      pubs.addRow({ metric: 'Drug-Focused', count: pubData.drugFocusedPublications, notes: 'Drug/therapeutic context' });
      pubs.addRow({ metric: 'Review Articles', count: pubData.reviewArticles, notes: 'Reviews and meta-analyses' });
      if (pubData.totalPublications > 0) {
        const recencyRatio = pubData.recentPublications / pubData.totalPublications;
        const ratioRow = pubs.addRow({ metric: 'Recency Ratio', count: recencyRatio, notes: recencyRatio > 0.10 ? 'Active research area' : 'Declining interest' });
        ratioRow.getCell('count').numFmt = '0.0%';
        ratioRow.getCell('count').fill = (recencyRatio > 0.10 ? LIGHT_GREEN_FILL : LIGHT_AMBER_FILL) as ExcelJS.Fill;
      }
    }
    applyAlternatingRows(pubs, 2);
    freezeAndFilter(pubs);

    // ══════════════════════════════════════════════════════════════════
    // Sheet 6: Preprints
    // ══════════════════════════════════════════════════════════════════
    const preprints = workbook.addWorksheet('Preprints');
    preprints.columns = [
      { header: 'DOI', key: 'doi', width: 30 },
      { header: 'Title', key: 'title', width: 50 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Authors', key: 'authors', width: 30 },
      { header: 'Institution', key: 'institution', width: 30 },
    ];
    applyHeaderStyle(preprints);
    const bioData = profile.rawData.biorxiv.data;
    if (bioData) {
      // Summary info at the top as a data row
      const summaryPreprintRow = preprints.addRow({
        doi: `Total: ${bioData.preprints90d} (90d) / ${bioData.preprints30d} (30d)`,
        title: `Velocity: ${bioData.velocityTrend}`,
        date: '',
        authors: `${bioData.uniqueGroups} unique groups`,
        institution: '',
      });
      summaryPreprintRow.eachCell((cell) => { cell.font = { bold: true, italic: true }; });

      bioData.recentPreprints.forEach((p) => {
        preprints.addRow({ doi: p.doi, title: p.title, date: p.date, authors: p.authors, institution: p.institution });
      });
    }
    applyAlternatingRows(preprints, 2);
    freezeAndFilter(preprints);

    // ══════════════════════════════════════════════════════════════════
    // Sheet 7: Regulatory Genomics — With conditional colors
    // ══════════════════════════════════════════════════════════════════
    const regulatory = workbook.addWorksheet('Regulatory Genomics');
    regulatory.columns = [
      { header: 'Metric', key: 'metric', width: 32 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Assessment', key: 'assess', width: 25 },
    ];
    applyHeaderStyle(regulatory);
    if (agData) {
      const addRegRow = (metric: string, value: string | number, assessment: string, fillOpt?: Partial<ExcelJS.Fill>) => {
        const row = regulatory.addRow({ metric, value, assess: assessment });
        if (fillOpt) {
          row.getCell('assess').fill = fillOpt as ExcelJS.Fill;
        }
        return row;
      };

      addRegRow('Regulatory Features (\u00B150kb)', agData.regulatoryFeatureCount,
        agData.regulatoryFeatureCount >= 30 ? 'High complexity' : agData.regulatoryFeatureCount >= 15 ? 'Moderate' : 'Low complexity',
        agData.regulatoryFeatureCount >= 30 ? LIGHT_GREEN_FILL : agData.regulatoryFeatureCount >= 15 ? LIGHT_AMBER_FILL : LIGHT_RED_FILL);
      addRegRow('Promoters', agData.promoterCount,
        agData.promoterCount >= 3 ? 'Multiple promoters' : 'Standard',
        agData.promoterCount >= 3 ? LIGHT_GREEN_FILL : LIGHT_AMBER_FILL);
      addRegRow('Enhancers', agData.enhancerCount,
        agData.enhancerCount >= 5 ? 'Enhancer-rich' : agData.enhancerCount >= 2 ? 'Moderate' : 'Enhancer-poor',
        agData.enhancerCount >= 5 ? LIGHT_GREEN_FILL : agData.enhancerCount >= 2 ? LIGHT_AMBER_FILL : LIGHT_RED_FILL);
      addRegRow('CTCF Binding Sites', agData.ctcfCount,
        agData.ctcfCount >= 5 ? 'Well-insulated' : 'Minimal insulation',
        agData.ctcfCount >= 5 ? LIGHT_GREEN_FILL : LIGHT_AMBER_FILL);
      addRegRow('Open Chromatin Regions', agData.openChromatinCount,
        agData.openChromatinCount >= 5 ? 'Highly accessible' : 'Limited accessibility',
        agData.openChromatinCount >= 5 ? LIGHT_GREEN_FILL : LIGHT_AMBER_FILL);
      addRegRow('Constrained Elements', agData.constrainedElementCount,
        agData.constrainedElementCount >= 20 ? 'Highly conserved' : agData.constrainedElementCount >= 10 ? 'Moderately conserved' : 'Low conservation',
        agData.constrainedElementCount >= 20 ? LIGHT_GREEN_FILL : agData.constrainedElementCount >= 10 ? LIGHT_AMBER_FILL : LIGHT_RED_FILL);
      addRegRow('Gene Length (bp)', agData.geneLength.toLocaleString(), '', undefined);
      addRegRow('Chromosome', agData.chromosome, '', undefined);
      addRegRow('Biotype', agData.biotype, '', undefined);
      addRegRow('Transcript Count', agData.transcriptCount,
        agData.transcriptCount >= 8 ? 'Complex splicing' : 'Simple',
        agData.transcriptCount >= 8 ? LIGHT_GREEN_FILL : LIGHT_AMBER_FILL);

      const complexityColors: Record<string, Partial<ExcelJS.Fill>> = {
        high: LIGHT_GREEN_FILL,
        moderate: LIGHT_AMBER_FILL,
        low: LIGHT_RED_FILL,
      };
      addRegRow('Regulatory Complexity', agData.regulatoryComplexity,
        agData.regulatoryComplexity.charAt(0).toUpperCase() + agData.regulatoryComplexity.slice(1),
        complexityColors[agData.regulatoryComplexity] ?? LIGHT_AMBER_FILL);

      const breadthRow = regulatory.addRow({
        metric: 'Expression Breadth',
        value: agData.expressionBreadth,
        assess: agData.expressionBreadth >= 70 ? 'Broadly expressed' : agData.expressionBreadth >= 40 ? 'Moderately expressed' : 'Tissue-restricted',
      });
      breadthRow.getCell('value').numFmt = '0.0"%"';
      breadthRow.getCell('assess').fill = (agData.expressionBreadth >= 70 ? LIGHT_GREEN_FILL : agData.expressionBreadth >= 40 ? LIGHT_AMBER_FILL : LIGHT_RED_FILL) as ExcelJS.Fill;
    }
    applyAlternatingRows(regulatory, 2);
    freezeAndFilter(regulatory);

    // ══════════════════════════════════════════════════════════════════
    // Sheet 8: Scoring Methodology
    // ══════════════════════════════════════════════════════════════════
    const methodology = workbook.addWorksheet('Scoring Methodology');
    methodology.columns = [
      { header: 'Dimension', key: 'dimension', width: 25 },
      { header: 'Weight', key: 'weight', width: 10 },
      { header: 'Component', key: 'component', width: 28 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Max', key: 'max', width: 10 },
      { header: '% of Max', key: 'pct', width: 10 },
      { header: 'Description', key: 'desc', width: 45 },
    ];
    applyHeaderStyle(methodology);
    DIMENSION_ORDER.forEach((dim) => {
      const dscore = profile.scores.dimensions[dim];
      dscore.components.forEach((c, i) => {
        const pct = c.maxValue > 0 ? (c.value / c.maxValue) * 100 : 0;
        const row = methodology.addRow({
          dimension: i === 0 ? DIMENSION_LABELS[dim] : '',
          weight: i === 0 ? DIMENSION_WEIGHTS[dim] : '',
          component: c.name,
          score: c.value,
          max: c.maxValue,
          pct: pct,
          desc: c.description,
        });
        row.getCell('score').numFmt = '0.0';
        row.getCell('pct').numFmt = '0.0"%"';
        row.getCell('pct').fill = getScoreFillLight(pct) as ExcelJS.Fill;
        if (i === 0) {
          row.getCell('dimension').font = { bold: true };
          row.getCell('weight').numFmt = '0%';
        }
      });
    });
    applyAlternatingRows(methodology, 2);
    freezeAndFilter(methodology);

    // ══════════════════════════════════════════════════════════════════
    // Sheet 9: Score Components Detail
    // ══════════════════════════════════════════════════════════════════
    const scoreDetail = workbook.addWorksheet('Score Components Detail');
    scoreDetail.columns = [
      { header: 'Dimension', key: 'dimension', width: 25 },
      { header: 'Component', key: 'component', width: 28 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Max', key: 'max', width: 10 },
      { header: '% of Max', key: 'pct', width: 12 },
      { header: 'Description', key: 'desc', width: 50 },
    ];
    applyHeaderStyle(scoreDetail);

    let totalScore = 0;
    let totalMax = 0;

    DIMENSION_ORDER.forEach((dim) => {
      const dscore = profile.scores.dimensions[dim];
      const weight = DIMENSION_WEIGHTS[dim];

      // Dimension header row
      const dimRow = scoreDetail.addRow({
        dimension: `${DIMENSION_LABELS[dim]} (${(weight * 100).toFixed(0)}%)`,
        component: '',
        score: dscore.score,
        max: 100,
        pct: dscore.score,
        desc: dscore.description,
      });
      dimRow.eachCell((cell) => { cell.font = { bold: true }; });
      dimRow.getCell('dimension').fill = SECTION_FILL as ExcelJS.Fill;
      dimRow.getCell('score').numFmt = '0.0';
      dimRow.getCell('pct').numFmt = '0.0"%"';
      dimRow.getCell('pct').fill = getScoreFillLight(dscore.score) as ExcelJS.Fill;

      dscore.components.forEach((c) => {
        const pct = c.maxValue > 0 ? (c.value / c.maxValue) * 100 : 0;
        const row = scoreDetail.addRow({
          dimension: '',
          component: c.name,
          score: c.value,
          max: c.maxValue,
          pct: pct,
          desc: c.description,
        });
        row.getCell('score').numFmt = '0.0';
        row.getCell('pct').numFmt = '0.0"%"';
        row.getCell('pct').fill = getScoreFillLight(pct) as ExcelJS.Fill;
      });

      totalScore += dscore.score * weight;
      totalMax += 100 * weight;
    });

    // Total row
    scoreDetail.addRow({});
    const totalRow = scoreDetail.addRow({
      dimension: 'WEIGHTED OVERALL SCORE',
      component: '',
      score: totalScore,
      max: totalMax,
      pct: totalMax > 0 ? (totalScore / totalMax) * 100 : 0,
      desc: getOverallLabel(profile.scores.overall),
    });
    totalRow.eachCell((cell) => { cell.font = { bold: true, size: 12 }; });
    totalRow.getCell('score').numFmt = '0.0';
    totalRow.getCell('pct').numFmt = '0.0"%"';
    totalRow.getCell('pct').fill = getScoreFill(profile.scores.overall) as ExcelJS.Fill;
    totalRow.getCell('pct').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };

    applyAlternatingRows(scoreDetail, 2);
    freezeAndFilter(scoreDetail);

    // ══════════════════════════════════════════════════════════════════
    // Sheet 10: Drug-Likeness Assessment
    // ══════════════════════════════════════════════════════════════════
    const drugLikeness = workbook.addWorksheet('Drug-Likeness Assessment');
    drugLikeness.columns = [
      { header: 'Compound', key: 'compound', width: 16 },
      { header: 'Name', key: 'name', width: 22 },
      { header: 'MW', key: 'mw', width: 10 },
      { header: 'LogP', key: 'logp', width: 8 },
      { header: 'TPSA', key: 'tpsa', width: 8 },
      { header: 'HBA', key: 'hba', width: 6 },
      { header: 'HBD', key: 'hbd', width: 6 },
      { header: 'RO5 Violations', key: 'ro5', width: 14 },
      { header: 'Rotatable Bonds', key: 'rotb', width: 15 },
      { header: 'Lipinski Pass', key: 'lipinski', width: 13 },
      { header: 'Veber Pass', key: 'veber', width: 11 },
    ];
    applyHeaderStyle(drugLikeness);

    if (chemblData) {
      const topCpds: CompoundDetail[] = chemblData.topCompounds ?? [];
      const assessable = topCpds.filter((c) =>
        c.molecularWeight != null || c.alogp != null || c.psa != null || c.hba != null || c.hbd != null
      );

      if (assessable.length > 0) {
        assessable.forEach((c) => {
          const mw = c.molecularWeight;
          const logp = c.alogp;
          const tpsa = c.psa;
          const hba = c.hba;
          const hbd = c.hbd;
          const rotb = c.rotatableBonds;

          // Lipinski: MW<500, LogP<5, HBA<10, HBD<5
          const lipinskiViolations: string[] = [];
          if (mw != null && mw >= 500) lipinskiViolations.push('MW');
          if (logp != null && logp >= 5) lipinskiViolations.push('LogP');
          if (hba != null && hba >= 10) lipinskiViolations.push('HBA');
          if (hbd != null && hbd >= 5) lipinskiViolations.push('HBD');
          const lipinskiPass = lipinskiViolations.length <= 1;

          // Veber: TPSA<140, RotB<10
          const veberViolations: string[] = [];
          if (tpsa != null && tpsa >= 140) veberViolations.push('TPSA');
          if (rotb != null && rotb >= 10) veberViolations.push('RotB');
          const veberPass = veberViolations.length === 0;

          const row = drugLikeness.addRow({
            compound: c.chemblId,
            name: c.preferredName ?? '',
            mw: mw ?? '',
            logp: logp ?? '',
            tpsa: tpsa ?? '',
            hba: hba ?? '',
            hbd: hbd ?? '',
            ro5: c.numRo5Violations ?? '',
            rotb: rotb ?? '',
            lipinski: lipinskiPass ? 'PASS' : `FAIL (${lipinskiViolations.join(', ')})`,
            veber: veberPass ? 'PASS' : `FAIL (${veberViolations.join(', ')})`,
          });

          // Color MW cell red if violation
          if (mw != null) {
            row.getCell('mw').numFmt = '0.0';
            if (mw >= 500) row.getCell('mw').fill = LIGHT_RED_FILL as ExcelJS.Fill;
          }
          // Color LogP cell red if violation
          if (logp != null) {
            row.getCell('logp').numFmt = '0.00';
            if (logp >= 5) row.getCell('logp').fill = LIGHT_RED_FILL as ExcelJS.Fill;
          }
          // Color TPSA cell red if violation
          if (tpsa != null) {
            row.getCell('tpsa').numFmt = '0.0';
            if (tpsa >= 140) row.getCell('tpsa').fill = LIGHT_RED_FILL as ExcelJS.Fill;
          }
          // Color HBA red if violation
          if (hba != null && hba >= 10) row.getCell('hba').fill = LIGHT_RED_FILL as ExcelJS.Fill;
          // Color HBD red if violation
          if (hbd != null && hbd >= 5) row.getCell('hbd').fill = LIGHT_RED_FILL as ExcelJS.Fill;
          // Color Rotatable Bonds red if violation
          if (rotb != null && rotb >= 10) row.getCell('rotb').fill = LIGHT_RED_FILL as ExcelJS.Fill;

          // RO5 violations coloring
          if (c.numRo5Violations != null) {
            if (c.numRo5Violations <= 1) {
              row.getCell('ro5').fill = LIGHT_GREEN_FILL as ExcelJS.Fill;
            } else if (c.numRo5Violations === 2) {
              row.getCell('ro5').fill = LIGHT_AMBER_FILL as ExcelJS.Fill;
            } else {
              row.getCell('ro5').fill = LIGHT_RED_FILL as ExcelJS.Fill;
            }
          }

          // Lipinski/Veber pass/fail coloring
          row.getCell('lipinski').fill = (lipinskiPass ? LIGHT_GREEN_FILL : LIGHT_RED_FILL) as ExcelJS.Fill;
          row.getCell('lipinski').font = { bold: true, color: { argb: lipinskiPass ? 'FF166534' : 'FF991B1B' } };
          row.getCell('veber').fill = (veberPass ? LIGHT_GREEN_FILL : LIGHT_RED_FILL) as ExcelJS.Fill;
          row.getCell('veber').font = { bold: true, color: { argb: veberPass ? 'FF166534' : 'FF991B1B' } };
        });
      } else {
        drugLikeness.addRow({
          compound: 'No compounds with molecular properties available',
          name: '', mw: '', logp: '', tpsa: '', hba: '', hbd: '', ro5: '', rotb: '', lipinski: '', veber: '',
        });
      }
    } else {
      drugLikeness.addRow({
        compound: 'No ChEMBL data available',
        name: '', mw: '', logp: '', tpsa: '', hba: '', hbd: '', ro5: '', rotb: '', lipinski: '', veber: '',
      });
    }
    applyAlternatingRows(drugLikeness, 2);
    freezeAndFilter(drugLikeness);

    // ── Generate buffer and respond ──────────────────────────────────
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
