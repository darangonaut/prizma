import { DX, DY, type Dir, type EntKind, type EntSpec, type Ev, type SectorDef } from './types';

/** Entita v hre. `r = -1` znamená previazanú entitu, ktorá je vo všetkých realitách naraz. */
export interface Ent {
  id: number;
  k: EntKind;
  r: number;
  x: number;
  y: number;
  spec: EntSpec;
  /** Natočenie zrkadla (0 = `/`, 1 = `\`). */
  o: number;
  /** Páka zapnutá / zámok otvorený / predmet zobratý / spúšťač použitý. */
  on: boolean;
}

/** Úsek lúča v jednej realite (body v súradniciach dlaždíc). */
export interface BeamPath {
  r: number;
  pts: [number, number][];
}

export interface Snap {
  px: number;
  py: number;
  pr: number;
  facing: Dir;
  /** Pre každú entitu x, y, o, on. */
  ents: number[];
  inv: string[];
  unlocked: number[];
  terrain: string[];
  cut: number[];
}

const WALKABLE = new Set(['.', ',', '"', ':']);
const TERRAIN = new Set(['#', '.', ' ', '~', '%', 'x', ',', '"', ':']);
/** Terén, cez ktorý neprejde lúč. */
const BEAM_STOP = new Set(['#', 'x', ' ', '%']);

const DEFAULTS: Record<string, EntSpec> = {
  '>': { k: 'exit' },
  c: { k: 'crate' },
  E: { k: 'crate', twin: true },
  '/': { k: 'mirror', o: 0 },
  N: { k: 'mirror', o: 1 },
};

const SOLID: ReadonlySet<EntKind> = new Set([
  'crate',
  'emitter',
  'mirror',
  'receiver',
  'switch',
  'core',
]);

/** Odraz smeru na zrkadle `/` (index 0) a `\` (index 1). */
const REFLECT: readonly (readonly Dir[])[] = [
  [1, 0, 3, 2],
  [3, 2, 1, 0],
];

/**
 * Logika jedného sektora: mriežka dlaždíc v niekoľkých realitách, hráč stojí vždy v jednej
 * z nich a môže sa presunúť do inej na tom istom mieste, ak je tam voľno.
 * Všetko je deterministické a bez DOM — testuje to solver v `tests/`.
 */
export class World {
  readonly def: SectorDef;
  readonly w: number;
  readonly h: number;
  readonly layers: number;
  /** terrain[r] je reťazec dĺžky w*h. */
  terrain: string[];
  ents: Ent[] = [];
  px = 0;
  py = 0;
  pr = 0;
  facing: Dir = 2;
  inv = new Set<string>();
  unlocked = new Set<number>([0]);
  /** Dlaždice s vyrúbanými lianami (r*w*h + idx). */
  cut: number[] = [];
  beams: BeamPath[] = [];

  /** Nehybné entity podľa dlaždice; bedne sa hľadajú zvlášť. */
  private fixed: Ent[][];
  private crates: Ent[] = [];
  private plates: Ent[] = [];
  private switches: Ent[] = [];
  private receivers: Ent[] = [];
  private doors: Ent[] = [];
  private emitters: Ent[] = [];
  private sigIds = new Map<string, number>();
  private sig: Uint8Array;
  private open: Uint8Array;
  private lit: Uint8Array;
  private beam: Uint8Array;
  private drainSig = -1;

