import { describe, expect, it } from 'vitest';
import { ROOMS } from '@/game/rooms';
import { newProgress, type Progress } from '@/game/save';
import { Sim } from '@/game/sim';
import { NO_INPUT, ROOM_H, ROOM_W, type Input, type RoomDef } from '@/game/types';

/** Doplní riadky stenami na rozmer miestnosti. */
function pad(rows: string[]): string[] {
  const out = rows.map((r) => r.padEnd(ROOM_W, '#'));
  while (out.length < ROOM_H) out.push('#'.repeat(ROOM_W));
  return out;
}

function room(
  layers: (string[] | null)[],
  extra: Partial<RoomDef> = {},
  id = 't',
  mx = 0,
): RoomDef {
  return { id, zone: 'kryo', mx, my: 0, layers: layers.map((l) => l && pad(l)), ...extra };
}

function sim(defs: RoomDef[], prog: Partial<Progress> = {}): Sim {
  return new Sim(defs, {
    ...newProgress(),
    room: defs[0]!.id,
    x: 1.5,
    y: 1.5,
    ...prog,
  });
}

const run = (s: Sim, input: Partial<Input>, seconds: number) => {
  const evs = [];
  for (let t = 0; t < seconds; t += 1 / 60) evs.push(...s.step(1 / 60, { ...NO_INPUT, ...input }));
  return evs;
};

describe('pohyb a presun', () => {
  it('chodí po podlahe a zastaví sa o stenu', () => {
    const s = sim([room([['#######', '#.....#', '#######']])]);
    run(s, { mx: 1 }, 2);
    expect(s.p.x).toBeGreaterThan(5.5);
    expect(s.p.x).toBeLessThan(6);
    run(s, { my: -1 }, 1);
    expect(s.p.y).toBeCloseTo(1.3, 1);
  });

  it('presun len do naladenej reality a na voľné miesto', () => {
    const s = sim(
      [
        room([
          ['#######', '#.....#', '#######'],
          ['#######', '##,,,,#', '#######'],
        ]),
      ],
      { unlocked: [0] },
    );
    expect(s.step(1 / 60, { ...NO_INPUT, shift: 1 })).toContainEqual({
      t: 'shiftBlocked',
      r: 1,
      why: 'locked',
    });
    s.prog.unlocked.push(1);
    expect(s.step(1 / 60, { ...NO_INPUT, shift: 1 })).toContainEqual({
      t: 'shiftBlocked',
      r: 1,
      why: 'solid',
    });
    run(s, { mx: 1 }, 0.4);
    expect(s.step(1 / 60, { ...NO_INPUT, shift: 1 })).toContainEqual({ t: 'shift', r: 1 });
    expect(s.p.r).toBe(1);
  });

  it('presun na miesto nepriateľa ho roztrhne', () => {
    const s = sim(
      [
        room([
          ['#######', '#.....#', '#######'],
          ['#######', '#,c,,,#', '#######'],
        ]),
      ],
      { unlocked: [0, 1], x: 2.5 },
    );
    const crawler = s.enemies[0]!;
    crawler.x = 2.5;
    crawler.y = 1.5;
    const ev = s.step(1 / 60, { ...NO_INPUT, shift: 1 });
    expect(ev.some((e) => e.t === 'telefrag')).toBe(true);
    expect(ev.some((e) => e.t === 'kill')).toBe(true);
    expect(s.enemies.length).toBe(0);
  });

  it('prechod do susednej miestnosti cez otvor', () => {
    // Otvor v riadku 1 na spoločnom okraji.
    const a = room([['#', '#' + '.'.repeat(ROOM_W - 1)]], {}, 'a', 0);
    const b = room([['#', '.....#']], {}, 'b', 1);
    const s = sim([a, b]);
    const ev = run(s, { mx: 1 }, 6);
    expect(ev).toContainEqual({ t: 'room', id: 'b', first: true });
    expect(s.room.def.id).toBe('b');
    expect(s.prog.visited).toContain('b');
  });
});

