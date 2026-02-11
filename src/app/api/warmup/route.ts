import { NextResponse } from 'next/server';

const DEMO_TARGETS = ['EGFR', 'KRAS', 'BRCA1'];

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const startTime = Date.now();

  const results = await Promise.allSettled(
    DEMO_TARGETS.map(async (gene) => {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gene }),
      });
      const data = await res.json() as { scores?: { overall?: number } };
      return {
        gene,
        score: data.scores?.overall ?? null,
        time: Date.now() - start,
        status: res.ok ? ('ok' as const) : ('error' as const),
      };
    })
  );

  const summary = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { gene: DEMO_TARGETS[i], status: 'error' as const, time: 0, score: null }
  );

  return NextResponse.json({
    warmedUp: summary.filter((s) => s.status === 'ok').length,
    total: DEMO_TARGETS.length,
    totalTime: Date.now() - startTime,
    targets: summary,
  });
}