  constructor(def: SectorDef, unlocked: Iterable<number> = [0], inv: Iterable<string> = []) {
    this.def = def;
    this.layers = def.layers.length;
    const rows0 = def.layers[0]!;
    this.h = rows0.length;
    this.w = Math.max(...rows0.map((r) => r.length));
    for (const r of unlocked) this.unlocked.add(r);
    for (const i of inv) this.inv.add(i);
    this.terrain = [];
    let start = false;
    def.layers.forEach((rows, r) => {
      if (rows.length !== this.h) throw new Error(`${def.id}: vrstva ${r} má zlú výšku`);
      let t = '';
      rows.forEach((row, y) => {
        if (row.length !== this.w)
          throw new Error(`${def.id}: vrstva ${r} riadok ${y} má zlú šírku`);
        for (let x = 0; x < this.w; x++) {
          const ch = row[x]!;
          if (TERRAIN.has(ch)) {
            t += ch;
            continue;
          }
          t += '.';
          if (ch === '@') {
            if (start) throw new Error(`${def.id}: dva štarty`);
            start = true;
            this.px = x;
            this.py = y;
            this.pr = r;
            continue;
          }
          const spec = def.legend?.[ch] ?? DEFAULTS[ch];
          if (!spec) throw new Error(`${def.id}: neznámy znak '${ch}'`);
          const twin = spec.k === 'crate' && spec.twin;
          this.ents.push({
            id: this.ents.length,
            k: spec.k,
            r: twin ? -1 : r,
            x,
            y,
            spec,
            o: spec.k === 'mirror' ? spec.o : 0,
            on: spec.k === 'switch' ? !!spec.on : false,
          });
        }
      });
      this.terrain.push(t);
    });
    if (!start) throw new Error(`${def.id}: chýba štart @`);

    this.fixed = Array.from({ length: this.w * this.h }, () => []);
    const sigId = (s: string) => {
      if (!this.sigIds.has(s)) this.sigIds.set(s, this.sigIds.size);
      return this.sigIds.get(s)!;
    };
    for (const e of this.ents) {
      if (e.k === 'crate') this.crates.push(e);
      else this.fixed[this.idx(e.x, e.y)]!.push(e);
      const s = e.spec;
      if (s.k === 'plate' || s.k === 'switch' || s.k === 'receiver') {
        sigId(s.sig);
        (s.k === 'plate' ? this.plates : s.k === 'switch' ? this.switches : this.receivers).push(e);
      }
      if (s.k === 'door') {
        this.doors.push(e);
        s.open.forEach(sigId);
      }
      if (s.k === 'emitter') this.emitters.push(e);
    }
    if (def.drain) this.drainSig = sigId(def.drain);
    this.sig = new Uint8Array(this.sigIds.size);
    this.open = new Uint8Array(this.ents.length);
    this.lit = new Uint8Array(this.ents.length);
    this.beam = new Uint8Array(this.layers * this.w * this.h);
    this.update();
  }

  // ---------- dotazy ----------

  idx(x: number, y: number): number {
    return y * this.w + x;
  }

  inside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  tile(r: number, x: number, y: number): string {
    if (!this.inside(x, y)) return ' ';
    return this.terrain[r]![this.idx(x, y)]!;
  }

  signal(name: string): boolean {
    const id = this.sigIds.get(name);
    return id !== undefined && this.sig[id] === 1;
  }

  drained(): boolean {
    return this.drainSig >= 0 && this.sig[this.drainSig] === 1;
  }

  isOpen(e: Ent): boolean {
    return this.open[e.id] === 1;
  }

  isLit(e: Ent): boolean {
    return this.lit[e.id] === 1;
  }

  walkableTerrain(r: number, x: number, y: number): boolean {
    const t = this.tile(r, x, y);
    return WALKABLE.has(t) || (t === '~' && this.drained());
  }

  private present(e: Ent, r: number): boolean {
    return (e.r === -1 || e.r === r) && !this.gone(e);
  }

  /** Entity prítomné v realite r na danom mieste. */
  entsAt(r: number, x: number, y: number): Ent[] {
    if (!this.inside(x, y)) return [];
    const out = this.fixed[this.idx(x, y)]!.filter((e) => this.present(e, r));
    for (const c of this.crates) if (c.x === x && c.y === y && this.present(c, r)) out.push(c);
    return out;
  }

  private crateAt(r: number, x: number, y: number, except?: Ent): Ent | undefined {
    for (const c of this.crates)
      if (c !== except && c.x === x && c.y === y && (c.r === -1 || c.r === r)) return c;
    return undefined;
  }

  /** Pevná entita (alebo bedňa) v realite r na mieste. */
  private solidAt(r: number, x: number, y: number, except?: Ent): Ent | undefined {
    if (!this.inside(x, y)) return undefined;
    for (const e of this.fixed[this.idx(x, y)]!) if (this.present(e, r) && this.solid(e)) return e;
    return this.crateAt(r, x, y, except);
  }

