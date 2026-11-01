import type { Progress } from './save';
import { DX, DY, REALITIES, ROOM_H, ROOM_W, type RoomDef, type Spec } from './types';

/** Podlaha každej reality (len vzhľad). */
export const FLOOR = ['.', ',', '"', ':'];

/**
 * Terén: `#` stena, ` ` prázdno (Nula), `~` hlboká voda, `%` liany, `x` sutina (strely prejdú),
 * podlaha `.` `,` `"` `:`. Entity podľa legendy (predvolené nižšie).
 */
export const DEFAULT_LEGEND: Record<string, Spec> = {
  L: { k: 'lock', all: true },
  T: { k: 'terminal', all: true },
  K: { k: 'item', item: 'card' },
  U: { k: 'item', item: 'cutter' },
  P: { k: 'item', item: 'lens' },
  Z: { k: 'core', all: true, after: 'heart' },
  d: { k: 'enemy', kind: 'drone' },
  c: { k: 'enemy', kind: 'crawler' },
  p: { k: 'enemy', kind: 'pod' },
  t: { k: 'enemy', kind: 'turret' },
  g: { k: 'enemy', kind: 'glitch' },
  W: { k: 'enemy', kind: 'warden' },
  B: { k: 'enemy', kind: 'heart', all: true },
};

const TERRAIN = new Set(['#', ' ', '~', '%', 'x', ...FLOOR]);

export interface Ent {
  uid: string;
  spec: Spec;
  x: number;
  y: number;
  /** Realita entity; -1 = všetky. */
  r: number;
  /** Spínač zapnutý / zámok otvorený. */
  on: boolean;
}

export function specFor(def: RoomDef, ch: string): Spec | undefined {
  return def.legend?.[ch] ?? DEFAULT_LEGEND[ch];
}

/** Vrstva reality r: zadaná, alebo odvodená z prvej (terén s podlahou reality, bez entít). */
export function layerOf(def: RoomDef, r: number): string[] {
  const own = def.layers[r];
  if (own) return own;
  const base = def.layers[0]!;
  return base.map((row) =>
    [...row]
      .map((ch) => (TERRAIN.has(ch) ? (FLOOR.includes(ch) ? FLOOR[r]! : ch) : FLOOR[r]!))
      .join(''),
  );
}

export class Room {
  readonly def: RoomDef;
  readonly w = ROOM_W;
  readonly h = ROOM_H;
  /** Terén každej reality (riadky ako polia znakov, liany sa dajú prerezať). */
  readonly tiles: string[][][] = [];
  readonly ents: Ent[] = [];
  /** Dlaždice zasiahnuté lúčom (index r * w * h + y * w + x). */
  readonly beam = new Uint8Array(REALITIES * ROOM_W * ROOM_H);
  /** Úsečky lúčov na vykreslenie. */
  beams: { r: number; x0: number; y0: number; x1: number; y1: number }[] = [];
  private readonly prog: Progress;

  constructor(def: RoomDef, prog: Progress) {
    this.def = def;
    this.prog = prog;
    for (let r = 0; r < REALITIES; r++) {
      const layer = layerOf(def, r);
      const grid: string[][] = [];
      for (let y = 0; y < ROOM_H; y++) {
        const row: string[] = [];
        for (let x = 0; x < ROOM_W; x++) {
          const ch = layer[y]?.[x] ?? '#';
          if (TERRAIN.has(ch)) {
            row.push(ch === '%' && prog.cut.includes(`${def.id}:${r}:${x}:${y}`) ? FLOOR[r]! : ch);
            continue;
          }
          row.push(FLOOR[r]!);
          const spec = specFor(def, ch);
          // Nepriateľov vytvára simulácia pri vstupe do miestnosti.
          if (!spec || spec.k === 'enemy') continue;
          // Entita „vo všetkých realitách“ sa zapíše len raz (z prvej vrstvy, kde je).
          if (spec.all && this.ents.some((e) => e.r === -1 && e.x === x && e.y === y)) continue;
          const uid = `${def.id}:${spec.all ? 'a' : r}:${x}:${y}`;
          this.ents.push({
            uid,
            spec,
            x,
            y,
            r: spec.all ? -1 : r,
            on:
              prog.taken.includes(uid) || (spec.k === 'switch' && prog.signals.includes(spec.sig)),
          });
        }
        grid.push(row);
      }
      this.tiles.push(grid);
    }
    this.updateBeams();
  }

