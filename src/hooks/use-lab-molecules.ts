'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LabMolecule } from '@/lib/types/lab';

const STORAGE_KEY = 'targetradar-lab-molecules';
const MAX_MOLECULES = 20;

export function useLabMolecules() {
  const [molecules, setMolecules] = useState<LabMolecule[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMolecules(JSON.parse(stored) as LabMolecule[]);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const addMolecule = useCallback((molecule: LabMolecule) => {
    setMolecules((prev) => {
      const filtered = prev.filter((m) => m.id !== molecule.id);
      const updated = [molecule, ...filtered].slice(0, MAX_MOLECULES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage unavailable
      }
      return updated;
    });
  }, []);

  const removeMolecule = useCallback((id: string) => {
    setMolecules((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage unavailable
      }
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setMolecules([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return { molecules, addMolecule, removeMolecule, clearAll };
}
