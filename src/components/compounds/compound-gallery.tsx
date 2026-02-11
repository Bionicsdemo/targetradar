'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getPhaseColor, getPhaseLabel } from '@/lib/constants';
import type { CompoundDetail } from '@/lib/types/target-profile';

interface CompoundGalleryProps {
  compounds: CompoundDetail[];
  className?: string;
}

declare global {
  interface Window {
    $3Dmol: {
      createViewer: (
        element: HTMLElement,
        config: Record<string, unknown>,
      ) => MolViewer3D;
    };
  }
}

interface MolViewer3D {
  addModel: (data: string, format: string) => unknown;
  setStyle: (sel: Record<string, unknown>, style: Record<string, unknown>) => void;
  zoomTo: () => void;
  spin: (axis: string, speed: number) => void;
  render: () => void;
  clear: () => void;
  removeAllModels: () => void;
  stopAnimate: () => void;
  resize: () => void;
}

/* ── Client-side SMILES renderer via SmilesDrawer (instant, no server calls) ── */
function SmilesRenderer({
  smiles,
  width = 280,
  height = 200,
  theme = 'dark',
  onError,
}: {
  smiles: string;
  width?: number;
  height?: number;
  theme?: 'dark' | 'light';
  onError?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !smiles) return;
    setError(false);

    let cancelled = false;

    async function render() {
      try {
        const SmilesDrawer = (await import('smiles-drawer')).default;
        if (cancelled || !canvasRef.current) return;

        const drawer = new SmilesDrawer.Drawer({ width, height });
        SmilesDrawer.parse(
          smiles,
          (tree: unknown) => {
            if (!cancelled && canvasRef.current) {
              drawer.draw(tree, canvasRef.current, theme);
            }
          },
          () => {
            if (!cancelled) { setError(true); onError?.(); }
          },
        );
      } catch {
        if (!cancelled) { setError(true); onError?.(); }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [smiles, width, height, theme, onError]);

  if (error || !smiles) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-[10px] text-slate-500">Structure unavailable</span>
      </div>
    );
  }

  return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />;
}

