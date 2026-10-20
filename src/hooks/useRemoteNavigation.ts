import { useEffect } from 'react';

export function useRemoteNavigation(onBack: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.startsWith('Arrow')) {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
        const controls = [...document.querySelectorAll<HTMLElement>('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])')].filter(el => el.getClientRects().length > 0);
        if (controls.length < 2) return;
        const current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const origin = current?.getBoundingClientRect();
        const direction = event.key === 'ArrowUp' ? 'up' : event.key === 'ArrowDown' ? 'down' : event.key === 'ArrowLeft' ? 'left' : 'right';
        if (!origin) { controls[0]?.focus(); event.preventDefault(); return; }
        const cx = origin.left + origin.width / 2, cy = origin.top + origin.height / 2;
        const candidates = controls.filter(el => el !== current).map(el => {
          const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
          const dx = x - cx, dy = y - cy;
          const ahead = direction === 'up' ? dy < -2 : direction === 'down' ? dy > 2 : direction === 'left' ? dx < -2 : dx > 2;
          return { el, ahead, primary: direction === 'left' || direction === 'right' ? Math.abs(dx) : Math.abs(dy), secondary: direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx) };
        });
        const scored = candidates.filter(c => c.ahead).sort((a, b) => (a.primary + a.secondary * 1.8) - (b.primary + b.secondary * 1.8));
        (scored[0]?.el ?? controls[0])?.focus(); event.preventDefault(); return;
      }
      if (event.key === 'Escape' || event.key === 'Backspace') {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
        event.preventDefault(); onBack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onBack]);
}
