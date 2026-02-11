import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Warmup } from '@/components/layout/warmup';
import { SearchBar } from '@/components/search/search-bar';
import { SearchSuggestions } from '@/components/search/search-suggestions';
import { RecentSearches } from '@/components/search/recent-searches';

const EXAMPLE_TARGETS = [
  { gene: 'EGFR', name: 'Epidermal Growth Factor Receptor', tag: 'Oncology', color: '#3B82F6' },
  { gene: 'KRAS', name: 'GTPase KRas', tag: 'Undruggable → Drugged', color: '#8B5CF6' },
  { gene: 'TP53', name: 'Tumor Protein P53', tag: 'Most Mutated', color: '#EF4444' },
  { gene: 'PCSK9', name: 'Proprotein Convertase', tag: 'Approved Drugs', color: '#10B981' },
  { gene: 'BRCA1', name: 'BRCA1 DNA Repair', tag: 'PARP Inhibitors', color: '#EC4899' },
];

const PERSONAS = [
  { icon: '🎓', title: 'PhD Students', desc: 'Choose thesis targets with confidence' },
  { icon: '💰', title: 'Biotech Investors', desc: 'Due diligence on target pipelines' },
  { icon: '🔬', title: 'Academic Labs', desc: 'Prioritize new research projects' },
  { icon: '🏥', title: 'Patient Advocacy', desc: 'Understand disease target landscapes' },
  { icon: '📰', title: 'Science Journalists', desc: 'Research drug development stories' },
  { icon: '💊', title: 'Small Pharma', desc: 'Enterprise insights without enterprise cost' },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Warmup />
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-10 sm:pb-16 text-center relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Open Source &middot; Free Forever &middot; 7 Live Data Sources
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Drug Target Validation
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                in 30 Seconds
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-10 px-2 sm:px-0">
              Enterprise-grade target analysis that used to cost $50–200K/year and take weeks.
              Now free, instant, and powered by AI.
            </p>

            <SearchBar autoFocus />
            <SearchSuggestions />

            {/* Try it — example targets */}
            <div className="mt-6 mb-2">
              <p className="text-xs text-slate-500 mb-3">Try a target:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLE_TARGETS.map((t) => (
                  <Link
                    key={t.gene}
                    href={`/analyze/${t.gene}`}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] transition-all"
                  >
                    <span className="text-sm font-bold font-mono text-white group-hover:text-blue-400 transition-colors">{t.gene}</span>
                    <span className="hidden sm:inline text-[10px] text-slate-500">{t.name}</span>
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-semibold rounded"
                      style={{ backgroundColor: t.color + '15', color: t.color }}
                    >
                      {t.tag}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <RecentSearches />
          </div>
        </section>

        {/* Stats banner */}
        <section className="border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
              {[
                { value: '7', label: 'Live APIs', sub: 'queried in parallel' },
                { value: '16', label: 'AI Features', sub: 'powered by Opus 4.6' },
                { value: '7', label: 'Dimensions', sub: 'transparent scoring' },
                { value: '32', label: 'API Routes', sub: 'Next.js 16' },
                { value: '92', label: 'Unit Tests', sub: 'all passing' },
                { value: 'MIT', label: 'License', sub: 'free & open source' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs font-medium text-slate-300">{stat.label}</div>
                  <div className="text-[10px] text-slate-600">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">
              Seven Dimensions. One Unified Score.
            </h2>
            <p className="text-slate-400">
              Real-time data from 7 authoritative sources, scored and synthesized by AI.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { name: 'Genetic Evidence', source: 'Open Targets', color: '#3B82F6' },
              { name: 'Chemical Tractability', source: 'ChEMBL', color: '#8B5CF6' },
              { name: 'Structural Readiness', source: 'AlphaFold/PDB', color: '#06B6D4' },
              { name: 'Clinical History', source: 'ClinicalTrials.gov', color: '#10B981' },
              { name: 'Regulatory Genomics', source: 'AlphaGenome / Ensembl', color: '#EC4899' },
              { name: 'Literature Depth', source: 'PubMed', color: '#F59E0B' },
              { name: 'Innovation Signal', source: 'bioRxiv', color: '#EF4444' },
            ].map((dim) => (
              <div
                key={dim.name}
                className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-4 text-center hover:border-white/10 transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-3"
                  style={{ backgroundColor: dim.color }}
                />
                <p className="text-sm font-medium text-white mb-1">{dim.name}</p>
                <p className="text-xs text-slate-500">{dim.source}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who is this for */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-2">Who Is This For?</h2>
            <p className="text-slate-400">
              Breaking barriers for everyone in drug discovery.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {PERSONAS.map((p) => (
              <div
                key={p.title}
                className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-5 hover:border-white/10 transition-colors"
              >
                <span className="text-2xl mb-3 block">{p.icon}</span>
                <p className="text-sm font-medium text-white mb-1">{p.title}</p>
                <p className="text-xs text-slate-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
