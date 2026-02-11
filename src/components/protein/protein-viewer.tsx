'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    $3Dmol: {
      createViewer: (
        element: HTMLElement,
        config: Record<string, unknown>,
      ) => Viewer3D;
    };
  }
}

interface Viewer3D {
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

interface ProteinViewerProps {
  pdbId?: string;
  uniprotId?: string;
  highlightResidues?: number[];
  colorScheme?: 'secondary-structure' | 'plddt' | 'hydrophobicity';
  showLigands?: boolean;
  className?: string;
  height?: number;
  autoRotate?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

let scriptLoaded = false;
let scriptLoadPromise: Promise<void> | null = null;

function load3DmolScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    if (window.$3Dmol) { scriptLoaded = true; resolve(); return; }
    const existing = document.querySelector('script[src*="3Dmol"]');
    if (existing) {
      existing.addEventListener('load', () => { scriptLoaded = true; resolve(); });
      existing.addEventListener('error', () => reject(new Error('Script failed')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.4/3Dmol-min.js';
    script.onload = () => { scriptLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load 3Dmol.js'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function ProteinViewer({
  pdbId,
  uniprotId,
  highlightResidues = [],
  colorScheme = 'secondary-structure',
  showLigands = true,
  className,
  height = 500,
  autoRotate = true,
  onLoad,
  onError,
}: ProteinViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer3D | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Initializing viewer...');
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<'pdb' | 'alphafold' | null>(null);

  // Use refs for unstable props to prevent infinite re-render loops
  const highlightRef = useRef(highlightResidues);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  highlightRef.current = highlightResidues;
  onLoadRef.current = onLoad;
  onErrorRef.current = onError;

  const initViewer = useCallback(async () => {
    if (!containerRef.current) return;

    // Wait for container to have dimensions
    if (!containerRef.current.offsetWidth || !containerRef.current.offsetHeight) {
      await new Promise((r) => requestAnimationFrame(r));
      if (!containerRef.current?.offsetWidth) return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setLoadingStage('Loading rendering engine...');

      await load3DmolScript();

      const $3Dmol = window.$3Dmol;
      if (!$3Dmol) throw new Error('3Dmol.js failed to initialize');

      // Try PDB first, fall back to AlphaFold if 404
      let pdbData: string | null = null;
      let source: 'pdb' | 'alphafold' = 'pdb';

      if (pdbId) {
        setLoadingStage(`Fetching PDB: ${pdbId.toUpperCase()}...`);
        const res = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
        if (res.ok) {
          const text = await res.text();
          // For very large PDBs (>1.5MB), use only first chain to avoid browser crash
          pdbData = text.length > 1_500_000
            ? text.split('\n').filter(l => !l.startsWith('ATOM') && !l.startsWith('HETATM') || l.substring(21, 22) === 'A' || l.startsWith('HETATM')).join('\n')
            : text;
          source = 'pdb';
        }
        if (!pdbData && uniprotId) {
          setLoadingStage(`Trying AlphaFold: ${uniprotId}...`);
          const afRes = await fetch(`https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v6.pdb`);
          if (afRes.ok) { pdbData = await afRes.text(); source = 'alphafold'; }
        }
      } else if (uniprotId) {
        setLoadingStage(`Fetching AlphaFold: ${uniprotId}...`);
        const res = await fetch(`https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v6.pdb`);
        if (res.ok) { pdbData = await res.text(); source = 'alphafold'; }
      }

      if (!pdbData) {
        throw new Error('No structure available (PDB and AlphaFold both failed)');
      }

      setActiveSource(source);
      setLoadingStage('Building molecular model...');

      // Clear previous viewer if any
      if (viewerRef.current) {
        viewerRef.current.clear();
        viewerRef.current.removeAllModels();
      }

      const viewer = $3Dmol.createViewer(containerRef.current, {
        backgroundColor: '#0F0F1E',
        antialias: true,
        disableFog: false,
      });

      viewerRef.current = viewer;
      viewer.addModel(pdbData, 'pdb');

      setLoadingStage('Applying cinematic rendering...');

      // Apply coloring
      if (colorScheme === 'secondary-structure') {
        viewer.setStyle({ ss: 'h' }, {
          cartoon: { color: '#8B5CF6', thickness: 0.4, opacity: 1.0 },
        });
        viewer.setStyle({ ss: 's' }, {
          cartoon: { color: '#6366F1', arrows: true, thickness: 0.4, opacity: 1.0 },
        });
        viewer.setStyle({ ss: 'c' }, {
          cartoon: { color: '#6B7280', thickness: 0.2, opacity: 0.9 },
        });
        viewer.setStyle({ ss: '' }, {
          cartoon: { color: '#6B7280', thickness: 0.2, opacity: 0.9 },
        });
      } else if (colorScheme === 'plddt') {
        viewer.setStyle({}, {
          cartoon: { colorfunc: null, colorscheme: 'bfactor', thickness: 0.4 },
        });
      } else if (colorScheme === 'hydrophobicity') {
        viewer.setStyle({}, {
          cartoon: { colorscheme: 'rasmol', thickness: 0.4 },
        });
      }

      // Highlight binding site residues
      const highlights = highlightRef.current;
      if (highlights.length > 0) {
        viewer.setStyle({ resi: highlights }, {
          cartoon: { color: '#FF6B00', thickness: 0.4 },
          stick: { color: '#FF6B00', radius: 0.15, opacity: 1.0 },
        });
      }

      // Show bound ligands
      if (showLigands) {
        viewer.setStyle({ hetflag: true, resn: ['HOH', 'WAT'], invert: true }, {
          stick: { radius: 0.18 },
          sphere: { scale: 0.3 },
        });
      }

      viewer.zoomTo();
      if (autoRotate) viewer.spin('y', 0.5);
      viewer.render();

      setIsLoading(false);
      setLoadingStage('');
      onLoadRef.current?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load structure';
      setError(msg);
      setIsLoading(false);
      onErrorRef.current?.(msg);
    }
    // Only re-run when the structure identity or visual settings change (all stable primitives)
  }, [pdbId, uniprotId, colorScheme, showLigands, autoRotate]);

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

  return (
    <div className={cn('relative rounded-xl overflow-hidden', className)}>
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #0F0F1E 0%, #1A1A3E 100%)',
            height: `${height}px`,
          }}
        >
          <div className="relative">
            <div className="w-24 h-24 relative">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-violet-400/50 animate-pulse" />
              <div className="absolute inset-4 rounded-full bg-violet-500/20 animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-violet-300 animate-pulse">{loadingStage}</p>
          <div className="mt-2 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full animate-loading-bar" />
          </div>
        </div>
      )}

      {error && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #0F0F1E 0%, #1A1A3E 100%)',
            height: `${height}px`,
          }}
        >
          <div className="text-center">
            <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
            <p className="text-sm text-red-400 mb-2">Structure unavailable</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">{error}</p>
            <button
              onClick={() => initViewer()}
              className="mt-3 px-3 py-1 text-xs bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        style={{ width: '100%', height: `${height}px` }}
        className="bg-[#0F0F1E]"
      />

      {!isLoading && !error && (
        <div className="absolute top-3 left-3 flex gap-2">
          {activeSource === 'pdb' && pdbId && (
            <span className="px-2 py-0.5 text-xs font-mono bg-black/60 backdrop-blur-sm rounded text-violet-300 border border-violet-500/20">
              PDB: {pdbId.toUpperCase()}
            </span>
          )}
          {activeSource === 'alphafold' && uniprotId && (
            <span className="px-2 py-0.5 text-xs font-mono bg-black/60 backdrop-blur-sm rounded text-blue-300 border border-blue-500/20">
              AlphaFold: {uniprotId}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
