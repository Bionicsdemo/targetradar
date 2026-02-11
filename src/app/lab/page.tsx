'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MoleculeForm } from '@/components/lab/molecule-form';
import { ResultsPanel } from '@/components/lab/results-panel';
import { MoleculeHistory } from '@/components/lab/molecule-history';
import { useLabMolecules } from '@/hooks/use-lab-molecules';
import type { LabMolecule } from '@/lib/types/lab';
import type { CompoundDetail } from '@/lib/types/target-profile';

interface AnalyzeResponse {
  rawData: {
    chembl: {
      data: {
        topCompounds: CompoundDetail[];
      } | null;
    };
  };
}

export default function LabPage() {
  const { molecules, addMolecule, removeMolecule, clearAll } = useLabMolecules();
  const [activeMolecule, setActiveMolecule] = useState<LabMolecule | null>(null);
  const [knownCompounds, setKnownCompounds] = useState<CompoundDetail[]>([]);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);

  const handleSubmit = async (molecule: LabMolecule) => {
    addMolecule(molecule);
    setActiveMolecule(molecule);
    setKnownCompounds([]);

    if (molecule.targetGene) {
      setIsLoadingTarget(true);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gene: molecule.targetGene }),
        });
        if (res.ok) {
          const data = (await res.json()) as AnalyzeResponse;
          const compounds = data.rawData?.chembl?.data?.topCompounds ?? [];
          setKnownCompounds(compounds);
        }
      } catch {
        // Target fetch failed — still show results without comparison
      } finally {
        setIsLoadingTarget(false);
      }
    }
  };

  const handleSelectHistory = async (molecule: LabMolecule) => {
    setActiveMolecule(molecule);
    setKnownCompounds([]);

    if (molecule.targetGene) {
      setIsLoadingTarget(true);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gene: molecule.targetGene }),
        });
        if (res.ok) {
          const data = (await res.json()) as AnalyzeResponse;
          const compounds = data.rawData?.chembl?.data?.topCompounds ?? [];
          setKnownCompounds(compounds);
        }
      } catch {
        // Target fetch failed
      } finally {
        setIsLoadingTarget(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Molecule Testing Lab</h1>
          <p className="text-sm text-slate-400 mt-1">
            Test your own molecules against drug-likeness rules and compare with known compounds
          </p>
        </div>

        {/* Layout: 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: form + results */}
          <div className="lg:col-span-2 space-y-6">
            <MoleculeForm onSubmit={handleSubmit} />

            {isLoadingTarget && (
              <div className="rounded-xl bg-[var(--surface-1)] border border-white/5 p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3" />
                <p className="text-sm text-slate-400">
                  Loading known compounds for {activeMolecule?.targetGene}...
                </p>
              </div>
            )}

            {activeMolecule && !isLoadingTarget && (
              <ResultsPanel
                molecule={activeMolecule}
                knownCompounds={knownCompounds}
              />
            )}
          </div>

          {/* Right: history sidebar */}
          <div>
            <MoleculeHistory
              molecules={molecules}
              activeId={activeMolecule?.id ?? null}
              onSelect={handleSelectHistory}
              onRemove={removeMolecule}
              onClear={clearAll}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
