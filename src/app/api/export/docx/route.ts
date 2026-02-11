import { NextRequest, NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from 'docx';
import type { TargetProfile } from '@/lib/types/target-profile';
import type { DimensionName } from '@/lib/types/scoring';
import { DIMENSION_LABELS } from '@/lib/types/scoring';
import { getScoreLabel, getPhaseLabel } from '@/lib/constants';

// ── Brand & Style Constants ────────────────────────────────────────────────
const BLUE = '2563EB';
const DARK_BLUE = '1E40AF';
const LIGHT_GRAY = 'F1F5F9';
const MID_GRAY = 'E2E8F0';
const SLATE = '64748B';
const WHITE = 'FFFFFF';

const DIMENSION_ORDER: DimensionName[] = [
  'geneticEvidence', 'chemicalTractability', 'structuralReadiness',
  'clinicalHistory', 'regulatoryGenomics', 'literatureDepth', 'innovationSignal',
];

const DIMENSION_COLORS: Record<DimensionName, string> = {
  geneticEvidence: '3B82F6',
  chemicalTractability: '10B981',
  structuralReadiness: '8B5CF6',
  clinicalHistory: 'F59E0B',
  regulatoryGenomics: 'EC4899',
  literatureDepth: '06B6D4',
  innovationSignal: 'F97316',
};

// ── Reusable border configs ────────────────────────────────────────────────
const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: MID_GRAY };

const cleanTableBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
  insideHorizontal: thinBorder,
  insideVertical: noBorder,
};

// ── Helper: Visual score bar row (unicode block chart) ─────────────────────
function createScoreBarRow(label: string, score: number, color: string): TableRow {
  const filled = Math.round(score / 5);
  const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: label, font: 'Arial', size: 18, bold: true })],
        })],
        width: { size: 3000, type: WidthType.DXA },
      }),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: bar, font: 'Consolas', size: 18, color })],
        })],
        width: { size: 4000, type: WidthType.DXA },
      }),
      new TableCell({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `${score}/100`, font: 'Arial', size: 18, bold: true })],
        })],
        width: { size: 1500, type: WidthType.DXA },
      }),
    ],
  });
}

// ── Helper: Section heading ────────────────────────────────────────────────
function heading(
  text: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1,
): Paragraph {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, color: BLUE, bold: true, font: 'Arial' })],
    spacing: { before: 300, after: 150 },
  });
}

// ── Helper: Body paragraph ─────────────────────────────────────────────────
function bodyText(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 22 })],
    spacing: { after: 100 },
  });
}

// ── Helper: Bold+normal inline paragraph ───────────────────────────────────
function keyValueText(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: label, font: 'Arial', size: 22, bold: true }),
      new TextRun({ text: value, font: 'Arial', size: 22 }),
    ],
    spacing: { after: 80 },
  });
}

// ── Helper: Section divider (horizontal rule) ──────────────────────────────
function sectionDivider(): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color: MID_GRAY, space: 1 },
    },
    children: [],
  });
}

// ── Helper: Blue header cell for tables ────────────────────────────────────
function headerCell(text: string, widthPct: number): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Arial', size: 20, bold: true, color: WHITE })],
    })],
    shading: { type: ShadingType.SOLID, color: BLUE },
    width: { size: widthPct, type: WidthType.PERCENTAGE },
  });
}

function headerCellCenter(text: string, widthPct: number): TableCell {
  return new TableCell({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, font: 'Arial', size: 20, bold: true, color: WHITE })],
    })],
    shading: { type: ShadingType.SOLID, color: BLUE },
    width: { size: widthPct, type: WidthType.PERCENTAGE },
  });
}

// ── Helper: Data cell with alternating shading ─────────────────────────────
function dataCell(text: string, rowIndex: number, widthPct: number, options?: {
  bold?: boolean;
  center?: boolean;
  fontSize?: number;
}): TableCell {
  return new TableCell({
    children: [new Paragraph({
      alignment: options?.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({
        text,
        font: 'Arial',
        size: options?.fontSize ?? 20,
        bold: options?.bold,
      })],
    })],
    shading: rowIndex % 2 === 0 ? { type: ShadingType.SOLID, color: LIGHT_GRAY } : undefined,
    width: { size: widthPct, type: WidthType.PERCENTAGE },
  });
}

