export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0F172A] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            <span className="font-semibold text-slate-400">TargetRadar</span>{' '}
            — Open source drug target validation. MIT License.
          </div>
          <div className="text-sm text-slate-500">
            Built by{' '}
            <span className="text-slate-400">Heinz Jungbluth</span>{' '}
            — Spectrix RD
          </div>
        </div>
        <div className="mt-4 text-xs text-slate-600 text-center sm:text-left">
          Data from Open Targets, ChEMBL, PubMed, ClinicalTrials.gov, bioRxiv, AlphaFold/PDB.
          AI analysis powered by Claude.
        </div>
      </div>
    </footer>
  );
}
