'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { CompoundDetail } from '@/lib/types/target-profile';

interface DockViewer3D {
  addModel: (data: string, format: string) => unknown;
  setStyle: (sel: Record<string, unknown>, style: Record<string, unknown>) => void;
  addStyle: (sel: Record<string, unknown>, style: Record<string, unknown>) => void;
  addSurface: (
    type: unknown,
    style: Record<string, unknown>,
    sel?: Record<string, unknown>,
    focusSel?: Record<string, unknown>,
  ) => unknown;
  zoomTo: (...args: unknown[]) => void;
  spin: (axis: string, speed: number) => void;
  render: () => void;
  clear: () => void;
  removeAllModels: () => void;
  removeAllSurfaces: () => void;
  stopAnimate: () => void;
  resize: () => void;
}

let scriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get3Dmol(): any { return (window as any).$3Dmol; }

function loadScript(): Promise<void> {
  if (scriptLoaded && get3Dmol()) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    if (get3Dmol()) { scriptLoaded = true; resolve(); return; }
    const existing = document.querySelector('script[src*="3Dmol"]');
    if (existing) {
      existing.addEventListener('load', () => { scriptLoaded = true; resolve(); });
      existing.addEventListener('error', () => reject(new Error('Script failed')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.4/3Dmol-min.js';
    s.onload = () => { scriptLoaded = true; resolve(); };
    s.onerror = () => reject(new Error('Failed to load 3Dmol.js'));
    document.head.appendChild(s);
  });
  return scriptLoadPromise;
}

/* ── Compound 3D mini-viewer with 2D fallback (independent instance) ── */
function CompoundViewer({
  smiles,
  height = 240,
}: {
  smiles: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<DockViewer3D | null>(null);
  const [status, setStatus] = useState<'loading' | '3d' | '2d' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    // Hard timeout: never let the user stare at a spinner for more than 10s
    const timeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        setStatus('2d');
      }
    }, 10000);

    async function init() {
      try {
        await loadScript();
        const $3Dmol = get3Dmol();
        if (!$3Dmol || cancelled) {
          clearTimeout(timeout);
          if (!cancelled) setStatus('2d');
          return;
        }

        const res = await fetch(
          `/api/lab/sdf3d?smiles=${encodeURIComponent(smiles)}`,
          { signal: AbortSignal.timeout(8000) },
        );
        if (!res.ok || cancelled) {
          clearTimeout(timeout);
          if (!cancelled) setStatus('2d');
          return;
        }

        const data = (await res.json()) as { sdf: string; is3d: boolean };
        if (!data.sdf?.trim() || cancelled) {
          clearTimeout(timeout);
          if (!cancelled) setStatus('2d');
          return;
        }

        // Wait one frame so the container has layout dimensions
        await new Promise((r) => requestAnimationFrame(r));
        if (cancelled || !containerRef.current) {
          clearTimeout(timeout);
          if (!cancelled) setStatus('2d');
          return;
        }

        // Clean up any previous viewer
        if (viewerRef.current) {
          viewerRef.current.stopAnimate();
          viewerRef.current.clear();
          viewerRef.current.removeAllModels();
          viewerRef.current = null;
        }

        const viewer = $3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#080C18',
          antialias: true,
        }) as DockViewer3D;
        viewerRef.current = viewer;

        viewer.addModel(data.sdf, 'sdf');
        viewer.setStyle(
          {},
          {
            stick: { radius: 0.15, colorscheme: 'Jmol' },
            sphere: { scale: 0.25, colorscheme: 'Jmol' },
          },
        );
        viewer.zoomTo();
        if (data.is3d) viewer.spin('y', 0.6);
        viewer.render();
        clearTimeout(timeout);
        if (!cancelled) setStatus('3d');
      } catch {
        clearTimeout(timeout);
        if (!cancelled) setStatus('2d');
      }
    }

    init();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      if (viewerRef.current) {
        viewerRef.current.stopAnimate();
        viewerRef.current.clear();
        viewerRef.current = null;
      }
      // Release WebGL context to prevent GPU memory leaks
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        const gl = canvas.getContext('webgl') ?? canvas.getContext('webgl2');
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      }
    };
  }, [smiles]);

  // Loading state — spinner with timeout guarantee
  if (status === 'loading') {
    return (
      <div
        style={{ height: `${height}px`, background: '#080C18' }}
        className="flex flex-col items-center justify-center rounded-lg"
      >
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-2" />
        <span className="text-[10px] text-emerald-300">Loading 3D conformer...</span>
      </div>
    );
  }

  // 2D fallback — PubChem 2D PNG with dark-mode color inversion
  if (status === '2d' || status === 'error') {
    return (
      <div
        style={{ height: `${height}px`, background: '#080C18' }}
        className="flex flex-col items-center justify-center rounded-lg p-2"
      >
        <img
          src={`/api/compound/image?smiles=${encodeURIComponent(smiles)}&size=300`}
          alt="2D structure"
          className="max-h-[80%] max-w-full object-contain rounded"
          style={{ filter: 'invert(1) hue-rotate(180deg) brightness(0.9)' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span className="text-[9px] text-slate-600 mt-1">2D structure</span>
      </div>
    );
  }

  // 3D viewer rendered by 3Dmol.js
  return (
    <div
      ref={containerRef}
      className="rounded-lg overflow-hidden"
      style={{ width: '100%', height: `${height}px` }}
    />
  );
}

interface DockingPanelProps {
  pdbId?: string;
  uniprotId?: string;
  geneName: string;
  ligandBoundCount?: number;
  compounds?: CompoundDetail[];
  className?: string;
}

export function DockingPanel({
  pdbId,
  uniprotId,
  geneName,
  ligandBoundCount = 0,
  compounds = [],
  className,
}: DockingPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<DockViewer3D | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState('Preparing binding site view...');
  const [error, setError] = useState<string | null>(null);
  const [showSurface, setShowSurface] = useState(false);
  const [selectedCompound, setSelectedCompound] = useState<CompoundDetail | null>(null);
  const [dockingLigand, setDockingLigand] = useState<string | null>(null);
  const [dockingPdbId, setDockingPdbId] = useState<string | null>(null);

  const hasPdb = !!pdbId;
  const hasStructure = hasPdb || !!uniprotId;

  const initViewer = useCallback(async () => {
    if (!containerRef.current || !hasStructure) return;

    // Wait for container to have dimensions
    if (!containerRef.current.offsetWidth || !containerRef.current.offsetHeight) {
      await new Promise((r) => requestAnimationFrame(r));
      if (!containerRef.current?.offsetWidth) return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setLoadingMsg('Loading rendering engine...');

      await loadScript();
      const $3Dmol = get3Dmol();
      if (!$3Dmol) throw new Error('3Dmol.js failed to initialize');

      // Step 1: Find best docking structure via our API
      setLoadingMsg('Searching for best co-crystal structure...');
      let dockingInfo: { pdbId: string; ligandId: string | null; ligandName: string | null } | null = null;

      if (uniprotId) {
        try {
          const dockRes = await fetch('/api/docking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uniprotId }),
            signal: AbortSignal.timeout(15000),
          });
          if (dockRes.ok) {
            dockingInfo = await dockRes.json() as { pdbId: string; ligandId: string | null; ligandName: string | null };
          }
        } catch {
          // Docking search failed -- use fallback
        }
      }

      // Step 2: Download PDB
      let pdbData: string | null = null;
      const targetPdbId = dockingInfo?.pdbId ?? pdbId;

      // Max PDB size: 1.5MB — larger structures (e.g., PRKDC 3.3MB) crash the browser
      const MAX_PDB_BYTES = 1_500_000;

      if (targetPdbId) {
        setLoadingMsg(`Fetching structure: ${targetPdbId.toUpperCase()}...`);
        const res = await fetch(`https://files.rcsb.org/download/${targetPdbId}.pdb`, {
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          const text = await res.text();
          if (text.length <= MAX_PDB_BYTES) {
            pdbData = text;
          } else {
            setLoadingMsg('Structure too large for browser rendering, trying AlphaFold...');
          }
        }
      }

      // Fallback to AlphaFold
      if (!pdbData && uniprotId) {
        setLoadingMsg('Fetching AlphaFold prediction...');
        const afRes = await fetch(`https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v6.pdb`, {
          signal: AbortSignal.timeout(10000),
        });
        if (afRes.ok) {
          const text = await afRes.text();
          if (text.length <= MAX_PDB_BYTES) {
            pdbData = text;
          }
        }
      }

      if (!pdbData) throw new Error('Structure too large or unavailable for interactive 3D rendering');

      // Step 3: Render
      setLoadingMsg('Rendering binding site...');

      if (viewerRef.current) {
        viewerRef.current.clear();
        viewerRef.current.removeAllModels();
        viewerRef.current.removeAllSurfaces();
      }

      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: '#111827',
        antialias: true,
      }) as DockViewer3D;
      viewerRef.current = viewer;

      viewer.addModel(pdbData, 'pdb');

      // Known ligand residue name from RCSB (e.g. "KY9" for EGFR)
      const lig = dockingInfo?.ligandId ?? null;

      // ── 1. PROTEIN: semi-transparent indigo cartoon ──
      viewer.setStyle({}, {
        cartoon: { color: '#818CF8', opacity: 0.55, thickness: 0.4 },
      });

      // ── 2. ALL LIGANDS (non-water heteroatoms): green sticks + spheres ──
      // This is the EXACT same pattern that works in protein-viewer.tsx line 200
      viewer.setStyle(
        { hetflag: true, resn: ['HOH', 'WAT'], invert: true },
        {
          stick: { radius: 0.3, colorscheme: 'greenCarbon' },
          sphere: { scale: 0.3, colorscheme: 'greenCarbon' },
        },
      );

      // ── 3. BINDING POCKET: teal cartoon + thin sticks for residues near ligand ──
      const ligSel = lig
        ? { resn: lig }
        : { hetflag: true, resn: ['HOH', 'WAT'], invert: true };

      // Pocket residues — protein atoms within 5A of ligand
      viewer.setStyle(
        { within: { distance: 5, sel: ligSel }, byres: true },
        {
          cartoon: { color: '#2DD4BF', opacity: 1.0, thickness: 0.6 },
          stick: { radius: 0.1, color: '#CBD5E1' },
        },
      );

      // ── 4. RE-APPLY LIGAND so pocket setStyle doesn't override it ──
      if (lig) {
        viewer.setStyle(
          { resn: lig },
          {
            stick: { radius: 0.35, colorscheme: 'greenCarbon' },
            sphere: { scale: 0.3, colorscheme: 'greenCarbon' },
          },
        );
      } else {
        viewer.setStyle(
          { hetflag: true, resn: ['HOH', 'WAT'], invert: true },
          {
            stick: { radius: 0.3, colorscheme: 'greenCarbon' },
            sphere: { scale: 0.3, colorscheme: 'greenCarbon' },
          },
        );
      }

      // ── 5. POCKET SURFACE: translucent amber ──
      try {
        viewer.addSurface(
          'VDW',
          { opacity: 0.15, color: '#FBBF24' },
          { within: { distance: 6, sel: ligSel }, byres: true },
        );
      } catch { /* surface can fail */ }

      // ── 6. ZOOM to the drug ligand + slow spin ──
      viewer.zoomTo(ligSel);
      viewer.spin('y', 0.3);
      viewer.render();

      // Update UI state with ligand info
      setDockingLigand(dockingInfo?.ligandName ?? null);
      setDockingPdbId(targetPdbId ?? null);

      setIsLoading(false);
      setLoadingMsg('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load structure';
      setError(msg);
      setIsLoading(false);
    }
  }, [pdbId, uniprotId, hasStructure]);

  useEffect(() => {
    initViewer();
    return () => {
      if (viewerRef.current) {
        viewerRef.current.stopAnimate();
        viewerRef.current.clear();
        viewerRef.current = null;
      }
      const canvas = containerRef.current?.querySelector('canvas');
      if (canvas) {
        const gl = canvas.getContext('webgl') ?? canvas.getContext('webgl2');
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      }
    };
  }, [initViewer]);

  useEffect(() => {
    const handleResize = () => viewerRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle protein surface overlay
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;
    viewer.removeAllSurfaces();
    if (showSurface) {
      try {
        viewer.addSurface(
          'MS' as unknown,
          { opacity: 0.15, color: '#6366F1' },
          { hetflag: false },
        );
      } catch { /* can fail */ }
    }
    // Re-add pocket surface around ligand
    try {
      const ligSel: Record<string, unknown> = dockingPdbId
        ? { hetflag: true, not: { resn: ['HOH','WAT','GOL','PEG','SO4','PO4','ACT','EDO','CL','NA','MG','CA','ZN','MN','NO3','DMS','AEDO','BEDO'] } }
        : {};
      viewer.addSurface(
        'VDW',
        { opacity: 0.10, color: '#F59E0B' },
        { within: { distance: 6, sel: ligSel }, byres: true },
      );
    } catch {
      // Pocket surface can fail -- skip
    }
    viewer.render();
  }, [showSurface, dockingLigand]);

  if (!hasStructure) return null;

  const topLigandCompounds = compounds.filter((c) => c.smiles).slice(0, 8);

  return (
    <div className={cn('rounded-xl border border-teal-500/20 bg-slate-900/50 backdrop-blur-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-teal-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-teal-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m11.14 0l-2.83-2.83M9.76 9.76L6.93 6.93" />
          </svg>
          <h3 className="text-xs sm:text-sm font-semibold text-white">
            Binding Site &amp; Explorer &mdash; {geneName}
          </h3>
          {(dockingPdbId ?? pdbId) && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-teal-500/20 text-teal-300 rounded">
              {(dockingPdbId ?? pdbId ?? '').toUpperCase()}
            </span>
          )}
          {dockingLigand && (
            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 rounded">
              {dockingLigand}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSurface(!showSurface)}
            className={cn(
              'px-2 py-0.5 text-[10px] rounded transition-colors',
              showSurface ? 'bg-teal-500/30 text-teal-200' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            Surface
          </button>
          {dockingPdbId && (
            <a
              href={`https://molstar.org/viewer/?pdb=${dockingPdbId}&hide-controls=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-teal-300 transition-colors"
            >
              Open in RCSB 3D &#8599;
            </a>
          )}
        </div>
      </div>

      {/* Split view: Protein left | Compound right (or stacked on small) */}
      <div className={cn(
        'grid gap-0',
        selectedCompound ? 'grid-cols-1 lg:grid-cols-[1fr_320px]' : 'grid-cols-1',
      )}>
        {/* Protein viewer */}
        <div className="relative">
          {isLoading && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0A0A1A 0%, #0F1A2E 100%)' }}
            >
              <div className="w-16 h-16 relative">
                <div className="absolute inset-0 rounded-full border-2 border-teal-500/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-teal-400/50 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-teal-500/20 animate-pulse flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
                  </svg>
                </div>
              </div>
              <p className="mt-3 text-xs text-teal-300 animate-pulse">{loadingMsg}</p>
            </div>
          )}

          {error && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center"
              style={{ background: '#0A0A1A', height: '420px' }}
            >
              <p className="text-sm text-red-400 mb-2">Binding site view unavailable</p>
              <p className="text-xs text-slate-500 max-w-xs text-center">{error}</p>
              <button
                onClick={() => initViewer()}
                className="mt-3 px-3 py-1 text-xs bg-teal-600 hover:bg-teal-500 text-white rounded transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          <div
            ref={containerRef}
            style={{ width: '100%', height: '420px' }}
            className="bg-[#0A0A1A]"
          />

          {/* Protein legend overlay */}
          {!isLoading && !error && (
            <div className="absolute bottom-2 left-2 flex gap-3 text-[9px] bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-sm bg-indigo-500 opacity-50" />
                <span className="text-slate-400">Protein ribbon</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-sm bg-teal-400" />
                <span className="text-slate-400">Binding site</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 rounded-full bg-emerald-400" />
                <span className="text-slate-400">Drug ligand</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1.5 rounded-sm bg-amber-500/20 border border-amber-500/30" />
                <span className="text-slate-400">Pocket</span>
              </span>
            </div>
          )}

          {/* Structure info strip */}
          {!isLoading && !error && (
            <div className="absolute bottom-2 right-2 flex flex-wrap gap-3 text-[10px] bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5">
              <span className="text-slate-500">
                Source: <span className={dockingPdbId ? 'text-teal-300' : 'text-violet-300'}>{dockingPdbId ? 'Co-crystal' : 'AlphaFold'}</span>
              </span>
              {dockingLigand && (
                <span className="text-slate-500">
                  Ligand: <span className="text-emerald-300">{dockingLigand}</span>
                </span>
              )}
              {ligandBoundCount > 0 && (
                <span className="text-slate-500">
                  Pocket: <span className="text-slate-300">{ligandBoundCount} struct.</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Selected compound detail panel */}
        {selectedCompound && (
          <div className="border-l border-teal-500/10 bg-[#080C18] flex flex-col">
            {/* Compound header */}
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">
                  {selectedCompound.preferredName ?? selectedCompound.chemblId}
                </div>
                <div className="text-[10px] font-mono text-slate-500">{selectedCompound.chemblId}</div>
              </div>
              <button
                onClick={() => setSelectedCompound(null)}
                className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* 3D compound viewer */}
            {selectedCompound.smiles && <CompoundViewer smiles={selectedCompound.smiles} height={200} />}

            {/* Compound properties */}
            <div className="px-3 py-2 space-y-2 flex-1 overflow-y-auto">
              {selectedCompound.pchemblValue !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Potency</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    pIC₅₀ {selectedCompound.pchemblValue.toFixed(1)}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                {selectedCompound.molecularWeight !== null && (
                  <div className="text-slate-500">MW <span className="text-slate-300 font-mono">{selectedCompound.molecularWeight.toFixed(0)}</span></div>
                )}
                {selectedCompound.alogp !== null && (
                  <div className="text-slate-500">LogP <span className="text-slate-300 font-mono">{selectedCompound.alogp.toFixed(1)}</span></div>
                )}
                {selectedCompound.psa !== null && (
                  <div className="text-slate-500">TPSA <span className="text-slate-300 font-mono">{selectedCompound.psa.toFixed(0)}</span></div>
                )}
                {selectedCompound.hba !== null && (
                  <div className="text-slate-500">HBA <span className="text-slate-300 font-mono">{selectedCompound.hba}</span></div>
                )}
                {selectedCompound.hbd !== null && (
                  <div className="text-slate-500">HBD <span className="text-slate-300 font-mono">{selectedCompound.hbd}</span></div>
                )}
                {selectedCompound.numRo5Violations !== null && (
                  <div className="text-slate-500">
                    RO5{' '}
                    <span className={cn('font-mono', selectedCompound.numRo5Violations <= 1 ? 'text-emerald-400' : 'text-amber-400')}>
                      {selectedCompound.numRo5Violations === 0 ? 'PASS' : `${selectedCompound.numRo5Violations} viol.`}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-600">
                Type: <span className="text-slate-400">{selectedCompound.moleculeType}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compound selector bar */}
      {topLigandCompounds.length > 0 && (
        <div className="px-4 py-3 border-t border-teal-500/10">
          <p className="text-[10px] text-slate-500 mb-2">
            Select compound to explore 3D structure:
          </p>
          <div className="flex flex-wrap gap-2">
            {topLigandCompounds.map((c) => (
              <button
                key={c.chemblId}
                onClick={() => setSelectedCompound(
                  selectedCompound?.chemblId === c.chemblId ? null : c,
                )}
                className={cn(
                  'px-2 py-1 text-[10px] rounded border transition-colors',
                  selectedCompound?.chemblId === c.chemblId
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20',
                )}
              >
                <span className="font-mono">{c.chemblId}</span>
                {c.preferredName && (
                  <span className="ml-1 text-slate-500">{c.preferredName.slice(0, 15)}</span>
                )}
                {c.pchemblValue !== null && (
                  <span className="ml-1 text-blue-400">pIC₅₀: {c.pchemblValue.toFixed(1)}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom info bar */}
      <div className="px-4 py-2 border-t border-teal-500/10 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex gap-4">
          {ligandBoundCount > 0 && (
            <span>
              <span className="text-teal-400">{ligandBoundCount}</span> ligand-bound structures
            </span>
          )}
          <span>
            Rendering: <span className="text-slate-400">Cartoon + Ball-and-Stick</span>
          </span>
        </div>
        <span className="text-slate-600">
          {selectedCompound ? 'Split view: protein + compound' : 'Click a compound to explore'}
        </span>
      </div>
    </div>
  );
}
