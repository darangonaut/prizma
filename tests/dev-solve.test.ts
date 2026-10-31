// Pomocný výpis pre ladenie máp: DEV_SECTOR=id npx vitest run tests/dev-solve.test.ts
import { test } from 'vitest';
import { SECTORS, unlockedAt } from '@/game/sectors';
import { solve } from '@/game/solver';

test.skipIf(!process.env.DEV_SECTOR)(
  'dev solve',
  () => {
    for (const [i, s] of SECTORS.entries()) {
      if (process.env.DEV_SECTOR !== 'all' && s.id !== process.env.DEV_SECTOR) continue;
      const t = Date.now();
      const sol = solve(s, unlockedAt(i), { limit: 3_000_000 });
      const path = sol?.steps.map((a) => ('m' in a ? '^>v<'[a.m] : 'ABCD'[a.s])).join('');
      process.stderr.write(
        [
          s.id,
          sol ? `${sol.steps.length} krokov, ${sol.explored} stavov` : 'BEZ RIEŠENIA',
          `${Date.now() - t} ms`,
          path,
        ].join(' ') + '\n',
      );
    }
  },
  600_000,
);
