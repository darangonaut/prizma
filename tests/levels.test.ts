import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/game/levels';
import { Panel, Sim, isSolid, laserPhase } from '@/game/sim';
import { SIZE } from '@/game/types';
import { solve } from './solve';

const KNOWN = '#.@*23^hv><AVTg:;H';

describe('úrovne', () => {
  it('majú jedinečné id a správne rozmery', () => {
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
    for (const l of LEVELS)
      for (const p of l.panels) {
        expect(p.map, `${l.id}/${p.r}`).toHaveLength(SIZE);
        for (const row of p.map) {
          expect(row, `${l.id}/${p.r}: ${row}`).toHaveLength(SIZE);
          for (const ch of row) expect(KNOWN, `${l.id}/${p.r}: '${ch}'`).toContain(ch);
        }
      }
  });

  it('každé okno má jednu kópiu, úlomok a uzavretý obvod', () => {
    for (const l of LEVELS) {
      expect(new Set(l.panels.map((p) => p.r)).size, l.id).toBe(l.panels.length);
      for (const p of l.panels) {
        const all = p.map.join('');
        expect(all.split('@').length - 1, `${l.id}/${p.r}`).toBe(1);
        expect(/[*23]/.test(all), `${l.id}/${p.r}`).toBe(true);
        for (let i = 0; i < SIZE; i++)
          for (const ch of [
            p.map[0]![i]!,
            p.map[SIZE - 1]![i]!,
            p.map[i]![0]!,
            p.map[i]![SIZE - 1]!,
          ])
            expect(isSolid(ch), `${l.id}/${p.r} okraj`).toBe(true);
      }
    }
  });

  it('kópia na začiatku nestojí v lúči lasera ani v dráhe zapnutej píly', () => {
    for (const l of LEVELS) {
      const sim = new Sim(l);
      for (let t = 0; t < 0.6; t += 0.05) {
        sim.step(0.05, { mx: 0, my: 0, dash: false });
        expect(sim.dead, `${l.id} v čase ${t.toFixed(2)}`).toBe(false);
      }
      for (const p of sim.panels)
        for (const las of p.lasers)
          for (let t = 0; t < 1.75; t += 0.05) expect(laserPhase(las, t), l.id).not.toBe('on');
    }
  });

  it('sa dajú vyriešiť a kapitoly pribúdajú po jednej realite', () => {
    const rows: string[] = [];
    const failed: string[] = [];
    for (const l of LEVELS) {
      // Hltavý riešič môže zablúdiť; stačí, keď riešenie nájde aspoň jedna z variant.
      const s =
        solve(l) ??
        solve(l, { dash: false }) ??
        solve(l, { anchor: false }) ??
        solve(l, { anchor: false, dash: false });
      if (!s) failed.push(l.id);
      const plain = solve(l, { anchor: false, dash: false, limit: 200_000 });
      rows.push(
        `${l.id.padEnd(6)} ${String(s?.steps ?? '—').padStart(3)} ťahov  bez kotvy a úskoku: ${plain?.steps ?? '—'}  stavy ${s?.states ?? '—'}`,
      );
      expect(l.panels.length, l.id).toBe(Math.min(4, l.chapter + 1));
    }
    if (process.env.LEVELS_REPORT) console.log(rows.join('\n'));
    expect(failed).toEqual([]);
  }, 120_000);

  it('všetky okná sa dajú vytvoriť', () => {
    for (const l of LEVELS) for (const p of l.panels) expect(() => new Panel(p)).not.toThrow();
  });
});