describe('boj', () => {
  it('strely zasiahnu len nepriateľa v rovnakej realite', () => {
    const def = room([
      ['#############', '#...........#', '#############'],
      ['#############', '#,,,,,,,c,,,#', '#############'],
    ]);
    const s = sim([def], { unlocked: [0, 1] });
    const enemy = s.enemies[0]!;
    enemy.t = 99;
    run(s, { fire: true, ax: 1 }, 1);
    expect(enemy.hp).toBe(enemy.max);
    s.step(1 / 60, { ...NO_INPUT, shift: 1 });
    run(s, { fire: true, ax: 1 }, 1.5);
    expect(s.enemies.length).toBe(0);
  });

  it('nepriateľská strela z inej reality neublíži, z rovnakej áno', () => {
    const s = sim([room([['#############', '#...........#', '#############'], null])], {
      unlocked: [0, 1],
    });
    s.fire({ x: 8.5, y: 1.5 }, 1, Math.PI, 6);
    run(s, {}, 2);
    expect(s.p.hp).toBe(s.prog.maxHp);
    s.fire({ x: 8.5, y: 1.5 }, 0, Math.PI, 6);
    const ev = run(s, {}, 2);
    expect(ev.some((e) => e.t === 'hurt')).toBe(true);
    expect(s.p.hp).toBe(s.prog.maxHp - 1);
  });

  it('úskok prejde cez strely', () => {
    const s = sim([room([['#############', '#...........#', '#############']])]);
    s.fire({ x: 3.2, y: 1.5 }, 0, Math.PI, 6);
    run(s, { mx: 1, dash: true }, 0.1);
    run(s, {}, 1);
    expect(s.p.hp).toBe(s.prog.maxHp);
  });

  it('smrť a obnova pri termináli', () => {
    const s = sim([room([['#########', '#.......#', '#T#######']])], { x: 1.5 });
    const ev = run(s, {}, 0.1);
    expect(ev).toContainEqual({ t: 'save' });
    run(s, { mx: 1 }, 1);
    s.p.hp = 1;
    s.fire({ x: 7.5, y: 1.5 }, 0, Math.PI, 6);
    expect(run(s, {}, 2)).toContainEqual({ t: 'death' });
    s.respawn();
    expect(s.p.hp).toBe(s.prog.maxHp);
    expect(s.p.x).toBeCloseTo(1.5, 1);
    expect(s.prog.deaths).toBe(1);
  });
});

describe('zariadenia a predmety', () => {
  it('spínač zasiahnutý strelou otvorí dvere v inej realite', () => {
    const s = sim(
      [
        room(
          [
            ['#########', '#.....S.#', '#.......#', '###D#####', '#.......#'],
            ['#########', '#,,,,,,,#', '#,,,,,,,#', '###D#####', '#,,,,,,,#'],
          ],
          {
            legend: {
              S: { k: 'switch', sig: 'x' },
              D: { k: 'door', sig: 'x', all: false },
            },
          },
        ),
      ],
      { unlocked: [0, 1], r: 1, x: 3.5, y: 2.5 },
    );
    expect(s.room.walkable(1, 3, 3)).toBe(false);
    s.step(1 / 60, { ...NO_INPUT, shift: 0 });
    const ev = run(s, { fire: true, ax: 1, ay: -0.33 }, 1);
    expect(ev.some((e) => e.t === 'switch')).toBe(true);
    expect(s.room.walkable(1, 3, 3)).toBe(true);
    expect(s.prog.signals).toContain('x');
  });

  it('čerpadlo vypustí vodu', () => {
    const def = room([['#######', '#..~~.#', '#######']], { drain: 'pump' });
    const s = sim([def]);
    expect(s.room.walkable(0, 3, 1)).toBe(false);
    s.prog.signals.push('pump');
    expect(s.room.walkable(0, 3, 1)).toBe(true);
  });

  it('liany prereže až rezačka', () => {
    const s = sim([room([['#########', '#...%...#', '#########']])]);
    const ev = run(s, { fire: true, ax: 1 }, 0.5);
    expect(ev.some((e) => e.t === 'needItem')).toBe(true);
    expect(s.room.tile(0, 4, 1)).toBe('%');
    s.prog.items.push('cutter');
    expect(run(s, { fire: true, ax: 1 }, 0.5).some((e) => e.t === 'cut')).toBe(true);
    expect(s.room.walkable(0, 4, 1)).toBe(true);
    expect(s.prog.cut).toContain('t:0:4:1');
  });

  it('zámok otvorí karta', () => {
    const s = sim([room([['#########', '#..L....#', '#########']])]);
    run(s, { mx: 1 }, 1);
    expect(s.p.x).toBeLessThan(3);
    s.prog.items.push('card');
    expect(run(s, { mx: 1 }, 1)).toContainEqual({ t: 'open' });
    run(s, { mx: 1 }, 1);
    expect(s.p.x).toBeGreaterThan(5);
  });

  it('lúč blokuje cestu, kým ho spínač nevypne', () => {
    const s = sim(
      [
        room([['#########', '#...E...#', '#.......#', '#.......#', '#...S...#', '#########']], {
          legend: {
            E: { k: 'emitter', dir: 2, sig: 'b' },
            S: { k: 'switch', sig: 'b' },
          },
        }),
      ],
      { x: 1.5, y: 2.5 },
    );
    expect(s.room.walkable(0, 4, 2)).toBe(false);
    run(s, { mx: 1 }, 2);
    expect(s.p.x).toBeLessThan(4);
    s.prog.signals.push('b');
    s.room.updateBeams();
    run(s, { mx: 1 }, 2);
    expect(s.p.x).toBeGreaterThan(5);
  });

  it('kryštál naladí realitu, záznam sa prečíta raz', () => {
    const s = sim(
      [
        room([['#########', '#..C.l..#', '#########']], {
          legend: { C: { k: 'crystal', reality: 2 }, l: { k: 'log', id: 'kryo-pod' } },
        }),
      ],
      {},
    );
    const ev = run(s, { mx: 1 }, 2);
    expect(ev).toContainEqual({ t: 'unlock', r: 2 });
    expect(ev).toContainEqual({ t: 'read', kind: 'log', id: 'kryo-pod' });
    expect(s.prog.unlocked).toContain(2);
    run(s, { mx: -1 }, 1);
    expect(run(s, { mx: 1 }, 2).some((e) => e.t === 'read')).toBe(false);
  });
});

