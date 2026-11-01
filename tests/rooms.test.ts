import { describe, expect, it } from 'vitest';
import { DEFAULT_LEGEND, FLOOR, layerOf, specFor } from '@/game/room';
import { ROOMS } from '@/game/rooms';
import { ROOM_H, ROOM_W, REALITIES, type RoomDef } from '@/game/types';
import { en } from '@/ui/locales/en';
import { sk } from '@/ui/locales/sk';
import { cs } from '@/ui/locales/cs';
import { explore } from './explore';

const TERRAIN = new Set(['#', ' ', '~', '%', 'x', ...FLOOR]);

/** Trieda okrajovej dlaždice: prechod musí sedieť so susedom. */
function edgeClass(def: RoomDef, r: number, x: number, y: number): string {
  const ch = layerOf(def, r)[y]![x]!;
  if (FLOOR.includes(ch) || !TERRAIN.has(ch)) return 'floor';
  if (ch === '~') return 'water';
  return 'solid';
}

describe('mapa stanice', () => {
  it('miestnosti majú správne rozmery a známe znaky', () => {
    for (const def of ROOMS) {
      expect(def.layers.length, def.id).toBeLessThanOrEqual(REALITIES);
      def.layers.forEach((rows, r) => {
        if (!rows) return;
        expect(rows.length, `${def.id} vrstva ${r}`).toBe(ROOM_H);
        rows.forEach((row, y) => {
          expect(row.length, `${def.id} vrstva ${r} riadok ${y}`).toBe(ROOM_W);
          for (const ch of row)
            if (!TERRAIN.has(ch))
              expect(specFor(def, ch), `${def.id}: neznámy znak '${ch}'`).toBeTruthy();
        });
      });
      for (const ch of Object.keys(def.legend ?? {}))
        expect(TERRAIN.has(ch), `${def.id}: legenda prekrýva terén '${ch}'`).toBe(false);
    }
  });

  it('jedinečné id a polohy', () => {
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(ROOMS.length);
    expect(new Set(ROOMS.map((r) => `${r.mx},${r.my}`)).size).toBe(ROOMS.length);
  });

  it('okraje susedov sedia v každej realite a otvory nevedú do prázdna', () => {
    const at = new Map(ROOMS.map((r) => [`${r.mx},${r.my}`, r]));
    for (const def of ROOMS)
      for (let r = 0; r < REALITIES; r++) {
        const east = at.get(`${def.mx + 1},${def.my}`);
        const south = at.get(`${def.mx},${def.my + 1}`);
        for (let y = 0; y < ROOM_H; y++) {
          const a = edgeClass(def, r, ROOM_W - 1, y);
          if (east) expect(a, `${def.id}→${east.id} r${r} y${y}`).toBe(edgeClass(east, r, 0, y));
          else expect(a, `${def.id} východ r${r} y${y}`).toBe('solid');
          if (!at.get(`${def.mx - 1},${def.my}`))
            expect(edgeClass(def, r, 0, y), `${def.id} západ r${r} y${y}`).toBe('solid');
        }
        for (let x = 0; x < ROOM_W; x++) {
          const a = edgeClass(def, r, x, ROOM_H - 1);
          if (south) expect(a, `${def.id}→${south.id} r${r} x${x}`).toBe(edgeClass(south, r, x, 0));
          else expect(a, `${def.id} juh r${r} x${x}`).toBe('solid');
          if (!at.get(`${def.mx},${def.my - 1}`))
            expect(edgeClass(def, r, x, 0), `${def.id} sever r${r} x${x}`).toBe('solid');
        }
      }
  });

  it('príbeh a texty existujú vo všetkých jazykoch', () => {
    const ids = new Set<string>();
    for (const def of ROOMS) {
      if (def.intro) ids.add(def.intro);
      for (const s of Object.values({ ...DEFAULT_LEGEND, ...def.legend }))
        if (s.k === 'log' || s.k === 'echo' || s.k === 'trigger')
          ids.add(s.k === 'trigger' ? s.msg : s.id);
      expect(en.ui[`room_${def.id}`], `názov ${def.id}`).toBeTruthy();
    }
    for (const id of ids)
      for (const [lang, loc] of Object.entries({ en, sk, cs }))
        expect(loc.story[id], `${lang}: ${id}`).toBeTruthy();
    for (const loc of [sk, cs]) {
      expect(Object.keys(loc.ui).sort()).toEqual(Object.keys(en.ui).sort());
      expect(Object.keys(loc.story).sort()).toEqual(Object.keys(en.story).sort());
    }
  });
});

describe('postup hrou', () => {
  const full = explore();

  it('všetko sa dá nájsť a hra sa dá dohrať', () => {
    expect([...full.rooms].sort()).toEqual(ROOMS.map((r) => r.id).sort());
    expect(full.logs.size).toBe(12);
    expect(full.echoes.size).toBe(8);
    expect(full.health.size).toBe(4);
    expect([...full.items].sort()).toEqual(['card', 'cutter', 'lens']);
    expect([...full.unlocked].sort()).toEqual([0, 1, 2, 3]);
    expect(full.bosses.has('warden') && full.bosses.has('heart')).toBe(true);
    expect(full.core).toBe(true);
  });

  it.each([
    ['crystal:1', 'h1'],
    ['card', 'y1'],
    ['crystal:2', 'y3'],
    ['cutter', 'y4'],
    ['lens', 'r4'],
    ['boss:warden', 'c1'],
    ['crystal:3', 'c3'],
  ])('bez %s sa nedá dostať do %s', (ban, room) => {
    expect(explore([ban]).rooms.has(room)).toBe(false);
  });

  it('kartu treba hľadať až po spustení čerpadla', () => {
    const f = explore(['sig:pump']);
    expect(f.items.has('card')).toBe(false);
    expect(f.health.has('hp-h2')).toBe(false);
  });
});
