import { Application, Container, Graphics } from 'pixi.js';
import { DX, DY, REALITIES, type Ev } from '@/game/types';
import type { Ent, Room } from '@/game/room';
import type { Enemy, Sim } from '@/game/sim';
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

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
  color: number;
  size: number;
}

export class Renderer {
  readonly app: Application;
  private post = new NeonPost();
  private root = new Container();
  private bg = new Graphics();
  private view = new Container();
  private ghost = new Graphics();
  private ghostDyn = new Graphics();
  private terrain = new Graphics();
  private terrainKey = '';
  private ghostKey = '';
  private floorLayer = new Graphics();
  private entLayer = new Graphics();
  private beamLayer = new Graphics();
  private enemyLayer = new Graphics();
  private bulletLayer = new Graphics();
  private playerLayer = new Graphics();
  private fxLayer = new Graphics();
  private overlay = new Graphics();
  private ui = new Graphics();
  private sim: Sim | null = null;
  private time = 0;
  private glitch = 0;
  private flash = 0;
  private hurtFlash = 0;
  private fade = 0;
  private shake = 0;
  private rings: { x: number; y: number; t: number; color: number; size: number }[] = [];
  private sparks: Spark[] = [];
  insets: Insets = { top: 60, bottom: 60, left: 12, right: 12 };
  /** Nahliadnutie do ostatných realít (podržané tlačidlo). */
  peek = 0;
  peekTarget = 0;
  scale = 1;
  /** Dotyková páčka na obrazovke (kreslí sa mimo sveta). */
  stick: { ox: number; oy: number; x: number; y: number } | null = null;

  constructor(app: Application) {
    this.app = app;
    this.root.filters = [this.post.filter];
    this.root.addChild(this.bg, this.view, this.overlay);
    this.view.addChild(
      this.terrain,
      this.ghost,
      this.floorLayer,
      this.ghostDyn,
      this.entLayer,
      this.beamLayer,
      this.enemyLayer,
      this.bulletLayer,
      this.playerLayer,
      this.fxLayer,
    );
    app.stage.addChild(this.root, this.ui);
  }

  setSim(sim: Sim | null): void {
    this.sim = sim;
    this.terrainKey = '';
    this.ghostKey = '';
    this.sparks = [];
    this.rings = [];
    this.layout();
    this.glitch = 1;
  }

  layout(): void {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    this.drawBackground(sw, sh);
    const room = this.sim?.room;
    if (!room) return;
    const ins = this.insets;
    const availW = Math.max(100, sw - ins.left - ins.right);
    const availH = Math.max(100, sh - ins.top - ins.bottom);
    const s = Math.min(availW / (room.w * T), availH / (room.h * T), 1.8);
    this.scale = s;
    this.view.scale.set(s);
    this.view.position.set(
      Math.round(ins.left + (availW - room.w * T * s) / 2),
      Math.round(ins.top + (availH - room.h * T * s) / 2),
    );
  }

