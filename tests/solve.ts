// Riešič úrovne na mriežke: všetky kópie sa naraz posunú o dlaždicu (každá zrkadlene), kópia pred
// stenou ostane stáť, voliteľne jedna kópia zakotví. Úskok = skok o dve dlaždice (ponad bodec).
// Bodce zabíjajú; pohyblivé nebezpečenstvá (píly, lasery, veže, prenasledovatelia, mihotavá
// podlaha) riešič ignoruje.
//
// Úplné prehľadanie štyroch otvorených okien je priveľké, preto riešič postupuje hltavo: z aktuálneho
// stavu hľadá do šírky najbližší stav, v ktorom niektorá kópia zoberie úlomok, a pokračuje odtiaľ.
// Nájdené riešenie je skutočné riešenie (počet ťahov je horný odhad najkratšieho).
import { isSolid, waveOf } from '@/game/sim';
import { SIZE, mirror, type LevelDef } from '@/game/types';

export interface Solution {
  /** Počet ťahov nájdeného riešenia a počet preskúmaných stavov. */
  steps: number;
  states: number;
}

export interface SolveOptions {
  anchor?: boolean;
  dash?: boolean;
  /** Najviac stavov pri hľadaní jedného ďalšieho úlomku. */
  limit?: number;
}

const DIRS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function solve(level: LevelDef, opts: SolveOptions = {}): Solution | null {
  const { anchor = true, dash = true, limit = 1_500_000 } = opts;
  const panels = level.panels.map((p) => p.map.join(''));
  const n = panels.length;
  const shards: { p: number; i: number; wave: number }[] = [];
  let pos: number[] = [];
  panels.forEach((map, p) => {
    for (let i = 0; i < SIZE * SIZE; i++) {
      if (map[i] === '@') pos[p] = i;
      const w = waveOf(map[i]!);
      if (w >= 0) shards.push({ p, i, wave: w });
    }
  });
  const moves: number[][] = [];
  for (const [dx, dy] of DIRS)
    moves.push(
      level.panels.map((pd) => {
        const [mx, my] = mirror(pd.r, dx, dy);
        return my * SIZE + mx;
      }),
    );
  const solid = panels.map((m) => [...m].map(isSolid));
  const spike = panels.map((m) => [...m].map((ch) => ch === '^'));
  const encode = (ps: number[]) => ps.reduce((k, v) => k * 128 + v, 0);
  const decode = (k: number) => {
    const ps = new Array<number>(n);
    for (let p = n - 1; p >= 0; p--) {
      ps[p] = k % 128;
      k = Math.floor(k / 128);
    }
    return ps;
  };

  const taken = new Set<number>();
  let steps = 0;
  let states = 0;
  const wave = () => Math.min(...shards.filter((_, k) => !taken.has(k)).map((s) => s.wave));
  const grab = (ps: number[]) => {
    let got = false;
    for (;;) {
      const w = wave();
      let more = false;
      shards.forEach((s, k) => {
        if (!taken.has(k) && s.wave === w && ps[s.p] === s.i) {
          taken.add(k);
          more = got = true;
        }
      });
      if (!more || taken.size === shards.length) return got;
    }
  };
  grab(pos);

  while (taken.size < shards.length) {
    // Do šírky k najbližšiemu stavu, kde kópia stojí na úlomku aktuálnej vlny.
    const w = wave();
    const goal = shards.filter((s, k) => !taken.has(k) && s.wave === w);
    const hit = (ps: number[]) => goal.some((s) => ps[s.p] === s.i);
    const seen = new Set<number>([encode(pos)]);
    let frontier = [encode(pos)];
    let found: number[] | null = null;
    for (let depth = 1; frontier.length && !found; depth++) {
      const next: number[] = [];
      for (const key of frontier) {
        const cur = decode(key);
        for (const mv of moves)
          for (let len = 1; len <= (dash ? 2 : 1) && !found; len++)
            for (let a = -1; a < (anchor && n > 1 ? n : 0); a++) {
              const np = cur.map((i, p) => {
                if (p === a) return i;
                let at = i;
                for (let s = 0; s < len; s++) {
                  if (solid[p]![at + mv[p]!]) break;
                  at += mv[p]!;
                }
                return at;
              });
              if (np.some((i, p) => spike[p]![i])) continue;
              const k = encode(np);
              if (seen.has(k)) continue;
              seen.add(k);
              if (hit(np)) {
                found = np;
                steps += depth;
                break;
              }
              next.push(k);
            }
        if (found) break;
      }
      if (seen.size > limit) break;
      frontier = next;
    }
    states += seen.size;
    if (!found) return null;
    pos = found;
    grab(pos);
  }
  return { steps, states };
}
