import {
  SIZE,
  mirror,
  type DeathCause,
  type Ev,
  type Input,
  type LevelDef,
  type PanelDef,
} from './types';

// Všetky rozmery sú v dlaždiciach, časy v sekundách.
export const HALF = 0.3;
/** Polomer zásahu kópie (menší než jej telo, aby zásahy pôsobili férovo). */
export const HIT = 0.22;
export const SPEED = 4.2;
export const DASH_SPEED = 12;
export const DASH_TIME = 0.14;
export const DASH_CD = 0.7;
export const SAW_SPEED = 2.6;
export const SAW_R = 0.36;
export const LASER_PERIOD = 3;
export const LASER_ON = 1.2;
export const LASER_WARN = 0.6;
export const BLINK_PERIOD = 3.5;
export const BLINK_GONE = 1;
export const BLINK_WARN = 0.6;
export const CHASER_SPEED = 1.6;
export const CHASER_R = 0.3;
export const CHASER_WAKE = 1;
export const TURRET_EVERY = 2;
export const TURRET_FIRST = 1.2;
export const BULLET_SPEED = 3.2;
export const BULLET_R = 0.12;
export const HEART_EVERY = 1.7;
export const HEART_SPEED = 2.4;
const STEP = 1 / 120;

/** Pevné dlaždice: stena, žiariče laserov, veže a srdce. */
const SOLID = '#><AVTH';
export const isSolid = (ch: string): boolean => SOLID.includes(ch);

/** Vlna úlomku podľa znaku: `*` hneď, `2` a `3` až po zobratí predošlej vlny. */
export function waveOf(ch: string): number {
  return ch === '*' ? 0 : ch === '2' ? 1 : ch === '3' ? 2 : -1;
}

export interface Saw {
  axis: 0 | 1;
  /** Krajné polohy stredu na osi pohybu a pevná súradnica na druhej osi. */
  min: number;
  max: number;
  fixed: number;
  s0: number;
  x: number;
  y: number;
}

export interface Laser {
  /** Žiarič (dlaždica) a smer lúča. */
  x: number;
  y: number;
  dx: number;
  dy: number;
  len: number;
}

export interface Gun {
  x: number;
  y: number;
  t: number;
  a: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Chaser {
  x: number;
  y: number;
  sx: number;
  sy: number;
}

export interface Shard {
  x: number;
  y: number;
  wave: number;
  taken: boolean;
}

export type Phase = 'on' | 'warn' | 'off';

/**
 * Laser svieti 1,2 s z 3 s, pred tým 0,6 s bliká. Vodorovné sa prvý raz zapnú v 1,8 s,
 * zvislé o pol periódy neskôr (potom sa striedajú).
 */
export function laserPhase(l: Laser, t: number): Phase {
  let ph = t - (l.dy ? LASER_PERIOD / 2 : 0);
  if (ph < 0) return 'off';
  ph %= LASER_PERIOD;
  if (ph >= LASER_PERIOD - LASER_ON) return 'on';
  return ph >= LASER_PERIOD - LASER_ON - LASER_WARN ? 'warn' : 'off';
}

/** Mihotavá podlaha Nuly: `:` a `;` miznú striedavo na 1 s z 3,5 s ('on' = podlaha zmizla). */
export function blinkPhase(ch: string, t: number): Phase {
  const ph = (t + (ch === ';' ? BLINK_PERIOD / 2 : 0)) % BLINK_PERIOD;
  if (ph >= BLINK_PERIOD - BLINK_GONE) return 'on';
  return ph >= BLINK_PERIOD - BLINK_GONE - BLINK_WARN ? 'warn' : 'off';
}

/** Poloha píly v čase t: tam a späť medzi stenami. */
export function sawAt(s: Saw, t: number): number {
  const len = s.max - s.min;
  if (len <= 0) return s.min;
  const d = (s.s0 + t * SAW_SPEED) % (2 * len);
  return s.min + (d < len ? d : 2 * len - d);
}

/** Jedna realita úrovne: jej mapa, kópia hráča a všetko, čo v nej ohrozuje. */
export class Panel {
  readonly r: number;
  readonly map: string[];
  x = 0;
  y = 0;
  sx = 0;
  sy = 0;
  /** Smer pohľadu a posledná rýchlosť (pre vykreslenie). */
  fx = 0;
  fy = 1;
  vx = 0;
  vy = 0;
  dashX = 0;
  dashY = 0;
  saws: Saw[] = [];
  lasers: Laser[] = [];
  turrets: Gun[] = [];
  hearts: Gun[] = [];
  bullets: Bullet[] = [];
  chasers: Chaser[] = [];
  shards: Shard[] = [];

