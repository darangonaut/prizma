// Pomocný výpis pre ladenie máp: DEV_SECTOR=id|all npx vitest run tests/dev-solve.test.ts
import { test } from 'vitest';
import { SECTORS, unlockedAt } from '@/game/sectors';
import { solve } from '@/game/solver';
import { World } from '@/game/world';

test.skipIf(!process.env.DEV_SECTOR)(
  'dev solve',
  () => {
    for (const [i, s] of SECTORS.entries()) {
      if (process.env.DEV_SECTOR !== 'all' && s.id !== process.env.DEV_SECTOR) continue;
      const t = Date.now();
      const sol = solve(s, unlockedAt(i), { limit: 3_000_000 });
      if (!sol) {
        process.stderr.write(`${s.id} BEZ RIEŠENIA ${Date.now() - t} ms\n`);
        continue;
      }
      const w = new World(s, unlockedAt(i));
      const n = { push: 0, rotate: 0, shift: 0 };
      for (const a of sol.steps)
        for (const e of 'm' in a ? w.move(a.m) : w.shift(a.s))
          if (e.t === 'push' || e.t === 'rotate' || e.t === 'shift') n[e.t]++;
      const path = sol.steps.map((a) => ('m' in a ? '^>v<'[a.m] : 'ABCD'[a.s])).join('');
      process.stderr.write(
        `${s.id}: ${sol.steps.length} krokov (posuny ${n.push}, otočenia ${n.rotate}, presuny ${n.shift}), ${sol.explored} stavov, ${Date.now() - t} ms\n  ${path}\n`,
      );
    }
  },
  600_000,
);