  /** Zobratý predmet / kryštál už nie je na mape. */
  gone(e: Ent): boolean {
    return (e.k === 'item' || e.k === 'crystal') && e.on;
  }

  solid(e: Ent): boolean {
    if (SOLID.has(e.k)) return true;
    if (e.k === 'door') return this.open[e.id] !== 1;
    if (e.k === 'lock') return !e.on;
    return false;
  }

  beamAt(r: number, x: number, y: number): boolean {
    return this.inside(x, y) && this.beam[r * this.w * this.h + this.idx(x, y)] === 1;
  }

  /** Môže tu stáť hráč? */
  free(r: number, x: number, y: number): boolean {
    return this.walkableTerrain(r, x, y) && !this.solidAt(r, x, y) && !this.beamAt(r, x, y);
  }

  /** Reality, v ktorých je entita (previazaná je vo všetkých). */
  realitiesOf(e: Ent): number[] {
    return e.r === -1 ? [...Array(this.layers).keys()] : [e.r];
  }

  canShift(r: number): boolean {
    return (
      r < this.layers && this.unlocked.has(r) && r !== this.pr && this.free(r, this.px, this.py)
    );
  }

  // ---------- akcie ----------

  move(dir: Dir): Ev[] {
    const ev: Ev[] = [];
    this.facing = dir;
    const r = this.pr;
    const tx = this.px + DX[dir];
    const ty = this.py + DY[dir];
    const solid = this.solidAt(r, tx, ty);
    if (solid) {
      this.bump(solid, dir, ev);
      if (!ev.some((e) => e.t === 'push')) return this.finish(ev);
    } else {
      const t = this.tile(r, tx, ty);
      if (t === '%') {
        if (this.inv.has('cutter')) {
          this.setTile(r, tx, ty, '"');
          this.cut.push(r * this.w * this.h + this.idx(tx, ty));
          ev.push({ t: 'cut' });
        } else {
          ev.push({ t: 'blocked', why: 'vines' }, { t: 'needItem', item: 'cutter' });
        }
        return this.finish(ev);
      }
      if (!this.walkableTerrain(r, tx, ty)) {
        ev.push({ t: 'blocked', why: 'wall' });
        return this.finish(ev);
      }
      if (this.beamAt(r, tx, ty)) {
        ev.push({ t: 'blocked', why: 'beam' });
        return this.finish(ev);
      }
    }
    this.px = tx;
    this.py = ty;
    ev.push({ t: 'step' });
    this.enter(ev);
    return this.finish(ev);
  }

  shift(r: number): Ev[] {
    const ev: Ev[] = [];
    if (r === this.pr) ev.push({ t: 'shiftBlocked', r, why: 'same' });
    else if (r >= this.layers || !this.unlocked.has(r))
      ev.push({ t: 'shiftBlocked', r, why: 'locked' });
    else if (this.beamAt(r, this.px, this.py)) ev.push({ t: 'shiftBlocked', r, why: 'beam' });
    else if (!this.free(r, this.px, this.py)) ev.push({ t: 'shiftBlocked', r, why: 'solid' });
    else {
      this.pr = r;
      ev.push({ t: 'shift', r });
      this.enter(ev);
    }
    return this.finish(ev);
  }

  private bump(e: Ent, dir: Dir, ev: Ev[]): void {
    const s = e.spec;
    switch (s.k) {
      case 'crate':
        if (this.push(e, dir)) ev.push({ t: 'push', twin: e.r === -1 });
        else ev.push({ t: 'blocked', why: 'crate' });
        return;
      case 'mirror':
        if (s.fixed) {
          ev.push({ t: 'blocked', why: 'solid' });
          return;
        }
        e.o = 1 - e.o;
        ev.push({ t: 'rotate' });
        return;
      case 'switch':
        e.on = !e.on;
        ev.push({ t: 'toggle', on: e.on });
        return;
      case 'lock':
        if (this.inv.has(s.item)) {
          e.on = true;
          ev.push({ t: 'open' });
        } else ev.push({ t: 'blocked', why: 'lock' }, { t: 'needItem', item: s.item });
        return;
      case 'door':
        ev.push({ t: 'blocked', why: 'door' });
        return;
      case 'core':
        ev.push({ t: 'core' });
        return;
      default:
        ev.push({ t: 'blocked', why: 'solid' });
    }
  }