/* ── Structure image: PubChem PNG primary → SmilesDrawer fallback → placeholder ── */
function StructureImage({
  compound,
  className,
  size = 300,
}: {
  compound: CompoundDetail;
  className?: string;
  imgClassName?: string;
  size?: number;
  theme?: 'dark' | 'light';
}) {
  const [imgError, setImgError] = useState(false);
  const [smilesDrawerFailed, setSmilesDrawerFailed] = useState(false);
  const compoundId = compound.chemblId;

  // Reset errors when compound changes
  useEffect(() => {
    setImgError(false);
    setSmilesDrawerFailed(false);
  }, [compoundId]);

  const isBiologic = compound.moleculeType === 'Antibody' || compound.moleculeType === 'Protein';

  // Case 1: Antibody/Protein — biologic icon
  if (isBiologic) {
    return (
      <div className={cn('flex flex-col items-center justify-center text-center gap-1.5', className)}>
        <svg className="w-8 h-8 text-slate-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
        <span className="text-[10px] text-slate-400">{compound.moleculeType}</span>
      </div>
    );
  }

  if (!compound.smiles) {
    return (
      <div className={cn('flex flex-col items-center justify-center text-center gap-1.5', className)}>
        <svg className="w-6 h-6 text-slate-400/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
        <span className="text-[10px] text-slate-400">No structure</span>
      </div>
    );
  }

  const imageUrl = `/api/compound/image?smiles=${encodeURIComponent(compound.smiles)}&size=${size}`;

  // Case 2: PubChem/CDK image (server-side, reliable)
  if (!imgError) {
    return (
      <img
        src={imageUrl}
        alt={compound.preferredName ?? compound.chemblId}
        className="max-h-full max-w-full object-contain"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  // Case 3: PubChem failed → try SmilesDrawer (client-side)
  if (!smilesDrawerFailed) {
    return (
      <SmilesRenderer
        smiles={compound.smiles}
        width={size}
        height={Math.round(size * 0.7)}
        theme="dark"
        onError={() => setSmilesDrawerFailed(true)}
      />
    );
  }

  // Case 4: Everything failed
  return (
    <div className={cn('flex flex-col items-center justify-center text-center gap-1.5', className)}>
      <span className="text-[10px] text-slate-500">Structure unavailable</span>
    </div>
  );
}

/* ── 3D Molecule mini-viewer ── */
function MoleculeViewer3D({
  smiles,
  height = 300,
}: {
  smiles: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<MolViewer3D | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current) return;
      // Wait for container to have dimensions
      if (!containerRef.current.offsetWidth || !containerRef.current.offsetHeight) {
        await new Promise((r) => requestAnimationFrame(r));
        if (cancelled || !containerRef.current?.offsetWidth) return;
      }
      setStatus('loading');

      // Global timeout — if anything takes longer than 12s, give up
      const timeout = setTimeout(() => {
        if (!cancelled) {
          cancelled = true;
          setStatus('error');
          setErrorMsg('3D loading timed out');
        }
      }, 12000);

      try {
        // Ensure 3Dmol.js is loaded
        if (!window.$3Dmol) {
          await new Promise<void>((resolve, reject) => {
            if (window.$3Dmol) { resolve(); return; }
            const existing = document.querySelector('script[src*="3Dmol"]');
            if (existing) {
              existing.addEventListener('load', () => resolve());
              existing.addEventListener('error', () => reject(new Error('Script failed')));
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.4/3Dmol-min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load 3Dmol.js'));
            document.head.appendChild(script);
          });
        }

        if (cancelled) return;

        // Fetch 3D SDF from our proxy with timeout
        const res = await fetch(`/api/lab/sdf3d?smiles=${encodeURIComponent(smiles)}`, {
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) throw new Error('No 3D data available');
        const data = (await res.json()) as { sdf: string; is3d: boolean };
        if (!data.sdf?.trim()) throw new Error('Empty 3D data');

        if (cancelled) return;

        // Clear previous
        if (viewerRef.current) {
          viewerRef.current.clear();
          viewerRef.current.removeAllModels();
        }

        const viewer = window.$3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#0F0F1E',
          antialias: true,
        });
        viewerRef.current = viewer;

        viewer.addModel(data.sdf, 'sdf');
        viewer.setStyle({}, {
          stick: { radius: 0.15, colorscheme: 'Jmol' },
          sphere: { scale: 0.25, colorscheme: 'Jmol' },
        });
        viewer.zoomTo();
        if (data.is3d) {
          viewer.spin('y', 0.8);
        }
        viewer.render();

        clearTimeout(timeout);
        setStatus('ready');
      } catch (err) {
        clearTimeout(timeout);
        if (!cancelled) {
          setStatus('error');
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load 3D');
        }
      }
    }

    init();
    return () => {
      cancelled = true;
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
  }, [smiles]);

  return (
    <div className="relative rounded-lg overflow-hidden">
      {status === 'loading' && (
        <div
          className="flex flex-col items-center justify-center"
          style={{ height: `${height}px`, background: 'linear-gradient(135deg, #0F0F1E 0%, #1A1A3E 100%)' }}
        >
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-2" />
          <span className="text-xs text-violet-300">Loading 3D structure...</span>
        </div>
      )}
      {status === 'error' && (
        <div
          className="flex items-center justify-center text-center"
          style={{ height: `${height}px`, background: '#0F0F1E' }}
        >
          <span className="text-xs text-slate-500">{errorMsg}</span>
        </div>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: `${height}px`, display: status === 'loading' || status === 'error' ? 'none' : 'block' }}
      />
    </div>
  );
}