// ── Helper: Format number with fallback ────────────────────────────────────
function fmt(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return val.toFixed(decimals);
}

function fmtInt(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'N/A';
  return val.toLocaleString();
}

// ════════════════════════════════════════════════════════════════════════════
// POST handler — generate the full .docx report
// ════════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;

    // ── AI Executive Summary ─────────────────────────────────────────────
    let execSummary = '';
    try {
      const aiRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/narrative`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        },
      );
      const aiData = await aiRes.json() as { narrative: string };
      execSummary = aiData.narrative || '';
    } catch {
      execSummary = `${profile.gene} (${profile.approvedName}) received an overall target validation score of ${profile.scores.overall}/100, classified as "${getScoreLabel(profile.scores.overall)}".`;
    }

    // ── Score table rows (7 dimensions) ──────────────────────────────────
    const scoreRows = DIMENSION_ORDER.map((dim, i) => {
      const score = profile.scores.dimensions[dim];
      return new TableRow({
        children: [
          dataCell(DIMENSION_LABELS[dim], i, 40),
          dataCell(`${score.score}`, i, 15, { bold: true, center: true }),
          dataCell(getScoreLabel(score.score), i, 20),
          dataCell(score.description, i, 25, { fontSize: 18 }),
        ],
      });
    });

    // ── Extract raw data handles ─────────────────────────────────────────
    const chemblData = profile.rawData.chembl.data;
    const clinicalData = profile.rawData.clinicalTrials.data;
    const alphagenomeData = profile.rawData.alphagenome.data;
    const alphafoldData = profile.rawData.alphafold.data;
    const pubmedData = profile.rawData.pubmed.data;
    const biorxivData = profile.rawData.biorxiv.data;

    // ══════════════════════════════════════════════════════════════════════
    // Build Top Compounds Section
    // ══════════════════════════════════════════════════════════════════════
    const compoundsParagraphs: (Paragraph | Table)[] = [];
    const compoundsTableRows: TableRow[] = [];

    if (chemblData?.topCompounds && chemblData.topCompounds.length > 0) {
      compoundsParagraphs.push(
        sectionDivider(),
        heading('Top Compounds'),
        bodyText(
          `TargetRadar identified ${chemblData.topCompounds.length} notable compounds from ChEMBL targeting ${profile.gene}. ` +
          `The following table summarizes physicochemical properties and clinical advancement.`,
        ),
      );

      // Header row
      compoundsTableRows.push(new TableRow({
        tableHeader: true,
        children: [
          headerCell('ChEMBL ID', 12),
          headerCell('Name', 14),
          headerCell('Type', 10),
          headerCellCenter('Phase', 7),
          headerCellCenter('MW', 7),
          headerCellCenter('LogP', 7),
          headerCellCenter('TPSA', 7),
          headerCellCenter('HBA', 6),
          headerCellCenter('HBD', 6),
          headerCellCenter('RO5', 6),
          headerCellCenter('pChEMBL', 8),
        ],
      }));

      chemblData.topCompounds.forEach((compound, i) => {
        compoundsTableRows.push(new TableRow({
          children: [
            dataCell(compound.chemblId, i, 12, { fontSize: 18 }),
            dataCell(compound.preferredName || '—', i, 14, { fontSize: 18 }),
            dataCell(compound.moleculeType || '—', i, 10, { fontSize: 18 }),
            dataCell(compound.maxPhase > 0 ? getPhaseLabel(compound.maxPhase) : 'Preclinical', i, 7, { center: true, fontSize: 18 }),
            dataCell(fmt(compound.molecularWeight, 0), i, 7, { center: true, fontSize: 18 }),
            dataCell(fmt(compound.alogp), i, 7, { center: true, fontSize: 18 }),
            dataCell(fmt(compound.psa, 0), i, 7, { center: true, fontSize: 18 }),
            dataCell(fmtInt(compound.hba), i, 6, { center: true, fontSize: 18 }),
            dataCell(fmtInt(compound.hbd), i, 6, { center: true, fontSize: 18 }),
            dataCell(fmtInt(compound.numRo5Violations), i, 6, { center: true, fontSize: 18 }),
            dataCell(fmt(compound.pchemblValue, 2), i, 8, { center: true, fontSize: 18, bold: true }),
          ],
        }));
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // Build Clinical Trials Section
    // ══════════════════════════════════════════════════════════════════════
    const clinicalParagraphs: (Paragraph | Table)[] = [];

    if (clinicalData) {
      clinicalParagraphs.push(
        sectionDivider(),
        heading('Clinical Trials Overview'),
      );

      // Summary metrics
      const topPhaseEntries = Object.entries(clinicalData.trialsByPhase || {});
      const topPhaseReached = topPhaseEntries.length > 0
        ? topPhaseEntries.sort(([a], [b]) => b.localeCompare(a))[0]?.[0] ?? 'None'
        : 'None';

      clinicalParagraphs.push(
        keyValueText('Total Trials: ', fmtInt(clinicalData.totalTrials)),
        keyValueText('Active (Recruiting) Trials: ', fmtInt(clinicalData.activeTrials)),
        keyValueText('Most Advanced Phase: ', topPhaseReached),
        keyValueText('Recent Trials (last 2 years): ', fmtInt(clinicalData.recentTrials)),
        keyValueText('Unique Sponsors: ', fmtInt(clinicalData.sponsors.length)),
        new Paragraph({ spacing: { after: 100 } }),
      );

      // Trials by status table
      const statusEntries = Object.entries(clinicalData.trialsByStatus || {})
        .sort(([, a], [, b]) => b - a);

      if (statusEntries.length > 0) {
        clinicalParagraphs.push(
          heading('Trials by Status', HeadingLevel.HEADING_3),
        );

        const statusTableRows: TableRow[] = [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell('Status', 60),
              headerCellCenter('Count', 40),
            ],
          }),
        ];

        statusEntries.forEach(([status, count], i) => {
          statusTableRows.push(new TableRow({
            children: [
              dataCell(status, i, 60),
              dataCell(count.toString(), i, 40, { center: true, bold: true }),
            ],
          }));
        });

        clinicalParagraphs.push(
          new Table({
            rows: statusTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cleanTableBorders,
          }),
          new Paragraph({ spacing: { after: 150 } }),
        );
      }

      // Top sponsors
      const sponsorCounts = clinicalData.sponsorTrialCounts || [];
      if (sponsorCounts.length > 0) {
        clinicalParagraphs.push(
          heading('Top Sponsors', HeadingLevel.HEADING_3),
        );

        const sponsorTableRows: TableRow[] = [
          new TableRow({
            tableHeader: true,
            children: [
              headerCellCenter('Rank', 10),
              headerCell('Sponsor', 65),
              headerCellCenter('Trials', 25),
            ],
          }),
        ];

        sponsorCounts.slice(0, 5).forEach((entry, i) => {
          sponsorTableRows.push(new TableRow({
            children: [
              dataCell(`${i + 1}`, i, 10, { center: true }),
              dataCell(entry.sponsor, i, 65, { fontSize: 18 }),
              dataCell(entry.count.toString(), i, 25, { center: true, bold: true }),
            ],
          }));
        });

        clinicalParagraphs.push(
          new Table({
            rows: sponsorTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cleanTableBorders,
          }),
          new Paragraph({ spacing: { after: 150 } }),
        );
      }

      // Top 5 individual studies
      const studies = clinicalData.studies || [];
      if (studies.length > 0) {
        clinicalParagraphs.push(
          heading('Notable Studies', HeadingLevel.HEADING_3),
        );

        const studyTableRows: TableRow[] = [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell('NCT ID', 15),
              headerCell('Title', 35),
              headerCellCenter('Phase', 12),
              headerCellCenter('Status', 18),
              headerCell('Sponsor', 20),
            ],
          }),
        ];

        studies.slice(0, 5).forEach((study, i) => {
          const titleTrunc = study.title.length > 80
            ? study.title.substring(0, 77) + '...'
            : study.title;
          studyTableRows.push(new TableRow({
            children: [
              dataCell(study.nctId, i, 15, { fontSize: 18, bold: true }),
              dataCell(titleTrunc, i, 35, { fontSize: 16 }),
              dataCell(study.phase || 'N/A', i, 12, { center: true, fontSize: 18 }),
              dataCell(study.status, i, 18, { center: true, fontSize: 18 }),
              dataCell(study.sponsor, i, 20, { fontSize: 16 }),
            ],
          }));
        });

        clinicalParagraphs.push(
          new Table({
            rows: studyTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cleanTableBorders,
          }),
        );
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // Build Regulatory Genomics Section
    // ══════════════════════════════════════════════════════════════════════
    const regulatoryParagraphs: (Paragraph | Table)[] = [];

    if (alphagenomeData) {
      regulatoryParagraphs.push(
        sectionDivider(),
        heading('AlphaGenome Regulatory Landscape'),
        bodyText(
          `The regulatory genomics analysis for ${profile.gene} leverages Ensembl regulatory annotations ` +
          `that correspond to AlphaGenome's predicted functional elements. This section summarizes the ` +
          `empirical regulatory landscape surrounding the gene locus.`,
        ),
      );

      // Gene information
      regulatoryParagraphs.push(
        heading('Gene Information', HeadingLevel.HEADING_3),
        keyValueText('Chromosome: ', alphagenomeData.chromosome || 'N/A'),
        keyValueText('Gene Length: ', `${fmtInt(alphagenomeData.geneLength)} bp`),
        keyValueText('Biotype: ', alphagenomeData.biotype || 'N/A'),
        keyValueText('Transcript Count: ', fmtInt(alphagenomeData.transcriptCount)),
        keyValueText('Expression Breadth: ', `${fmt(alphagenomeData.expressionBreadth, 0)}%`),
        keyValueText('Regulatory Complexity: ', (alphagenomeData.regulatoryComplexity || 'N/A').toUpperCase()),
        new Paragraph({ spacing: { after: 100 } }),
      );

      // Regulatory feature counts table
      regulatoryParagraphs.push(
        heading('Regulatory Feature Counts', HeadingLevel.HEADING_3),
      );

      const regFeatures: Array<[string, number]> = [
        ['Promoters', alphagenomeData.promoterCount],
        ['Enhancers', alphagenomeData.enhancerCount],
        ['CTCF Binding Sites', alphagenomeData.ctcfCount],
        ['Open Chromatin Regions', alphagenomeData.openChromatinCount],
        ['Total Regulatory Features', alphagenomeData.regulatoryFeatureCount],
        ['Constrained Elements', alphagenomeData.constrainedElementCount],
      ];

      const regTableRows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('Feature Type', 60),
            headerCellCenter('Count', 40),
          ],
        }),
      ];

      regFeatures.forEach(([name, count], i) => {
        const isTotalRow = name.startsWith('Total') || name.startsWith('Constrained');
        regTableRows.push(new TableRow({
          children: [
            dataCell(name, i, 60, { bold: isTotalRow }),
            dataCell(fmtInt(count), i, 40, { center: true, bold: isTotalRow }),
          ],
        }));
      });

      regulatoryParagraphs.push(
        new Table({
          rows: regTableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: cleanTableBorders,
        }),
        new Paragraph({ spacing: { after: 150 } }),
      );

      // Interpretation
      const complexityNote = alphagenomeData.regulatoryComplexity === 'high'
        ? 'The high regulatory complexity indicates tissue-specific expression control with multiple enhancers and promoters, suggesting opportunities for selective therapeutic modulation.'
        : alphagenomeData.regulatoryComplexity === 'moderate'
          ? 'Moderate regulatory complexity indicates a balanced regulatory landscape with some tissue-specificity potential.'
          : 'Low regulatory complexity suggests constitutive or housekeeping-like expression, which may limit tissue-selective intervention strategies.';

      regulatoryParagraphs.push(
        heading('Interpretation', HeadingLevel.HEADING_3),
        bodyText(complexityNote),
        bodyText(
          `The locus harbors ${fmtInt(alphagenomeData.constrainedElementCount)} constrained elements, ` +
          `indicating regions under evolutionary selection pressure. These conserved non-coding elements ` +
          `are prime candidates for functional regulatory variants detectable by AlphaGenome.`,
        ),
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    // Build Structural Biology Section
    // ══════════════════════════════════════════════════════════════════════
    const structuralParagraphs: (Paragraph | Table)[] = [];

    if (alphafoldData) {
      structuralParagraphs.push(
        sectionDivider(),
        heading('Structural Biology'),
        bodyText(
          `Structural coverage assessment for ${profile.gene} integrates experimental PDB structures ` +
          `with AlphaFold computational predictions to evaluate readiness for structure-based drug design.`,
        ),
      );

      const structMetrics: Array<[string, string]> = [
        ['UniProt ID', alphafoldData.uniprotId || profile.uniprotId || 'N/A'],
        ['Experimental PDB Structures', fmtInt(alphafoldData.pdbCount)],
        ['Ligand-Bound Structures', fmtInt(alphafoldData.ligandBoundCount)],
        ['Best Resolution', alphafoldData.bestResolution > 0 ? `${fmt(alphafoldData.bestResolution, 1)} \u00C5` : 'N/A'],
        ['AlphaFold Confidence (pLDDT)', `${fmt(alphafoldData.avgPLDDT, 1)} / 100`],
        ['AlphaFold Model Available', alphafoldData.hasAlphaFold ? 'Yes' : 'No'],
      ];

      const structTableRows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('Metric', 55),
            headerCellCenter('Value', 45),
          ],
        }),
      ];

      structMetrics.forEach(([metric, value], i) => {
        structTableRows.push(new TableRow({
          children: [
            dataCell(metric, i, 55),
            dataCell(value, i, 45, { center: true, bold: true }),
          ],
        }));
      });

      structuralParagraphs.push(
        new Table({
          rows: structTableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: cleanTableBorders,
        }),
        new Paragraph({ spacing: { after: 100 } }),
      );

      // Interpretation
      const pdbNote = alphafoldData.pdbCount > 10
        ? 'Extensive experimental structural coverage enables high-confidence structure-based drug design campaigns.'
        : alphafoldData.pdbCount > 3
          ? 'Moderate structural coverage supports rational drug design, supplemented by AlphaFold predictions for unresolved regions.'
          : alphafoldData.pdbCount > 0
            ? 'Limited experimental structures available; AlphaFold predictions are essential for structural coverage.'
            : 'No experimental structures deposited; drug design relies entirely on AlphaFold computational predictions.';

      const ligandNote = alphafoldData.ligandBoundCount > 0
        ? ` ${alphafoldData.ligandBoundCount} ligand-bound structure(s) provide direct evidence of druggable binding sites.`
        : ' No ligand-bound structures are available, suggesting that binding site identification may require computational approaches.';

      structuralParagraphs.push(
        bodyText(pdbNote + ligandNote),
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    // Build Literature Analysis Section
    // ══════════════════════════════════════════════════════════════════════
    const literatureParagraphs: (Paragraph | Table)[] = [];

    if (pubmedData) {
      literatureParagraphs.push(
        sectionDivider(),
        heading('Literature Analysis'),
        bodyText(
          `A comprehensive PubMed analysis reveals the publication landscape for ${profile.gene}, ` +
          `spanning total output, recent momentum, drug-focused research, and review article coverage.`,
        ),
      );

      const litMetrics: Array<[string, string]> = [
        ['Total Publications', fmtInt(pubmedData.totalPublications)],
        ['Recent Publications (last 2 years)', fmtInt(pubmedData.recentPublications)],
        ['Drug-Focused Publications', fmtInt(pubmedData.drugFocusedPublications)],
        ['Review Articles', fmtInt(pubmedData.reviewArticles)],
        ['Recency Ratio', pubmedData.totalPublications > 0
          ? `${((pubmedData.recentPublications / pubmedData.totalPublications) * 100).toFixed(1)}%`
          : 'N/A'],
      ];

      const litTableRows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('Metric', 60),
            headerCellCenter('Value', 40),
          ],
        }),
      ];

      litMetrics.forEach(([metric, value], i) => {
        litTableRows.push(new TableRow({
          children: [
            dataCell(metric, i, 60),
            dataCell(value, i, 40, { center: true, bold: true }),
          ],
        }));
      });

      literatureParagraphs.push(
        new Table({
          rows: litTableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: cleanTableBorders,
        }),
        new Paragraph({ spacing: { after: 100 } }),
      );

      const depthNote = pubmedData.totalPublications > 1000
        ? `With ${fmtInt(pubmedData.totalPublications)} total publications, ${profile.gene} is an extensively studied target with a deep literature base.`
        : pubmedData.totalPublications > 100
          ? `${profile.gene} has a moderate publication base of ${fmtInt(pubmedData.totalPublications)} articles, indicating established but not saturated research interest.`
          : `${profile.gene} has a relatively sparse literature base (${fmtInt(pubmedData.totalPublications)} publications), suggesting an emerging or niche target.`;

      literatureParagraphs.push(bodyText(depthNote));
    }

    // ══════════════════════════════════════════════════════════════════════
    // Build Innovation Signal Section
    // ══════════════════════════════════════════════════════════════════════
    const innovationParagraphs: (Paragraph | Table)[] = [];

    if (biorxivData) {
      innovationParagraphs.push(
        sectionDivider(),
        heading('Innovation Signal'),
        bodyText(
          `Preprint activity on bioRxiv and medRxiv serves as a leading indicator of research momentum. ` +
          `The following metrics capture the innovation trajectory for ${profile.gene}.`,
        ),
      );

      const trendLabel = biorxivData.velocityTrend === 'increasing'
        ? 'Increasing (accelerating)'
        : biorxivData.velocityTrend === 'stable'
          ? 'Stable'
          : 'Decreasing (decelerating)';

      const innovMetrics: Array<[string, string]> = [
        ['Preprints (last 90 days)', fmtInt(biorxivData.preprints90d)],
        ['Preprints (last 30 days)', fmtInt(biorxivData.preprints30d)],
        ['Velocity Trend', trendLabel],
        ['Unique Research Groups', fmtInt(biorxivData.uniqueGroups)],
      ];

      const innovTableRows: TableRow[] = [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('Metric', 60),
            headerCellCenter('Value', 40),
          ],
        }),
      ];

      innovMetrics.forEach(([metric, value], i) => {
        innovTableRows.push(new TableRow({
          children: [
            dataCell(metric, i, 60),
            dataCell(value, i, 40, { center: true, bold: true }),
          ],
        }));
      });

      innovationParagraphs.push(
        new Table({
          rows: innovTableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: cleanTableBorders,
        }),
        new Paragraph({ spacing: { after: 100 } }),
      );

      // Recent preprint titles
      const recentPreprints = biorxivData.recentPreprints || [];
      if (recentPreprints.length > 0) {
        innovationParagraphs.push(
          heading('Recent Preprints', HeadingLevel.HEADING_3),
        );

        recentPreprints.slice(0, 8).forEach((preprint) => {
          innovationParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: '\u2022 ', font: 'Arial', size: 20 }),
                new TextRun({ text: preprint.title, font: 'Arial', size: 20, italics: true }),
                new TextRun({
                  text: ` (${preprint.date})`,
                  font: 'Arial', size: 18, color: SLATE,
                }),
              ],
              spacing: { after: 60 },
            }),
          );
        });
      }

      // Innovation interpretation
      const velocityNote = biorxivData.velocityTrend === 'increasing'
        ? `Research momentum for ${profile.gene} is accelerating, with ${biorxivData.preprints30d} preprints in the last 30 days. This signals growing interest and potential first-mover opportunities.`
        : biorxivData.velocityTrend === 'stable'
          ? `Preprint activity for ${profile.gene} is stable, indicating sustained but not surging research interest.`
          : `Preprint activity for ${profile.gene} is declining, which may indicate a maturing field or shifting priorities.`;

      innovationParagraphs.push(
        new Paragraph({ spacing: { after: 50 } }),
        bodyText(velocityNote),
      );
    }

    // ══════════════════════════════════════════════════════════════════════
    // Assemble the Document
    // ══════════════════════════════════════════════════════════════════════
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1200, right: 1200 },
          },
        },
        children: [
          // ── COVER PAGE ─────────────────────────────────────────────────
          new Paragraph({ spacing: { before: 2000 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'TargetRadar', color: BLUE, bold: true, font: 'Arial', size: 48 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Drug Target Validation Report', font: 'Arial', size: 28, color: SLATE })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `${profile.gene} \u2014 ${profile.approvedName}`, font: 'Arial', size: 36, bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: `Overall Score: ${profile.scores.overall}/100 (${getScoreLabel(profile.scores.overall)})`,
              font: 'Arial', size: 28, color: BLUE,
            })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: `Ensembl: ${profile.ensemblId}    UniProt: ${profile.uniprotId}`,
              font: 'Arial', size: 20, color: SLATE,
            })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
              font: 'Arial', size: 20, color: '94A3B8',
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: 'Powered by TargetRadar \u2014 Open Source Drug Target Validation',
              font: 'Arial', size: 18, color: '94A3B8',
            })],
          }),

          // ── EXECUTIVE SUMMARY ──────────────────────────────────────────
          sectionDivider(),
          heading('Executive Summary'),
          ...execSummary.split('\n\n').map((p) => bodyText(p)),

          // ── SCORE RADAR (visual bar chart) ─────────────────────────────
          sectionDivider(),
          heading('Score Radar'),
          bodyText('Visual representation of all 7 scoring dimensions:'),
          new Table({
            rows: DIMENSION_ORDER.map((dim) =>
              createScoreBarRow(
                DIMENSION_LABELS[dim],
                profile.scores.dimensions[dim].score,
                DIMENSION_COLORS[dim],
              )
            ),
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
              insideHorizontal: thinBorder,
              insideVertical: noBorder,
            },
          }),
          new Paragraph({ spacing: { after: 200 } }),

          // ── SCORE BREAKDOWN TABLE ──────────────────────────────────────
          heading('Score Breakdown'),
          new Table({
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  headerCell('Dimension', 40),
                  headerCellCenter('Score', 15),
                  headerCell('Rating', 20),
                  headerCell('Summary', 25),
                ],
              }),
              ...scoreRows,
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cleanTableBorders,
          }),
          new Paragraph({ spacing: { after: 100 } }),

          // Overall score callout
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 200 },
            children: [
              new TextRun({ text: 'Overall Weighted Score: ', font: 'Arial', size: 24, color: DARK_BLUE }),
              new TextRun({ text: `${profile.scores.overall}/100`, font: 'Arial', size: 28, bold: true, color: BLUE }),
              new TextRun({ text: ` (${getScoreLabel(profile.scores.overall)})`, font: 'Arial', size: 24, color: DARK_BLUE }),
            ],
          }),

          // ── COMPONENT BREAKDOWNS (per dimension) ───────────────────────
          ...DIMENSION_ORDER.flatMap((dim) => {
            const score = profile.scores.dimensions[dim];
            return [
              heading(DIMENSION_LABELS[dim], HeadingLevel.HEADING_2),
              bodyText(`Score: ${score.score}/100 \u2014 ${score.description}`),
              ...score.components.map((c) =>
                bodyText(`  \u2022 ${c.name}: ${c.value.toFixed(1)}/${c.maxValue} \u2014 ${c.description}`)
              ),
            ];
          }),

          // ── NEW SECTIONS: detailed data ────────────────────────────────
          ...compoundsParagraphs,
          ...(compoundsTableRows.length > 0 ? [
            new Table({
              rows: compoundsTableRows,
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: cleanTableBorders,
            }),
          ] : []),
          ...clinicalParagraphs,
          ...regulatoryParagraphs,
          ...structuralParagraphs,
          ...literatureParagraphs,
          ...innovationParagraphs,

          // ── METHODOLOGY ────────────────────────────────────────────────
          sectionDivider(),
          heading('Methodology'),
          bodyText(
            'TargetRadar scores drug targets across 7 dimensions using live data from public APIs. ' +
            'Each dimension is scored 0\u2013100 based on specific components with defined caps and thresholds. ' +
            'The overall score is a weighted average reflecting the relative importance of each dimension ' +
            'in drug target validation:',
          ),
          new Paragraph({ spacing: { after: 50 } }),
          bodyText('  \u2022 Chemical Tractability: 22% \u2014 availability of drug-like compounds and chemical tools'),
          bodyText('  \u2022 Genetic Evidence: 18% \u2014 strength of genetic links to disease'),
          bodyText('  \u2022 Clinical History: 18% \u2014 track record in clinical trials'),
          bodyText('  \u2022 Structural Readiness: 13% \u2014 3D structure availability for drug design'),
          bodyText('  \u2022 Regulatory Genomics: 12% \u2014 AlphaGenome-informed regulatory landscape complexity'),
          bodyText('  \u2022 Literature Depth: 9% \u2014 scientific publication volume and recency'),
          bodyText('  \u2022 Innovation Signal: 8% \u2014 preprint activity and emerging research momentum'),

          // ── DATA SOURCES & TIMESTAMPS ──────────────────────────────────
          sectionDivider(),
          heading('Data Sources & Timestamps'),
          keyValueText('Analysis Timestamp: ', new Date(profile.metadata.analysisTimestamp).toISOString()),
          keyValueText('Total Response Time: ', `${profile.metadata.totalResponseTimeMs}ms`),
          keyValueText('Services Completed: ', `${profile.metadata.servicesCompleted}/7`),
          keyValueText('Services Failed: ', `${profile.metadata.servicesFailed}/7`),
          new Paragraph({ spacing: { after: 100 } }),
          bodyText('Data sources queried:'),
          bodyText('  \u2022 Open Targets Platform \u2014 genetic associations and tractability'),
          bodyText('  \u2022 ChEMBL \u2014 compound data, bioactivities, and mechanisms'),
          bodyText('  \u2022 PubMed / NCBI \u2014 publication counts and categorization'),
          bodyText('  \u2022 ClinicalTrials.gov \u2014 trial registry data'),
          bodyText('  \u2022 bioRxiv / medRxiv \u2014 preprint activity'),
          bodyText('  \u2022 AlphaFold DB + PDB \u2014 protein structures and predictions'),
          bodyText('  \u2022 Ensembl Regulation (AlphaGenome) \u2014 regulatory features and constrained elements'),

          // ── PROFESSIONAL FOOTER ────────────────────────────────────────
          sectionDivider(),
          new Paragraph({ spacing: { before: 200, after: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: 'DISCLAIMER',
              font: 'Arial', size: 18, bold: true, color: SLATE,
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({
              text: 'This report is generated by automated computational analysis of publicly available databases. ' +
                'It is intended for research and informational purposes only. It does not constitute medical advice, ' +
                'regulatory guidance, or investment recommendations. All data should be independently verified ' +
                'before use in clinical or commercial decision-making.',
              font: 'Arial', size: 16, color: SLATE,
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
            children: [new TextRun({
              text: 'TargetRadar \u2014 Open Source Drug Target Validation',
              font: 'Arial', size: 18, bold: true, color: BLUE,
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({
              text: 'https://github.com/targetradar/targetradar',
              font: 'Arial', size: 16, color: SLATE,
            })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: 'Released under the MIT License. Free for academic and commercial use.',
              font: 'Arial', size: 16, color: '94A3B8',
            })],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="TargetRadar_${profile.gene}_Report.docx"`,
      },
    });
  } catch (err) {
    console.error('DOCX export error:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