  /** Posun bedne; previazaná sa musí dať posunúť vo všetkých realitách naraz. */
  private push(e: Ent, dir: Dir): boolean {
    const nx = e.x + DX[dir];
    const ny = e.y + DY[dir];
    for (const r of this.realitiesOf(e)) {
      if (!this.walkableTerrain(r, nx, ny)) return false;
      if (this.solidAt(r, nx, ny, e)) return false;
    }
    e.x = nx;
    e.y = ny;
    return true;
  }

  private enter(ev: Ev[]): void {
    for (const e of this.fixed[this.idx(this.px, this.py)]!) {
      if (!this.present(e, this.pr)) continue;
      const s = e.spec;
      if (s.k === 'item') {
        e.on = true;
        this.inv = new Set(this.inv).add(s.item);
        ev.push({ t: 'pickup', item: s.item });
      } else if (s.k === 'crystal') {
        e.on = true;
        this.unlocked = new Set(this.unlocked).add(s.reality);
        ev.push({ t: 'unlock', r: s.reality });
      } else if ((s.k === 'log' || s.k === 'echo') && !e.on) {
        // Holografický záznam sa prehrá pri prvom vstupe.
        e.on = true;
        ev.push({ t: 'read', kind: s.k, id: s.id });
      } else if (s.k === 'trigger' && !e.on) {
        e.on = true;
        ev.push({ t: 'msg', id: s.msg });
      } else if (s.k === 'exit') {
        ev.push({ t: 'exit' });
      }
    }
  }

  private setTile(r: number, x: number, y: number, ch: string): void {
    const t = this.terrain[r]!;
    const i = this.idx(x, y);
    this.terrain[r] = t.slice(0, i) + ch + t.slice(i + 1);
  }

  private finish(ev: Ev[]): Ev[] {
    const open = this.open.slice();
    const lit = this.lit.slice();
    this.update();
    let opened = 0;
    let closed = 0;
    for (const d of this.doors) {
      if (this.open[d.id] && !open[d.id]) opened++;
      if (!this.open[d.id] && open[d.id]) closed++;
    }
    if (opened || closed) ev.push({ t: 'doors', opened, closed });
    for (const e of this.receivers) {
      if (this.lit[e.id] && !lit[e.id]) ev.push({ t: 'receiver', lit: true });
      if (!this.lit[e.id] && lit[e.id]) ev.push({ t: 'receiver', lit: false });
    }
    return ev;
  }

  // ---------- odvodený stav ----------

  /** Prepočíta signály, dvere a lúče (lúče závisia od dverí a dvere od prijímačov). */
  update(): void {
    const sig = this.sig;
    for (let pass = 0; pass < 6; pass++) {
      sig.fill(0);
      for (const e of this.plates) {
        if (e.spec.k !== 'plate') continue;
        if ((this.pr === e.r && this.px === e.x && this.py === e.y) || this.crateAt(e.r, e.x, e.y))
          sig[this.sigIds.get(e.spec.sig)!] = 1;
      }
      for (const e of this.switches)
        if (e.spec.k === 'switch' && e.on) sig[this.sigIds.get(e.spec.sig)!] = 1;
      for (const e of this.receivers)
        if (e.spec.k === 'receiver' && this.lit[e.id]) sig[this.sigIds.get(e.spec.sig)!] = 1;
      let changed = false;
      for (const e of this.doors) {
        if (e.spec.k !== 'door') continue;
        // Dvere sa nezatvoria, kým v nich stojí hráč alebo bedňa.
        const open =
          e.spec.open.every((s) => sig[this.sigIds.get(s)!]) ||
          (this.pr === e.r && this.px === e.x && this.py === e.y) ||
          !!this.crateAt(e.r, e.x, e.y);
        const v = open ? 1 : 0;
        if (this.open[e.id] !== v) {
          this.open[e.id] = v;
          changed = true;
        }
      }
      if (this.emitters.length === 0) {
        if (!changed) break;
        continue;
      }
      const litBefore = this.lit.slice();
      this.traceBeams();
      const litChanged = this.receivers.some((e) => this.lit[e.id] !== litBefore[e.id]);
      if (!changed && !litChanged) break;
    }
  }