/** Boj s bossom: hráč je nezraniteľný, mieri na bossa a presúva sa do jeho reality. */
function fight(id: string, seconds: number): { s: Sim; won: boolean } {
  const def = ROOMS.find((r) => r.id === id)!;
  const s = new Sim(ROOMS, {
    ...newProgress(),
    room: id,
    x: 10.5,
    y: 9.5,
    unlocked: [0, 1, 2, 3],
    items: ['lens'],
  });
  expect(s.room.def).toBe(def);
  for (let t = 0; t < seconds; t += 1 / 60) {
    s.p.inv = 1;
    const boss = s.enemies.find((e) => e.boss);
    if (!boss) return { s, won: true };
    const target = boss.kind === 'heart' ? boss.warn : boss.r;
    const ax = boss.x - s.p.x;
    const ay = boss.y - s.p.y;
    s.step(1 / 60, {
      ...NO_INPUT,
      ax,
      ay,
      fire: true,
      lens: true,
      shift: target !== s.p.r && s.p.shiftCd <= 0 ? target : null,
    });
  }
  return { s, won: !s.enemies.some((e) => e.boss) };
}

describe('bossovia', () => {
  it('strážca reaktora padne a nechá kryštál Nuly', () => {
    const { s, won } = fight('r5', 120);
    expect(won).toBe(true);
    expect(s.prog.bosses).toContain('warden');
    expect(s.room.ents.some((e) => e.spec.k === 'crystal' && s.room.present(e))).toBe(true);
    expect(s.room.walkable(0, 10, 11)).toBe(true);
  });

  it('srdce Prizmy padne a odhalí jadro', () => {
    const { s, won } = fight('c5', 180);
    expect(won).toBe(true);
    expect(s.room.ents.some((e) => e.spec.k === 'core' && s.room.present(e))).toBe(true);
  });
});

describe('nepriatelia v miestnostiach', () => {
  it.each(ROOMS.map((r) => r.id))('%s: 20 s bez chýb, nikto nevojde do steny', (id) => {
    const def = ROOMS.find((r) => r.id === id)!;
    const s = new Sim(ROOMS, {
      ...newProgress(),
      room: id,
      x: 10.5,
      y: 6.5,
      unlocked: [0, 1, 2, 3],
    });
    // Hráč stojí na voľnom mieste niekde v strede.
    outer: for (let y = 5; y < 8; y++)
      for (let x = 2; x < 19; x++)
        if (s.boxFree(0, x + 0.5, y + 0.5, 0.3)) {
          s.p.x = x + 0.5;
          s.p.y = y + 0.5;
          break outer;
        }
    for (let t = 0; t < 20; t += 1 / 30) {
      s.p.inv = 1;
      s.step(1 / 30, NO_INPUT);
      for (const e of s.enemies) {
        expect(Number.isFinite(e.x) && Number.isFinite(e.y), `${def.id} ${e.kind}`).toBe(true);
        expect(e.x > 0 && e.y > 0 && e.x < ROOM_W && e.y < ROOM_H, `${def.id} ${e.kind}`).toBe(
          true,
        );
        if (!e.boss && e.r >= 0)
          expect(s.boxFree(e.r, e.x, e.y, e.rad * 0.8, true), `${def.id} ${e.kind} v stene`).toBe(
            true,
          );
      }
    }
    expect(s.room.def.id).toBe(id);
  });
});
