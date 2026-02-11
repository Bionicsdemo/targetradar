'use client';

import Link from 'next/link';

const SUGGESTIONS = [
  { gene: 'EGFR', label: 'Epidermal Growth Factor Receptor' },
  { gene: 'KRAS', label: 'KRAS Proto-Oncogene' },
  { gene: 'BRCA1', label: 'BRCA1 DNA Repair Associated' },
  { gene: 'TP53', label: 'Tumor Protein P53' },
  { gene: 'PCSK9', label: 'Proprotein Convertase Subtilisin/Kexin Type 9' },
];

export function SearchSuggestions() {
  return (
    <div className="mt-8">
      <p className="text-sm text-slate-500 mb-3">Try these popular targets</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {SUGGESTIONS.map((s) => (
          <Link
            key={s.gene}
            href={`/analyze/${s.gene}`}
            className="group px-4 py-2 bg-[var(--surface-1)] hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/30 rounded-xl text-sm transition-all"
          >
            <span className="font-mono font-bold text-blue-400 group-hover:text-blue-300">
              {s.gene}
            </span>
            <span className="text-slate-500 ml-2 hidden sm:inline">
              {s.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
