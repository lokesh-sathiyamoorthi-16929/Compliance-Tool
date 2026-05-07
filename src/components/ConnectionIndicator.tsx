import { useEffect, useState } from 'react';
import { health } from '../api/health';
import { isDemoMode } from '../config/env';

type ConnectionState = 'connected' | 'demo' | 'unreachable';

function Dot({ color }: { color: string }) {
  return <span className={`h-2 w-2 rounded-full ${color}`} aria-hidden="true" />;
}

export default function ConnectionIndicator() {
  const demoMode = isDemoMode();
  const [state, setState] = useState<ConnectionState>(demoMode ? 'demo' : 'connected');

  useEffect(() => {
    if (demoMode) {
      setState('demo');
      return;
    }

    let active = true;
    let intervalId: number | null = null;

    const checkHealth = async () => {
      try {
        await health();
        if (active) {
          setState('connected');
        }
      } catch {
        if (active) {
          setState('unreachable');
        }
      }
    };

    void checkHealth();
    intervalId = window.setInterval(() => {
      void checkHealth();
    }, 30_000);

    return () => {
      active = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [demoMode]);

  if (state === 'demo') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
        <Dot color="bg-amber-500" />
        Demo Mode
      </span>
    );
  }

  if (state === 'unreachable') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800"
        title="Backend unreachable. Start it with: docker-compose up -d && npm run dev"
      >
        <Dot color="bg-rose-500" />
        Backend unreachable
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
      <Dot color="bg-emerald-500" />
      Connected
    </span>
  );
}
