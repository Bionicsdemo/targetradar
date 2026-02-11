'use client';

import Link from 'next/link';
import { useRecentSearches } from '@/hooks/use-recent-searches';

export function RecentSearches() {
  const { searches } = useRecentSearches();

  if (searches.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-sm text-slate-500 mb-3">Recent searches</p>
      <div className="flex flex-wrap gap-2">
        {searches.map((s) => (
          <Link
            key={s.gene}
            href={`/analyze/${s.gene}`}
            className="px-3 py-1.5 bg-[var(--surface-1)] hover:bg-[#2D3B4F] border border-white/5 rounded-lg text-sm font-mono text-blue-400 transition-colors"
          >
            {s.gene}
          </Link>
        ))}
      </div>
    </div>
  );
}