  constructor(def: PanelDef) {
    this.r = def.r;
    this.map = def.map;
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const ch = this.tile(x, y);
        const cx = x + 0.5;
        const cy = y + 0.5;
        if (ch === '@') {
          this.sx = this.x = cx;
          this.sy = this.y = cy;
        } else if (waveOf(ch) >= 0)
          this.shards.push({ x: cx, y: cy, wave: waveOf(ch), taken: false });
        else if (ch === 'h' || ch === 'v') this.saws.push(this.makeSaw(x, y, ch === 'h' ? 0 : 1));
        else if (ch === 'g') this.chasers.push({ x: cx, y: cy, sx: cx, sy: cy });
        else if (ch === 'T')
          this.turrets.push({ x: cx, y: cy, t: TURRET_EVERY - TURRET_FIRST, a: 0 });
        else if (ch === 'H') this.hearts.push({ x: cx, y: cy, t: HEART_EVERY - 1, a: 0 });
        else if ('><AV'.includes(ch)) {
          const dx = ch === '>' ? 1 : ch === '<' ? -1 : 0;
          const dy = ch === 'V' ? 1 : ch === 'A' ? -1 : 0;
          let len = 0;
          while (!isSolid(this.tile(x + dx * (len + 1), y + dy * (len + 1)))) len++;
          this.lasers.push({ x, y, dx, dy, len });
        }
      }
  }

  private makeSaw(x: number, y: number, axis: 0 | 1): Saw {
    const at = (k: number) => (axis === 0 ? this.tile(k, y) : this.tile(x, k));
    const start = axis === 0 ? x : y;
    let lo = start;
    let hi = start;
    while (!isSolid(at(lo - 1))) lo--;
    while (!isSolid(at(hi + 1))) hi++;
    const saw: Saw = {
      axis,
      min: lo + 0.5,
      max: hi + 0.5,
      fixed: (axis === 0 ? y : x) + 0.5,
      s0: start - lo,
      x: x + 0.5,
      y: y + 0.5,
    };
    return saw;
  }

  tile(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return '#';
    return this.map[y]![x] ?? '#';
  }

  /** Zmestí sa štvorec s polovičnou stranou `half` so stredom (x, y)? */
  boxFree(x: number, y: number, half = HALF): boolean {
    const e = 1e-6;
    for (let ty = Math.floor(y - half + e); ty <= Math.floor(y + half - e); ty++)
      for (let tx = Math.floor(x - half + e); tx <= Math.floor(x + half - e); tx++)
        if (isSolid(this.tile(tx, ty))) return false;
    return true;
  }

  /** Posun s kĺzaním po stenách; `nudge` pomôže trafiť sa do chodby širokej jednu dlaždicu. */
  move(o: { x: number; y: number }, dx: number, dy: number, half: number, nudge: boolean): void {
    this.axis(o, 0, dx, half, nudge && !dy);
    this.axis(o, 1, dy, half, nudge && !dx);
  }

  private axis(
    o: { x: number; y: number },
    ax: 0 | 1,
    d: number,
    half: number,
    nudge: boolean,
  ): void {
    if (!d) return;
    const nx = ax === 0 ? o.x + d : o.x;
    const ny = ax === 1 ? o.y + d : o.y;
    if (this.boxFree(nx, ny, half)) {
      o.x = nx;
      o.y = ny;
      return;
    }
    // Prilepiť sa k stene.
    const pos = ax === 0 ? o.x : o.y;
    const edge =
      d > 0
        ? Math.floor(pos + half + d) - half - 1e-4
        : Math.floor(pos - half + d) + 1 + half + 1e-4;
    if ((d > 0 && edge > pos) || (d < 0 && edge < pos)) {
      if (ax === 0) o.x = edge;
      else o.y = edge;
    }
    if (!nudge) return;
    // Roh: ak je chodba blízko vedľa, posunúť sa k jej stredu.
    const side = ax === 0 ? o.y : o.x;
    const base = Math.floor(side) + 0.5;
    for (const c of [base, base - 1, base + 1].sort(
      (a, b) => Math.abs(a - side) - Math.abs(b - side),
    )) {
      if (Math.abs(c - side) > 0.45 || Math.abs(c - side) < 1e-6) continue;
      const fx = ax === 0 ? o.x + d : c;
      const fy = ax === 0 ? c : o.y + d;
      if (!this.boxFree(fx, fy, half)) continue;
      const step = Math.min(Math.abs(d), Math.abs(c - side)) * Math.sign(c - side);
      const tx = ax === 0 ? o.x : o.x + step;
      const ty = ax === 0 ? o.y + step : o.y;
      if (this.boxFree(tx, ty, half)) {
        o.x = tx;
        o.y = ty;
      }
      return;
    }
  }
}

