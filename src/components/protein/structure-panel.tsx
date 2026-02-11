'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const ProteinViewer = dynamic(
  () => import('./protein-viewer').then((m) => ({ default: m.ProteinViewer })),
  { ssr: false },
);

interface StructurePanelProps {
  pdbId?: string;
  uniprotId?: string;
  geneName: string;
  pdbCount?: number;
  bestResolution?: number;
  avgPLDDT?: number;
  ligandBound?: number;
  className?: string;
}

export function StructurePanel({
  pdbId,
  uniprotId,
  geneName,
  pdbCount = 0,
  bestResolution,
  avgPLDDT,
  ligandBound = 0,
  className,
}: StructurePanelProps) {
  const [colorScheme, setColorScheme] = useState<
    'secondary-structure' | 'plddt' | 'hydrophobicity'
  >('secondary-structure');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const hasPdb = !!pdbId;
  const hasAlphaFold = !!uniprotId;
  const hasStructure = hasPdb || hasAlphaFold;

  if (!hasStructure) {
    return (
      <div
        className={cn(
          'rounded-xl border border-slate-700/50 bg-slate-900/50 p-8 text-center',
          className,
        )}
      >
        <svg
          className="w-12 h-12 text-slate-700 mx-auto mb-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
        <p className="text-sm text-slate-500">No structure available for {geneName}</p>
        <p className="text-xs text-slate-600 mt-1">
          No experimental PDB structure or AlphaFold prediction found
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-violet-500/20 bg-slate-900/50 backdrop-blur-sm overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-violet-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <span className="text-violet-400 text-sm">
            <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
            </svg>
          </span>
          <h3 className="text-sm font-semibold text-white">
            3D Structure &mdash; {geneName}
          </h3>
          {hasPdb && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-violet-500/20 text-violet-300 rounded">
              PDB: {pdbId!.toUpperCase()}
            </span>
          )}
          {!hasPdb && hasAlphaFold && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-500/20 text-blue-300 rounded">
              AlphaFold Prediction
            </span>
          )}
        </div>

        {/* Color scheme toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setColorScheme('secondary-structure')}
            className={cn(
              'px-2 py-0.5 text-[10px] rounded transition-colors',
              colorScheme === 'secondary-structure'
                ? 'bg-violet-500/30 text-violet-200'
                : 'text-slate-500 hover:text-slate-300',
            )}
          >
            Structure
          </button>
          {hasAlphaFold && (
            <button
              onClick={() => setColorScheme('plddt')}
              className={cn(
                'px-2 py-0.5 text-[10px] rounded transition-colors',
                colorScheme === 'plddt'
                  ? 'bg-blue-500/30 text-blue-200'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              Confidence
            </button>
          )}
          <button
            onClick={() => setColorScheme('hydrophobicity')}
            className={cn(
              'px-2 py-0.5 text-[10px] rounded transition-colors',
              colorScheme === 'hydrophobicity'
                ? 'bg-amber-500/30 text-amber-200'
                : 'text-slate-500 hover:text-slate-300',
            )}
          >
            Hydro
          </button>
        </div>
      </div>

      {/* 3D Viewer */}
      <ProteinViewer
        pdbId={pdbId}
        uniprotId={!pdbId ? uniprotId : undefined}
        colorScheme={colorScheme}
        height={460}
        autoRotate={true}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />

      {/* Bottom info bar */}
      <div className="px-3 sm:px-4 py-2 border-t border-violet-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-[10px] text-slate-500">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {pdbCount > 0 && (
            <span>
              <span className="text-slate-400">{pdbCount.toLocaleString()}</span> PDB
              structures
            </span>
          )}
          {bestResolution !== undefined && bestResolution < 90 && (
            <span>
              Best: <span className="text-slate-400">{bestResolution.toFixed(1)} &Aring;</span>
            </span>
          )}
          {avgPLDDT !== undefined && avgPLDDT > 0 && (
            <span>
              pLDDT: <span className="text-slate-400">{avgPLDDT.toFixed(1)}</span>
            </span>
          )}
          {ligandBound > 0 && (
            <span>
              <span className="text-slate-400">{ligandBound}</span> ligand-bound
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {colorScheme === 'secondary-structure' && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-violet-500" /> Helix
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Sheet
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-500" /> Coil
              </span>
            </>
          )}
          {colorScheme === 'plddt' && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600" /> &gt;90
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> 70-90
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-500" /> 50-70
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" /> &lt;50
              </span>
            </>
          )}
          {colorScheme === 'hydrophobicity' && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> RasMol coloring
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
