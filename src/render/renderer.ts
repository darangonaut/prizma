import { Application, Container, Graphics } from 'pixi.js';
import { DX, DY, type Dir, type Ev } from '@/game/types';
import type { Ent, World } from '@/game/world';
import { NeonPost } from './post';
import { DANGER, PALETTES, WHITE, mix } from './palette';

/** Veľkosť dlaždice vo svetových jednotkách (svet sa potom zmenší na obrazovku). */
export const T = 48;

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Deterministický šum pre ozdoby dlaždíc. */
function hash(n: number): number {
  let x = (n * 374761393) ^ 0x5bf03635;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}

interface Pos {
  x: number;
  y: number;
}

export class Renderer {
  readonly app: Application;
  private post = new NeonPost();
  private root = new Container();
  private bg = new Graphics();
  private view = new Container();
  private ghost = new Graphics();
  private terrain: Graphics[] = [];
  private terrainKey: string[] = [];
  private floorLayer = new Graphics();
  private solidLayer = new Graphics();
  private beamLayer = new Graphics();
  private playerLayer = new Graphics();
  private fxLayer = new Graphics();
  private world: World | null = null;
  private drawn = new Map<number, Pos>();
  private player: Pos = { x: 0, y: 0 };
  private time = 0;
  private glitch = 0;
  private flash = 0;
  private nudge = 0;
  private shake = 0;
  private rings: { x: number; y: number; t: number; color: number }[] = [];
  private sparks: { x: number; y: number; vx: number; vy: number; t: number; color: number }[] = [];
  insets: Insets = { top: 60, bottom: 90, left: 12, right: 12 };
  /** Nápoveda: najbližšie kroky riešenia (smer alebo presun do reality). */
  hint: { x: number; y: number; r: number; dir?: number; shift?: boolean }[] = [];
  /** Nahliadnutie do ostatných realít (podržané tlačidlo). */
  peek = 0;
  peekTarget = 0;
  scale = 1;

  constructor(app: Application) {
    this.app = app;
    this.root.filters = [this.post.filter];
    this.root.addChild(this.bg, this.view);
    this.view.addChild(
      this.ghost,
      this.floorLayer,
      this.solidLayer,
      this.beamLayer,
      this.playerLayer,
      this.fxLayer,
    );
    app.stage.addChild(this.root);
  }

  setWorld(world: World): void {
    this.world = world;
    for (const g of this.terrain) g.destroy();
    this.terrain = [];
    this.terrainKey = [];
    for (let r = 0; r < world.layers; r++) {
      const g = new Graphics();
      this.terrain.push(g);
      this.terrainKey.push('');
      this.view.addChildAt(g, r);
    }
    this.snap();
    this.layout();
    this.glitch = 1;
  }

  /** Okamžite presunie kreslené pozície na skutočné (po späť / reštarte). */
  snap(): void {
    const w = this.world;
    if (!w) return;
    this.player = { x: w.px, y: w.py };
    this.drawn.clear();
    for (const e of w.ents) this.drawn.set(e.id, { x: e.x, y: e.y });
  }

  layout(): void {
    const w = this.world;
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    this.drawBackground(sw, sh);
    if (!w) return;
    const ins = this.insets;
    const availW = Math.max(100, sw - ins.left - ins.right);
    const availH = Math.max(100, sh - ins.top - ins.bottom);
    const s = Math.min(availW / ((w.w + 0.6) * T), availH / ((w.h + 0.6) * T), 1.6);
    this.scale = s;
    this.view.scale.set(s);
    this.view.position.set(
      Math.round(ins.left + (availW - w.w * T * s) / 2),
      Math.round(ins.top + (availH - w.h * T * s) / 2),
    );
  }

  private drawBackground(sw: number, sh: number): void {
    const g = this.bg.clear();
    const pal = PALETTES[this.world?.pr ?? 0]!;
    g.rect(0, 0, sw, sh).fill(pal.bg);
    const n = Math.floor((sw * sh) / 2600);
    for (let i = 0; i < n; i++) {
      const x = hash(i * 3 + 1) * sw;
      const y = hash(i * 3 + 2) * sh;
      const b = hash(i * 3 + 3);
      g.circle(x, y, b > 0.96 ? 1.4 : 0.7).fill({
        color: b > 0.9 ? pal.neon : WHITE,
        alpha: 0.15 + b * 0.35,
      });
    }
  }

