import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/game/levels';
import { emptySave, recordWin } from '@/game/save';
import { CHASER_WAKE, Sim, blinkPhase } from '@/game/sim';
import { mirror, type Ev, type LevelDef } from '@/game/types';

const OPEN = [
  '###########',
  '#.........#',
  '#.........#',
  '#.........#',
  '#.........#',
  '#....@....#',
  '#.........#',
  '#.........#',
  '#.........#',
  '#........*#',
  '###########',
];

/** Úroveň z okien; prázdne miesta v mape doplní otvorená miestnosť. */
function level(...panels: { r: number; map?: string[] }[]): LevelDef {
  return {
    id: 'test',
    chapter: 0,
    par: 10,
    panels: panels.map((p) => ({ r: p.r, map: p.map ?? OPEN })),
  };
}

function run(sim: Sim, time: number, mx = 0, my = 0, dash = false): Ev[] {
  const ev: Ev[] = [];
  let first = true;
  for (let t = 0; t < time - 1e-9; t += 1 / 60) {
    ev.push(...sim.step(1 / 60, { mx, my, dash: dash && first }));
    first = false;
  }
  return ev;
}

describe('zrkadlenie', () => {
  it('každá realita zrkadlí pohyb inak', () => {
    expect(mirror(0, 1, 0)).toEqual([1, 0]);
    expect(mirror(1, 1, 0)).toEqual([-1, 0]);
    expect(mirror(1, 0, 1)).toEqual([0, 1]);
    expect(mirror(2, 1, 0)).toEqual([0, 1]);
    expect(mirror(2, 0, -1)).toEqual([-1, 0]);
    expect(mirror(3, 1, 0)).toEqual([0, -1]);
    expect(mirror(3, 0, 1)).toEqual([-1, 0]);
  });

  it('jeden vstup posunie štyri kópie štyrmi smermi', () => {
    const sim = new Sim(level({ r: 0 }, { r: 1 }, { r: 2 }, { r: 3 }));
    run(sim, 0.4, 1, 0);
    const [p, h, j, n] = sim.panels;
    expect(p!.x).toBeGreaterThan(6);
    expect(h!.x).toBeLessThan(5);
    expect(j!.y).toBeGreaterThan(6);
    expect(n!.y).toBeLessThan(5);
    expect(j!.x).toBeCloseTo(5.5);
  });
});

describe('pohyb', () => {
  it('kópia pred stenou stojí, kým sa ostatné hýbu', () => {
    const wall = [...OPEN];
    wall[5] = '#####@....#';
    const sim = new Sim(level({ r: 0, map: wall }, { r: 1 }));
    run(sim, 0.5, -1, 0);
    expect(sim.panels[0]!.x).toBeCloseTo(5.3, 2);
    expect(sim.panels[1]!.x).toBeGreaterThan(6.5);
  });

  it('zakotvená kópia stojí, ostatné sa hýbu', () => {
    const sim = new Sim(level({ r: 0 }, { r: 1 }));
    expect(sim.toggleAnchor(1)).toEqual([{ t: 'anchor', p: 1 }]);
    run(sim, 0.4, 1, 0);
    expect(sim.panels[0]!.x).toBeGreaterThan(6);
    expect(sim.panels[1]!.x).toBeCloseTo(5.5);
    sim.toggleAnchor(1);
    expect(sim.anchor).toBe(-1);
  });

  it('s jedinou kópiou sa kotviť nedá', () => {
    const sim = new Sim(level({ r: 0 }));
    expect(sim.toggleAnchor(0)).toEqual([]);
  });

  it('kĺže do chodby širokej jednu dlaždicu aj pri nepresnom zarovnaní', () => {
    const map = [...OPEN];
    map[4] = '#####.#####';
    map[3] = '#####.#####';
    const sim = new Sim(level({ r: 0, map }));
    sim.panels[0]!.x = 5.75;
    run(sim, 0.8, 0, -1);
    expect(sim.panels[0]!.y).toBeLessThan(3.6);
  });
});