/**
 * Úroveň: jeden vstup hýbe všetkými kópiami naraz, každou zrkadlene podľa jej reality.
 * Keď zahynie jedna kópia, zahynú všetky. Úroveň je hotová, keď sú zobraté všetky úlomky.
 */
export class Sim {
  readonly level: LevelDef;
  readonly panels: Panel[];
  readonly waves: number;
  t = 0;
  /** Zakotvená kópia stojí, kým sa hýbu ostatné (-1 = žiadna). */
  anchor = -1;
  wave = 0;
  dashT = 0;
  dashCd = 0;
  dead = false;
  won = false;
  private ev: Ev[] = [];

  constructor(level: LevelDef) {
    this.level = level;
    this.panels = level.panels.map((d) => new Panel(d));
    this.waves = 1 + Math.max(0, ...this.panels.flatMap((p) => p.shards.map((s) => s.wave)));
  }

  get canAnchor(): boolean {
    return this.panels.length > 1;
  }

  toggleAnchor(i: number): Ev[] {
    if (!this.canAnchor || i < 0 || i >= this.panels.length || this.dead || this.won) return [];
    this.anchor = this.anchor === i ? -1 : i;
    return [{ t: 'anchor', p: this.anchor }];
  }

  /** Koľko úlomkov aktuálnej vlny ešte chýba. */
  remaining(): number {
    let n = 0;
    for (const p of this.panels)
      for (const s of p.shards) if (s.wave === this.wave && !s.taken) n++;
    return n;
  }

  total(): number {
    return this.panels.reduce((n, p) => n + p.shards.length, 0);
  }

  taken(): number {
    return this.panels.reduce((n, p) => n + p.shards.filter((s) => s.taken).length, 0);
  }

  step(dt: number, input: Input): Ev[] {
    this.ev = [];
    let left = dt;
    let first = true;
    while (left > 1e-9 && !this.dead && !this.won) {
      const h = Math.min(STEP, left);
      left -= h;
      this.tick(h, first ? input : { ...input, dash: false });
      first = false;
    }
    return this.ev;
  }

  private tick(h: number, input: Input): void {
    this.t += h;
    let ix = input.mx;
    let iy = input.my;
    const len = Math.hypot(ix, iy);
    if (len > 1) {
      ix /= len;
      iy /= len;
    }
    if (input.dash && this.dashCd <= 0) {
      this.dashT = DASH_TIME;
      this.dashCd = DASH_CD;
      for (const p of this.panels) {
        const [dx, dy] = len > 0.1 ? mirror(p.r, ix / len, iy / len) : [p.fx, p.fy];
        p.dashX = dx;
        p.dashY = dy;
      }
      this.ev.push({ t: 'dash' });
    }
    this.dashCd = Math.max(0, this.dashCd - h);
    const dashing = this.dashT > 0;
    this.dashT = Math.max(0, this.dashT - h);

    this.panels.forEach((p, i) => {
      if (i === this.anchor) {
        p.vx = p.vy = 0;
        return;
      }
      let [vx, vy] = mirror(p.r, ix, iy);
      vx *= SPEED;
      vy *= SPEED;
      if (dashing) {
        vx = p.dashX * DASH_SPEED;
        vy = p.dashY * DASH_SPEED;
      }
      p.vx = vx;
      p.vy = vy;
      const v = Math.hypot(vx, vy);
      if (v > 0.01) {
        p.fx = vx / v;
        p.fy = vy / v;
      }
      p.move(p, vx * h, vy * h, HALF, true);
    });

    this.panels.forEach((p, i) => this.hazards(p, i, h));
    this.collect();
    if (!this.won && !dashing) this.checkDeath();
  }

