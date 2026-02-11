'use client';

import { useEffect } from 'react';

export function Warmup() {
  useEffect(() => {
    // Pre-warm demo caches (EGFR, KRAS, BRCA1) in the background
    fetch('/api/warmup').catch(() => {});
  }, []);

  return null;
}
