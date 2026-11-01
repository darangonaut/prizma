import { updateEnemy, ENEMY } from './enemies';
import { Room, specFor, type Ent } from './room';
import type { Progress } from './save';
import {
  REALITIES,
  ROOM_H,
  ROOM_W,
  type EnemyKind,
  type Ev,
  type Input,
  type RoomDef,
} from './types';

/** Polovica šírky hráča (štvorec v dlaždiciach). */
export const PLAYER_HALF = 0.3;
const SPEED = 4.4;
const DASH_SPEED = 13;
const DASH_TIME = 0.15;
const DASH_COOLDOWN = 0.55;
const FIRE_COOLDOWN = 0.19;
const LENS_COOLDOWN = 2.2;
const SHIFT_COOLDOWN = 0.3;
const HURT_INVULN = 1.1;
const BULLET_SPEED = 12;
const STEP = 1 / 120;

export interface Player {
  x: number;
  y: number;
  r: number;
  /** Smer pohľadu (jednotkový vektor). */
  fx: number;
  fy: number;
  hp: number;
  /** Nezraniteľnosť po zásahu (s). */
  inv: number;
  dash: number;
  dashCd: number;
  dx: number;
  dy: number;
  fireCd: number;
  lensCd: number;
  shiftCd: number;
  dead: boolean;
  /** Či sa práve hýbe (pre animáciu). */
  moving: boolean;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  /** Realita nepriateľa; -1 = všetky (srdce Prizmy). */
  r: number;
  hp: number;
  max: number;
  rad: number;
  /** Časovače a stav správania. */
  t: number;
  t2: number;
  t3: number;
  t4: number;
  st: number;
  /** Ohlásená salva bossa: realita, v ktorej vystrelí (-1 = žiadna). */
  aim: number;
  vx: number;
  vy: number;
  ang: number;
  flash: number;
  /** Ohlásená realita (boss: kam sa presunie / kde vystrelí; strážca: zraniteľná realita). */
  warn: number;
  boss: boolean;
  dead: boolean;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Realita strely; -1 = hranolová strela, ktorá ide cez všetky. */
  r: number;
  foe: boolean;
  dmg: number;
  life: number;
  rad: number;
  hits?: number[];
}

export interface Drop {
  x: number;
  y: number;
  r: number;
  t: number;
}

