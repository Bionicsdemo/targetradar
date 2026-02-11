'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AiBadge } from './ai-badge';
import type { TargetProfile } from '@/lib/types/target-profile';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'Is this target safe to modulate?',
  'What diseases could this target treat?',
  "What's the best drug modality?",
  'What are the key risks for this target?',
];

export function TargetChat({ profile }: { profile: TargetProfile }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isStreaming) return;

      const userMessage: ChatMessage = { role: 'user', content: question.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsStreaming(true);

      // Add empty assistant message that will be filled by streaming
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, question: question.trim() }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: 'Failed to get a response. Please try again.',
            };
            return updated;
          });
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6);
            if (payload === '[DONE]') break;

            try {
              const parsed = JSON.parse(payload) as { text?: string; error?: string };
              if (parsed.error) {
                accumulated = 'An error occurred while generating the response.';
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: accumulated,
                  };
                  return updated;
                });
                break;
              }
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: accumulated,
                  };
                  return updated;
                });
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && (err as DOMException).name === 'AbortError')) {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: 'assistant',
              content: 'Failed to get a response. Please try again.',
            };
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, profile]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleSuggestion = (question: string) => {
    void sendMessage(question);
  };

  return (
    <div
      className="rounded-xl border border-white/5 p-4 sm:p-6 animate-fade-in-up"
      style={{ backgroundColor: 'var(--surface-1)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <AiBadge />
        <h3 className="text-sm font-medium text-slate-300 flex-1">
          Ask Anything about {profile.gene}
        </h3>
      </div>

      {/* Messages area */}
      <div className="max-h-[500px] overflow-y-auto space-y-3 mb-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500 mb-4">
              Ask any scientific question about{' '}
              <span className="font-mono text-slate-400">{profile.gene}</span>{' '}
              — the full analysis data is available as context.
            </p>
            {/* Suggested questions */}
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  disabled={isStreaming}
                  className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 border border-blue-500/20 text-blue-100'
                  : 'bg-white/[0.03] border border-white/5 text-slate-300'
              }`}
            >
              {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin" />
                  <span className="text-xs">Analyzing...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {msg.content.split('\n\n').map((paragraph, pi) => (
                    <p key={pi} className={pi > 0 ? 'mt-3' : ''}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions after first exchange */}
      {messages.length > 0 && !isStreaming && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_QUESTIONS.filter(
            (q) => !messages.some((m) => m.role === 'user' && m.content === q)
          )
            .slice(0, 3)
            .map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestion(q)}
                className="px-2.5 py-1 text-[11px] rounded-md border border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20 hover:bg-white/5 transition-all"
              >
                {q}
              </button>
            ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          id="chat-input"
          name="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${profile.gene}...`}
          disabled={isStreaming}
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/30 disabled:text-blue-300/50 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
        >
          {isStreaming ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
