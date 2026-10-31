import { describe, expect, it } from 'vitest';
import { SECTORS, unlockedAt } from '@/game/sectors';
import { World } from '@/game/world';
import { en } from '@/ui/locales/en';
import { sk } from '@/ui/locales/sk';
import { cs } from '@/ui/locales/cs';
import { solve } from '@/game/solver';

describe('komory', () => {
  it.each(SECTORS.map((s, i) => [s.id, i] as const))(
    '%s sa dá prejsť',
    (_id, i) => {
      const s = SECTORS[i]!;
      const last = i === SECTORS.length - 1;
      const sol = solve(s, unlockedAt(i), { limit: 3_000_000 });
      expect(sol, `${s.id} nemá riešenie`).not.toBeNull();
      if (last) expect(new World(s).ents.some((e) => e.k === 'core')).toBe(true);
    },
    300_000,
  );

  it.each(SECTORS.map((s, i) => [s.id, i] as const))(
    '%s potrebuje každú naladenú realitu',
    (_id, i) => {
      const s = SECTORS[i]!;
      const unlocked = unlockedAt(i).filter((r) => r < s.layers.length);
      for (const r of s.needs ?? unlocked.slice(1)) {
        const sol = solve(
          s,
          unlocked.filter((u) => u !== r),
          { limit: 3_000_000 },
        );
        expect(sol, `${s.id} ide aj bez reality ${r}`).toBeNull();
      }
    },
    300_000,
  );

  it('identifikátory záznamov a ozvien sú jedinečné a majú texty vo všetkých jazykoch', () => {
    const ids: string[] = [];
    for (const s of SECTORS) {
      if (s.intro) ids.push(s.intro);
      for (const spec of Object.values(s.legend ?? {})) {
        if (spec.k === 'log' || spec.k === 'echo') ids.push(spec.id);
        if (spec.k === 'trigger') ids.push(spec.msg);
        if (spec.k === 'crystal') ids.push(`unlock-${spec.reality}`);
      }
    }
    const records = ids.filter(
      (id) => !id.startsWith('unlock-') && !id.endsWith('-intro') && !id.startsWith('hint-'),
    );
    expect(new Set(records).size).toBe(records.length);
    for (const loc of [en, sk, cs]) for (const id of ids) expect(loc.story[id], id).toBeTruthy();
  });

  it('kryštály odomknú reality postupne a posledná komora má všetky štyri', () => {
    expect(unlockedAt(0)).toEqual([0]);
    expect(unlockedAt(SECTORS.length - 1)).toEqual([0, 1, 2, 3]);
  });
});

describe('preklady', () => {
  it('všetky jazyky majú rovnaké kľúče', () => {
    for (const loc of [sk, cs]) {
      expect(Object.keys(loc.ui).sort()).toEqual(Object.keys(en.ui).sort());
      expect(Object.keys(loc.story).sort()).toEqual(Object.keys(en.story).sort());
      for (const [id, e] of Object.entries(loc.story))
        expect(e.pages.length, id).toBe(en.story[id]!.pages.length);
    }
  });
});