  /** Poloha bodu sveta (v dlaždiciach) na obrazovke. */
  toScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: this.view.position.x + x * T * this.scale,
      y: this.view.position.y + y * T * this.scale,
    };
  }

  private drawBackground(sw: number, sh: number): void {
    const g = this.bg.clear();
    const pal = PALETTES[this.sim?.p.r ?? 0]!;
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

  /** Reakcia na udalosti simulácie (efekty). */
  events(ev: Ev[]): void {
    const sim = this.sim;
    if (!sim) return;
    const p = sim.p;
    const pc = PALETTES[p.r]!.neon;
    for (const e of ev) {
      switch (e.t) {
        case 'shift':
          this.glitch = 1;
          this.flash = 1;
          this.ring(p.x, p.y, PALETTES[e.r]!.neon, 1);
          this.drawBackground(this.app.screen.width, this.app.screen.height);
          break;
        case 'shiftBlocked':
          if (e.why === 'solid') this.glitch = Math.max(this.glitch, 0.35);
          break;
        case 'telefrag':
          this.burst(e.x, e.y, WHITE, 26, 220);
          this.burst(e.x, e.y, PALETTES[e.r]!.neon, 20, 160);
          this.shake = 0.6;
          break;
        case 'shoot':
          this.burst(p.x + p.fx * 0.4, p.y + p.fy * 0.4, pc, 2, 60);
          break;
        case 'lens':
          this.ring(p.x, p.y, WHITE, 0.6);
          this.glitch = Math.max(this.glitch, 0.3);
          break;
        case 'hit':
          this.burst(e.x, e.y, this.color(e.r), e.boss ? 5 : 6, 120);
          break;
        case 'kill':
          this.burst(e.x, e.y, this.color(e.r), 22, 200);
          this.burst(e.x, e.y, WHITE, 8, 120);
          this.ring(e.x, e.y, this.color(e.r), e.kind === 'warden' || e.kind === 'heart' ? 3 : 0.8);
          if (e.kind === 'warden' || e.kind === 'heart') {
            this.shake = 1;
            this.glitch = 1;
          } else this.shake = Math.max(this.shake, 0.2);
          break;
        case 'spark':
          this.burst(e.x, e.y, this.color(e.r), 3, 70);
          break;
        case 'hurt':
          this.hurtFlash = 1;
          this.shake = 0.5;
          this.burst(e.x, e.y, DANGER, 12, 150);
          break;
        case 'death':
          this.glitch = 1;
          this.burst(p.x, p.y, pc, 40, 260);
          break;
        case 'dash':
          this.burst(p.x, p.y, pc, 6, 50);
          break;
        case 'pickup':
        case 'health':
        case 'unlock': {
          const color = e.t === 'unlock' ? PALETTES[e.r]!.neon : WHITE;
          this.ring(p.x, p.y, color, 1.4);
          this.burst(p.x, p.y, color, 24, 160);
          if (e.t === 'unlock') this.glitch = 1;
          break;
        }
        case 'heal':
          this.burst(p.x, p.y, WHITE, 8, 80);
          break;
        case 'save':
          this.ring(p.x, p.y, WHITE, 1);
          break;
        case 'cut':
          this.burst(e.x, e.y, PALETTES[2]!.neon, 14, 140);
          break;
        case 'switch':
          this.ring(e.x, e.y, WHITE, 0.7);
          this.burst(e.x, e.y, WHITE, 10, 120);
          break;
        case 'open':
          this.ring(p.x, p.y, WHITE, 0.8);
          break;
        case 'room':
          this.fade = 1;
          this.glitch = Math.max(this.glitch, 0.5);
          this.sparks = [];
          this.rings = [];
          this.terrainKey = '';
          this.ghostKey = '';
          this.layout();
          break;
        case 'bossShift':
          this.glitch = Math.max(this.glitch, 0.6);
          break;
        case 'bossDown':
          this.flash = 1;
          break;
        default:
          break;
      }
    }
  }

  private color(r: number): number {
    return r < 0 ? WHITE : PALETTES[r]!.neon;
  }

  private ring(x: number, y: number, color: number, size: number): void {
    this.rings.push({ x: x * T, y: y * T, t: 0, color, size });
  }

  private burst(x: number, y: number, color: number, n: number, speed: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.sparks.push({
        x: x * T,
        y: y * T,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        t: 0,
        life: 0.35 + Math.random() * 0.35,
        color,
        size: 1.5 + Math.random() * 1.5,
      });
    }
  }

  frame(dt: number): void {
    const sim = this.sim;
    this.time += dt;
    this.glitch = Math.max(0, this.glitch - dt * 2.2);
    this.flash = Math.max(0, this.flash - dt * 3);
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 2.5);
    this.fade = Math.max(0, this.fade - dt * 5);
    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.peek += (this.peekTarget - this.peek) * Math.min(1, dt * 12);
    this.post.update(
      this.time,
      this.glitch,
      Math.max(0.75, this.scale * this.app.renderer.resolution),
    );
    this.drawUi();
    if (!sim) {
      this.view.visible = false;
      this.overlay.clear();
      return;
    }
    this.view.visible = true;
    const room = sim.room;
    const r = sim.p.r;
    const key = `${room.def.id}:${r}:${room.drained()}:${sim.prog.cut.length}:${sim.prog.unlocked.length}`;
    if (key !== this.terrainKey) {
      if (!this.terrainKey.startsWith(`${room.def.id}:${r}:`))
        this.drawBackground(this.app.screen.width, this.app.screen.height);
      this.terrainKey = key;
      this.drawTerrain(room, r);
    }
    if (key !== this.ghostKey) {
      this.ghostKey = key;
      this.drawGhost(sim);
    }
    this.ghost.alpha = 0.35 + this.peek * 0.65;
    this.drawFloor(room, r);
    this.drawGhostDyn(sim);
    this.drawEnts(sim);
    this.drawBeams(sim);
    this.drawEnemies(sim);
    this.drawBullets(sim);
    this.drawPlayer(sim);
    this.drawFx(dt);
    this.drawOverlay(sim);
    const sx = this.shake ? (Math.random() - 0.5) * this.shake * 10 : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake * 10 : 0;
    this.root.position.set(sx, sy);
  }

  // ---------- terén ----------

  private drawTerrain(room: Room, r: number): void {
    const pal = PALETTES[r]!;
    const g = this.terrain.clear();
    const drained = room.drained();
    for (let y = 0; y < room.h; y++) {
      for (let x = 0; x < room.w; x++) {
        const t = room.tile(r, x, y);
        const X = x * T;
        const Y = y * T;
        const h = hash(y * 977 + x * 131 + r * 7);
        if (t === ' ') {
          // Prázdno Nuly: tma s rozpadajúcimi sa bodmi.
          for (let i = 0; i < 3; i++)
            g.rect(X + hash(x * 7 + y * 3 + i) * T, Y + hash(x * 5 + y * 11 + i) * T, 2, 2).fill({
              color: pal.neon,
              alpha: 0.25,
            });
          continue;
        }
        if (t === '#') {
          g.rect(X, Y, T, T).fill(pal.wall);
          g.rect(X, Y, T, T).fill({ color: 0x000000, alpha: 0.6 });
          for (let i = 1; i < 4; i++) {
            const o = (i * T) / 4;
            g.moveTo(X + o, Y).lineTo(X, Y + o);
            g.moveTo(X + T, Y + o).lineTo(X + o, Y + T);
          }
          g.stroke({ width: 1, color: pal.neon, alpha: 0.07 });
          continue;
        }
        g.rect(X, Y, T, T).fill(pal.floor);
        g.rect(X + 1, Y + 1, T - 2, T - 2).stroke({ width: 1, color: pal.neon, alpha: 0.06 });
        g.circle(X, Y, 1.6).fill({ color: pal.neon, alpha: 0.22 });
        if (t === '~' && !drained) {
          g.rect(X, Y, T, T).fill({ color: mix(pal.bg, pal.neon, 0.2), alpha: 1 });
          g.rect(X + 2, Y + 2, T - 4, T - 4).stroke({ width: 1, color: pal.neon, alpha: 0.12 });
        } else if (t === '~' || t === ',') {
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
    // Neónové okraje stien, vody a prázdna.
    const solid = (t: string) => t === '#' || t === ' ' || (t === '~' && !drained);
    for (let y = 0; y < room.h; y++) {
      for (let x = 0; x < room.w; x++) {
        const t = room.tile(r, x, y);
        if (!solid(t)) continue;
        for (let d = 0; d < 4; d++) {
          const nx = x + DX[d as 0];
          const ny = y + DY[d as 0];
          if (nx < 0 || ny < 0 || nx >= room.w || ny >= room.h) continue;
          const n = room.tile(r, nx, ny);
          if (n === t || (solid(n) && t !== '#') || n === '#') continue;
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
   * Šrafa = tam je prekážka (presun sem nepôjde), čiarkovaný rám = tam je priechod.
   */
  private drawGhost(sim: Sim): void {
    const room = sim.room;
    const g = this.ghost.clear();
    const pr = sim.p.r;
    const blocked = (r: number, x: number, y: number) => {
      const t = room.tile(r, x, y);
      return t === '#' || t === ' ' || t === 'x' || t === '%' || (t === '~' && !room.drained());
    };
    for (const r of sim.prog.unlocked) {
      if (r === pr) continue;
      const pal = PALETTES[r]!;
      const off = (r - pr) * 2;
      for (let y = 0; y < room.h; y++) {
        for (let x = 0; x < room.w; x++) {
          const here = blocked(pr, x, y);
          const there = blocked(r, x, y);
          if (here === there) continue;
          const X = x * T + off;
          const Y = y * T + off;
          if (there) {
            g.rect(X + 4, Y + 4, T - 8, T - 8).fill({ color: pal.neon, alpha: 0.06 });
            for (let i = 1; i < 3; i++) {
              const o = (i * (T - 8)) / 3;
              g.moveTo(X + 4 + o, Y + 4).lineTo(X + 4, Y + 4 + o);
              g.moveTo(X + T - 4, Y + 4 + o).lineTo(X + 4 + o, Y + T - 4);
            }
            g.stroke({ width: 1, color: pal.neon, alpha: 0.28 });
          } else {
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
            g.stroke({ width: 1.5, color: pal.neon, alpha: 0.5 });
          }
        }
      }
    }
  }

  /** Animovaná voda. */
  private drawFloor(room: Room, r: number): void {
    const g = this.floorLayer.clear();
    if (room.drained()) return;
    const pal = PALETTES[r]!;
    for (let y = 0; y < room.h; y++)
      for (let x = 0; x < room.w; x++) {
        if (room.tile(r, x, y) !== '~') continue;
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

  /** Nepriatelia, strely a predmety z ostatných realít — slabo, pri nahliadnutí silnejšie. */
  private drawGhostDyn(sim: Sim): void {
    const g = this.ghostDyn.clear();
    const pr = sim.p.r;
    const a = 0.16 + this.peek * 0.5;
    for (const e of sim.enemies) {
      if (e.r === pr || e.r === -1) continue;
      if (!sim.prog.unlocked.includes(e.r) && this.peek < 0.05) continue;
      this.drawEnemy(g, e, PALETTES[e.r]!.neon, a, true);
    }
    for (const b of sim.bullets) {
      if (!b.foe || b.r === pr || b.r < 0) continue;
      g.circle(b.x * T, b.y * T, b.rad * T).stroke({
        width: 1.5,
        color: PALETTES[b.r]!.neon,
        alpha: a,
      });
    }
    if (this.peek > 0.05)
      for (const e of sim.room.ents) {
        if (e.r === pr || e.r === -1 || !sim.room.present(e)) continue;
        this.drawEnt(g, sim, e, e.r, this.peek * 0.7);
      }
  }

  // ---------- entity ----------

  private drawEnts(sim: Sim): void {
    const g = this.entLayer.clear();
    const room = sim.room;
    for (const e of room.ents) {
      if (!room.inReality(e, sim.p.r) || !room.present(e)) continue;
      this.drawEnt(g, sim, e, sim.p.r, 1);
    }
    // Lekárničky po nepriateľoch.
    for (const d of sim.drops) {
      if (d.r !== sim.p.r) continue;
      const blink = d.t < 2 ? (Math.sin(this.time * 20) > 0 ? 1 : 0.3) : 1;
      const cx = d.x * T;
      const cy = d.y * T + Math.sin(this.time * 4 + d.x) * 2;
      g.circle(cx, cy, 9).fill({ color: 0x000000, alpha: 0.6 * blink });
      g.circle(cx, cy, 9).stroke({ width: 1.5, color: WHITE, alpha: blink });
      g.rect(cx - 5, cy - 1.5, 10, 3).fill({ color: WHITE, alpha: blink });
      g.rect(cx - 1.5, cy - 5, 3, 10).fill({ color: WHITE, alpha: blink });
    }
  }

  private drawEnt(g: Graphics, sim: Sim, e: Ent, r: number, alpha: number): void {
    const room = sim.room;
    const pal = PALETTES[e.r === -1 ? r : e.r]!;
    const c = pal.neon;
    const X = e.x * T;
    const Y = e.y * T;
    const cx = X + T / 2;
    const cy = Y + T / 2;
    const t = this.time;
    const s = e.spec;
    switch (s.k) {
      case 'door':
      case 'lock': {
        const open = room.isOpen(e);
        const horiz = room.tile(r, e.x - 1, e.y) === '#' || room.tile(r, e.x + 1, e.y) === '#';
        const col = s.k === 'lock' ? WHITE : c;
        if (open) {
          g.rect(X + 3, Y + 3, T - 6, T - 6).stroke({ width: 1, color: col, alpha: 0.25 * alpha });
          break;
        }
        g.rect(X, Y, T, T).fill({ color: pal.wall, alpha: 0.85 * alpha });
        for (let i = 0; i < 4; i++) {
          const o = 8 + i * 10.5;
          if (horiz) g.moveTo(X + o, Y + 4).lineTo(X + o, Y + T - 4);
          else g.moveTo(X + 4, Y + o).lineTo(X + T - 4, Y + o);
        }
        g.stroke({ width: 2.5, color: col, alpha });
        if (s.k === 'lock')
          g.roundRect(cx - 9, cy - 6, 18, 12, 2)
            .fill({ color: pal.bg, alpha })
            .stroke({ width: 1.5, color: c, alpha });
        else
          g.circle(cx, cy, 4).fill({ color: DANGER, alpha }).stroke({ width: 1, color: c, alpha });
        break;
      }
      case 'switch': {
        if (s.lens) {
          // Hranolový prijímač: kosoštvorec, ktorý reaguje len na hranolovú strelu.
          const k = 15;
          g.poly([cx, cy - k, cx + k, cy, cx, cy + k, cx - k, cy])
            .fill({ color: e.on ? WHITE : pal.wall, alpha: (e.on ? 0.5 : 1) * alpha })
            .stroke({ width: 2, color: WHITE, alpha });
          for (let i = 0; i < REALITIES; i++)
            g.circle(cx + Math.cos(t + i * 1.57) * 6, cy + Math.sin(t + i * 1.57) * 6, 2).fill({
              color: PALETTES[i]!.neon,
              alpha,
            });
          break;
        }
        g.circle(cx, cy, 13).fill({ color: pal.wall, alpha }).stroke({ width: 2, color: c, alpha });
        const a = e.on ? -0.8 : -2.35;
        g.moveTo(cx, cy)
          .lineTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15)
          .stroke({ width: 3, color: e.on ? WHITE : c, alpha });
        if (!e.on)
          g.circle(cx, cy, 17 + Math.sin(t * 5) * 2).stroke({
            width: 1,
            color: c,
            alpha: 0.4 * alpha,
          });
        break;
      }
      case 'emitter': {
        g.rect(X + 7, Y + 7, T - 14, T - 14)
          .fill({ color: pal.wall, alpha })
          .stroke({ width: 2, color: c, alpha });
        const on = !room.signal(s.sig);
        g.circle(cx + DX[s.dir] * 12, cy + DY[s.dir] * 12, 5).fill({
          color: on ? WHITE : pal.wall,
          alpha,
        });
        break;
      }
      case 'item': {
        const bob = Math.sin(t * 3 + e.x) * 3;
        g.circle(cx, cy + bob, T * 0.36).stroke({ width: 1, color: WHITE, alpha: 0.35 * alpha });
        if (s.item === 'card') {
          g.roundRect(cx - 10, cy - 7 + bob, 20, 14, 2)
            .fill({ color: pal.bg, alpha })
            .stroke({ width: 2, color: WHITE, alpha });
          g.rect(cx - 6, cy - 2 + bob, 6, 4).fill({ color: c, alpha });
        } else if (s.item === 'cutter') {
          g.poly([
            cx - 10,
            cy + 8 + bob,
            cx + 8,
            cy - 10 + bob,
            cx + 11,
            cy - 7 + bob,
            cx - 7,
            cy + 11 + bob,
          ]).fill({
            color: WHITE,
            alpha,
          });
          g.circle(cx - 8, cy + 9 + bob, 4).stroke({ width: 2, color: c, alpha });
        } else {
          const pts: number[] = [];
          for (let i = 0; i < 3; i++) {
            const ang = t * 1.5 + (i * Math.PI * 2) / 3;
            pts.push(cx + Math.cos(ang) * 12, cy + bob + Math.sin(ang) * 12);
          }
          g.poly(pts)
            .fill({ color: WHITE, alpha: 0.5 * alpha })
            .stroke({ width: 2, color: WHITE, alpha });
          for (let i = 0; i < REALITIES; i++)
            g.moveTo(cx, cy + bob)
              .lineTo(cx + 20, cy + bob - 9 + i * 6)
              .stroke({ width: 1.5, color: PALETTES[i]!.neon, alpha });
        }
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
          g.moveTo(cx, cy).lineTo(cx + Math.cos(ang) * 24, cy + Math.sin(ang) * 24);
        }
        g.stroke({ width: 1, color: col, alpha: 0.45 * alpha });
        g.poly(pts)
          .fill({ color: col, alpha: 0.4 * alpha })
          .stroke({ width: 2, color: WHITE, alpha });
        break;
      }
      case 'health': {
        const p = 0.6 + 0.4 * Math.sin(t * 4);
        g.circle(cx, cy, 15)
          .fill({ color: pal.bg, alpha })
          .stroke({ width: 2, color: WHITE, alpha });
        g.poly([cx, cy - 9, cx + 8, cy, cx, cy + 9, cx - 8, cy]).fill({
          color: c,
          alpha: p * alpha,
        });
        g.circle(cx, cy, 20 + p * 3).stroke({ width: 1, color: c, alpha: 0.4 * alpha });
        break;
      }
      case 'log': {
        const read = sim.prog.logs.includes(s.id);
        const a = read ? 0.45 : 1;
        g.roundRect(X + 8, Y + 10, T - 16, T - 20, 3)
          .fill({ color: pal.wall, alpha: alpha })
          .stroke({ width: 2, color: c, alpha: a * alpha });
        for (let i = 0; i < 3; i++)
          g.rect(X + 13, Y + 15 + i * 5, (T - 30) * (0.5 + hash(i + e.x * 7) * 0.5), 2);
        g.fill({ color: c, alpha: 0.8 * a * alpha });
        if (!read)
          g.rect(X + T - 16, Y + T - 16, 3, 3).fill({
            color: WHITE,
            alpha: (Math.sin(t * 5 + e.x) > 0 ? 1 : 0.3) * alpha,
          });
        break;
      }
      case 'echo': {
        const read = sim.prog.echoes.includes(s.id);
        const fl = 0.55 + 0.45 * Math.sin(t * 9 + e.x * 3) * Math.sin(t * 2.3);
        const jx = Math.sin(t * 40 + e.y) > 0.92 ? 3 : 0;
        this.figure(g, cx + jx, cy, 0, 1, c, alpha * fl * (read ? 0.4 : 1), true);
        break;
      }
      case 'terminal': {
        const here = sim.prog.room === room.def.id;
        g.roundRect(X + 6, Y + 8, T - 12, T - 14, 4)
          .fill({ color: pal.wall, alpha })
          .stroke({ width: 2, color: WHITE, alpha: 0.9 * alpha });
        g.rect(X + 11, Y + 13, T - 22, T - 26).fill({
          color: c,
          alpha: (here ? 0.5 : 0.18) * alpha,
        });
        g.moveTo(cx - 6, cy - 1)
          .lineTo(cx - 1, cy + 4)
          .lineTo(cx + 7, cy - 6)
          .stroke({ width: 2, color: WHITE, alpha: (here ? 1 : 0.3) * alpha });
        break;
      }
      case 'core': {
        const p = 0.5 + 0.5 * Math.sin(t * 2);
        for (let i = 0; i < REALITIES; i++) {
          const a = t * 0.7 + (i * Math.PI * 2) / REALITIES;
          g.circle(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 5).fill({
            color: PALETTES[i]!.neon,
            alpha,
          });
        }
        const pts: number[] = [];
        for (let i = 0; i < 3; i++) {
          const ang = -t * 0.4 + (i * Math.PI * 2) / 3;
          pts.push(cx + Math.cos(ang) * 18, cy + Math.sin(ang) * 18);
        }
        g.poly(pts)
          .fill({ color: WHITE, alpha: (0.4 + p * 0.4) * alpha })
          .stroke({ width: 2, color: WHITE, alpha });
        break;
      }
      default:
        break;
    }
  }

  /** Postava zhora (hráč, ozveny): telo, hlava, priezor v smere pohľadu. */
  private figure(
    g: Graphics,
    cx: number,
    cy: number,
    fx: number,
    fy: number,
    color: number,
    alpha: number,
    echo = false,
  ): void {
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

  // ---------- lúče, nepriatelia, strely, hráč ----------

  private drawBeams(sim: Sim): void {
    const g = this.beamLayer.clear();
    for (const b of sim.room.beams) {
      const cur = b.r === sim.p.r;
      if (!cur && !sim.prog.unlocked.includes(b.r)) continue;
      const col = PALETTES[b.r]!.neon;
      const x0 = (b.x0 + 0.5) * T;
      const y0 = (b.y0 + 0.5) * T;
      const x1 = (b.x1 + 0.5) * T;
      const y1 = (b.y1 + 0.5) * T;
      if (cur) {
        const jit = 0.75 + Math.sin(this.time * 30) * 0.25;
        g.moveTo(x0, y0)
          .lineTo(x1, y1)
          .stroke({ width: 12, color: col, alpha: 0.25 * jit });
        g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 4, color: col, alpha: 0.9 });
        g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 1.5, color: WHITE, alpha: 1 });
      } else {
        g.moveTo(x0, y0)
          .lineTo(x1, y1)
          .stroke({ width: 2, color: col, alpha: 0.15 + this.peek * 0.5 });
      }
    }
  }

  private drawEnemies(sim: Sim): void {
    const g = this.enemyLayer.clear();
    const pr = sim.p.r;
    for (const e of sim.enemies) {
      if (e.r !== pr && e.r !== -1) continue;
      const color = e.flash > 0 ? WHITE : e.r === -1 ? WHITE : PALETTES[e.r]!.neon;
      this.drawEnemy(g, e, color, 1, false);
    }
  }

  private drawEnemy(g: Graphics, e: Enemy, color: number, alpha: number, ghost: boolean): void {
    const cx = e.x * T;
    const cy = e.y * T;
    const R = e.rad * T;
    const t = this.time;
    const dark = ghost ? 0x000000 : 0x05080c;
    switch (e.kind) {
      case 'drone': {
        const pts: number[] = [];
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 + Math.PI / 6;
          pts.push(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        }
        g.poly(pts)
          .fill({ color: dark, alpha: 0.8 * alpha })
          .stroke({ width: 2, color, alpha });
        for (let i = 0; i < 2; i++) {
          const a = t * 14 + i * Math.PI;
          g.moveTo(cx - Math.cos(a) * R * 1.2, cy - R * 0.9 - Math.sin(a) * 3)
            .lineTo(cx + Math.cos(a) * R * 1.2, cy - R * 0.9 + Math.sin(a) * 3)
            .stroke({ width: 1.5, color, alpha: 0.6 * alpha });
        }
        g.circle(cx + Math.cos(e.ang) * R * 0.35, cy + Math.sin(e.ang) * R * 0.35, 4).fill({
          color: DANGER,
          alpha,
        });
        break;
      }
      case 'crawler': {
        const lunge = e.st === 1 ? 1 + Math.sin(t * 40) * 0.08 : 1;
        for (let i = 0; i < 7; i++) {
          const a = (i * Math.PI * 2) / 7 + Math.sin(t * 5 + i) * 0.3;
          const l = R * (1.25 + Math.sin(t * 7 + i * 2) * 0.2);
          g.moveTo(cx + Math.cos(a) * R * 0.6, cy + Math.sin(a) * R * 0.6).quadraticCurveTo(
            cx + Math.cos(a + 0.4) * l,
            cy + Math.sin(a + 0.4) * l,
            cx + Math.cos(a) * l,
            cy + Math.sin(a) * l,
          );
        }
        g.stroke({ width: 1.8, color, alpha: 0.8 * alpha });
        g.circle(cx, cy, R * 0.75 * lunge)
          .fill({ color: dark, alpha: 0.85 * alpha })
          .stroke({ width: 2, color, alpha });
        for (const o of [-0.35, 0.35])
          g.circle(
            cx + Math.cos(e.ang + o) * R * 0.4,
            cy + Math.sin(e.ang + o) * R * 0.4,
            2.5,
          ).fill({ color: e.st === 1 ? DANGER : WHITE, alpha });
        break;
      }
      case 'pod': {
        const open = Math.max(0, 1 - e.t / 0.6);
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5 + t * 0.3;
          const l = R * (1.1 + open * 0.4);
          g.moveTo(cx, cy)
            .quadraticCurveTo(
              cx + Math.cos(a - 0.5) * l,
              cy + Math.sin(a - 0.5) * l,
              cx + Math.cos(a) * l,
              cy + Math.sin(a) * l,
            )
            .quadraticCurveTo(cx + Math.cos(a + 0.5) * l, cy + Math.sin(a + 0.5) * l, cx, cy);
        }
        g.fill({ color: dark, alpha: 0.8 * alpha }).stroke({ width: 1.8, color, alpha });
        g.circle(cx, cy, R * 0.35 * (1 + open * 0.4)).fill({
          color,
          alpha: (0.5 + open * 0.5) * alpha,
        });
        break;
      }
      case 'turret': {
        g.rect(cx - R, cy - R, R * 2, R * 2)
          .fill({ color: dark, alpha: 0.85 * alpha })
          .stroke({ width: 2, color, alpha });
        const base = e.st * (Math.PI / 4);
        for (let k = 0; k < 4; k++) {
          const a = base + (k * Math.PI) / 2;
          g.moveTo(cx + Math.cos(a) * R * 0.3, cy + Math.sin(a) * R * 0.3).lineTo(
            cx + Math.cos(a) * R * 1.15,
            cy + Math.sin(a) * R * 1.15,
          );
        }
        g.stroke({ width: 4, color, alpha });
        g.circle(cx, cy, R * 0.32).fill({ color: e.t < 0.3 ? DANGER : color, alpha });
        break;
      }
      case 'glitch': {
        for (let i = 0; i < 5; i++) {
          const ox = (hash(Math.floor(t * 20) * 7 + i + e.id) - 0.5) * R * 1.6;
          const oy = (hash(Math.floor(t * 20) * 3 + i * 5 + e.id) - 0.5) * R * 1.6;
          const s = R * (0.35 + hash(i + e.id) * 0.4);
          g.rect(cx + ox - s / 2, cy + oy - s / 2, s, s).stroke({ width: 1.5, color, alpha });
        }
        g.rect(cx - R * 0.4, cy - R * 0.4, R * 0.8, R * 0.8).fill({
          color: e.st === 1 ? DANGER : color,
          alpha: 0.7 * alpha,
        });
        break;
      }
      case 'warden': {
        // Ohlásený presun: obrys v cieľovej realite.
        if (e.warn >= 0 && !ghost) {
          const wc = PALETTES[e.warn]!.neon;
          g.circle(cx, cy, R * (1.2 + Math.sin(t * 20) * 0.08)).stroke({
            width: 3,
            color: wc,
            alpha: 0.8,
          });
        }
        g.circle(cx, cy, R)
          .fill({ color: dark, alpha: 0.85 * alpha })
          .stroke({ width: 3, color, alpha });
        for (let i = 0; i < 8; i++) {
          const a = e.ang + (i * Math.PI) / 4;
          g.moveTo(cx + Math.cos(a) * R * 0.7, cy + Math.sin(a) * R * 0.7).lineTo(
            cx + Math.cos(a + 0.25) * R * 0.95,
            cy + Math.sin(a + 0.25) * R * 0.95,
          );
        }
        g.stroke({ width: 3, color, alpha });
        g.circle(cx, cy, R * 0.38).stroke({ width: 2, color, alpha });
        g.circle(cx, cy, R * 0.18).fill({ color: DANGER, alpha });
        break;
      }
      case 'heart': {
        const vc = PALETTES[e.warn]?.neon ?? WHITE;
        // Ohlásená salva: krúžok farby reality, v ktorej vystrelí.
        if (e.aim >= 0) {
          const k = Math.max(0, Math.min(1, 1 - e.t / 0.6));
          g.circle(cx, cy, R * (2.2 - k * 1)).stroke({
            width: 3,
            color: PALETTES[e.aim]!.neon,
            alpha: 0.4 + k * 0.6,
          });
        }
        for (let i = 0; i < REALITIES; i++) {
          const a = e.ang * 1.5 + (i * Math.PI * 2) / REALITIES;
          const on = i === e.warn;
          g.circle(cx + Math.cos(a) * R * 1.35, cy + Math.sin(a) * R * 1.35, on ? 9 : 5).fill({
            color: PALETTES[i]!.neon,
            alpha: (on ? 1 : 0.5) * alpha,
          });
        }
        const pts: number[] = [];
        for (let i = 0; i < 3; i++) {
          const a = -e.ang + (i * Math.PI * 2) / 3;
          pts.push(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        }
        g.poly(pts)
          .fill({ color: vc, alpha: (e.flash > 0 ? 0.9 : 0.35) * alpha })
          .stroke({ width: 3, color: WHITE, alpha });
        g.circle(cx, cy, R * 0.3 * (1 + Math.sin(t * 6) * 0.1)).fill({ color: WHITE, alpha });
        break;
      }
    }
    if (!ghost && !e.boss && e.hp < e.max) {
      const w = R * 1.6;
      g.rect(cx - w / 2, cy - R - 9, w, 3).fill({ color: 0x000000, alpha: 0.7 });
      g.rect(cx - w / 2, cy - R - 9, (w * e.hp) / e.max, 3).fill({ color, alpha: 0.9 });
    }
  }

  private drawBullets(sim: Sim): void {
    const g = this.bulletLayer.clear();
    const pr = sim.p.r;
    for (const b of sim.bullets) {
      const x = b.x * T;
      const y = b.y * T;
      if (b.r === -1) {
        // Hranolová strela: biely hrot a dúhová stopa.
        const l = Math.hypot(b.vx, b.vy) || 1;
        const ux = b.vx / l;
        const uy = b.vy / l;
        for (let i = 0; i < REALITIES; i++) {
          const off = (i - 1.5) * 3;
          g.moveTo(x - ux * 4 - uy * off, y - uy * 4 + ux * off)
            .lineTo(x - ux * 30 - uy * off * 2, y - uy * 30 + ux * off * 2)
            .stroke({ width: 2.5, color: PALETTES[i]!.neon, alpha: 0.8 });
        }
        g.poly([x + ux * 12, y + uy * 12, x - uy * 8, y + ux * 8, x + uy * 8, y - ux * 8]).fill({
          color: WHITE,
        });
        continue;
      }
      if (b.r !== pr) continue;
      const col = PALETTES[b.r]!.neon;
      if (b.foe) {
        g.circle(x, y, b.rad * T * 1.6).fill({ color: col, alpha: 0.25 });
        g.circle(x, y, b.rad * T).fill({ color: col });
        g.circle(x, y, b.rad * T * 0.5).fill({ color: WHITE });
      } else {
        g.moveTo(x, y)
          .lineTo(x - b.vx * 1.6, y - b.vy * 1.6)
          .stroke({ width: 4, color: col, alpha: 0.6 });
        g.circle(x, y, 3.5).fill({ color: WHITE });
      }
    }
  }

  private drawPlayer(sim: Sim): void {
    const g = this.playerLayer.clear();
    const p = sim.p;
    if (p.dead) return;
    const pal = PALETTES[p.r]!;
    const cx = p.x * T;
    const cy = p.y * T;
    const blink = p.inv > 0.15 && Math.sin(this.time * 40) > 0 ? 0.35 : 1;
    if (p.dash > 0)
      for (let i = 1; i <= 3; i++)
        this.figure(g, cx - p.dx * i * 9, cy - p.dy * i * 9, p.fx, p.fy, pal.neon, 0.25 / i);
    g.circle(cx, cy, T * 0.5).fill({ color: pal.neon, alpha: 0.07 + this.flash * 0.3 });
    this.figure(g, cx, cy, p.fx, p.fy, pal.neon, blink);
    // Zariadenie na lom realít — malý hranol na chrbte.
    const bx = cx - p.fx * 11;
    const by = cy - p.fy * 11;
    g.poly([bx, by - 4, bx + 4, by + 3, bx - 4, by + 3]).fill({ color: WHITE, alpha: 0.9 * blink });
    // Hlaveň pištole v smere mierenia.
    g.moveTo(cx + p.fx * 10, cy + p.fy * 10)
      .lineTo(cx + p.fx * 19, cy + p.fy * 19)
      .stroke({ width: 3, color: WHITE, alpha: blink });
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
      g.circle(r.x, r.y, T * (0.4 + p * 2.6) * r.size).stroke({
        width: 3 * (1 - p),
        color: r.color,
        alpha: 1 - p,
      });
    }
    this.sparks = this.sparks.filter((s) => (s.t += dt) < s.life);
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.92;
      s.vy *= 0.92;
      const k = 1 - s.t / s.life;
      g.circle(s.x, s.y, s.size * k).fill({ color: s.color, alpha: k });
    }
  }

  /** Celoobrazovkové prekrytie: zásah, prechod medzi miestnosťami, nízke zdravie. */
  private drawOverlay(sim: Sim): void {
    const g = this.overlay.clear();
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    if (this.fade > 0) g.rect(0, 0, sw, sh).fill({ color: 0x000000, alpha: this.fade * 0.85 });
    const low = sim.p.hp === 1 && !sim.p.dead ? 0.12 + Math.sin(this.time * 5) * 0.06 : 0;
    const a = Math.max(this.hurtFlash * 0.35, low);
    if (a > 0) {
      const b = Math.min(sw, sh) * 0.12;
      g.rect(0, 0, sw, b).fill({ color: DANGER, alpha: a });
      g.rect(0, sh - b, sw, b).fill({ color: DANGER, alpha: a });
      g.rect(0, 0, b, sh).fill({ color: DANGER, alpha: a * 0.8 });
      g.rect(sw - b, 0, b, sh).fill({ color: DANGER, alpha: a * 0.8 });
    }
  }

  /** Dotyková páčka (mimo filtra, v pixeloch obrazovky). */
  private drawUi(): void {
    const g = this.ui.clear();
    const s = this.stick;
    if (!s) return;
    const color = PALETTES[this.sim?.p.r ?? 0]!.neon;
    g.circle(s.ox, s.oy, 50).stroke({ width: 2, color, alpha: 0.35 });
    g.circle(s.ox, s.oy, 50).fill({ color, alpha: 0.05 });
    const dx = s.x - s.ox;
    const dy = s.y - s.oy;
    const d = Math.hypot(dx, dy);
    const k = d > 46 ? 46 / d : 1;
    g.circle(s.ox + dx * k, s.oy + dy * k, 22)
      .fill({ color, alpha: 0.3 })
      .stroke({
        width: 2,
        color,
        alpha: 0.8,
      });
  }
}
