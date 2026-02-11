'use client';

import { useState } from 'react';
import type { DimensionScore } from '@/lib/types/scoring';
import { getScoreColor, getDimensionColor } from '@/lib/constants';
import { ScoreCounter } from './score-counter';

interface DimensionCardProps {
  dimension: DimensionScore;
  dimensionKey: string;
  index: number;
  animate?: boolean;
}

export function DimensionCard({ dimension, dimensionKey, index, animate = true }: DimensionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scoreColor = getScoreColor(dimension.score);
  const dimColor = getDimensionColor(dimensionKey);
  const progressBarColor = dimension.score > 70 ? '#10B981' : dimension.score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div
      className={`group rounded-xl border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none overflow-hidden ${
        animate ? `animate-fade-in-up stagger-${index + 1}` : ''
      }`}
      style={{ backgroundColor: 'var(--surface-1)' }}
      onClick={() => setIsExpanded(!isExpanded)}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded); } }}
      role="button"
      aria-expanded={isExpanded}
    >
      {/* Score progress bar at top */}
      <div className="h-[3px] w-full bg-white/[0.03]">
        <div
          className="h-full rounded-r-full transition-all duration-1000 ease-out"
          style={{
            width: animate ? `${dimension.score}%` : '0%',
            backgroundColor: progressBarColor,
            transitionDelay: `${index * 80 + 200}ms`,
          }}
        />
      </div>
      <div className="p-5">
        {/* Dimension accent bar */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dimColor }} />
          <h3 className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors flex-1">
            {dimension.label}
          </h3>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
            style={{ backgroundColor: scoreColor + '15' }}
          >
            <ScoreCounter target={dimension.score} animate={animate} color={scoreColor} />
            <span className="text-xs" style={{ color: scoreColor + 'B0' }}>
              /100
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-3">
          {dimension.description}
        </p>

        {/* Progress bar with dimension color */}
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: animate ? `${dimension.score}%` : '0%',
              backgroundColor: dimColor,
              transitionDelay: `${index * 80 + 400}ms`,
            }}
          />
        </div>

        {/* Expand indicator */}
        <div className="flex items-center justify-center mt-2">
          <svg
            className={`w-3 h-3 text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-2 animate-fade-in-up">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
            Score Components
          </p>
          {dimension.components.map((comp) => (
            <div key={comp.name} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <span className="text-xs text-slate-300">{comp.name}</span>
                <p className="text-xs text-slate-500 truncate">{comp.description}</p>
              </div>
              <div className="text-right ml-4 flex items-baseline gap-1">
                <span className="font-mono text-sm font-tabular" style={{ color: dimColor }}>
                  {comp.value.toFixed(1)}
                </span>
                <span className="text-xs text-slate-600 font-tabular">/{comp.maxValue}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
