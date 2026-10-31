import type { Dir, SectorDef } from '@/game/types';
import { World, type Snap } from '@/game/world';

export type Action = { m: Dir } | { s: number };

export interface Solution {
  steps: Action[];
  explored: number;
}

/**
 * Prehľadávanie do šírky cez všetky stavy komory (pozícia, realita, bedne, zrkadlá, páky,
 * predmety). Vráti najkratšiu cestu k výťahu, alebo null, ak sektor nemá riešenie.
 * `goal` môže cieľ nahradiť (napr. „stojí pri jadre“).
 */
export function solve(
  def: SectorDef,
  unlocked: number[] = [0],
  opts: { limit?: number; goal?: (w: World) => boolean; inv?: string[]; from?: Snap } = {},
): Solution | null {
  const limit = opts.limit ?? 2_000_000;
  const world = new World(def, unlocked, opts.inv ?? []);
  if (opts.from) world.restore(opts.from);
  const actions: Action[] = [0, 1, 2, 3].map((m) => ({ m: m as Dir }));
  for (let r = 0; r < world.layers; r++) actions.push({ s: r });
  const start = world.snap();
  const seen = new Map<string, { prev: string | null; act: Action | null }>();
  const snaps = new Map<string, ReturnType<World['snap']>>();
  const k0 = world.key();
  seen.set(k0, { prev: null, act: null });
  snaps.set(k0, start);
  let queue = [k0];
  while (queue.length) {
    const next: string[] = [];
    for (const k of queue) {
      const s = snaps.get(k)!;
      for (const a of actions) {
        world.restore(s);
        const ev = 'm' in a ? world.move(a.m) : world.shift(a.s);
        const done =
          ev.some((e) => e.t === 'exit' || e.t === 'core') || (opts.goal?.(world) ?? false);
        const nk = world.key();
        if (seen.has(nk) && !done) continue;
        if (!seen.has(nk)) seen.set(nk, { prev: k, act: a });
        if (done) {
          const steps: Action[] = [a];
          let cur: string | null = k;
          while (cur) {
            const node: { prev: string | null; act: Action | null } = seen.get(cur)!;
            if (node.act) steps.unshift(node.act);
            cur = node.prev;
          }
          return { steps, explored: seen.size };
        }
        snaps.set(nk, world.snap());
        next.push(nk);
        if (seen.size > limit) return null;
      }
      snaps.delete(k);
    }
    queue = next;
  }
  return null;
}
