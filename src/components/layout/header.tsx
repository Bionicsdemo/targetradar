'use client';

import { useState } from 'react';
import Link from 'next/link';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-white/10 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              TargetRadar
            </span>
            <span className="hidden sm:inline text-xs text-slate-400 ml-2">
              Drug Target Validation
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Search</Link>
          <Link href="/compare" className="text-sm text-slate-400 hover:text-white transition-colors">Compare</Link>
          <Link href="/discover" className="text-sm text-slate-400 hover:text-white transition-colors">Discover</Link>
          <Link href="/lab" className="text-sm text-slate-400 hover:text-white transition-colors">Lab</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 hover:text-white transition-colors">GitHub</a>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="sm:hidden p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <nav className="sm:hidden border-t border-white/5 bg-[#0F172A]/95 backdrop-blur-md px-4 py-3 space-y-1">
          <Link href="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-400 hover:text-white transition-colors">Search</Link>
          <Link href="/compare" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-400 hover:text-white transition-colors">Compare</Link>
          <Link href="/discover" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-400 hover:text-white transition-colors">Discover</Link>
          <Link href="/lab" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-400 hover:text-white transition-colors">Lab</Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-slate-400 hover:text-white transition-colors">GitHub</a>
        </nav>
      )}
    </header>
  );
}
