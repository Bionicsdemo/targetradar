'use client';

import type { TargetProfile } from '@/lib/types/target-profile';

const TDL_LEVELS = {
  Tclin: {
    label: 'Tclin',
    desc: 'Clinical Target -- Approved drugs exist',
    color: '#10B981',
    bg: '#10B98115',
  },
  Tchem: {
    label: 'Tchem',
    desc: 'Chemical Target -- Tool compounds available',
    color: '#3B82F6',
    bg: '#3B82F615',
  },
  Tbio: {
    label: 'Tbio',
    desc: 'Biological Target -- Biological evidence only',
    color: '#F59E0B',
    bg: '#F59E0B15',
  },
  Tdark: {
    label: 'Tdark',
    desc: 'Dark Target -- Understudied, minimal data',
    color: '#6B7280',
    bg: '#6B728015',
  },
};

function classifyTDL(profile: TargetProfile): keyof typeof TDL_LEVELS {
  const chembl = profile.rawData.chembl.data;
  const maxPhase = chembl?.maxClinicalPhase ?? 0;
  const compoundCount = chembl?.compoundCount ?? 0;
  const diseaseCount =
    profile.rawData.openTargets.data?.diseaseAssociationCount ?? 0;

  if (maxPhase >= 4) return 'Tclin';
  if (maxPhase >= 1 || compoundCount > 0) return 'Tchem';
  if (diseaseCount > 0 || profile.scores.overall > 20) return 'Tbio';
  return 'Tdark';
}

export function TDLBadge({ profile }: { profile: TargetProfile }) {
  const level = classifyTDL(profile);
  const tdl = TDL_LEVELS[level];

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border"
      style={{
        borderColor: tdl.color + '30',
        backgroundColor: tdl.bg,
      }}
    >
      <span
        className="text-sm font-bold font-mono"
        style={{ color: tdl.color }}
      >
        {tdl.label}
      </span>
      <span className="text-[10px] text-slate-400">{tdl.desc}</span>
    </div>
  );
}