  /** Reakcia na udalosti hry (efekty). */
  events(ev: Ev[]): void {
    const w = this.world;
    if (!w) return;
    const cx = (w.px + 0.5) * T;
    const cy = (w.py + 0.5) * T;
    for (const e of ev) {
      if (e.t === 'shift') {
        this.glitch = 1;
        this.flash = 1;
        this.rings.push({ x: cx, y: cy, t: 0, color: PALETTES[e.r]!.neon });
        this.drawBackground(this.app.screen.width, this.app.screen.height);
      } else if (e.t === 'shiftBlocked' || e.t === 'blocked') {
        this.nudge = 1;
        if (e.t === 'shiftBlocked' && e.why !== 'same') this.glitch = Math.max(this.glitch, 0.35);
      } else if (e.t === 'push') {
        const fx = cx + DX[w.facing] * T;
        const fy = cy + DY[w.facing] * T;
        this.burst(fx, fy, e.twin ? WHITE : PALETTES[w.pr]!.neon, 6);
        if (e.twin) this.glitch = Math.max(this.glitch, 0.25);
      } else if (e.t === 'pickup' || e.t === 'unlock') {
        const color = e.t === 'unlock' ? PALETTES[e.r]!.neon : WHITE;
        this.rings.push({ x: cx, y: cy, t: 0, color });
        this.burst(cx, cy, color, 18);
        if (e.t === 'unlock') this.glitch = 1;
      } else if (e.t === 'cut') {
        this.burst(cx + DX[w.facing] * T, cy + DY[w.facing] * T, PALETTES[2]!.neon, 12);
      } else if (e.t === 'receiver' && e.lit) {
        this.shake = 0.4;
      } else if (e.t === 'exit') {
        this.rings.push({ x: cx, y: cy, t: 0, color: WHITE });
        this.glitch = 0.6;
      }
    }
  }

