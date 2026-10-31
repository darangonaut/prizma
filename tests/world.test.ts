import { describe, expect, it } from 'vitest';
import type { SectorDef } from '@/game/types';
import { World } from '@/game/world';

const def = (
  layers: string[][],
  legend: SectorDef['legend'] = {},
  extra: Partial<SectorDef> = {},
): SectorDef => ({
  id: 't',
  zone: 'kryo',
  layers,
  legend,
  ...extra,
});

describe('pohyb a presun medzi realitami', () => {
  it('chodí po podlahe a zastaví sa o stenu', () => {
    const w = new World(def([['#####', '#@..#', '#####']]));
    expect(w.move(1)[0]).toEqual({ t: 'step' });
    expect(w.px).toBe(2);
    w.move(1);
    expect(w.move(1)).toContainEqual({ t: 'blocked', why: 'wall' });
    expect(w.px).toBe(3);
  });

  it('presun do inej reality len na voľné miesto', () => {
    const w = new World(
      def([
        ['#####', '#@..#', '#####'],
        ['#####', '#~,.#', '#####'],
      ]),
      [0, 1],
    );
    expect(w.shift(1)).toContainEqual({ t: 'shiftBlocked', r: 1, why: 'solid' });
    w.move(1);
    expect(w.shift(1)).toContainEqual({ t: 'shift', r: 1 });
    expect(w.pr).toBe(1);
  });

  it('zamknutá realita sa nedá použiť', () => {
    const w = new World(
      def([
        ['###', '#@#', '###'],
        ['###', '#.#', '###'],
      ]),
    );
    expect(w.shift(1)).toContainEqual({ t: 'shiftBlocked', r: 1, why: 'locked' });
  });

  it('kryštál odomkne realitu', () => {
    const w = new World(
      def(
        [
          ['####', '#@Y#', '####'],
          ['####', '#..#', '####'],
        ],
        { Y: { k: 'crystal', reality: 1 } },
      ),
    );
    expect(w.move(1)).toContainEqual({ t: 'unlock', r: 1 });
    expect(w.unlocked.has(1)).toBe(true);
  });
});

describe('bedne, dosky a dvere', () => {
  it('bedňa na doske otvorí dvere v inej realite', () => {
    const w = new World(
      def(
        [
          ['######', '#@.d.#', '######'],
          ['######', '#.c1.#', '######'],
        ],
        { d: { k: 'door', open: ['s'] }, '1': { k: 'plate', sig: 's' } },
      ),
      [0, 1],
    );
    w.move(1);
    expect(w.move(1)).toContainEqual({ t: 'blocked', why: 'door' });
    w.move(3);
    w.shift(1);
    const ev = w.move(1);
    expect(ev).toContainEqual({ t: 'push', twin: false });
    expect(ev).toContainEqual({ t: 'doors', opened: 1, closed: 0 });
    w.shift(0);
    w.move(1);
    expect(w.px).toBe(3);
  });

  it('previazaná bedňa sa hýbe vo všetkých realitách, ak je všade miesto', () => {
    const layers = [
      ['######', '#@E..#', '######'],
      ['######', '#,,,#', '######'].map((r) => r.padEnd(6, '#')),
    ];
    const w = new World(def(layers), [0, 1]);
    // V Hlbine je na x=4 stena → bedňa sa posunie len o jedno.
    expect(w.move(1)).toContainEqual({ t: 'push', twin: true });
    expect(w.move(1)).toContainEqual({ t: 'blocked', why: 'crate' });
    w.shift(1);
    expect(w.entsAt(1, 3, 1)[0]?.k).toBe('crate');
  });

  it('kartou sa odomkne zámok', () => {
    const w = new World(
      def([['#######', '#@k.L.#', '#######']], {
        k: { k: 'item', item: 'card' },
        L: { k: 'lock', item: 'card' },
      }),
    );
    w.move(1);
    w.move(1);
    expect(w.move(1)).toContainEqual({ t: 'open' });
    w.move(1);
    expect(w.px).toBe(4);
  });

  it('čerpadlo vypustí vodu', () => {
    const w = new World(
      def([['######', '#@p~.#', '######']], { p: { k: 'plate', sig: 'pump' } }, { drain: 'pump' }),
    );
    w.move(1);
    w.move(1);
    expect(w.px).toBe(3);
    // Keď hráč zíde z dosky, voda sa vráti — ale stojaceho nevytlačí.
    w.move(1);
    expect(w.px).toBe(4);
    expect(w.move(3)).toContainEqual({ t: 'blocked', why: 'wall' });
  });

  it('liany sa dajú vyrúbať len rezačkou', () => {
    const w = new World(
      def([['######', '#@r%.#', '######']], { r: { k: 'item', item: 'cutter' } }),
    );
    w.move(1);
    expect(w.move(1)).toContainEqual({ t: 'cut' });
    w.move(1);
    expect(w.px).toBe(3);
  });
});

describe('lúče', () => {
  const room = (mirror: string) =>
    def([['#######', '#@....#', `#e..${mirror}.#`, '#...r.#', '###d###', '#..>..#', '#######']], {
      e: { k: 'emitter', dir: 1 },
      r: { k: 'receiver', sig: 'a' },
      d: { k: 'door', open: ['a'] },
    });

  it('lúč blokuje cestu a zrkadlo ho odrazí do prijímača', () => {
    const w = new World(room('N'));
    expect(w.beamAt(0, 2, 2)).toBe(true);
    expect(w.signal('a')).toBe(true);
    w.move(1);
    expect(w.move(2)).toContainEqual({ t: 'blocked', why: 'beam' });
    // Otočenie zrkadla zhora: lúč ide hore a prijímač zhasne.
    w.move(1);
    w.move(1);
    const ev = w.move(2);
    expect(ev).toContainEqual({ t: 'rotate' });
    expect(ev).toContainEqual({ t: 'receiver', lit: false });
    expect(w.beamAt(0, 4, 1)).toBe(true);
    expect(w.signal('a')).toBe(false);
  });

  it('fázové okno prenesie lúč do inej reality', () => {
    const w = new World(
      def(
        [
          ['#######', '#@....#', '#e.p..#', '#######'],
          ['#######', '#.....#', '#....r#', '#######'],
        ],
        { e: { k: 'emitter', dir: 1 }, p: { k: 'phase', to: 1 }, r: { k: 'receiver', sig: 'a' } },
      ),
      [0, 1],
    );
    expect(w.beamAt(0, 2, 2)).toBe(true);
    expect(w.beamAt(1, 4, 2)).toBe(true);
    expect(w.beamAt(0, 4, 2)).toBe(false);
    expect(w.signal('a')).toBe(true);
  });
});

describe('späť', () => {
  it('snap/restore vráti celý stav', () => {
    const w = new World(def([['######', '#@c..#', '######']]));
    const s = w.snap();
    w.move(1);
    expect(w.ents[0]!.x).toBe(3);
    w.restore(s);
    expect(w.ents[0]!.x).toBe(2);
    expect(w.px).toBe(1);
  });

  it('holografický záznam sa prehrá len raz', () => {
    const w = new World(def([['#####', '#@t.#', '#####']], { t: { k: 'log', id: 'x' } }));
    expect(w.move(1)).toContainEqual({ t: 'read', kind: 'log', id: 'x' });
    w.move(1);
    expect(w.move(3).some((e) => e.t === 'read')).toBe(false);
  });
});
