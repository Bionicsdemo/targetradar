'use client';

import { cn } from '@/lib/utils';
import { assessDrugLikeness } from '@/lib/utils/drug-likeness';
import { labMoleculeToCompoundDetail } from '@/lib/types/lab';
import type { LabMolecule } from '@/lib/types/lab';

interface MoleculeHistoryProps {
  molecules: LabMolecule[];
  activeId: string | null;
  onSelect: (molecule: LabMolecule) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  className?: string;
}

export function MoleculeHistory({
  molecules,
  activeId,
  onSelect,
  onRemove,
  onClear,
  className,
}: MoleculeHistoryProps) {
  if (molecules.length === 0) {
    return (
      <div className={cn('rounded-xl bg-[var(--surface-1)] border border-white/5 p-5', className)}>
        <h3 className="text-sm font-semibold text-white mb-3">History</h3>
        <p className="text-xs text-slate-500">
          Tested molecules will appear here. Data is saved locally in your browser.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl bg-[var(--surface-1)] border border-white/5 p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">History</h3>
        <button
          onClick={onClear}
          className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {molecules.map((mol) => {
          const assessment = assessDrugLikeness(labMoleculeToCompoundDetail(mol));
          const isActive = mol.id === activeId;
          return (
            <div
              key={mol.id}
              className={cn(
                'group relative rounded-lg p-3 cursor-pointer transition-colors border',
                isActive
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-[#0F172A]/50 border-white/5 hover:border-white/10'
              )}
              onClick={() => onSelect(mol)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(mol.id);
                }}
                className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all text-xs"
              >
                x
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-white truncate max-w-[140px]">
                  {mol.name}
                </span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-xs font-bold rounded shrink-0',
                    assessment.lipinskiPass
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  )}
                >
                  {assessment.lipinskiPass ? 'PASS' : 'FAIL'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                {mol.targetGene && (
                  <span className="text-blue-400">{mol.targetGene}</span>
                )}
                <span>{new Date(mol.createdAt).toLocaleDateString()}</span>
              </div>
              {mol.molecularWeight !== null && (
                <div className="text-[10px] text-slate-600 mt-1">
                  MW {mol.molecularWeight.toFixed(0)} | Score {assessment.overallScore}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