  private hazards(p: Panel, i: number, h: number): void {
    const t = this.t;
    for (const s of p.saws) {
      const v = sawAt(s, t);
      s.x = s.axis === 0 ? v : s.fixed;
      s.y = s.axis === 0 ? s.fixed : v;
    }
    for (const g of p.turrets) {
      g.t += h;
      if (g.t < TURRET_EVERY) continue;
      g.t -= TURRET_EVERY;
      const dx = p.x - g.x;
      const dy = p.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      this.shoot(p, i, g, dx / d, dy / d, BULLET_SPEED);
    }
    for (const g of p.hearts) {
      g.t += h;
      const every = HEART_EVERY - 0.3 * this.wave;
      if (g.t < every) continue;
      g.t -= every;
      const n = 8 + this.wave * 2;
      for (let k = 0; k < n; k++) {
        const a = g.a + (k / n) * Math.PI * 2;
        this.shoot(p, i, g, Math.cos(a), Math.sin(a), HEART_SPEED, k > 0);
      }
      g.a += Math.PI / n;
    }
    p.bullets = p.bullets.filter((b) => {
      b.x += b.vx * h;
      b.y += b.vy * h;
      return !isSolid(p.tile(Math.floor(b.x), Math.floor(b.y)));
    });
    if (t > CHASER_WAKE)
      for (const c of p.chasers) {
        const dx = p.x - c.x;
        const dy = p.y - c.y;
        const d = Math.hypot(dx, dy);
        if (d < 1e-3) continue;
        p.move(c, (dx / d) * CHASER_SPEED * h, (dy / d) * CHASER_SPEED * h, CHASER_R, true);
      }
  }

  private shoot(
    p: Panel,
    i: number,
    g: Gun,
    dx: number,
    dy: number,
    v: number,
    quiet = false,
  ): void {
    p.bullets.push({ x: g.x + dx * 0.75, y: g.y + dy * 0.75, vx: dx * v, vy: dy * v });
    if (!quiet) this.ev.push({ t: 'fire', p: i, x: g.x, y: g.y });
  }

  private collect(): void {
    this.panels.forEach((p, i) => {
      for (const s of p.shards) {
        if (s.taken || s.wave !== this.wave) continue;
        if (Math.hypot(p.x - s.x, p.y - s.y) > 0.5) continue;
        s.taken = true;
        this.ev.push({ t: 'shard', p: i, x: s.x, y: s.y, left: this.remaining() });
      }
    });
    if (this.remaining() > 0) return;
    this.wave++;
    if (this.wave >= this.waves) {
      this.won = true;
      this.ev.push({ t: 'win', time: this.t });
    } else this.ev.push({ t: 'wave', n: this.wave });
  }

  /** Čo zabije kópiu v okne p (null = nič). */
  danger(p: Panel): DeathCause | null {
    const t = this.t;
    const ch = p.tile(Math.floor(p.x), Math.floor(p.y));
    if (ch === '^') return 'spike';
    if ((ch === ':' || ch === ';') && blinkPhase(ch, t) === 'on') return 'void';
    for (const s of p.saws) if (Math.hypot(p.x - s.x, p.y - s.y) < SAW_R + HIT) return 'saw';
    for (const b of p.bullets) if (Math.hypot(p.x - b.x, p.y - b.y) < BULLET_R + HIT) return 'shot';
    if (t > CHASER_WAKE)
      for (const c of p.chasers)
        if (Math.hypot(p.x - c.x, p.y - c.y) < CHASER_R + HIT) return 'chaser';
    for (const l of p.lasers) {
      if (laserPhase(l, t) !== 'on') continue;
      const ex = l.x + 0.5;
      const ey = l.y + 0.5;
      if (l.dx) {
        const a = Math.min(ex, ex + l.dx * (l.len + 0.5));
        const b = Math.max(ex, ex + l.dx * (l.len + 0.5));
        if (Math.abs(p.y - ey) < HIT + 0.06 && p.x > a && p.x < b) return 'laser';
      } else {
        const a = Math.min(ey, ey + l.dy * (l.len + 0.5));
        const b = Math.max(ey, ey + l.dy * (l.len + 0.5));
        if (Math.abs(p.x - ex) < HIT + 0.06 && p.y > a && p.y < b) return 'laser';
      }
    }
    return null;
  }

  private checkDeath(): void {
    for (let i = 0; i < this.panels.length; i++) {
      const p = this.panels[i]!;
      const cause = this.danger(p);
      if (!cause) continue;
      this.dead = true;
      this.ev.push({ t: 'death', p: i, x: p.x, y: p.y, cause });
      return;
    }
  }
}
