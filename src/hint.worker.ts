/// <reference lib="webworker" />
import { SECTORS } from '@/game/sectors';
import { solve } from '@/game/solver';
import type { Snap } from '@/game/world';

/** Nápoveda: najkratšie riešenie z aktuálneho stavu, mimo hlavného vlákna. */
self.onmessage = (
  e: MessageEvent<{ id: number; index: number; unlocked: number[]; snap: Snap }>,
) => {
  const { id, index, unlocked, snap } = e.data;
  const def = SECTORS[index];
  const sol = def ? solve(def, unlocked, { from: snap, limit: 1_500_000 }) : null;
  self.postMessage({ id, steps: sol ? sol.steps : null });
};
