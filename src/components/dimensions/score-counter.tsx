'use client';

import { useState, useEffect } from 'react';

interface ScoreCounterProps {
  target: number;
  animate?: boolean;
  color: string;
  duration?: number;
  className?: string;
}

export function ScoreCounter({ target, animate = true, color, duration = 1200, className }: ScoreCounterProps) {
  const [current, setCurrent] = useState(animate ? 0 : target);

  useEffect(() => {
    if (!animate) {
      setCurrent(target);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startValue + (target - startValue) * eased));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    const delay = setTimeout(() => requestAnimationFrame(tick), 300);
    return () => {
      cancelled = true;
      clearTimeout(delay);
    };
  }, [target, animate, duration]);

  return (
    <span className={className ?? "text-lg font-bold font-mono"} style={{ color }}>
      {current}
    </span>
  );
}
