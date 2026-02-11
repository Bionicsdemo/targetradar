import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { query } = (await request.json()) as { query: string };
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: `You are a drug discovery expert. Given the following natural language query, identify the SINGLE most relevant drug target gene symbol to analyze.

Query: "${query}"

Rules:
- Return ONLY a valid human gene symbol (e.g., EGFR, KRAS, BRCA1, TP53, PCSK9)
- If the query mentions a specific gene, return that gene
- If the query describes a disease or pathway, return the most prominent drug target gene for it
- If the query is about a drug class, return the primary target gene
- If you cannot determine a gene, return "UNKNOWN"

Respond with ONLY the gene symbol, nothing else. No explanation, no punctuation.`,
      }],
    });

    const block = message.content[0];
    const gene = block?.type === 'text' ? block.text.trim().toUpperCase() : 'UNKNOWN';

    if (gene === 'UNKNOWN' || gene.length > 15 || gene.includes(' ')) {
      return NextResponse.json({
        interpreted: false,
        query,
        suggestion: 'Could not interpret query. Try searching for a specific gene symbol like EGFR or KRAS.',
      });
    }

    return NextResponse.json({
      interpreted: true,
      query,
      gene,
      message: `Interpreted "${query}" \u2192 analyzing ${gene}`,
    });
  } catch {
    return NextResponse.json({ error: 'AI interpretation failed' }, { status: 500 });
  }
}
