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
import { getScoreLabel } from '@/lib/constants';

const BLUE = '2563EB';
const DIMENSION_ORDER: DimensionName[] = [
  'geneticEvidence', 'chemicalTractability', 'structuralReadiness',
  'clinicalHistory', 'regulatoryGenomics', 'literatureDepth', 'innovationSignal',
];

// Dimension-specific colors for the visual score bar (hex without #)
const DIMENSION_COLORS: Record<DimensionName, string> = {
  geneticEvidence: '3B82F6',
  chemicalTractability: '10B981',
  structuralReadiness: '8B5CF6',
  clinicalHistory: 'F59E0B',
  regulatoryGenomics: 'EC4899',
  literatureDepth: '06B6D4',
  innovationSignal: 'F97316',
};

/**
 * Creates a visual score bar row for the radar-style chart in the report.
 * Uses Unicode block characters to render a proportional bar (20 blocks max).
 */
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

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, color: BLUE, bold: true, font: 'Arial' })],
    spacing: { before: 300, after: 150 },
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 22 })],
    spacing: { after: 100 },
  });
}

export async function POST(request: NextRequest) {
  try {
    const profile = await request.json() as TargetProfile;

    // Try to get AI executive summary
    let execSummary = '';
    try {
      const aiRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/narrative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const aiData = await aiRes.json() as { narrative: string };
      execSummary = aiData.narrative || '';
    } catch {
      execSummary = `${profile.gene} (${profile.approvedName}) received an overall target validation score of ${profile.scores.overall}/100, classified as "${getScoreLabel(profile.scores.overall)}".`;
    }

    // Build score table
    const scoreRows = DIMENSION_ORDER.map((dim, i) => {
      const score = profile.scores.dimensions[dim];
      return new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: DIMENSION_LABELS[dim], font: 'Arial', size: 20 })] })],
            shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: 'F1F5F9' } : undefined,
            width: { size: 40, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `${score.score}`, font: 'Arial', size: 20, bold: true })],
            })],
            shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: 'F1F5F9' } : undefined,
            width: { size: 15, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: getScoreLabel(score.score), font: 'Arial', size: 20 })] })],
            shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: 'F1F5F9' } : undefined,
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: score.description, font: 'Arial', size: 18 })] })],
            shading: i % 2 === 0 ? { type: ShadingType.SOLID, color: 'F1F5F9' } : undefined,
            width: { size: 25, type: WidthType.PERCENTAGE },
          }),
        ],
      });
    });

    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

    const doc = new Document({
      sections: [{
        children: [
          // Cover page
          new Paragraph({ spacing: { before: 2000 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'TargetRadar', color: BLUE, bold: true, font: 'Arial', size: 48 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Drug Target Validation Report', font: 'Arial', size: 28, color: '64748B' })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `${profile.gene} — ${profile.approvedName}`, font: 'Arial', size: 36, bold: true })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({
              text: `Overall Score: ${profile.scores.overall}/100 (${getScoreLabel(profile.scores.overall)})`,
              font: 'Arial', size: 28, color: BLUE,
            })],
            spacing: { after: 400 },
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
              text: 'Powered by TargetRadar — Open Source Drug Target Validation',
              font: 'Arial', size: 18, color: '94A3B8',
            })],
          }),

          // Executive Summary
          heading('Executive Summary'),
          ...execSummary.split('\n\n').map((p) => bodyText(p)),

          // Visual Score Radar — text-based bar chart for at-a-glance dimension comparison
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
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
          }),
          new Paragraph({ spacing: { after: 200 } }),

          // Score Breakdown
          heading('Score Breakdown'),
          new Table({
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Dimension', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })],
                    shading: { type: ShadingType.SOLID, color: BLUE },
                    width: { size: 40, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Score', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })],
                    shading: { type: ShadingType.SOLID, color: BLUE },
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Rating', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })],
                    shading: { type: ShadingType.SOLID, color: BLUE },
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Summary', font: 'Arial', size: 20, bold: true, color: 'FFFFFF' })] })],
                    shading: { type: ShadingType.SOLID, color: BLUE },
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              ...scoreRows,
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
              insideVertical: noBorder,
            },
          }),

          // Component breakdowns per dimension
          ...DIMENSION_ORDER.flatMap((dim) => {
            const score = profile.scores.dimensions[dim];
            return [
              heading(DIMENSION_LABELS[dim], HeadingLevel.HEADING_2),
              bodyText(`Score: ${score.score}/100 — ${score.description}`),
              ...score.components.map((c) =>
                bodyText(`  • ${c.name}: ${c.value.toFixed(1)}/${c.maxValue} — ${c.description}`)
              ),
            ];
          }),

          // Methodology
          heading('Methodology'),
          bodyText('TargetRadar scores drug targets across 7 dimensions using live data from public APIs. Each dimension is scored 0-100 based on specific components with defined caps and thresholds. The overall score is a weighted average: Chemical Tractability (22%), Genetic Evidence (18%), Clinical History (18%), Structural Readiness (13%), Regulatory Genomics (12%), Literature Depth (9%), Innovation Signal (8%).'),

          // Data Sources
          heading('Data Sources & Timestamps'),
          bodyText(`Analysis timestamp: ${new Date(profile.metadata.analysisTimestamp).toISOString()}`),
          bodyText(`Total response time: ${profile.metadata.totalResponseTimeMs}ms`),
          bodyText(`Services completed: ${profile.metadata.servicesCompleted}/7`),
          bodyText('Sources: Open Targets Platform, ChEMBL, PubMed/NCBI, ClinicalTrials.gov, bioRxiv, AlphaFold DB, PDB, Ensembl Regulation (AlphaGenome)'),
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