/* ── Fullscreen structure lightbox with 2D/3D toggle ── */
function StructureLightbox({
  compound,
  onClose,
}: {
  compound: CompoundDetail;
  onClose: () => void;
}) {
  const [view, setView] = useState<'2d' | '3d'>('2d');

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  const has3D = !!compound.smiles;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--surface-0)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* 2D/3D toggle */}
        {has3D && (
          <div className="absolute top-3 left-3 z-10 flex gap-1 bg-black/40 backdrop-blur-sm rounded-lg p-0.5">
            <button
              onClick={() => setView('2d')}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors',
                view === '2d' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              2D
            </button>
            <button
              onClick={() => setView('3d')}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors',
                view === '3d' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:text-white'
              )}
            >
              3D
            </button>
          </div>
        )}

        {/* Structure view area */}
        <div className="min-h-[360px]">
          {view === '2d' ? (
            <div className="flex items-center justify-center p-8 min-h-[360px] bg-white rounded-t-2xl">
              {compound.smiles ? (
                <img
                  src={`/api/compound/image?smiles=${encodeURIComponent(compound.smiles)}&size=500`}
                  alt={compound.preferredName ?? compound.chemblId}
                  className="max-h-[340px] max-w-full object-contain"
                />
              ) : (
                <StructureImage
                  compound={compound}
                  className="min-h-[300px]"
                  size={500}
                  theme="dark"
                />
              )}
            </div>
          ) : (
            compound.smiles && <MoleculeViewer3D smiles={compound.smiles} height={360} />
          )}
        </div>

        {/* Compound info footer */}
        <div className="p-5 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {compound.preferredName ?? compound.chemblId}
              </h3>
              <span className="text-xs font-mono text-slate-500">{compound.chemblId}</span>
            </div>
            <span
              className="px-2 py-1 text-xs font-semibold rounded"
              style={{
                backgroundColor: getPhaseColor(compound.maxPhase) + '20',
                color: getPhaseColor(compound.maxPhase),
              }}
            >
              {getPhaseLabel(compound.maxPhase)}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-[11px]">
            {compound.molecularWeight !== null && (
              <div className="text-slate-500">MW <span className="text-slate-300 font-mono">{compound.molecularWeight.toFixed(1)}</span></div>
            )}
            {compound.alogp !== null && (
              <div className="text-slate-500">LogP <span className="text-slate-300 font-mono">{compound.alogp.toFixed(2)}</span></div>
            )}
            {compound.psa !== null && (
              <div className="text-slate-500">TPSA <span className="text-slate-300 font-mono">{compound.psa.toFixed(1)}</span></div>
            )}
            {compound.hba !== null && (
              <div className="text-slate-500">HBA <span className="text-slate-300 font-mono">{compound.hba}</span></div>
            )}
            {compound.hbd !== null && (
              <div className="text-slate-500">HBD <span className="text-slate-300 font-mono">{compound.hbd}</span></div>
            )}
            {compound.numRo5Violations !== null && (
              <div className="text-slate-500">RO5 <span className={cn('font-mono', compound.numRo5Violations <= 1 ? 'text-emerald-400' : 'text-amber-400')}>{compound.numRo5Violations}</span></div>
            )}
            {compound.aromaticRings !== null && (
              <div className="text-slate-500">Arom <span className="text-slate-300 font-mono">{compound.aromaticRings}</span></div>
            )}
            {compound.rotatableBonds !== null && (
              <div className="text-slate-500">RotB <span className="text-slate-300 font-mono">{compound.rotatableBonds}</span></div>
            )}
            {compound.pchemblValue !== null && (
              <div className="text-slate-500">pChEMBL <span className="text-blue-400 font-mono">{compound.pchemblValue.toFixed(2)}</span></div>
            )}
            <div className="text-slate-500">Type <span className="text-slate-300">{compound.moleculeType}</span></div>
          </div>

          {compound.smiles && (
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-slate-600">SMILES</span>
              <p className="text-[10px] font-mono text-slate-500 break-all leading-relaxed mt-0.5">
                {compound.smiles}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small badges ── */
function RO5Badge({ violations }: { violations: number | null }) {
  if (violations === null) return null;
  const color = violations <= 1 ? 'bg-emerald-500' : violations === 2 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <span className="flex items-center gap-1 text-[10px] text-slate-400">
      <span className={cn('w-1.5 h-1.5 rounded-full', color)} />
      RO5: {violations}
    </span>
  );
}

function CompoundCard({
  compound,
  onImageClick,
}: {
  compound: CompoundDetail;
  onImageClick: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const phaseColor = getPhaseColor(compound.maxPhase);

  return (
    <div
      className="rounded-xl bg-[var(--surface-1)] border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-300 cursor-pointer"
      style={{ borderLeftWidth: '3px', borderLeftColor: phaseColor }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Structure image — click opens lightbox */}
      <div
        className="h-32 bg-white flex items-center justify-center border-b border-white/5 p-2 relative group"
        onClick={(e) => {
          e.stopPropagation();
          onImageClick();
        }}
      >
        <StructureImage
          compound={compound}
          className="h-full w-full"
          size={300}
          theme="dark"
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        {/* ChEMBL ID on image overlay */}
        <span className="absolute bottom-1.5 left-2 text-[9px] font-mono text-white/80 drop-shadow-sm pointer-events-none">
          {compound.chemblId}
        </span>
        {/* Expand hint on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-70 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-300">{compound.chemblId}</span>
          <span
            className="px-1.5 py-0.5 text-[10px] font-semibold rounded"
            style={{
              backgroundColor: phaseColor + '20',
              color: phaseColor,
            }}
          >
            {getPhaseLabel(compound.maxPhase)}
          </span>
        </div>

        {compound.preferredName && (
          <p className="text-xs text-slate-400 truncate">{compound.preferredName}</p>
        )}

        <div className="flex items-center justify-between text-[10px]">
          <div className="flex gap-3 text-slate-500">
            {compound.molecularWeight !== null && (
              <span>MW: <span className="text-slate-400">{compound.molecularWeight.toFixed(0)}</span></span>
            )}
            {compound.alogp !== null && (
              <span>LogP: <span className="text-slate-400">{compound.alogp.toFixed(1)}</span></span>
            )}
          </div>
          <RO5Badge violations={compound.numRo5Violations} />
        </div>

        {compound.pchemblValue !== null && (
          <div className="text-[10px] text-slate-500">
            pChEMBL: <span className="text-blue-400 font-mono">{compound.pchemblValue.toFixed(1)}</span>
            {compound.activityType && <span className="ml-1">({compound.activityType})</span>}
          </div>
        )}

        {/* Expanded properties — full scientific detail */}
        {expanded && (
          <div className="pt-2 mt-2 border-t border-white/5 animate-fade-in-up text-[10px] space-y-3">
            {/* Molecular Properties Table */}
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Molecular Properties</div>
              {[
                { label: 'Molecule Type', value: compound.moleculeType },
                compound.molecularWeight !== null ? { label: 'Molecular Weight', value: `${compound.molecularWeight.toFixed(2)} Da` } : null,
                compound.alogp !== null ? { label: 'LogP (lipophilicity)', value: compound.alogp.toFixed(2) } : null,
                compound.psa !== null ? { label: 'TPSA (polar surface)', value: `${compound.psa.toFixed(1)} A\u00B2` } : null,
                compound.hba !== null ? { label: 'H-bond Acceptors', value: String(compound.hba) } : null,
                compound.hbd !== null ? { label: 'H-bond Donors', value: String(compound.hbd) } : null,
                compound.aromaticRings !== null ? { label: 'Aromatic Rings', value: String(compound.aromaticRings) } : null,
                compound.rotatableBonds !== null ? { label: 'Rotatable Bonds', value: String(compound.rotatableBonds) } : null,
                compound.numRo5Violations !== null ? { label: 'RO5 Violations', value: `${compound.numRo5Violations} ${compound.numRo5Violations <= 1 ? '(drug-like)' : compound.numRo5Violations === 2 ? '(borderline)' : '(non-drug-like)'}` } : null,
              ]
                .filter((row): row is { label: string; value: string } => row !== null)
                .map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      'flex items-center justify-between px-2 py-1 rounded-sm',
                      i % 2 === 0 ? 'bg-white/[0.03]' : '',
                    )}
                  >
                    <span className="text-slate-500">{row.label}</span>
                    <span className="text-slate-300 font-mono">{row.value}</span>
                  </div>
              ))}
            </div>

            {/* Bioactivity / Potency */}
            {compound.pchemblValue !== null && (
              <div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Bioactivity</div>
                <div className="bg-white/[0.03] rounded-sm px-2 py-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">pChEMBL value</span>
                    <span className="text-blue-400 font-mono font-semibold">{compound.pchemblValue.toFixed(2)}</span>
                  </div>
                  {compound.activityType && (
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-500">Assay type</span>
                      <span className="text-slate-300 font-mono">{compound.activityType}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-slate-500">Potency class</span>
                    <span className={cn('font-mono', compound.pchemblValue >= 8 ? 'text-emerald-400' : compound.pchemblValue >= 7 ? 'text-blue-400' : compound.pchemblValue >= 6 ? 'text-amber-400' : 'text-slate-400')}>
                      {compound.pchemblValue >= 8 ? 'Highly potent' : compound.pchemblValue >= 7 ? 'Potent' : compound.pchemblValue >= 6 ? 'Moderate' : 'Weak'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Clinical Phase detail */}
            <div>
              <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">Development Status</div>
              <div className="bg-white/[0.03] rounded-sm px-2 py-1.5 flex items-center justify-between">
                <span className="text-slate-500">Clinical phase</span>
                <span className="font-mono" style={{ color: phaseColor }}>
                  {compound.maxPhase === 4 ? 'Approved Drug' : compound.maxPhase === 3 ? 'Phase III' : compound.maxPhase === 2 ? 'Phase II' : compound.maxPhase === 1 ? 'Phase I' : 'Preclinical'}
                </span>
              </div>
            </div>

            {/* SMILES */}
            {compound.smiles && (
              <div>
                <div className="text-[9px] text-slate-600 uppercase tracking-wider mb-1">SMILES</div>
                <p className="font-mono text-slate-500 break-all leading-relaxed bg-white/[0.03] rounded-sm px-2 py-1">
                  {compound.smiles}
                </p>
              </div>
            )}

            {/* External link to ChEMBL */}
            <a
              href={`https://www.ebi.ac.uk/chembl/compound_report_card/${compound.chemblId}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View on ChEMBL
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M3.5 8.5l5-5m0 0H4m4.5 0V8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        )}

        {/* Click to expand indicator */}
        {!expanded && (
          <div className="flex items-center justify-center pt-1">
            <svg
              className="w-3.5 h-3.5 text-slate-600 animate-pulse"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export function CompoundGallery({ compounds, className }: CompoundGalleryProps) {
  const [lightboxCompound, setLightboxCompound] = useState<CompoundDetail | null>(null);

  if (compounds.length === 0) return null;

  return (
    <>
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Compound Landscape</h2>
          <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
            {compounds.length} compounds
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {compounds.map((compound, i) => (
            <div key={compound.chemblId} className={`animate-fade-in-up stagger-${Math.min(i + 1, 8)}`}>
              <CompoundCard
                compound={compound}
                onImageClick={() => setLightboxCompound(compound)}
              />
            </div>
          ))}
        </div>
      </div>

      {lightboxCompound && (
        <StructureLightbox
          compound={lightboxCompound}
          onClose={() => setLightboxCompound(null)}
        />
      )}
    </>
  );
}
