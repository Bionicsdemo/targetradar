import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageStreamEvent } from '@anthropic-ai/sdk/resources/messages';
import { buildProfileSummary } from '@/lib/services/ai-analysis';
import type { TargetProfile } from '@/lib/types/target-profile';

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { profile, question } = (await request.json()) as {
      profile: TargetProfile;
      question: string;
    };

    if (!profile || !question?.trim()) {
      return NextResponse.json(
        { error: 'Profile and question required' },
        { status: 400 }
      );
    }

    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a senior drug discovery scientist with deep expertise in pharmacology, medicinal chemistry, and clinical development. You have access to the following comprehensive data profile for ${profile.gene}:

${buildProfileSummary(profile)}

The user is asking a scientific question about this target. Answer it thoroughly, citing specific data from the profile above. Be direct and scientific — no disclaimers or hedging. Reference actual numbers, compound IDs, trial counts, and scores.

QUESTION: ${question}`,
        },
      ],
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream as AsyncIterable<MessageStreamEvent>) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Stream failed';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}
