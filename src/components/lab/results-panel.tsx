'use client';

import { cn } from '@/lib/utils';
import { assessDrugLikeness } from '@/lib/utils/drug-likeness';
import { DrugLikenessPanel } from '@/components/compounds/drug-likeness-panel';
import { PropertyScatter } from '@/components/charts/property-scatter';
import { labMoleculeToCompoundDetail } from '@/lib/types/lab';
import type { LabMolecule } from '@/lib/types/lab';
import type { CompoundDetail } from '@/lib/types/target-profile';

interface ResultsPanelProps {
  molecule: LabMolecule;
  knownCompounds: CompoundDetail[];
  className?: string;
}

interface PropertyCardProps {
  label: string;
  value: string;
  threshold: string;
  pass: boolean;
}

function PropertyCard({ label, value, threshold, pass }: PropertyCardProps) {
  return (
    <div className={cn(
      'rounded-lg p-3 border',
      pass
        ? 'bg-emerald-500/5 border-emerald-500/20'
        : 'bg-red-500/5 border-red-500/20'
    )}>
      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
      <div className={cn(
        'text-[10px] mt-1',
        pass ? 'text-emerald-400' : 'text-red-400'
      )}>
        {threshold}
      </div>
    </div>
  );
}

export function ResultsPanel({ molecule, knownCompounds, className }: ResultsPanelProps) {
  const compound = labMoleculeToCompoundDetail(molecule);
  const assessment = assessDrugLikeness(compound);

  const allCompounds = [compound, ...knownCompounds];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Verdict card */}
      <div className={cn(
        'rounded-xl border p-5 text-center',
        assessment.lipinskiPass
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-red-500/5 border-red-500/20'
      )}>
        <div className={cn(
          'inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3',
          assessment.lipinskiPass
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-red-500/20 text-red-400'
        )}>
          {assessment.lipinskiPass ? 'RO5 PASS' : 'RO5 FAIL'}
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {assessment.overallScore}/100
        </div>
        <div className="text-xs text-slate-400">
          Drug-Likeness Score
        </div>
        {assessment.flags.length > 0 && (
          <div className="mt-3 text-[11px] text-amber-400">
            Flags: {assessment.flags.join(', ')}
          </div>
        )}
      </div>

      {/* Property summary cards */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Property Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <PropertyCard
            label="Molecular Weight"
            value={molecule.molecularWeight?.toFixed(1) ?? 'N/A'}
            threshold="≤ 500 Da"
            pass={molecule.molecularWeight === null || molecule.molecularWeight <= 500}
          />
          <PropertyCard
            label="LogP"
            value={molecule.alogp?.toFixed(2) ?? 'N/A'}
            threshold="≤ 5"
            pass={molecule.alogp === null || molecule.alogp <= 5}
          />
          <PropertyCard
            label="TPSA"
            value={molecule.psa?.toFixed(1) ?? 'N/A'}
            threshold="< 140 A²"
            pass={molecule.psa === null || molecule.psa < 140}
          />
          <PropertyCard
            label="HB Acceptors"
            value={molecule.hba?.toString() ?? 'N/A'}
            threshold="≤ 10"
            pass={molecule.hba === null || molecule.hba <= 10}
          />
          <PropertyCard
            label="HB Donors"
            value={molecule.hbd?.toString() ?? 'N/A'}
            threshold="≤ 5"
            pass={molecule.hbd === null || molecule.hbd <= 5}
          />
          <PropertyCard
            label="Rotatable Bonds"
            value={molecule.rotatableBonds?.toString() ?? 'N/A'}
            threshold="≤ 10"
            pass={molecule.rotatableBonds === null || molecule.rotatableBonds <= 10}
          />
        </div>
      </div>

      {/* Drug-Likeness Panel (radar chart + Lipinski/Veber rules) */}
      <DrugLikenessPanel compounds={[compound]} />

      {/* Chemical Space Scatter */}
      <PropertyScatter compounds={allCompounds} />

      {/* Known compounds note */}
      {knownCompounds.length > 0 && molecule.targetGene && (
        <p className="text-[10px] text-slate-500 text-center">
          Showing your molecule alongside {knownCompounds.length} known {molecule.targetGene} compounds
        </p>
      )}
    </div>
  );
}
