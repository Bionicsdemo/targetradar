'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'targetradar-recent-searches';
const MAX_RECENT = 8;

interface RecentSearch {
  gene: string;
  timestamp: number;
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSearches(JSON.parse(stored) as RecentSearch[]);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const addSearch = useCallback((gene: string) => {
    setSearches((prev) => {
      const filtered = prev.filter((s) => s.gene !== gene);
      const updated = [{ gene, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage unavailable
      }
      return updated;
    });
  }, []);

  return { searches, addSearch };
}