/** Deterministický generátor (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Sim {
  readonly defs: RoomDef[];
  readonly prog: Progress;
  room!: Room;
  p: Player;
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  drops: Drop[] = [];
  readonly rand: () => number;
  time = 0;
  private nextId = 1;
  private ev: Ev[] = [];
  private touchCd = 0;
  private coreDone = false;
  /** Terminál, pri ktorom sa naposledy uložilo (aby sa neukladalo stále dokola). */
  private terminal = '';
  /** Glitche nasledujú hráča do inej reality s oneskorením. */
  private shiftedAt = -10;

  constructor(defs: RoomDef[], prog: Progress, seed = 1) {
    this.defs = defs;
    this.prog = prog;
    this.rand = rng(seed);
    this.p = {
      x: prog.x,
      y: prog.y,
      r: prog.r,
      fx: 1,
      fy: 0,
      hp: prog.maxHp,
      inv: 0,
      dash: 0,
      dashCd: 0,
      dx: 0,
      dy: 0,
      fireCd: 0,
      lensCd: 0,
      shiftCd: 0,
      dead: false,
      moving: false,
    };
    this.load(prog.room, prog.x, prog.y, prog.r);
  }

  // ---------- miestnosti ----------

  def(id: string): RoomDef {
    const d = this.defs.find((r) => r.id === id);
    if (!d) throw new Error('neznáma miestnosť ' + id);
    return d;
  }

  defAt(mx: number, my: number): RoomDef | undefined {
    return this.defs.find((r) => r.mx === mx && r.my === my);
  }

  /** Vstup do miestnosti na danom mieste. */
  load(id: string, x: number, y: number, r: number): void {
    const def = this.def(id);
    this.room = new Room(def, this.prog);
    this.p.x = x;
    this.p.y = y;
    this.p.r = r;
    this.p.dash = 0;
    this.terminal = '';
    this.bullets = [];
    this.drops = [];
    this.enemies = [];
    for (let rr = 0; rr < REALITIES; rr++) {
      const layer = def.layers[rr];
      if (!layer) continue;
      layer.forEach((row, ty) =>
        [...row].forEach((ch, tx) => {
          const spec = specFor(def, ch);
          if (spec?.k !== 'enemy') return;
          if (spec.all && rr > 0) return;
          if (this.prog.bosses.includes(spec.kind)) return;
          this.spawn(spec.kind, tx + 0.5, ty + 0.5, spec.all ? -1 : rr);
        }),
      );
    }
    const first = !this.prog.visited.includes(id);
    if (first) this.prog.visited.push(id);
    this.ev.push({ t: 'room', id, first });
    if (def.intro && !this.prog.seen.includes(def.intro)) {
      this.prog.seen.push(def.intro);
      this.ev.push({ t: 'msg', id: def.intro });
    }
  }

  spawn(kind: EnemyKind, x: number, y: number, r: number): Enemy {
    const st = ENEMY[kind];
    const e: Enemy = {
      id: this.nextId++,
      kind,
      x,
      y,
      r,
      hp: st.hp,
      max: st.hp,
      rad: st.rad,
      t: 0.6 + this.rand() * 1.2,
      t2: 0,
      t3: 0,
      t4: 0,
      st: 0,
      aim: -1,
      vx: 0,
      vy: 0,
      ang: this.rand() * Math.PI * 2,
      flash: 0,
      warn: -1,
      boss: kind === 'warden' || kind === 'heart',
      dead: false,
    };
    if (kind === 'warden') {
      e.t2 = 7;
      e.warn = -1;
    }
    if (kind === 'heart') {
      e.warn = 0;
      e.t2 = 5;
    }
    this.enemies.push(e);
    return e;
  }

  /** Obnova na poslednom termináli po smrti. */
  respawn(): void {
    this.prog.deaths++;
    this.p.hp = this.prog.maxHp;
    this.p.dead = false;
    this.p.inv = 1.5;
    this.load(this.prog.room, this.prog.x, this.prog.y, this.prog.r);
  }

  // ---------- dotazy ----------

  /** Je štvorec (stred, polovica) celý na priechodnom teréne reality r? */
  boxFree(r: number, x: number, y: number, half: number, swim = false): boolean {
    const x0 = Math.floor(x - half);
    const x1 = Math.floor(x + half - 1e-6);
    const y0 = Math.floor(y - half);
    const y1 = Math.floor(y + half - 1e-6);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++) if (!this.room.walkable(r, tx, ty, swim)) return false;
    return true;
  }

  /** Posun štvorca s kolíziou po osiach (kĺže po stenách). */
  moveBox(
    o: { x: number; y: number },
    dx: number,
    dy: number,
    half: number,
    r: number,
    swim = false,
  ): boolean {
    let hit = false;
    if (dx) {
      const nx = o.x + dx;
      if (this.boxFree(r, nx, o.y, half, swim)) o.x = nx;
      else {
        hit = true;
        // Prisunie sa až k stene.
        o.x = dx > 0 ? Math.floor(nx + half) - half - 1e-4 : Math.ceil(nx - half) + half + 1e-4;
        if (!this.boxFree(r, o.x, o.y, half, swim)) o.x -= dx;
        // Pomoc na rohoch: ak chýba málo, posunie sa okolo.
        if (!dy) this.nudge(o, 'y', half, r, swim, dx);
      }
    }
    if (dy) {
      const ny = o.y + dy;
      if (this.boxFree(r, o.x, ny, half, swim)) o.y = ny;
      else {
        hit = true;
        o.y = dy > 0 ? Math.floor(ny + half) - half - 1e-4 : Math.ceil(ny - half) + half + 1e-4;
        if (!this.boxFree(r, o.x, o.y, half, swim)) o.y -= dy;
        if (!dx) this.nudge(o, 'x', half, r, swim, dy);
      }
    }
    return hit;
  }

  private nudge(
    o: { x: number; y: number },
    axis: 'x' | 'y',
    half: number,
    r: number,
    swim: boolean,
    push: number,
  ): void {
    const c = o[axis];
    const frac = c - Math.floor(c);
    const target = Math.floor(c) + 0.5;
    if (Math.abs(frac - 0.5) < 0.12) return;
    const probe = { ...o };
    probe[axis] = target;
    const ahead = { ...probe };
    if (axis === 'y') ahead.x += Math.sign(push) * 0.3;
    else ahead.y += Math.sign(push) * 0.3;
    if (!this.boxFree(r, ahead.x, ahead.y, half, swim)) return;
    const step = Math.sign(target - c) * Math.min(Math.abs(target - c), Math.abs(push) * 0.8);
    const moved = { ...o };
    moved[axis] = c + step;
    if (this.boxFree(r, moved.x, moved.y, half, swim)) o[axis] = moved[axis];
  }

  /** Priama viditeľnosť v realite r (steny a zatvorené dvere ju zastavia). */
  los(r: number, x0: number, y0: number, x1: number, y1: number): boolean {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.ceil(d / 0.2);
    for (let i = 1; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      if (this.room.blocksShot(r, Math.floor(x), Math.floor(y))) return false;
    }
    return true;
  }

  /** Vidí nepriateľ hráča (rovnaká realita, priama čiara, dosah)? */
  sees(e: Enemy, range: number): boolean {
    const p = this.p;
    if (p.dead || (e.r !== -1 && e.r !== p.r)) return false;
    if (Math.hypot(p.x - e.x, p.y - e.y) > range) return false;
    return this.los(p.r, e.x, e.y, p.x, p.y);
  }

  fire(
    e: { x: number; y: number },
    r: number,
    ang: number,
    speed: number,
    opts: Partial<Bullet> = {},
  ): void {
    this.bullets.push({
      x: e.x,
      y: e.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r,
      foe: true,
      dmg: 1,
      life: 4,
      rad: 0.14,
      ...opts,
    });
  }

  emit(e: Ev): void {
    this.ev.push(e);
  }

  get shiftedRecently(): number {
    return this.time - this.shiftedAt;
  }

  // ---------- krok ----------

  step(dt: number, input: Input): Ev[] {
    const n = Math.max(1, Math.ceil(dt / STEP - 1e-6));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.tick(h, input);
      // Jednorazové akcie sa vykonajú len v prvom podkroku.
      if (i === 0) input = { ...input, dash: false, lens: false, shift: null };
    }
    const out = this.ev;
    this.ev = [];
    return out;
  }

  private tick(dt: number, input: Input): void {
    const p = this.p;
    this.time += dt;
    this.prog.time += dt;
    if (p.dead) return;
    p.inv = Math.max(0, p.inv - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.fireCd = Math.max(0, p.fireCd - dt);
    p.lensCd = Math.max(0, p.lensCd - dt);
    p.shiftCd = Math.max(0, p.shiftCd - dt);
    this.touchCd = Math.max(0, this.touchCd - dt);

    if (input.shift !== null) this.shift(input.shift);

    // Pohyb.
    let mx = input.mx;
    let my = input.my;
    const ml = Math.hypot(mx, my);
    if (ml > 1) {
      mx /= ml;
      my /= ml;
    }
    p.moving = ml > 0.15;
    if (p.moving) {
      p.fx = mx / Math.max(ml, 1e-6);
      p.fy = my / Math.max(ml, 1e-6);
      if (ml > 1) {
        p.fx = mx;
        p.fy = my;
      }
    }
    if (input.dash && p.dashCd <= 0 && p.dash <= 0) {
      p.dash = DASH_TIME;
      p.dashCd = DASH_COOLDOWN;
      const l = Math.hypot(mx, my);
      p.dx = l > 0.15 ? mx / l : p.fx;
      p.dy = l > 0.15 ? my / l : p.fy;
      this.ev.push({ t: 'dash' });
    }
    if (p.dash > 0) {
      p.dash -= dt;
      this.moveBox(p, p.dx * DASH_SPEED * dt, p.dy * DASH_SPEED * dt, PLAYER_HALF, p.r);
    } else if (p.moving) {
      this.moveBox(p, mx * SPEED * dt, my * SPEED * dt, PLAYER_HALF, p.r);
    }

    // Mierenie a streľba.
    let ax = input.ax;
    let ay = input.ay;
    const al = Math.hypot(ax, ay);
    if (al > 0.2) {
      ax /= al;
      ay /= al;
      if (!p.moving) {
        p.fx = ax;
        p.fy = ay;
      }
    } else {
      [ax, ay] = this.autoAim(p.fx, p.fy);
    }
    if (input.fire && p.fireCd <= 0) {
      p.fireCd = FIRE_COOLDOWN;
      const a = Math.atan2(ay, ax);
      this.bullets.push({
        x: p.x + ax * 0.35,
        y: p.y + ay * 0.35,
        vx: Math.cos(a) * BULLET_SPEED,
        vy: Math.sin(a) * BULLET_SPEED,
        r: p.r,
        foe: false,
        dmg: 1,
        life: 1.1,
        rad: 0.12,
      });
      this.ev.push({ t: 'shoot', x: p.x, y: p.y });
    }
    if (input.lens && this.prog.items.includes('lens') && p.lensCd <= 0) {
      p.lensCd = LENS_COOLDOWN;
      const a = Math.atan2(ay, ax);
      this.bullets.push({
        x: p.x + ax * 0.4,
        y: p.y + ay * 0.4,
        vx: Math.cos(a) * 10,
        vy: Math.sin(a) * 10,
        r: -1,
        foe: false,
        dmg: 4,
        life: 1.4,
        rad: 0.3,
        hits: [],
      });
      this.ev.push({ t: 'lens', x: p.x, y: p.y });
    }

    this.updateBullets(dt);
    for (const e of this.enemies) if (!e.dead) updateEnemy(this, e, dt);
    this.contact();
    this.enemies = this.enemies.filter((e) => !e.dead);
    this.updateDrops(dt);
    this.touch();
    this.edges();
  }

  /** Pomoc pri mierení: najbližší viditeľný nepriateľ v kuželi pred hráčom. */
  autoAim(fx: number, fy: number): [number, number] {
    const p = this.p;
    let best: Enemy | null = null;
    let bestScore = Infinity;
    for (const e of this.enemies) {
      if (e.dead || (e.r !== -1 && e.r !== p.r)) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 11 || d < 0.01) continue;
      const cos = (dx * fx + dy * fy) / d;
      if (cos < 0.82) continue;
      if (!this.los(p.r, p.x, p.y, e.x, e.y)) continue;
      const score = d * (2 - cos);
      if (score < bestScore) {
        bestScore = score;
        best = e;
      }
    }
    if (!best) return [fx, fy];
    const d = Math.hypot(best.x - p.x, best.y - p.y);
    return [(best.x - p.x) / d, (best.y - p.y) / d];
  }

  private shift(r: number): void {
    const p = this.p;
    if (r === p.r) {
      this.ev.push({ t: 'shiftBlocked', r, why: 'same' });
      return;
    }
    if (!this.prog.unlocked.includes(r)) {
      this.ev.push({ t: 'shiftBlocked', r, why: 'locked' });
      return;
    }
    if (p.shiftCd > 0) {
      this.ev.push({ t: 'shiftBlocked', r, why: 'cooldown' });
      return;
    }
    if (!this.boxFree(r, p.x, p.y, PLAYER_HALF)) {
      this.ev.push({ t: 'shiftBlocked', r, why: 'solid' });
      return;
    }
    // Presun na miesto nepriateľa ho roztrhne.
    for (const e of this.enemies) {
      if (e.dead || e.r !== r) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) > e.rad + PLAYER_HALF + 0.1) continue;
      this.ev.push({ t: 'telefrag', x: e.x, y: e.y, r });
      this.damage(e, e.boss ? 3 : 4, e.x - p.x, e.y - p.y);
    }
    p.r = r;
    p.shiftCd = SHIFT_COOLDOWN;
    p.inv = Math.max(p.inv, 0.12);
    this.shiftedAt = this.time;
    this.ev.push({ t: 'shift', r });
  }

  /** Zásah nepriateľa. */
  damage(e: Enemy, dmg: number, kx: number, ky: number): void {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.12;
    this.ev.push({ t: 'hit', x: e.x, y: e.y, r: e.r, boss: e.boss });
    if (!e.boss && ENEMY[e.kind].speed > 0) {
      const l = Math.hypot(kx, ky) || 1;
      this.moveBox(e, (kx / l) * 0.25, (ky / l) * 0.25, e.rad * 0.8, e.r, true);
    }
    if (e.hp > 0) return;
    e.dead = true;
    this.ev.push({ t: 'kill', kind: e.kind, x: e.x, y: e.y, r: e.r });
    if (e.boss) {
      if (!this.prog.bosses.includes(e.kind)) this.prog.bosses.push(e.kind);
      // Porazený boss otvorí dvere so signálom svojho mena.
      if (!this.prog.signals.includes(e.kind)) this.prog.signals.push(e.kind);
      this.bullets = this.bullets.filter((b) => !b.foe);
      for (const o of this.enemies) if (!o.boss) o.dead = true;
      this.room.updateBeams();
      this.ev.push({ t: 'bossDown', kind: e.kind });
    } else if (this.rand() < 0.24) {
      this.drops.push({ x: e.x, y: e.y, r: e.r === -1 ? this.p.r : e.r, t: 9 });
    }
  }

  hurt(fromX: number, fromY: number): void {
    const p = this.p;
    if (p.inv > 0 || p.dead) return;
    p.hp--;
    p.inv = HURT_INVULN;
    this.ev.push({ t: 'hurt', x: p.x, y: p.y });
    const dx = p.x - fromX;
    const dy = p.y - fromY;
    const l = Math.hypot(dx, dy) || 1;
    this.moveBox(p, (dx / l) * 0.45, (dy / l) * 0.45, PLAYER_HALF, p.r);
    if (p.hp <= 0) {
      p.dead = true;
      this.ev.push({ t: 'death' });
    }
  }

  private updateBullets(dt: number): void {
    const p = this.p;
    const room = this.room;
    for (const b of this.bullets) {
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const tx = Math.floor(b.x);
      const ty = Math.floor(b.y);
      // Hranolová strela sa riadi terénom reality, z ktorej ju hráč vystrelil.
      const r = b.r === -1 ? p.r : b.r;
      if (room.blocksShot(r, tx, ty)) {
        b.life = 0;
        if (!b.foe) this.shotHitTile(r, tx, ty, b);
        else this.ev.push({ t: 'spark', x: b.x - b.vx * dt, y: b.y - b.vy * dt, r });
        continue;
      }
      if (b.foe) {
        if (b.r !== p.r || p.dead || p.dash > 0) continue;
        if (
          Math.abs(b.x - p.x) < PLAYER_HALF + b.rad &&
          Math.abs(b.y - p.y) < PLAYER_HALF + b.rad
        ) {
          b.life = 0;
          this.hurt(b.x - b.vx, b.y - b.vy);
        }
        continue;
      }
      for (const e of this.enemies) {
        if (e.dead || b.life <= 0) continue;
        if (b.r !== -1 && e.r !== -1 && e.r !== b.r) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) > e.rad + b.rad) continue;
        if (b.hits) {
          if (b.hits.includes(e.id)) continue;
          b.hits.push(e.id);
        } else b.life = 0;
        // Srdce Prizmy je zraniteľné len v ohlásenej realite (hranolovou strelou vždy).
        if (e.kind === 'heart' && b.r !== -1 && b.r !== e.warn) {
          this.ev.push({ t: 'spark', x: b.x, y: b.y, r: b.r });
          continue;
        }
        this.damage(e, b.dmg, b.vx, b.vy);
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
  }

  private shotHitTile(r: number, tx: number, ty: number, b: Bullet): void {
    const room = this.room;
    const t = room.tile(r, tx, ty);
    if (t === '%' && tx >= 0 && ty >= 0 && tx < room.w && ty < room.h) {
      if (this.prog.items.includes('cutter') || b.r === -1) {
        room.cut(r, tx, ty);
        this.ev.push({ t: 'cut', x: tx + 0.5, y: ty + 0.5 });
        return;
      }
      if (this.touchCd <= 0) {
        this.touchCd = 2.5;
        this.ev.push({ t: 'needItem', item: 'cutter' });
      }
    }
    const e = room.blocker(r, tx, ty);
    if (e?.spec.k === 'switch' && !e.on && (!e.spec.lens || b.r === -1)) {
      this.flip(e);
      return;
    }
    this.ev.push({ t: 'spark', x: b.x - b.vx * 0.016, y: b.y - b.vy * 0.016, r });
  }

  private flip(e: Ent): void {
    if (e.spec.k !== 'switch' || e.on) return;
    e.on = true;
    if (!this.prog.signals.includes(e.spec.sig)) this.prog.signals.push(e.spec.sig);
    this.room.updateBeams();
    this.ev.push({ t: 'switch', x: e.x + 0.5, y: e.y + 0.5 });
  }

  /** Dotyk s nepriateľom zraňuje. */
  private contact(): void {
    const p = this.p;
    if (p.dead || p.dash > 0) return;
    for (const e of this.enemies) {
      if (e.dead || (e.r !== -1 && e.r !== p.r)) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.rad + PLAYER_HALF * 0.8) this.hurt(e.x, e.y);
    }
  }

  private updateDrops(dt: number): void {
    const p = this.p;
    for (const d of this.drops) {
      d.t -= dt;
      if (d.r !== p.r || d.t <= 0) continue;
      if (Math.hypot(d.x - p.x, d.y - p.y) < 0.6 && p.hp < this.prog.maxHp) {
        p.hp++;
        d.t = 0;
        this.ev.push({ t: 'heal' });
      }
    }
    this.drops = this.drops.filter((d) => d.t > 0);
  }

  /** Predmety pod hráčom a zariadenia, ktorých sa dotkne. */
  private touch(): void {
    const p = this.p;
    const room = this.room;
    const prog = this.prog;
    for (const e of room.ents) {
      if (!room.inReality(e, p.r) || !room.present(e)) continue;
      const s = e.spec;
      const dx = Math.abs(e.x + 0.5 - p.x);
      const dy = Math.abs(e.y + 0.5 - p.y);
      const over = dx < 0.5 + PLAYER_HALF - 0.1 && dy < 0.5 + PLAYER_HALF - 0.1;
      const near = dx < 0.5 + PLAYER_HALF + 0.25 && dy < 0.5 + PLAYER_HALF + 0.25;
      if (!near) continue;
      switch (s.k) {
        case 'item':
          if (!over) break;
          prog.taken.push(e.uid);
          if (!prog.items.includes(s.item)) prog.items.push(s.item);
          this.ev.push({ t: 'pickup', item: s.item });
          break;
        case 'crystal':
          if (!over) break;
          prog.taken.push(e.uid);
          if (!prog.unlocked.includes(s.reality)) {
            prog.unlocked.push(s.reality);
            prog.unlocked.sort();
          }
          this.ev.push({ t: 'unlock', r: s.reality });
          break;
        case 'health':
          if (!over) break;
          prog.taken.push(e.uid);
          prog.maxHp++;
          p.hp = prog.maxHp;
          this.ev.push({ t: 'health' });
          break;
        case 'trigger':
          if (!over) break;
          prog.taken.push(e.uid);
          this.ev.push({ t: 'msg', id: s.msg });
          break;
        case 'log':
        case 'echo': {
          if (!over) break;
          const list = s.k === 'log' ? prog.logs : prog.echoes;
          if (list.includes(s.id)) break;
          list.push(s.id);
          this.ev.push({ t: 'read', kind: s.k, id: s.id });
          break;
        }
        case 'core':
          if (!over || this.coreDone) break;
          this.coreDone = true;
          this.ev.push({ t: 'core' });
          break;
        case 'terminal': {
          if (this.terminal === e.uid && p.hp >= prog.maxHp) break;
          this.terminal = e.uid;
          prog.room = room.def.id;
          // Obnoví sa na voľnom mieste pri termináli (tam, kde hráč stojí).
          prog.x = p.x;
          prog.y = p.y;
          prog.r = p.r;
          p.hp = prog.maxHp;
          this.ev.push({ t: 'save' });
          break;
        }
        case 'lock':
          if (e.on) break;
          if (prog.items.includes('card')) {
            e.on = true;
            prog.taken.push(e.uid);
            room.updateBeams();
            this.ev.push({ t: 'open' });
          } else if (this.touchCd <= 0) {
            this.touchCd = 2.5;
            this.ev.push({ t: 'needItem', item: 'card' });
          }
          break;
        case 'switch':
          if (!s.lens) this.flip(e);
          break;
        case 'emitter':
          break;
        default:
          break;
      }
    }
    // Do lúča sa nedá vojsť; kto sa oň oprie, toho popáli.
    const near = (tx: number, ty: number) =>
      tx >= 0 &&
      ty >= 0 &&
      tx < room.w &&
      ty < room.h &&
      room.beam[p.r * room.w * room.h + ty * room.w + tx] === 1;
    const reach = PLAYER_HALF + 0.08;
    for (const [ox, oy] of [
      [reach, 0],
      [-reach, 0],
      [0, reach],
      [0, -reach],
    ] as const) {
      const tx = Math.floor(p.x + ox);
      const ty = Math.floor(p.y + oy);
      if (near(tx, ty) && p.inv <= 0) {
        this.ev.push({ t: 'zap' });
        this.hurt(tx + 0.5, ty + 0.5);
        break;
      }
    }
  }

  /** Prechod do susednej miestnosti cez otvor na okraji. */
  private edges(): void {
    const p = this.p;
    const d = this.room.def;
    let nx = p.x;
    let ny = p.y;
    let mx = d.mx;
    let my = d.my;
    if (p.x < 0) {
      mx--;
      nx = ROOM_W - 0.35;
    } else if (p.x >= ROOM_W) {
      mx++;
      nx = 0.35;
    } else if (p.y < 0) {
      my--;
      ny = ROOM_H - 0.35;
    } else if (p.y >= ROOM_H) {
      my++;
      ny = 0.35;
    } else return;
    const next = this.defAt(mx, my);
    if (!next) {
      p.x = Math.max(PLAYER_HALF, Math.min(ROOM_W - PLAYER_HALF, p.x));
      p.y = Math.max(PLAYER_HALF, Math.min(ROOM_H - PLAYER_HALF, p.y));
      return;
    }
    this.load(next.id, nx, ny, p.r);
  }
}
