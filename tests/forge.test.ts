// Kováčňa hádaniek: z predlohy s `?` (stena/podlaha) a `!` (prekážka reality/podlaha)
// hľadá horolezeckým algoritmom variant s čo najťažším riešením.
// Spustenie: FORGE=id FORGE_ITER=400 npx vitest run tests/forge.test.ts
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { TEMPLATES, type Template } from './templates';
import { World } from '@/game/world';
import { solve } from '@/game/solver';
import type { SectorDef } from '@/game/types';

const FLOOR = ['.', ',', '"', ':'];
const HAZARD = ['#', '~', '%', ' '];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

interface Cell {
  r: number;
  y: number;
  x: number;
  /** Možnosti: index 0 je podlaha. */
  opts: string[];
}

/** `?` stena, `!` prekážka reality, `$` zrkadlo, `&` bedňa. */
function options(kind: string, r: number): string[] | null {
  const f = FLOOR[r]!;
  if (kind === '?') return [f, '#'];
  if (kind === '!') return [f, HAZARD[r]!];
  if (kind === '$') return [f, '/', 'N', '#'];
  if (kind === '&') return [f, 'c', '#'];
  return null;
}

function fill(t: SectorDef, cells: Cell[], vals: number[]): SectorDef {
  const layers = t.layers.map((rows) => rows.map((row) => row.split('')));
  cells.forEach((c, i) => {
    layers[c.r]![c.y]![c.x] = c.opts[vals[i]!]!;
  });
  return { ...t, layers: layers.map((rows) => rows.map((r) => r.join(''))) };
}

/** Hodnotenie rozloženia; `cur` je skóre, ktoré treba prekonať (drahé kontroly sa inak preskočia). */
function score(def: SectorDef, tpl: Template, cur = -Infinity): number {
  const unlocked = tpl.unlocked;
  const need = tpl.need ?? unlocked.slice(1);
  const sol = solve(def, unlocked, { limit: 400_000 });
  // Neriešiteľné: čím menej prekážok, tým bližšie k riešeniu.
  if (!sol)
    return (
      -1000 -
      def.layers
        .join('')
        .split('')
        .filter((c) => '#~% '.includes(c)).length
    );
  // Prehranie riešenia: ťahy, ktoré menia hádanku, sú cennejšie než chôdza.
  const w = new World(def, unlocked);
  let pushes = 0;
  let rotations = 0;
  let shifts = 0;
  for (const a of sol.steps) {
    const ev = 'm' in a ? w.move(a.m) : w.shift(a.s);
    for (const e of ev) {
      if (e.t === 'push') pushes++;
      if (e.t === 'rotate') rotations++;
      if (e.t === 'shift') shifts++;
    }
  }
  let penalty = 0;
  if (tpl.minRotations && rotations < tpl.minRotations)
    penalty += 200 * (tpl.minRotations - rotations);
  if (tpl.minPushes && pushes < tpl.minPushes) penalty += 200 * (tpl.minPushes - pushes);
  const base =
    sol.steps.length * 0.5 +
    pushes * 4 +
    rotations * 4 +
    shifts * 3 +
    Math.log2(sol.explored) * 1.5;
  if (base - penalty < cur) return base - penalty - 1;
  // Bez každej z potrebných realít to nesmie ísť (inak trest, aby sa dalo stúpať).
  for (const r of need) {
    if (
      solve(
        def,
        unlocked.filter((u) => u !== r),
        { limit: 400_000 },
      )
    )
      penalty += 500;
    if (base - penalty < cur) return base - penalty;
  }
  return base - penalty;
}

test.skipIf(!process.env.FORGE)(
  'forge',
  () => {
    const id = process.env.FORGE!;
    const tpl = TEMPLATES[id];
    if (!tpl) throw new Error('neznáma predloha ' + id);
    const cells: Cell[] = [];
    tpl.def.layers.forEach((rows, r) =>
      rows.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          const opts = options(ch, r);
          if (opts) cells.push({ r, y, x, opts });
        }),
      ),
    );
    const iters = Number(process.env.FORGE_ITER ?? 300);
    const seeds = Number(process.env.FORGE_SEEDS ?? 3);
    const seed0 = Number(process.env.FORGE_SEED0 ?? 1);
    let best = { s: -Infinity, def: tpl.def };
    for (let seed = seed0; seed < seed0 + seeds; seed++) {
      const rand = rng(seed * 7919 + 13);
      const pick = (c: Cell) =>
        rand() < (tpl.density ?? 0.35) ? 1 + Math.floor(rand() * (c.opts.length - 1)) : 0;
      let bits = cells.map(pick);
      let cur = score(fill(tpl.def, cells, bits), tpl);
      for (let i = 0; i < iters; i++) {
        const next = [...bits];
        const flips = 1 + Math.floor(rand() * 3);
        for (let f = 0; f < flips; f++) {
          const j = Math.floor(rand() * cells.length);
          next[j] =
            (next[j]! + 1 + Math.floor(rand() * (cells[j]!.opts.length - 1))) %
            cells[j]!.opts.length;
        }
        const s = score(fill(tpl.def, cells, next), tpl, cur);
        if (s >= cur) {
          bits = next;
          cur = s;
        }
        if (i % 25 === 0 && process.env.FORGE_OUT) {
          const d = fill(tpl.def, cells, bits);
          writeFileSync(
            process.env.FORGE_OUT,
            `seed ${seed} iter ${i} score ${cur.toFixed(1)}\n` +
              d.layers.map((rows) => rows.map((r) => `      '${r}',`).join('\n')).join('\n\n') +
              '\n',
          );
        }
      }
      process.stderr.write(`seed ${seed}: ${cur.toFixed(1)}\n`);
      if (cur > best.s) best = { s: cur, def: fill(tpl.def, cells, bits) };
    }
    if (best.s < 0) throw new Error('nenašlo sa riešiteľné rozloženie');
    const sol = solve(best.def, tpl.unlocked);
    const path = sol?.steps.map((a) => ('m' in a ? '^>v<'[a.m] : 'ABCD'[a.s])).join('');
    process.stderr.write(
      `\nNAJLEPŠIE ${best.s.toFixed(1)} — ${sol?.steps.length} krokov: ${path}\n`,
    );
    best.def.layers.forEach((rows) => {
      process.stderr.write('    [\n' + rows.map((r) => `      '${r}',`).join('\n') + '\n    ],\n');
    });
  },
  3_600_000,
);