  /** Terén; mimo miestnosti sa predĺži okrajová dlaždica (otvor pokračuje k susedovi). */
  tile(r: number, x: number, y: number): string {
    const cx = Math.max(0, Math.min(this.w - 1, x));
    const cy = Math.max(0, Math.min(this.h - 1, y));
    return this.tiles[r]![cy]![cx]!;
  }

  drained(): boolean {
    return !!this.def.drain && this.prog.signals.includes(this.def.drain);
  }

  signal(sig: string): boolean {
    return this.prog.signals.includes(sig);
  }

  /** Je entita prítomná (nie zobratá a jej boss už padol)? */
  present(e: Ent): boolean {
    const s = e.spec;
    if (s.after && !this.prog.bosses.includes(s.after)) return false;
    if (
      (s.k === 'item' || s.k === 'crystal' || s.k === 'health' || s.k === 'trigger') &&
      this.prog.taken.includes(e.uid)
    )
      return false;
    return true;
  }

  inReality(e: Ent, r: number): boolean {
    return e.r === -1 || e.r === r;
  }

  isOpen(e: Ent): boolean {
    if (e.spec.k === 'door') return this.signal(e.spec.sig);
    if (e.spec.k === 'lock') return e.on;
    return true;
  }

  /** Entita, ktorá zaberá dlaždicu (dvere, zámok, spínač, žiarič). */
  blocker(r: number, x: number, y: number): Ent | undefined {
    for (const e of this.ents) {
      if (e.x !== x || e.y !== y || !this.inReality(e, r) || !this.present(e)) continue;
      const k = e.spec.k;
      if ((k === 'door' || k === 'lock') && !this.isOpen(e)) return e;
      if (k === 'switch' || k === 'emitter' || k === 'terminal') return e;
    }
    return undefined;
  }

  /** Dá sa dlaždica prejsť (hráč, nepriatelia; `swim` = cez hlbokú vodu)? */
  walkable(r: number, x: number, y: number, swim = false): boolean {
    const t = this.tile(r, x, y);
    if (t === '#' || t === ' ' || t === 'x' || t === '%') return false;
    if (t === '~' && !swim && !this.drained()) return false;
    const cx = Math.max(0, Math.min(this.w - 1, x));
    const cy = Math.max(0, Math.min(this.h - 1, y));
    if (this.beam[r * this.w * this.h + cy * this.w + cx]) return false;
    return !this.blocker(r, cx, cy);
  }

  /** Zastaví dlaždica strelu? (Voda, prázdno a sutina nie.) */
  blocksShot(r: number, x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    const t = this.tile(r, x, y);
    if (t === '#' || t === '%') return true;
    const b = this.blocker(r, x, y);
    return !!b && b.spec.k !== 'terminal';
  }

  /** Lúče žiaričov: idú rovno, kým nenarazia na stenu alebo entitu. Vypne ich signál. */
  updateBeams(): void {
    this.beam.fill(0);
    this.beams = [];
    for (const e of this.ents) {
      if (e.spec.k !== 'emitter' || !this.present(e) || this.signal(e.spec.sig)) continue;
      const d = e.spec.dir;
      const rs = e.r === -1 ? [0, 1, 2, 3] : [e.r];
      for (const r of rs) {
        let x = e.x + DX[d];
        let y = e.y + DY[d];
        while (x >= 0 && y >= 0 && x < this.w && y < this.h && !this.blocksShot(r, x, y)) {
          this.beam[r * this.w * this.h + y * this.w + x] = 1;
          x += DX[d];
          y += DY[d];
        }
        this.beams.push({ r, x0: e.x, y0: e.y, x1: x - DX[d], y1: y - DY[d] });
      }
    }
  }

  cut(r: number, x: number, y: number): void {
    this.tiles[r]![y]![x] = FLOOR[r]!;
    const key = `${this.def.id}:${r}:${x}:${y}`;
    if (!this.prog.cut.includes(key)) this.prog.cut.push(key);
    this.updateBeams();
  }
}
