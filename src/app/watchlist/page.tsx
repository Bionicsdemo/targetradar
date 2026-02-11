'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useWatchlist } from '@/hooks/use-watchlist';
import { getScoreColor, getScoreLabel } from '@/lib/constants';

const TDL_STYLES: Record<string, { bg: string; text: string }> = {
  Tclin: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  Tchem: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  Tbio: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  Tdark: { bg: 'bg-slate-500/15', text: 'text-slate-400' },
};

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function WatchlistPage() {
  const { targets, removeTarget } = useWatchlist();
  const router = useRouter();

  const canCompare = targets.length >= 2;

  const handleCompare = () => {
    if (canCompare) {
      router.push(`/compare?a=${targets[0]!.gene}&b=${targets[1]!.gene}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Target Watchlist</h1>
            <span className="px-2.5 py-0.5 rounded-full text-sm font-semibold bg-blue-500/15 text-blue-400">
              {targets.length}
            </span>
          </div>
          {canCompare && (
            <button
              onClick={handleCompare}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Compare top 2
            </button>
          )}
        </div>

        {/* Empty state */}
        {targets.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">No targets saved yet</h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Analyze a target and click &quot;Add to Watchlist&quot; to start building your portfolio.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search for a target
            </Link>
          </div>
        )}

        {/* Target cards grid */}
        {targets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {targets.map((target) => {
              const tdlStyle = TDL_STYLES[target.tdl] ?? TDL_STYLES.Tdark!;
              const scoreColor = getScoreColor(target.overallScore);

              return (
                <div
                  key={target.gene}
                  className="group relative rounded-xl border border-white/5 bg-[#0F172A]/60 hover:border-white/10 hover:bg-[#0F172A]/80 transition-all cursor-pointer"
                >
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeTarget(target.gene);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={`Remove ${target.gene} from watchlist`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Card content — clickable */}
                  <Link href={`/analyze/${target.gene}`} className="block p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white font-mono group-hover:text-blue-400 transition-colors">
                          {target.gene}
                        </h3>
                        <p className="text-sm text-slate-400 mt-0.5 line-clamp-1">
                          {target.approvedName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {/* TDL badge */}
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${tdlStyle.bg} ${tdlStyle.text}`}>
                          {target.tdl}
                        </span>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-2xl font-extrabold font-mono"
                          style={{ color: scoreColor }}
                        >
                          {target.overallScore}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: scoreColor + '15',
                            color: scoreColor,
                          }}
                        >
                          {getScoreLabel(target.overallScore)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-600">
                        Added {timeAgo(target.addedAt)}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