  private traceBeams(): void {
    this.beam.fill(0);
    this.lit.fill(0);
    this.beams = [];
    const n = this.w * this.h;
    for (const em of this.emitters) {
      if (em.spec.k !== 'emitter') continue;
      let r = em.r;
      let x = em.x;
      let y = em.y;
      let d: Dir = em.spec.dir;
      let path: BeamPath = { r, pts: [[x, y]] };
      this.beams.push(path);
      const seen = new Set<number>();
      for (let guard = 0; guard < 4000; guard++) {
        x += DX[d];
        y += DY[d];
        const stop = () => path.pts.push([x - DX[d] * 0.5, y - DY[d] * 0.5]);
        if (!this.inside(x, y) || BEAM_STOP.has(this.tile(r, x, y))) {
          stop();
          break;
        }
        const key = (r * n + this.idx(x, y)) * 4 + d;
        if (seen.has(key)) {
          path.pts.push([x, y]);
          break;
        }
        seen.add(key);
        let mirror: Ent | undefined;
        let phase: Ent | undefined;
        let blocked = false;
        for (const e of this.fixed[this.idx(x, y)]!) {
          if (!this.present(e, r)) continue;
          if (e.k === 'receiver') {
            this.lit[e.id] = 1;
            blocked = true;
          } else if (e.k === 'mirror') mirror = e;
          else if (e.k === 'phase') phase = e;
          else if (this.solid(e)) blocked = true;
        }
        if (!mirror && !blocked && this.crateAt(r, x, y)) blocked = true;
        if (mirror) {
          path.pts.push([x, y]);
          d = REFLECT[mirror.o]![d]!;
          continue;
        }
        if (blocked) {
          const recv = this.fixed[this.idx(x, y)]!.some(
            (e) => e.k === 'receiver' && this.present(e, r),
          );
          if (recv) path.pts.push([x, y]);
          else stop();
          break;
        }
        this.beam[r * n + this.idx(x, y)] = 1;
        if (phase && phase.spec.k === 'phase' && phase.spec.to < this.layers) {
          path.pts.push([x, y]);
          r = phase.spec.to;
          this.beam[r * n + this.idx(x, y)] = 1;
          path = { r, pts: [[x, y]] };
          this.beams.push(path);
        }
      }
    }
  }

  // ---------- stav pre späť / solver ----------

  snap(): Snap {
    const ents: number[] = new Array(this.ents.length * 4);
    this.ents.forEach((e, i) => {
      ents[i * 4] = e.x;
      ents[i * 4 + 1] = e.y;
      ents[i * 4 + 2] = e.o;
      ents[i * 4 + 3] = e.on ? 1 : 0;
    });
    return {
      px: this.px,
      py: this.py,
      pr: this.pr,
      facing: this.facing,
      ents,
      inv: [...this.inv],
      unlocked: [...this.unlocked],
      terrain: [...this.terrain],
      cut: [...this.cut],
    };
  }

  restore(s: Snap): void {
    this.px = s.px;
    this.py = s.py;
    this.pr = s.pr;
    this.facing = s.facing;
    this.ents.forEach((e, i) => {
      e.x = s.ents[i * 4]!;
      e.y = s.ents[i * 4 + 1]!;
      e.o = s.ents[i * 4 + 2]!;
      e.on = s.ents[i * 4 + 3] === 1;
    });
    this.inv = new Set(s.inv);
    this.unlocked = new Set(s.unlocked);
    this.terrain = [...s.terrain];
    this.cut = [...s.cut];
    this.update();
  }

  /** Kľúč stavu pre solver (len to, čo ovplyvňuje hrateľnosť). */
  key(): string {
    let k = `${this.px},${this.py},${this.pr}|`;
    for (const e of this.ents) {
      if (e.k === 'crate') k += `${e.x},${e.y};`;
      else if (e.k === 'mirror') k += e.o;
      else if (e.k === 'switch' || e.k === 'lock' || e.k === 'item' || e.k === 'crystal')
        k += e.on ? 1 : 0;
    }
    k += '|' + [...this.unlocked].sort().join('');
    if (this.cut.length) k += '|' + [...this.cut].sort((a, b) => a - b).join(',');
    return k;
  }
}