describe('nebezpečenstvá', () => {
  it('bodce zabijú, úskok ich preskočí', () => {
    const map = [...OPEN];
    map[4] = '#^^^^^^^^^#';
    const a = new Sim(level({ r: 0, map }));
    const ev = run(a, 0.5, 0, -1);
    expect(ev.find((e) => e.t === 'death')).toMatchObject({ cause: 'spike' });
    const b = new Sim(level({ r: 0, map }));
    run(b, 0.25, 0, -1, true);
    expect(b.dead).toBe(false);
    expect(b.panels[0]!.y).toBeLessThan(4);
  });

  it('smrť jednej kópie ukončí pokus všetkým', () => {
    const map = [...OPEN];
    map[5] = '#...^@....#';
    const sim = new Sim(level({ r: 0 }, { r: 1, map }));
    // Hlbina zrkadlí: vstup vpravo ju pošle vľavo na bodce.
    const ev = run(sim, 0.5, 1, 0);
    expect(ev.filter((e) => e.t === 'death')).toEqual([expect.objectContaining({ p: 1 })]);
    expect(sim.dead).toBe(true);
    expect(sim.step(1, { mx: 1, my: 0, dash: false })).toEqual([]);
  });

  it('píla chodí od steny ku stene a zabije', () => {
    const map = [...OPEN];
    map[5] = '#h...@....#';
    const sim = new Sim(level({ r: 0, map }));
    const ev = run(sim, 3);
    expect(ev.find((e) => e.t === 'death')).toMatchObject({ cause: 'saw' });
  });

  it('laser zabije len keď svieti', () => {
    const map = [...OPEN];
    map[5] = '>....@....#';
    const sim = new Sim(level({ r: 0, map }));
    run(sim, 1.7);
    expect(sim.dead).toBe(false);
    const ev = run(sim, 0.3);
    expect(ev.find((e) => e.t === 'death')).toMatchObject({ cause: 'laser' });
  });

  it('veža strieľa na kópiu', () => {
    const map = [...OPEN];
    map[5] = 'T....@....#';
    const sim = new Sim(level({ r: 0, map }));
    const ev = run(sim, 4);
    expect(ev.some((e) => e.t === 'fire')).toBe(true);
    expect(ev.find((e) => e.t === 'death')).toMatchObject({ cause: 'shot' });
  });

  it('utopenec sa prebudí a ide za kópiou', () => {
    const map = [...OPEN];
    map[1] = '#g........#';
    const sim = new Sim(level({ r: 0, map }));
    run(sim, CHASER_WAKE - 0.1);
    expect(sim.panels[0]!.chasers[0]!.x).toBeCloseTo(1.5);
    const ev = run(sim, 6);
    expect(ev.find((e) => e.t === 'death')).toMatchObject({ cause: 'chaser' });
  });

  it('mihotavá podlaha na chvíľu zmizne', () => {
    const map = [...OPEN];
    map[5] = '#...:@....#';
    const sim = new Sim(level({ r: 0, map }));
    sim.panels[0]!.x = 4.5;
    let t = 0;
    while (blinkPhase(':', t) !== 'on') t += 0.05;
    run(sim, t - 0.1);
    expect(sim.dead).toBe(false);
    const ev = run(sim, 0.3);
    expect(ev.find((e) => e.t === 'death')).toMatchObject({ cause: 'void' });
  });
});

describe('úlomky', () => {
  it('po zobratí všetkých je úroveň hotová', () => {
    const map = [...OPEN];
    map[9] = '#.........#';
    map[5] = '#....@.*..#';
    const sim = new Sim(level({ r: 0, map }));
    const ev = run(sim, 1, 1, 0);
    expect(ev.filter((e) => e.t === 'shard')).toHaveLength(1);
    expect(ev.find((e) => e.t === 'win')).toBeTruthy();
    expect(sim.won).toBe(true);
  });

  it('úlomky ďalšej vlny sa dajú zobrať až po predošlej', () => {
    const map = [...OPEN];
    map[9] = '#.........#';
    map[5] = '#.2..@.*..#';
    const sim = new Sim(level({ r: 0, map }));
    run(sim, 0.8, -1, 0);
    expect(sim.taken()).toBe(0);
    const ev = run(sim, 1.6, 1, 0);
    expect(ev.find((e) => e.t === 'wave')).toEqual({ t: 'wave', n: 1 });
    run(sim, 2, -1, 0);
    expect(sim.won).toBe(true);
  });

  it('srdce strieľa kruhy', () => {
    const heart = LEVELS.find((l) => l.id === 'heart')!;
    const sim = new Sim(heart);
    const ev = run(sim, 1.2);
    expect(ev.filter((e) => e.t === 'fire').length).toBe(4);
    expect(sim.panels[0]!.bullets.length).toBeGreaterThanOrEqual(8);
  });
});

describe('úrovne bežia', () => {
  it('každá úroveň vydrží 10 s bez chyby', () => {
    for (const l of LEVELS) {
      const sim = new Sim(l);
      for (let i = 0; i < 600 && !sim.dead; i++)
        sim.step(1 / 60, { mx: Math.sin(i / 20), my: Math.cos(i / 31), dash: i % 90 === 0 });
      for (const p of sim.panels) {
        expect(Number.isFinite(p.x + p.y), l.id).toBe(true);
        for (const c of p.chasers) expect(p.boxFree(c.x, c.y, 0.29), l.id).toBe(true);
        expect(p.boxFree(p.x, p.y, 0.29), l.id).toBe(true);
      }
    }
  });
});

describe('uloženie', () => {
  it('výhra odomkne ďalšiu úroveň a uloží lepší čas', () => {
    const save = emptySave();
    expect(recordWin(save, 0, 'p1', 20, 5)).toBe(true);
    expect(save.unlocked).toBe(1);
    expect(recordWin(save, 0, 'p1', 25, 5)).toBe(false);
    expect(save.best.p1).toBe(20);
    recordWin(save, 4, 'x', 9, 5);
    expect(save.finished).toBe(true);
    expect(save.unlocked).toBe(4);
  });
});
