'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AiSection } from './ai-section';
import type { TargetProfile } from '@/lib/types/target-profile';

interface TargetNarrativeProps {
  profile: TargetProfile;
  /** Use streaming endpoint for real-time token delivery. Falls back to non-streaming on error. */
  stream?: boolean;
}

export function TargetNarrative({ profile, stream = true }: TargetNarrativeProps) {
  const [narrative, setNarrative] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchStreaming = useCallback(async (signal: AbortSignal): Promise<boolean> => {
    const res = await fetch('/api/ai/narrative/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      signal,
    });

    if (!res.ok || !res.body) return false;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last partial line in the buffer
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') break;

        try {
          const parsed = JSON.parse(payload) as { text?: string; error?: string };
          if (parsed.error) return false;
          if (parsed.text) {
            accumulated += parsed.text;
            setNarrative(accumulated);
          }
        } catch {
          // Skip malformed JSON chunks
        }
      }
    }

    return accumulated.length > 0;
  }, [profile]);

  const fetchNonStreaming = useCallback(async (signal: AbortSignal): Promise<void> => {
    const res = await fetch('/api/ai/narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
      signal,
    });

    const data = (await res.json()) as { narrative: string; error?: string };
    if (data.error) {
      setError('AI narrative unavailable. Set ANTHROPIC_API_KEY to enable.');
    } else {
      setNarrative(data.narrative);
    }
  }, [profile]);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);
    setNarrative('');

    const run = async () => {
      try {
        if (stream) {
          const ok = await fetchStreaming(controller.signal);
          if (!ok && !controller.signal.aborted) {
            // Fallback to non-streaming
            setNarrative('');
            await fetchNonStreaming(controller.signal);
          }
        } else {
          await fetchNonStreaming(controller.signal);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const msg = err instanceof Error ? err.message : 'Failed to generate AI narrative.';
          setError(msg);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [profile, stream, fetchStreaming, fetchNonStreaming]);

  return (
    <AiSection
      title="Target Intelligence Brief"
      content={narrative}
      isLoading={isLoading && !narrative}
      error={error}
      defaultExpanded={true}
    />
  );
}