  private burst(x: number, y: number, color: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 40 + Math.random() * 120;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, color });
    }
  }

  frame(dt: number): void {
    const w = this.world;
    this.time += dt;
    this.glitch = Math.max(0, this.glitch - dt * 2.2);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.nudge = Math.max(0, this.nudge - dt * 6);
    this.shake = Math.max(0, this.shake - dt * 2);
    this.peek += (this.peekTarget - this.peek) * Math.min(1, dt * 12);
    this.post.update(
      this.time,
      this.glitch,
      Math.max(0.75, this.scale * this.app.renderer.resolution),
    );
    if (!w) return;

    const k = Math.min(1, dt * 20);
    this.player.x += (w.px - this.player.x) * k;
    this.player.y += (w.py - this.player.y) * k;
    for (const e of w.ents) {
      const d = this.drawn.get(e.id) ?? { x: e.x, y: e.y };
      d.x += (e.x - d.x) * k;
      d.y += (e.y - d.y) * k;
      this.drawn.set(e.id, d);
    }

    for (let r = 0; r < w.layers; r++) {
      const key = w.terrain[r]! + (w.drained() ? 'd' : '') + [...w.unlocked].join('');
      if (this.terrainKey[r] !== key) {
        this.terrainKey[r] = key;
        this.drawTerrain(this.terrain[r]!, r);
      }
      this.terrain[r]!.visible = r === w.pr;
    }
    this.drawGhost();
    this.drawDynamic();
    this.drawBeams();
    this.drawPlayer();
    this.drawFx(dt);
    const sx = this.shake ? (Math.random() - 0.5) * this.shake * 6 : 0;
    this.root.position.set(sx, 0);
  }

  // ---------- terén ----------

  private drawTerrain(g: Graphics, r: number): void {
    const w = this.world!;
    const pal = PALETTES[r]!;
    g.clear();
    const drained = w.drained();
    for (let y = 0; y < w.h; y++) {
      for (let x = 0; x < w.w; x++) {
        const t = w.tile(r, x, y);
        const X = x * T;
        const Y = y * T;
        const h = hash(y * 977 + x * 131 + r * 7);
        if (t === ' ') continue;
        if (t === '#') {
          g.rect(X, Y, T, T).fill(pal.wall);
          g.rect(X, Y, T, T).fill({ color: 0x000000, alpha: 0.6 });
          // Jemné šrafovanie, aby stena pôsobila plne.
          for (let i = 1; i < 4; i++) {
            const o = (i * T) / 4;
            g.moveTo(X + o, Y).lineTo(X, Y + o);
            g.moveTo(X + T, Y + o).lineTo(X + o, Y + T);
          }
          g.stroke({ width: 1, color: pal.neon, alpha: 0.07 });
          continue;
        }
        // Podlaha pod všetkým ostatným.
        g.rect(X, Y, T, T).fill(pal.floor);
        g.rect(X + 1, Y + 1, T - 2, T - 2).stroke({ width: 1, color: pal.neon, alpha: 0.06 });
        g.circle(X, Y, 1.6).fill({ color: pal.neon, alpha: 0.22 });
        if (t === '~' && !drained) {
          g.rect(X, Y, T, T).fill({ color: mix(pal.bg, pal.neon, 0.2), alpha: 1 });
          g.rect(X + 2, Y + 2, T - 4, T - 4).stroke({ width: 1, color: pal.neon, alpha: 0.12 });
        } else if (t === '~' || t === ',') {
          // Plytká / vypustená voda: odlesky.
          for (let i = 0; i < 2; i++) {
            const ox = X + 8 + hash(x * 13 + y * 7 + i) * (T - 20);
            const oy = Y + 10 + hash(x * 5 + y * 17 + i) * (T - 20);
            g.moveTo(ox, oy).quadraticCurveTo(ox + 5, oy - 3, ox + 10, oy);
          }
          g.stroke({ width: 1.2, color: pal.neon, alpha: t === '~' ? 0.12 : 0.25 });
        } else if (t === '"') {
          for (let i = 0; i < 3; i++) {
            const ox = X + 6 + hash(x * 31 + y * 3 + i) * (T - 12);
            const oy = Y + 10 + hash(x * 7 + y * 29 + i) * (T - 16);
            g.moveTo(ox, oy)
              .lineTo(ox - 2, oy - 6)
              .moveTo(ox, oy)
              .lineTo(ox + 3, oy - 5);
          }
          g.stroke({ width: 1.2, color: pal.neon, alpha: 0.3 });
        } else if (t === '%') {
          g.rect(X, Y, T, T).fill({ color: mix(pal.floor, pal.neon, 0.12) });
          for (let i = 0; i < 4; i++) {
            const ox = X + hash(x * 11 + y * 19 + i) * T;
            const oy = Y + hash(x * 23 + y * 3 + i) * T;
            g.moveTo(ox, oy).bezierCurveTo(
              ox + 14,
              oy - 10,
              ox - 6,
              oy + 18,
              X + hash(i + x) * T,
              Y + T * hash(i * 3 + y),
            );
          }
          g.stroke({ width: 2, color: pal.neon, alpha: 0.75 });
          for (let i = 0; i < 5; i++)
            g.circle(
              X + 6 + hash(x * 3 + i * 7 + y) * (T - 12),
              Y + 6 + hash(y * 5 + i * 11 + x) * (T - 12),
              2.4,
            );
          g.fill({ color: pal.neon, alpha: 0.6 });
        } else if (t === 'x') {
          for (let i = 0; i < 3; i++) {
            const cx = X + 10 + hash(x * 7 + y * 3 + i * 5) * (T - 20);
            const cy = Y + 10 + hash(x * 3 + y * 7 + i * 9) * (T - 20);
            const s = 7 + hash(i + x * y) * 8;
            g.poly([
              cx - s,
              cy,
              cx - s * 0.3,
              cy - s * 0.8,
              cx + s,
              cy - s * 0.2,
              cx + s * 0.4,
              cy + s * 0.7,
            ]);
          }
          g.fill({ color: pal.wall }).stroke({ width: 1.5, color: pal.neon, alpha: 0.55 });
        } else if (t === ':') {
          if (h > 0.6) g.rect(X + h * 20, Y + 8, 10, 4).fill({ color: pal.neon, alpha: 0.18 });
          if (h < 0.25)
            g.rect(X + 6, Y + 6 + h * 60, T - 12, 2).fill({ color: 0x000000, alpha: 0.7 });
        }
      }
    }
    // Neónové okraje stien a prázdna.
    for (let y = 0; y < w.h; y++) {
      for (let x = 0; x < w.w; x++) {
        const t = w.tile(r, x, y);
        if (t !== '#' && t !== ' ' && !(t === '~' && !drained)) continue;
        for (let d = 0; d < 4; d++) {
          const n = w.tile(r, x + DX[d as Dir], y + DY[d as Dir]);
          const open = n !== '#' && n !== ' ' && !(n === '~' && !drained && t !== '#');
          if (!open || n === t) continue;
          this.edge(g, x, y, d, pal.neon, t === '#' ? 1 : t === ' ' ? 0.55 : 0.35, t === ' ');
        }
      }
    }
  }

  /** Neónová hrana na strane d dlaždice (x, y). */
  private edge(
    g: Graphics,
    x: number,
    y: number,
    d: number,
    color: number,
    alpha: number,
    dashed = false,
  ): void {
    const X = x * T;
    const Y = y * T;
    const seg = (inset: number): [number, number, number, number] => {
      if (d === 0) return [X, Y + inset, X + T, Y + inset];
      if (d === 2) return [X, Y + T - inset, X + T, Y + T - inset];
      if (d === 3) return [X + inset, Y, X + inset, Y + T];
      return [X + T - inset, Y, X + T - inset, Y + T];
    };
    const [a, b, c, e] = seg(3);
    if (dashed) {
      for (let i = 0; i < 4; i++) {
        const t0 = i / 4 + 0.03;
        const t1 = t0 + 0.14;
        g.moveTo(a + (c - a) * t0, b + (e - b) * t0).lineTo(a + (c - a) * t1, b + (e - b) * t1);
      }
      g.stroke({ width: 2, color, alpha });
      return;
    }
    g.moveTo(a, b).lineTo(c, e).stroke({ width: 2.5, color, alpha });
    const [a2, b2, c2, e2] = seg(8);
    g.moveTo(a2, b2)
      .lineTo(c2, e2)
      .stroke({ width: 1, color, alpha: alpha * 0.35 });
  }

  /**
   * Zrkadlové svety presvitajú: ostatné reality sa kreslia len tam, kde sa líšia od tejto.
   * Plná šrafa = tam je prekážka (presun sem nepôjde), čiarkovaný rám = tam je priechod.
   */
  private drawGhost(): void {
    const w = this.world!;
    const g = this.ghost.clear();
    const strong = this.peek;
    const blocked = (r: number, x: number, y: number) =>
      !w.walkableTerrain(r, x, y) && w.tile(r, x, y) !== '%';
    for (let r = 0; r < w.layers; r++) {
      if (r === w.pr || !w.unlocked.has(r)) continue;
      const pal = PALETTES[r]!;
      const off = (r - w.pr) * 2 * (1 - strong);
      for (let y = 0; y < w.h; y++) {
        for (let x = 0; x < w.w; x++) {
          const here = blocked(w.pr, x, y) || w.tile(w.pr, x, y) === '%';
          const there = blocked(r, x, y) || w.tile(r, x, y) === '%';
          if (here === there) continue;
          const X = x * T + off;
          const Y = y * T + off;
          if (there) {
            // Prekážka v inej realite nad našou podlahou.
            g.rect(X + 4, Y + 4, T - 8, T - 8).fill({
              color: pal.neon,
              alpha: 0.04 + strong * 0.12,
            });
            for (let i = 1; i < 3; i++) {
              const o = (i * (T - 8)) / 3;
              g.moveTo(X + 4 + o, Y + 4).lineTo(X + 4, Y + 4 + o);
              g.moveTo(X + T - 4, Y + 4 + o).lineTo(X + 4 + o, Y + T - 4);
            }
            g.stroke({ width: 1, color: pal.neon, alpha: 0.1 + strong * 0.45 });
          } else {
            // Priechod v inej realite tam, kde je u nás stena.
            const k = 6;
            for (const [ax, ay, bx, by] of [
              [X + k, Y + k, X + T - k, Y + k],
              [X + T - k, Y + k, X + T - k, Y + T - k],
              [X + T - k, Y + T - k, X + k, Y + T - k],
              [X + k, Y + T - k, X + k, Y + k],
            ] as const) {
              for (let i = 0; i < 3; i++) {
                const t0 = i / 3 + 0.04;
                const t1 = t0 + 0.2;
                g.moveTo(ax + (bx - ax) * t0, ay + (by - ay) * t0).lineTo(
                  ax + (bx - ax) * t1,
                  ay + (by - ay) * t1,
                );
              }
            }
            g.stroke({ width: 1.5, color: pal.neon, alpha: 0.22 + strong * 0.6 });
          }
        }
      }
      if (strong > 0.05) {
        for (const e of w.ents) {
          if (e.r !== r || w.gone(e) || e.k === 'trigger') continue;
          this.drawEnt(e, r, strong * 0.7, true);
        }
      }
    }
  }

  // ---------- entity ----------

  private drawDynamic(): void {
    const w = this.world!;
    this.floorLayer.clear();
    this.solidLayer.clear();
    const r = w.pr;
    const pal = PALETTES[r]!;
    // Hlboká voda sa vlní.
    if (!w.drained()) {
      const g = this.floorLayer;
      for (let y = 0; y < w.h; y++)
        for (let x = 0; x < w.w; x++) {
          if (w.tile(r, x, y) !== '~') continue;
          for (let i = 0; i < 2; i++) {
            const oy = y * T + 14 + i * 18 + Math.sin(this.time * 1.6 + x * 0.9 + i) * 3;
            g.moveTo(x * T + 4, oy);
            for (let s = 1; s <= 4; s++)
              g.lineTo(
                x * T + 4 + s * 10,
                oy + Math.sin(this.time * 2.4 + x * 2 + s * 1.7 + i) * 2.5,
              );
          }
        }
      g.stroke({ width: 1.4, color: pal.neon, alpha: 0.35 });
    }
    for (const e of w.ents) {
      if (w.gone(e) || e.k === 'trigger') continue;
      if (e.r !== -1 && e.r !== r) continue;
      this.drawEnt(e, r, 1, false);
    }
  }

  private drawEnt(e: Ent, r: number, alpha: number, ghost: boolean): void {
    const w = this.world!;
    const pal = PALETTES[e.r === -1 ? r : e.r]!;
    const c = pal.neon;
    const d = ghost ? { x: e.x, y: e.y } : (this.drawn.get(e.id) ?? e);
    const X = d.x * T;
    const Y = d.y * T;
    const cx = X + T / 2;
    const cy = Y + T / 2;
    const t = this.time;
    const floor = ghost ? this.ghost : this.floorLayer;
    const solid = ghost ? this.ghost : this.solidLayer;
    const s = e.spec;
    switch (s.k) {
      case 'plate': {
        const on = w.signal(s.sig);
        floor
          .rect(X + 8, Y + 8, T - 16, T - 16)
          .fill({ color: c, alpha: (on ? 0.35 : 0.08) * alpha });
        floor
          .rect(X + 8, Y + 8, T - 16, T - 16)
          .stroke({ width: 2, color: c, alpha: (on ? 1 : 0.6) * alpha });
        floor
          .rect(X + 14, Y + 14, T - 28, T - 28)
          .stroke({ width: 1, color: c, alpha: 0.5 * alpha });
        break;
      }
      case 'exit': {
        const p = (t * 0.8) % 1;
        floor.circle(cx, cy, T * 0.38).stroke({ width: 2, color: WHITE, alpha: 0.8 * alpha });
        floor
          .circle(cx, cy, T * 0.38 * p)
          .stroke({ width: 2, color: WHITE, alpha: (1 - p) * alpha });
        for (let i = 0; i < 3; i++) {
          const oy = cy + 8 - i * 7;
          floor
            .moveTo(cx - 7, oy)
            .lineTo(cx, oy - 6)
            .lineTo(cx + 7, oy);
        }
        floor.stroke({ width: 2, color: WHITE, alpha: 0.6 * alpha });
        break;
      }
      case 'phase': {
        const to = PALETTES[s.to]!.neon;
        floor.circle(cx, cy, T * 0.36).stroke({ width: 3, color: to, alpha: 0.8 * alpha });
        floor.circle(cx, cy, T * 0.26).stroke({ width: 1.5, color: c, alpha: 0.8 * alpha });
        for (let i = 0; i < 3; i++) {
          const a = t * 2 + (i * Math.PI * 2) / 3;
          floor
            .circle(cx + Math.cos(a) * T * 0.36, cy + Math.sin(a) * T * 0.36, 2.5)
            .fill({ color: to, alpha });
        }
        break;
      }
      case 'item': {
        const bob = Math.sin(t * 3 + e.id) * 3;
        if (s.item === 'card') {
          floor
            .roundRect(cx - 10, cy - 7 + bob, 20, 14, 2)
            .fill({ color: pal.bg, alpha })
            .stroke({ width: 2, color: WHITE, alpha });
          floor.rect(cx - 6, cy - 2 + bob, 6, 4).fill({ color: c, alpha });
        } else {
          floor
            .poly([
              cx - 10,
              cy + 8 + bob,
              cx + 8,
              cy - 10 + bob,
              cx + 11,
              cy - 7 + bob,
              cx - 7,
              cy + 11 + bob,
            ])
            .fill({ color: WHITE, alpha });
          floor.circle(cx - 8, cy + 9 + bob, 4).stroke({ width: 2, color: c, alpha });
        }
        floor.circle(cx, cy + bob, T * 0.34).stroke({ width: 1, color: WHITE, alpha: 0.3 * alpha });
        break;
      }
      case 'crystal': {
        const col = PALETTES[s.reality]!.neon;
        const a = t * 1.2;
        const pts: number[] = [];
        for (let i = 0; i < 3; i++) {
          const ang = a + (i * Math.PI * 2) / 3;
          pts.push(cx + Math.cos(ang) * 13, cy + Math.sin(ang) * 13);
        }
        for (let i = 0; i < 6; i++) {
          const ang = -a * 0.5 + (i * Math.PI) / 3;
          floor.moveTo(cx, cy).lineTo(cx + Math.cos(ang) * 22, cy + Math.sin(ang) * 22);
        }
        floor.stroke({ width: 1, color: col, alpha: 0.4 * alpha });
        floor
          .poly(pts)
          .fill({ color: col, alpha: 0.35 * alpha })
          .stroke({ width: 2, color: WHITE, alpha });
        break;
      }
      case 'crate': {
        const twin = e.r === -1;
        const col = twin ? WHITE : c;
        solid
          .rect(X + 6, Y + 6, T - 12, T - 12)
          .fill({ color: pal.wall, alpha })
          .stroke({ width: 2.5, color: col, alpha });
        if (twin) {
          // Previazaná bedňa: znak ∞ a rohy vo farbách všetkých realít.
          const k = 9;
          solid
            .moveTo(cx, cy)
            .bezierCurveTo(cx + k, cy - k, cx + k * 1.6, cy + k, cx, cy)
            .bezierCurveTo(cx - k, cy - k, cx - k * 1.6, cy + k, cx, cy);
          solid.stroke({ width: 2, color: WHITE, alpha: (0.7 + Math.sin(t * 4) * 0.3) * alpha });
          const corners = [
            [X + 9, Y + 9],
            [X + T - 9, Y + 9],
            [X + T - 9, Y + T - 9],
            [X + 9, Y + T - 9],
          ];
          corners.forEach(([px, py], i) => {
            if (i < w.layers) solid.circle(px!, py!, 2.5).fill({ color: PALETTES[i]!.neon, alpha });
          });
        } else {
          solid
            .moveTo(X + 11, Y + 11)
            .lineTo(X + T - 11, Y + T - 11)
            .moveTo(X + T - 11, Y + 11)
            .lineTo(X + 11, Y + T - 11);
          solid.stroke({ width: 1.5, color: col, alpha: 0.5 * alpha });
        }
        break;
      }
      case 'door':
      case 'lock': {
        const open = s.k === 'door' ? w.isOpen(e) : e.on;
        const horiz = w.tile(r, e.x - 1, e.y) === '#' || w.tile(r, e.x + 1, e.y) === '#';
        const col = s.k === 'lock' ? WHITE : c;
        if (open) {
          solid
            .rect(X + 3, Y + 3, T - 6, T - 6)
            .stroke({ width: 1, color: col, alpha: 0.25 * alpha });
          break;
        }
        solid.rect(X, Y, T, T).fill({ color: pal.wall, alpha: 0.8 * alpha });
        for (let i = 0; i < 4; i++) {
          const o = 8 + i * 10.5;
          if (horiz) solid.moveTo(X + o, Y + 4).lineTo(X + o, Y + T - 4);
          else solid.moveTo(X + 4, Y + o).lineTo(X + T - 4, Y + o);
        }
        solid.stroke({ width: 2.5, color: col, alpha });
        if (s.k === 'lock') {
          solid
            .roundRect(cx - 9, cy - 6, 18, 12, 2)
            .fill({ color: pal.bg, alpha })
            .stroke({ width: 1.5, color: c, alpha });
        } else {
          // Kontrolky: farba reality, z ktorej ide signál.
          s.open.forEach((sig, i) => {
            const src = w.ents.find(
              (o) =>
                (o.spec.k === 'plate' || o.spec.k === 'switch' || o.spec.k === 'receiver') &&
                o.spec.sig === sig,
            );
            const on = w.signal(sig);
            const sc = src ? PALETTES[src.r === -1 ? r : src.r]!.neon : WHITE;
            const px = cx + (i - (s.open.length - 1) / 2) * 10;
            solid
              .circle(px, cy, 3.5)
              .fill({ color: on ? sc : 0x000000, alpha })
              .stroke({ width: 1.5, color: sc, alpha });
          });
        }
        break;
      }
      case 'switch': {
        solid
          .circle(cx, cy, 12)
          .fill({ color: pal.wall, alpha })
          .stroke({ width: 2, color: c, alpha });
        const a = e.on ? -0.8 : -2.35;
        solid
          .moveTo(cx, cy)
          .lineTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14)
          .stroke({ width: 3, color: e.on ? WHITE : c, alpha });
        break;
      }
      case 'log': {
        solid
          .roundRect(X + 8, Y + 10, T - 16, T - 20, 3)
          .fill({ color: pal.wall, alpha })
          .stroke({ width: 2, color: c, alpha });
        const blink = Math.sin(t * 5 + e.id) > 0 ? 1 : 0.4;
        for (let i = 0; i < 3; i++)
          solid.rect(X + 13, Y + 15 + i * 5, (T - 30) * (0.5 + hash(i + e.id) * 0.5), 2);
        solid.fill({ color: c, alpha: 0.8 * alpha });
        solid.rect(X + T - 16, Y + T - 16, 3, 3).fill({ color: WHITE, alpha: blink * alpha });
        break;
      }
      case 'echo': {
        // Ozvena — iná verzia teba, bliká ako zlý signál.
        const fl = 0.55 + 0.45 * Math.sin(t * 9 + e.id * 3) * Math.sin(t * 2.3);
        const jx = Math.sin(t * 40 + e.id) > 0.92 ? 3 : 0;
        this.figure(solid, cx + jx, cy, c, alpha * fl, 2, true);
        break;
      }
      case 'emitter': {
        solid
          .rect(X + 7, Y + 7, T - 14, T - 14)
          .fill({ color: pal.wall, alpha })
          .stroke({ width: 2, color: c, alpha });
        const lx = cx + DX[s.dir] * 14;
        const ly = cy + DY[s.dir] * 14;
        solid.circle(lx, ly, 5).fill({ color: WHITE, alpha });
        solid.circle(cx, cy, 6).stroke({ width: 1.5, color: c, alpha });
        break;
      }
      case 'receiver': {
        const lit = w.isLit(e);
        solid
          .poly([cx, cy - 15, cx + 15, cy, cx, cy + 15, cx - 15, cy])
          .fill({ color: lit ? c : pal.wall, alpha: (lit ? 0.6 : 1) * alpha })
          .stroke({ width: 2, color: lit ? WHITE : c, alpha });
        solid.circle(cx, cy, 4).fill({ color: lit ? WHITE : c, alpha });
        break;
      }
      case 'mirror': {
        solid
          .circle(cx, cy, 15)
          .fill({ color: pal.wall, alpha })
          .stroke({ width: 1.5, color: c, alpha: (s.fixed ? 0.3 : 0.7) * alpha });
        const k = 15;
        if (e.o === 0) solid.moveTo(cx - k, cy + k).lineTo(cx + k, cy - k);
        else solid.moveTo(cx - k, cy - k).lineTo(cx + k, cy + k);
        solid.stroke({ width: 4, color: WHITE, alpha });
        break;
      }
      case 'core': {
        const p = 0.5 + 0.5 * Math.sin(t * 2);
        for (let i = 0; i < w.layers; i++) {
          const a = t * 0.7 + (i * Math.PI * 2) / w.layers;
          solid
            .circle(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18, 5)
            .fill({ color: PALETTES[i]!.neon, alpha });
        }
        const pts: number[] = [];
        for (let i = 0; i < 3; i++) {
          const ang = -t * 0.4 + (i * Math.PI * 2) / 3;
          pts.push(cx + Math.cos(ang) * 16, cy + Math.sin(ang) * 16);
        }
        solid
          .poly(pts)
          .fill({ color: WHITE, alpha: (0.4 + p * 0.4) * alpha })
          .stroke({ width: 2, color: WHITE, alpha });
        break;
      }
      default:
        break;
    }
  }

  /** Postava zhora: hlava, ramená, priezor. */
  private figure(
    g: Graphics,
    cx: number,
    cy: number,
    color: number,
    alpha: number,
    facing: number,
    echo = false,
  ): void {
    const fx = DX[facing as 0];
    const fy = DY[facing as 0];
    g.ellipse(cx, cy + 2, 14, 11)
      .fill({ color: 0x000000, alpha: 0.6 * alpha })
      .stroke({ width: 2, color, alpha });
    g.circle(cx + fx * 3, cy + fy * 3, 8)
      .fill({ color: echo ? 0x000000 : 0x0b0f14, alpha })
      .stroke({ width: 2, color, alpha });
    g.moveTo(cx + fx * 6 - fy * 5, cy + fy * 6 - fx * 5)
      .lineTo(cx + fx * 6 + fy * 5, cy + fy * 6 + fx * 5)
      .stroke({ width: 3, color: WHITE, alpha: alpha * 0.9 });
    if (echo)
      for (let i = 0; i < 3; i++)
        g.rect(cx - 14, cy - 8 + i * 7, 28, 1).fill({ color, alpha: alpha * 0.4 });
  }

  // ---------- lúče, hráč, efekty ----------

  private drawBeams(): void {
    const w = this.world!;
    const g = this.beamLayer.clear();
    for (const b of w.beams) {
      if (b.pts.length < 2) continue;
      const cur = b.r === w.pr;
      const col = PALETTES[b.r]!.neon;
      if (!cur && !w.unlocked.has(b.r)) continue;
      const path = () => {
        b.pts.forEach(([x, y], i) => {
          const px = (x + 0.5) * T;
          const py = (y + 0.5) * T;
          if (i === 0) g.moveTo(px, py);
          else g.lineTo(px, py);
        });
      };
      if (cur) {
        const jit = 0.75 + Math.sin(this.time * 30) * 0.25;
        path();
        g.stroke({ width: 10, color: col, alpha: 0.25 * jit });
        path();
        g.stroke({ width: 4, color: col, alpha: 0.9 });
        path();
        g.stroke({ width: 1.5, color: WHITE, alpha: 1 });
      } else {
        path();
        g.stroke({ width: 2, color: col, alpha: 0.18 + this.peek * 0.5 });
      }
    }
  }

  private drawPlayer(): void {
    const w = this.world!;
    const g = this.playerLayer.clear();
    const pal = PALETTES[w.pr]!;
    const n = this.nudge * this.nudge * 6;
    const cx = (this.player.x + 0.5) * T + DX[w.facing] * n;
    const cy = (this.player.y + 0.5) * T + DY[w.facing] * n;
    g.circle(cx, cy, T * 0.46).fill({ color: pal.neon, alpha: 0.07 + this.flash * 0.3 });
    this.figure(g, cx, cy, pal.neon, 1, w.facing);
    // Zariadenie na lom realít — malý hranol na chrbte.
    const bx = cx - DX[w.facing] * 11;
    const by = cy - DY[w.facing] * 11;
    g.poly([bx, by - 4, bx + 4, by + 3, bx - 4, by + 3]).fill({ color: WHITE, alpha: 0.9 });
    if (this.peek > 0.05)
      g.circle(cx, cy, T * (0.6 + this.peek * 0.3)).stroke({
        width: 1.5,
        color: WHITE,
        alpha: this.peek * 0.5,
      });
  }

  private drawFx(dt: number): void {
    const g = this.fxLayer.clear();
    this.rings = this.rings.filter((r) => (r.t += dt) < 0.7);
    for (const r of this.rings) {
      const p = r.t / 0.7;
      g.circle(r.x, r.y, T * (0.4 + p * 2.6)).stroke({
        width: 3 * (1 - p),
        color: r.color,
        alpha: 1 - p,
      });
    }
    this.sparks = this.sparks.filter((s) => (s.t += dt) < 0.6);
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.9;
      s.vy *= 0.9;
      g.circle(s.x, s.y, 2 * (1 - s.t / 0.6)).fill({ color: s.color, alpha: 1 - s.t / 0.6 });
    }
    // Nápoveda: šípky po ceste, krúžok pri presune do inej reality.
    this.hint.forEach((h, i) => {
      const a = Math.max(0.15, 0.95 - i * 0.12) * (0.65 + 0.35 * Math.sin(this.time * 6 - i * 0.7));
      const color = PALETTES[h.r]!.neon;
      const cx = (h.x + 0.5) * T;
      const cy = (h.y + 0.5) * T;
      if (h.shift) {
        g.circle(cx, cy, T * 0.42).stroke({ width: 3, color, alpha: a });
        g.circle(cx, cy, T * 0.3).stroke({ width: 1.5, color: WHITE, alpha: a * 0.6 });
        return;
      }
      const d = h.dir as Dir;
      const fx = DX[d];
      const fy = DY[d];
      const tipX = cx + fx * T * 0.42;
      const tipY = cy + fy * T * 0.42;
      const k = T * 0.16;
      g.moveTo(tipX - fx * k - fy * k, tipY - fy * k - fx * k)
        .lineTo(tipX, tipY)
        .lineTo(tipX - fx * k + fy * k, tipY - fy * k + fx * k)
        .stroke({ width: 3, color, alpha: a });
    });
    // Varovanie pri zablokovanom presune.
    if (this.glitch > 0.3 && this.nudge > 0) {
      const w = this.world!;
      g.rect(w.px * T + 2, w.py * T + 2, T - 4, T - 4).stroke({
        width: 2,
        color: DANGER,
        alpha: this.nudge,
      });
    }
  }
}
