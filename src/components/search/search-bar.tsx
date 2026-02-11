'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useSearch } from '@/hooks/use-search';
import { useRecentSearches } from '@/hooks/use-recent-searches';

interface InterpretResponse {
  interpreted: boolean;
  query: string;
  gene?: string;
  message?: string;
  suggestion?: string;
  error?: string;
}

export function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const { query, setQuery, results, isLoading } = useSearch();
  const { addSearch } = useRecentSearches();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setInterpretError(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear interpret error when query changes
  useEffect(() => {
    setInterpretError(null);
  }, [query]);

  const handleSubmit = (gene: string) => {
    const normalized = gene.trim().toUpperCase();
    if (!normalized) return;
    addSearch(normalized);
    setIsOpen(false);
    setQuery('');
    setInterpretError(null);
    router.push(`/analyze/${normalized}`);
  };

  const handleAiInterpret = useCallback(async (naturalQuery: string) => {
    setIsInterpreting(true);
    setInterpretError(null);
    try {
      const res = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: naturalQuery }),
      });
      const data = (await res.json()) as InterpretResponse;

      if (data.interpreted && data.gene) {
        handleSubmit(data.gene);
      } else {
        setInterpretError(data.suggestion ?? "Couldn't interpret. Try a gene symbol.");
      }
    } catch {
      setInterpretError("AI interpretation failed. Try a gene symbol like EGFR or KRAS.");
    } finally {
      setIsInterpreting(false);
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSubmit(results[selectedIndex].symbol);
      } else if (results.length === 0 && query.trim().length > 5 && !isLoading) {
        // No autocomplete matches and query is long enough -- try AI interpretation
        handleAiInterpret(query.trim());
      } else {
        handleSubmit(query);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInterpretError(null);
    }
  };

  const showAiButton = query.trim().length > 5 && results.length === 0 && !isLoading;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <svg
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          ref={inputRef}
          id="gene-search"
          name="gene-search"
          type="text"
          autoComplete="off"
          placeholder="Search a gene target or describe what you're looking for..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full h-12 sm:h-14 pl-10 sm:pl-12 pr-4 text-base sm:text-lg bg-[var(--surface-1)] border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
        />
        {(isLoading || isInterpreting) && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isInterpreting && (
              <span className="text-xs text-purple-400 whitespace-nowrap">AI interpreting...</span>
            )}
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Autocomplete results dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-[var(--surface-1)] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {results.map((result, index) => (
            <button
              key={result.id}
              className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                index === selectedIndex ? 'bg-blue-500/20' : 'hover:bg-white/5'
              }`}
              onClick={() => handleSubmit(result.symbol)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="font-mono font-bold text-blue-400 text-sm min-w-[80px]">
                {result.symbol}
              </span>
              <span className="text-slate-300 text-sm truncate">
                {result.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* AI interpret suggestion (no autocomplete results) */}
      {isOpen && showAiButton && !isInterpreting && !interpretError && (
        <div className="absolute top-full mt-2 w-full bg-[var(--surface-1)] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <button
            className="w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-purple-500/10"
            onClick={() => handleAiInterpret(query.trim())}
          >
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
            <div>
              <span className="text-sm text-purple-300 font-medium">Try AI Search</span>
              <span className="text-xs text-slate-500 ml-2">
                Let Opus 4.6 interpret &quot;{query.trim().length > 40 ? query.trim().slice(0, 40) + '...' : query.trim()}&quot;
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Interpret error message */}
      {interpretError && (
        <div className="absolute top-full mt-2 w-full bg-[var(--surface-1)] border border-amber-500/20 rounded-xl shadow-2xl overflow-hidden z-50 px-4 py-3">
          <p className="text-sm text-amber-400">{interpretError}</p>
        </div>
      )}
    </div>
  );
}
