'use client';

import { useState, useEffect, useCallback } from 'react';

interface WatchlistTarget {
  gene: string;
  approvedName: string;
  overallScore: number;
  tdl: string; // Tclin, Tchem, Tbio, Tdark
  addedAt: number;
}

const STORAGE_KEY = 'targetradar-watchlist';
const MAX_ITEMS = 20;

export type { WatchlistTarget };

export function useWatchlist() {
  const [targets, setTargets] = useState<WatchlistTarget[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTargets(JSON.parse(stored) as WatchlistTarget[]);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const addTarget = useCallback((target: WatchlistTarget) => {
    setTargets((prev) => {
      const filtered = prev.filter((t) => t.gene !== target.gene);
      const updated = [target, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage unavailable
      }
      return updated;
    });
  }, []);

  const removeTarget = useCallback((gene: string) => {
    setTargets((prev) => {
      const updated = prev.filter((t) => t.gene !== gene);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage unavailable
      }
      return updated;
    });
  }, []);

  const isInWatchlist = useCallback(
    (gene: string) => targets.some((t) => t.gene === gene),
    [targets]
  );

  return { targets, addTarget, removeTarget, isInWatchlist };
}
