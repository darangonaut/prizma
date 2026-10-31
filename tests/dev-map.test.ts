// Rýchle skúšanie mapy zo súboru: DEV_MAP=cesta.json npx vitest run tests/dev-map.test.ts
import { readFileSync } from 'node:fs';
import { test } from 'vitest';
import { solve } from '@/game/solver';
import type { SectorDef } from '@/game/types';
import { World } from '@/game/world';

test.skipIf(!process.env.DEV_MAP)(
  'dev map',
  () => {
    const { def, unlocked, need } = JSON.parse(readFileSync(process.env.DEV_MAP!, 'utf8')) as {
      def: SectorDef;
      unlocked: number[];
      need?: number[];
    };
    const sol = solve(def, unlocked, { limit: 3_000_000 });
    if (!sol) {
      process.stderr.write('BEZ RIEŠENIA\n');
      return;
    }
    const w = new World(def, unlocked);
    const n = { push: 0, rotate: 0, shift: 0 };
    for (const a of sol.steps)
      for (const e of 'm' in a ? w.move(a.m) : w.shift(a.s))
        if (e.t === 'push' || e.t === 'rotate' || e.t === 'shift') n[e.t]++;
    const path = sol.steps.map((a) => ('m' in a ? '^>v<'[a.m] : 'ABCD'[a.s])).join('');
    process.stderr.write(
      `${sol.steps.length} krokov (posuny ${n.push}, otočenia ${n.rotate}, presuny ${n.shift}), ${sol.explored} stavov\n${path}\n`,
    );
    for (const r of need ?? []) {
      const s2 = solve(
        def,
        unlocked.filter((u) => u !== r),
        { limit: 3_000_000 },
      );
      process.stderr.write(`bez reality ${r}: ${s2 ? 'IDE (' + s2.steps.length + ')' : 'nejde'}\n`);
    }
  },
  600_000,
);
