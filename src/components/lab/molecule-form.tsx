'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearch } from '@/hooks/use-search';
import type { LabMolecule, LabFormState } from '@/lib/types/lab';

interface MoleculeFormProps {
  onSubmit: (molecule: LabMolecule) => void;
}

const INITIAL_FORM: LabFormState = {
  name: '',
  smiles: '',
  moleculeType: 'Small molecule',
  maxPhase: '0',
  molecularWeight: '',
  alogp: '',
  psa: '',
  hba: '',
  hbd: '',
  rotatableBonds: '',
  targetGene: '',
};

const MOLECULE_TYPES = ['Small molecule', 'Antibody', 'Protein', 'Oligonucleotide', 'Enzyme', 'Other'];

export function MoleculeForm({ onSubmit }: MoleculeFormProps) {
  const [form, setForm] = useState<LabFormState>(INITIAL_FORM);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');
  const [resolvedFromPubChem, setResolvedFromPubChem] = useState(false);
  const { query, setQuery, results, isLoading: isSearching } = useSearch();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const update = (field: keyof LabFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleResolve = async () => {
    if (!form.smiles.trim()) return;
    setIsResolving(true);
    setResolveError('');
    try {
      const res = await fetch('/api/lab/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smiles: form.smiles.trim() }),
      });
      const data = (await res.json()) as {
        success: boolean;
        properties?: {
          molecularWeight: number;
          alogp: number;
          psa: number;
          hba: number;
          hbd: number;
          rotatableBonds: number;
        };
        error?: string;
      };
      if (data.success && data.properties) {
        setForm((prev) => ({
          ...prev,
          molecularWeight: data.properties!.molecularWeight.toString(),
          alogp: data.properties!.alogp.toString(),
          psa: data.properties!.psa.toString(),
          hba: data.properties!.hba.toString(),
          hbd: data.properties!.hbd.toString(),
          rotatableBonds: data.properties!.rotatableBonds.toString(),
        }));
        setResolvedFromPubChem(true);
      } else {
        setResolveError(data.error ?? 'Failed to resolve SMILES');
        setResolvedFromPubChem(false);
      }
    } catch {
      setResolveError('Network error resolving SMILES');
      setResolvedFromPubChem(false);
    } finally {
      setIsResolving(false);
    }
  };

  const handleSubmit = () => {
    const mw = parseFloat(form.molecularWeight);
    if (isNaN(mw)) return;

    const safeFloat = (v: string): number | null => {
      if (!v) return null;
      const n = parseFloat(v);
      return isNaN(n) ? null : n;
    };
    const safeInt = (v: string): number | null => {
      if (!v) return null;
      const n = parseInt(v, 10);
      return isNaN(n) ? null : n;
    };

    const molecule: LabMolecule = {
      id: `lab-${Date.now()}`,
      name: form.name || form.smiles || 'Untitled Molecule',
      smiles: form.smiles,
      moleculeType: form.moleculeType,
      maxPhase: parseInt(form.maxPhase, 10) || 0,
      molecularWeight: isNaN(mw) ? null : mw,
      alogp: safeFloat(form.alogp),
      psa: safeFloat(form.psa),
      hba: safeInt(form.hba),
      hbd: safeInt(form.hbd),
      rotatableBonds: safeInt(form.rotatableBonds),
      targetGene: form.targetGene,
      resolvedFromPubChem,
      createdAt: Date.now(),
    };
    onSubmit(molecule);
  };

  const selectTarget = (symbol: string) => {
    update('targetGene', symbol);
    setQuery('');
    setShowSuggestions(false);
  };

  const canSubmit = form.molecularWeight.trim() !== '' && !isNaN(parseFloat(form.molecularWeight));

  return (
    <Card className="bg-[var(--surface-1)] border-white/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-base text-white">Test a Molecule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Target gene (optional) */}
        <div className="relative">
          <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">
            Target Gene (optional)
          </label>
          <Input
            id="lab-target-gene"
            name="lab-target-gene"
            placeholder="e.g. EGFR, KRAS, BRCA1"
            value={form.targetGene || query}
            onChange={(e) => {
              const v = e.target.value;
              update('targetGene', '');
              setQuery(v);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600"
          />
          {showSuggestions && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-[#0F172A] border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectTarget(r.symbol)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium text-white">{r.symbol}</span>
                  <span className="text-slate-500 ml-2 text-xs">{r.name}</span>
                </button>
              ))}
            </div>
          )}
          {isSearching && (
            <span className="absolute right-3 top-8 text-[10px] text-slate-500">Searching...</span>
          )}
        </div>

        {/* SMILES */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">
            SMILES String
          </label>
          <div className="flex gap-2">
            <Input
              id="lab-smiles"
              name="lab-smiles"
              placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
              value={form.smiles}
              onChange={(e) => {
                update('smiles', e.target.value);
                setResolvedFromPubChem(false);
              }}
              className="bg-[#0F172A] border-white/10 text-white font-mono text-sm placeholder:text-slate-600"
            />
            <Button
              onClick={handleResolve}
              disabled={!form.smiles.trim() || isResolving}
              variant="outline"
              className="shrink-0 border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
            >
              {isResolving ? 'Resolving...' : 'Resolve'}
            </Button>
          </div>
          {resolveError && (
            <p className="text-[10px] text-red-400 mt-1">{resolveError}</p>
          )}
          {resolvedFromPubChem && (
            <p className="text-[10px] text-emerald-400 mt-1">Properties auto-filled from PubChem</p>
          )}
        </div>

        {/* Molecule name */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">
            Molecule Name
          </label>
          <Input
            id="lab-molecule-name"
            name="lab-molecule-name"
            placeholder="e.g. Aspirin"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="bg-[#0F172A] border-white/10 text-white placeholder:text-slate-600"
          />
        </div>

        {/* Property grid */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 mb-2 block">
            Molecular Properties
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'molecularWeight' as const, label: 'MW (Da)', placeholder: '180.16' },
              { key: 'alogp' as const, label: 'LogP', placeholder: '1.19' },
              { key: 'psa' as const, label: 'TPSA', placeholder: '63.6' },
              { key: 'hba' as const, label: 'HBA', placeholder: '4' },
              { key: 'hbd' as const, label: 'HBD', placeholder: '1' },
              { key: 'rotatableBonds' as const, label: 'RotB', placeholder: '3' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <span className="text-[10px] text-slate-500 block mb-1">{label}</span>
                <Input
                  id={`lab-${key}`}
                  name={`lab-${key}`}
                  type="number"
                  step="any"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                  className="bg-[#0F172A] border-white/10 text-white text-sm placeholder:text-slate-600 h-8"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Type + Phase */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">
              Molecule Type
            </label>
            <select
              id="lab-molecule-type"
              name="lab-molecule-type"
              value={form.moleculeType}
              onChange={(e) => update('moleculeType', e.target.value)}
              className="w-full h-9 rounded-md bg-[#0F172A] border border-white/10 text-sm text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MOLECULE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 mb-1.5 block">
              Max Phase
            </label>
            <select
              id="lab-max-phase"
              name="lab-max-phase"
              value={form.maxPhase}
              onChange={(e) => update('maxPhase', e.target.value)}
              className="w-full h-9 rounded-md bg-[#0F172A] border border-white/10 text-sm text-white px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {[0, 1, 2, 3, 4].map((p) => (
                <option key={p} value={p}>
                  {p === 0 ? 'Preclinical' : p === 4 ? 'Approved' : `Phase ${p}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
        >
          Analyze Molecule
        </Button>
      </CardContent>
    </Card>
  );
}
