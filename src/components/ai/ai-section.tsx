'use client';

import { useState } from 'react';
import { AiBadge } from './ai-badge';
import { cn } from '@/lib/utils';

interface AiSectionProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  borderColor?: string;
  content: string;
  isLoading: boolean;
  error?: string | null;
  loadingMessage?: string;
  /** If true, section starts expanded. Default: false (collapsed with teaser). */
  defaultExpanded?: boolean;
  children?: React.ReactNode;
}

export function AiSection({
  title,
  badge,
  badgeColor = 'indigo',
  borderColor = 'white/5',
  content,
  isLoading,
  error,
  loadingMessage,
  defaultExpanded = false,
  children,
}: AiSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const borderClasses: Record<string, string> = {
    'white/5': 'border-white/5',
    'indigo-500/10': 'border-indigo-500/10',
    'amber-500/20': 'border-amber-500/20',
    'rose-500/20': 'border-rose-500/20',
    'cyan-500/20': 'border-cyan-500/20',
    'purple-500/20': 'border-purple-500/20',
    'emerald-500/20': 'border-emerald-500/20',
    'red-500/20': 'border-red-500/20',
  };
  const borderClass = borderClasses[borderColor] ?? 'border-white/5';
  const paragraphs = content ? content.split('\n\n').filter(Boolean) : [];
  const teaser = paragraphs[0] ?? '';
  const hasMore = paragraphs.length > 1;

  // Badge color classes
  const badgeColors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    red: 'bg-red-500/10 text-red-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    amber: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    rose: 'bg-rose-500/10 text-rose-400',
  };

  if (error) {
    return (
      <div className={cn('rounded-xl border p-4 sm:p-6', borderClass)} style={{ backgroundColor: 'var(--surface-1)' }}>
        <div className="flex items-center gap-2 mb-3">
          <AiBadge />
          <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        </div>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border p-4 sm:p-6', borderClass)} style={{ backgroundColor: 'var(--surface-1)' }}>
        <div className="flex items-center gap-2 mb-3">
          <AiBadge />
          <h3 className="text-sm font-medium text-slate-300">{title}</h3>
          {badge && (
            <span className={cn('px-2 py-0.5 text-[9px] font-bold rounded', badgeColors[badgeColor] ?? badgeColors.indigo)}>
              {badge}
            </span>
          )}
        </div>
        <div className="space-y-3">
          {loadingMessage && (
            <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
              <span className="w-4 h-4 border-2 border-slate-500/30 border-t-slate-400 rounded-full animate-spin" />
              {loadingMessage}
            </div>
          )}
          <div className="h-4 bg-white/5 rounded animate-pulse" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-white/5 rounded animate-pulse w-4/6" />
        </div>
      </div>
    );
  }

  if (!content && !children) return null;

  return (
    <div className={cn('rounded-xl border p-4 sm:p-6 animate-fade-in-up', borderClass)} style={{ backgroundColor: 'var(--surface-1)' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <AiBadge />
        <h3 className="text-sm font-medium text-slate-300 flex-1">{title}</h3>
        {badge && (
          <span className={cn('px-2 py-0.5 text-[9px] font-bold rounded', badgeColors[badgeColor] ?? badgeColors.indigo)}>
            {badge}
          </span>
        )}
      </div>

      {/* Custom children (e.g., NextSteps grid, MutationImpact form) */}
      {children}

      {/* Paragraph content with progressive disclosure */}
      {content && (
        <div className="prose prose-sm prose-invert max-w-none">
          {isExpanded ? (
            paragraphs.map((paragraph, i) => (
              <p key={i} className="text-slate-300 leading-[1.6] text-sm mb-3 last:mb-0">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-slate-300 leading-[1.6] text-sm">
              {teaser}
            </p>
          )}
        </div>
      )}

      {/* Expand/collapse toggle */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none rounded px-1"
        >
          <svg
            className={cn('w-3 h-3 transition-transform duration-200', isExpanded && 'rotate-180')}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isExpanded ? 'Show less' : `Read full analysis (${paragraphs.length} paragraphs)`}
        </button>
      )}
    </div>
  );
}
