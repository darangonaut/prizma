import { Application, Container, Graphics, Text } from 'pixi.js';
import { SIZE, mirror, type Ev } from '@/game/types';
import { blinkPhase, laserPhase, type Panel, type Sim } from '@/game/sim';
import { NeonPost } from './post';
import { DANGER, PALETTES, WHITE, mix } from './palette';

/** Veľkosť dlaždice vo svetových jednotkách (okno sa potom zmenší na obrazovku). */
export const T = 40;
const W = SIZE * T;

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

const ARROW: Record<string, string> = { '1,0': '→', '-1,0': '←', '0,1': '↓', '0,-1': '↑' };

/** Štítok okna: kam sa v realite r pohne „vpravo“ (a „hore“, ak sa tiež mení). */
export function mirrorGlyph(r: number): string {
  if (r === 0) return '';
  const a = (x: number, y: number) => ARROW[mirror(r, x, y).join(',')] ?? '';
  const right = `→ ${a(1, 0)}`;
  return a(0, -1) === '↑' ? right : `${right} · ↑ ${a(0, -1)}`;
}

/** Vykreslenie jedného okna: statický terén + každý snímok nebezpečenstvá, úlomky a kópia. */
class PanelView {
  readonly root = new Container();
  readonly frame = new Graphics();
  readonly terrain = new Graphics();
  readonly dyn = new Graphics();
  readonly copy = new Graphics();
  readonly fx = new Graphics();
  readonly label: Text;
  readonly glyph: Text;
  /** Poloha a mierka okna na obrazovke. */
  x = 0;
  y = 0;
  s = 1;
  sparks: Spark[] = [];
  rings: { x: number; y: number; t: number; color: number; size: number }[] = [];
  trail: { x: number; y: number; t: number }[] = [];

  constructor(readonly r: number) {
    const pal = PALETTES[r]!;
    this.label = new Text({
      text: '',
      style: {
        fontFamily: 'Orbitron',
        fontWeight: '700',
        fontSize: 15,
        fill: pal.neon,
        letterSpacing: 3,
      },
    });
    this.glyph = new Text({
      text: mirrorGlyph(r),
      style: { fontFamily: 'Share Tech Mono', fontSize: 16, fill: WHITE, letterSpacing: 1 },
    });
    this.glyph.alpha = 0.75;
    this.root.addChild(
      this.frame,
      this.terrain,
      this.dyn,
      this.copy,
      this.fx,
      this.label,
      this.glyph,
    );
  }
}

export class Renderer {
  readonly app: Application;
  private post = new NeonPost();
  private root = new Container();
  private bg = new Graphics();
  private world = new Container();
  private overlay = new Graphics();
  private ui = new Graphics();
  private views: PanelView[] = [];
  private sim: Sim | null = null;
  private time = 0;
  private glitch = 0;
  private flash = 0;
  private shake = 0;
  private winGlow = 0;
  insets: Insets = { top: 60, bottom: 20, left: 12, right: 12 };
  /** Mierka najmenšieho okna (pre shader). */
  scale = 1;
  /** Dotyková páčka na obrazovke (kreslí sa mimo filtra). */
  stick: { ox: number; oy: number; x: number; y: number } | null = null;
  /** Názvy realít pre štítky okien. */
  names: string[] = ['', '', '', ''];
  /** Kým hráč nezačne, okná jemne pulzujú. */
  waiting = false;

  constructor(app: Application) {
    this.app = app;
    this.root.filters = [this.post.filter];
    this.root.addChild(this.bg, this.world, this.overlay);
    app.stage.addChild(this.root, this.ui);
  }

  setSim(sim: Sim | null): void {
    const same =
      sim &&
      this.sim &&
      sim.level.id === this.sim.level.id &&
      this.views.length === sim.panels.length;
    this.sim = sim;
    if (!same) {
      for (const v of this.views) v.root.destroy({ children: true });
      this.views = (sim?.panels ?? []).map((p) => new PanelView(p.r));
      for (const v of this.views) this.world.addChild(v.root);
      this.views.forEach((v, i) => this.drawTerrain(v, sim!.panels[i]!));
      this.glitch = 1;
    }
    for (const v of this.views) v.trail = [];
    this.winGlow = 0;
    this.layout();
  }

  layout(): void {
    const sw = this.app.screen.width;
    const sh = this.app.screen.height;
    this.drawBackground(sw, sh);
    const n = this.views.length;
    if (!n) return;
    const ins = this.insets;
    const availW = Math.max(100, sw - ins.left - ins.right);
    const availH = Math.max(100, sh - ins.top - ins.bottom);
    const gap = 30;
    const labelH = 30;
    // Rozloženie okien s najväčšou dlaždicou: v rade, v stĺpci alebo 2 × 2.
    const options: [number, number][] = [
      [n, 1],
      [1, n],
    ];
    if (n >= 3) options.push([2, 2]);
    if (n === 4) options.push([4, 1]);
    let best: [number, number] = [n, 1];
    let bestSize = 0;
    for (const [c, rws] of options) {
      const size = Math.min(
        (availW - gap * (c - 1)) / c,
        (availH - (labelH + gap) * rws + gap) / rws,
      );
      if (size > bestSize + 0.5) {
        bestSize = size;
        best = [c, rws];
      }
    }
    const [cols, rows] = best;
    const size = Math.min(bestSize, 560);
    const s = size / W;
    this.scale = s;
    const totalW = cols * size + (cols - 1) * gap;
    const totalH = rows * (size + labelH) + (rows - 1) * gap;
    const x0 = ins.left + (availW - totalW) / 2;
    const y0 = ins.top + (availH - totalH) / 2;
    this.views.forEach((v, i) => {
      // Pri troch oknách v mriežke 2 × 2 je spodné v strede.
      let col = i % cols;
      const row = Math.floor(i / cols);
      let shift = 0;
      if (n === 3 && cols === 2 && row === 1) {
        col = 0;
        shift = (size + gap) / 2;
      }
      v.x = Math.round(x0 + col * (size + gap) + shift);
      v.y = Math.round(y0 + row * (size + labelH + gap) + labelH);
      v.s = s;
      v.root.position.set(v.x, v.y);
      v.root.scale.set(s);
      v.label.text = `${this.names[v.r] ?? ''}`.toUpperCase();
      v.label.scale.set(1 / s);
      v.label.position.set(0, -labelH / s);
      // Štítok zrkadlenia vpravo; v úzkom okne sa zmenší, aby neprekryl názov.
      v.glyph.scale.set(1 / s);
      const room = W - v.label.width - 14 / s;
      if (v.glyph.width > room) v.glyph.scale.set((1 / s) * Math.max(0.45, room / v.glyph.width));
      v.glyph.position.set(W - v.glyph.width, -labelH / s + (18 / s - v.glyph.height) / 2);
    });
  }

  /** Index okna pod bodom obrazovky (-1 = žiadne). */
  panelAt(x: number, y: number): number {
    return this.views.findIndex(
      (v) => x >= v.x && y >= v.y - 30 && x <= v.x + W * v.s && y <= v.y + W * v.s,
    );
  }

  /** Stred okna na obrazovke (pre zobrazenie kotvy na dotyk). */
  panelRect(i: number): { x: number; y: number; w: number } | null {
    const v = this.views[i];
    return v ? { x: v.x, y: v.y, w: W * v.s } : null;
  }

  private drawBackground(sw: number, sh: number): void {
    const g = this.bg.clear();
    g.rect(0, 0, sw, sh).fill(0x02050a);
    const n = Math.floor((sw * sh) / 2600);
    for (let i = 0; i < n; i++) {
      const x = hash(i * 3 + 1) * sw;
      const y = hash(i * 3 + 2) * sh;
      const b = hash(i * 3 + 3);
      g.circle(x, y, b > 0.96 ? 1.4 : 0.7).fill({
        color: b > 0.9 ? PALETTES[i % 4]!.neon : WHITE,
        alpha: 0.12 + b * 0.3,
      });
    }
  }

  // ---------- udalosti ----------

  events(ev: Ev[]): void {
    const sim = this.sim;
    if (!sim) return;
    for (const e of ev) {
      switch (e.t) {
        case 'shard': {
          const v = this.views[e.p]!;
          const c = PALETTES[v.r]!.neon;
          this.burst(v, e.x, e.y, WHITE, 10, 140);
          this.burst(v, e.x, e.y, c, 14, 200);
          this.ring(v, e.x, e.y, c, 1);
          break;
        }
        case 'wave':
          this.glitch = 0.7;
          this.flash = 0.8;
          sim.panels.forEach((p, i) => this.ring(this.views[i]!, 5.5, 5.5, PALETTES[p.r]!.neon, 3));
          break;
        case 'death': {
          this.glitch = 1;
          this.shake = 0.8;
          sim.panels.forEach((p, i) => {
            const v = this.views[i]!;
            const c = PALETTES[p.r]!.neon;
            this.burst(
              v,
              p.x,
              p.y,
              i === e.p ? DANGER : c,
              i === e.p ? 40 : 18,
              i === e.p ? 260 : 150,
            );
          });
          break;
        }
        case 'dash':
          sim.panels.forEach((p, i) =>
            this.burst(this.views[i]!, p.x, p.y, PALETTES[p.r]!.neon, 6, 60),
          );
          break;
        case 'anchor':
          if (e.p >= 0) {
            const p = sim.panels[e.p]!;
            this.ring(this.views[e.p]!, p.x, p.y, WHITE, 0.7);
          }
          break;
        case 'fire': {
          const v = this.views[e.p]!;
          this.burst(v, e.x, e.y, DANGER, 3, 60);
          break;
        }
        case 'win':
          this.winGlow = 1;
          this.flash = 1;
          this.glitch = 0.5;
          sim.panels.forEach((p, i) => {
            const v = this.views[i]!;
            this.ring(v, p.x, p.y, WHITE, 2.5);
            this.burst(v, p.x, p.y, PALETTES[p.r]!.neon, 30, 220);
          });
          break;
      }
    }
  }

  private ring(v: PanelView, x: number, y: number, color: number, size: number): void {
    v.rings.push({ x: x * T, y: y * T, t: 0, color, size });
  }

  private burst(v: PanelView, x: number, y: number, color: number, n: number, speed: number): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = speed * (0.3 + Math.random() * 0.7);
      v.sparks.push({
        x: x * T,
        y: y * T,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        t: 0,
        life: 0.35 + Math.random() * 0.45,
        color,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  // ---------- snímok ----------

  frame(dt: number): void {
    const sim = this.sim;
    this.time += dt;
    this.glitch = Math.max(0, this.glitch - dt * 2.2);
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.winGlow = Math.max(0, this.winGlow - dt * 0.8);
    this.post.update(
      this.time,
      this.glitch,
      Math.max(0.75, this.scale * 1.2 * this.app.renderer.resolution),
    );
    this.drawUi();
    if (!sim) {
      this.world.visible = false;
      this.overlay.clear();
      return;
    }
    this.world.visible = true;
    sim.panels.forEach((p, i) => {
      const v = this.views[i];
      if (!v) return;
      this.drawFrame(v, sim, i);
      this.drawDyn(v, p, sim);
      this.drawCopy(v, p, sim, i, dt);
      this.drawFx(v, dt);
    });
    const g = this.overlay.clear();
    if (this.flash > 0)
      g.rect(0, 0, this.app.screen.width, this.app.screen.height).fill({
        color: WHITE,
        alpha: this.flash * 0.08,
      });
    const sx = this.shake ? (Math.random() - 0.5) * this.shake * 10 : 0;
    const sy = this.shake ? (Math.random() - 0.5) * this.shake * 10 : 0;
    this.root.position.set(sx, sy);
  }

  /** Rám okna: farba reality, pri kotve biely, pri smrti červený. */
  private drawFrame(v: PanelView, sim: Sim, i: number): void {
    const pal = PALETTES[v.r]!;
    const g = v.frame.clear();
    const anchored = sim.anchor === i;
    const pulse = this.waiting ? 0.55 + Math.sin(this.time * 3 + i) * 0.2 : 0.75;
    const color = sim.dead ? DANGER : anchored ? WHITE : pal.neon;
    g.rect(-6, -6, W + 12, W + 12).fill({ color: pal.bg, alpha: 1 });
    g.rect(-4, -4, W + 8, W + 8).stroke({ width: 3, color, alpha: anchored ? 1 : pulse });
    g.rect(-9, -9, W + 18, W + 18).stroke({ width: 1, color, alpha: 0.25 + this.winGlow * 0.6 });
    // Rohové značky.
    const k = 22;
    for (const [cx, cy, dx, dy] of [
      [-9, -9, 1, 1],
      [W + 9, -9, -1, 1],
      [-9, W + 9, 1, -1],
      [W + 9, W + 9, -1, -1],
    ] as const)
      g.moveTo(cx + dx * k, cy)
        .lineTo(cx, cy)
        .lineTo(cx, cy + dy * k);
    g.stroke({ width: 3, color, alpha: 0.9 });
  }

  private drawTerrain(v: PanelView, p: Panel): void {
    const pal = PALETTES[v.r]!;
    const g = v.terrain.clear();
    const solid = (ch: string) => '#><AVTH'.includes(ch);
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const ch = p.tile(x, y);
        const X = x * T;
        const Y = y * T;
        if (ch === '#' || 'TH'.includes(ch)) {
          g.rect(X, Y, T, T).fill(mix(pal.wall, 0x000000, 0.55));
          for (let i = 1; i < 4; i++) {
            const o = (i * T) / 4;
            g.moveTo(X + o, Y).lineTo(X, Y + o);
            g.moveTo(X + T, Y + o).lineTo(X + o, Y + T);
          }
          g.stroke({ width: 1, color: pal.neon, alpha: 0.06 });
          continue;
        }
        if ('><AV'.includes(ch)) {
          g.rect(X, Y, T, T).fill(mix(pal.wall, 0x000000, 0.4));
          continue;
        }
        if (ch === ':' || ch === ';') continue; // mihotavá podlaha sa kreslí každý snímok
        g.rect(X, Y, T, T).fill(pal.floor);
        g.rect(X + 1, Y + 1, T - 2, T - 2).stroke({ width: 1, color: pal.neon, alpha: 0.07 });
        g.circle(X, Y, 1.4).fill({ color: pal.neon, alpha: 0.2 });
        if (ch === '^') {
          for (let i = 0; i < 4; i++) {
            const cx = X + ((i % 2) + 0.5) * (T / 2);
            const cy = Y + (Math.floor(i / 2) + 0.5) * (T / 2);
            g.poly([cx - 7, cy + 6, cx, cy - 8, cx + 7, cy + 6]);
          }
          g.fill({ color: mix(pal.bg, DANGER, 0.35) }).stroke({
            width: 1.5,
            color: DANGER,
            alpha: 0.9,
          });
        } else if (v.r === 1 && hash(x * 31 + y * 7) > 0.7) {
          const ox = X + 8 + hash(x * 13 + y) * (T - 20);
          const oy = Y + 12 + hash(y * 5 + x) * (T - 20);
          g.moveTo(ox, oy)
            .quadraticCurveTo(ox + 5, oy - 3, ox + 10, oy)
            .stroke({ width: 1.2, color: pal.neon, alpha: 0.25 });
        } else if (v.r === 2 && hash(x * 17 + y * 3) > 0.65) {
          const ox = X + 8 + hash(x * 3 + y * 29) * (T - 16);
          const oy = Y + 12 + hash(x * 7 + y * 11) * (T - 18);
          g.moveTo(ox, oy)
            .lineTo(ox - 2, oy - 6)
            .moveTo(ox, oy)
            .lineTo(ox + 3, oy - 5)
            .stroke({ width: 1.2, color: pal.neon, alpha: 0.3 });
        } else if (v.r === 3 && hash(x * 5 + y * 13) > 0.8) {
          g.rect(X + hash(x + y * 3) * 26, Y + 10, 10, 3).fill({ color: pal.neon, alpha: 0.2 });
        }
      }
    // Neónové okraje stien.
    const DX = [0, 1, 0, -1];
    const DY = [-1, 0, 1, 0];
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        if (!solid(p.tile(x, y))) continue;
        for (let d = 0; d < 4; d++) {
          const nx = x + DX[d]!;
          const ny = y + DY[d]!;
          if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE || solid(p.tile(nx, ny))) continue;
          const X = x * T;
          const Y = y * T;
          const seg = (inset: number): [number, number, number, number] => {
            if (d === 0) return [X, Y + inset, X + T, Y + inset];
            if (d === 2) return [X, Y + T - inset, X + T, Y + T - inset];
            if (d === 3) return [X + inset, Y, X + inset, Y + T];
            return [X + T - inset, Y, X + T - inset, Y + T];
          };
          const [a, b, c, e] = seg(2);
          g.moveTo(a, b).lineTo(c, e).stroke({ width: 2.5, color: pal.neon, alpha: 0.95 });
        }
      }
  }

  private drawDyn(v: PanelView, p: Panel, sim: Sim): void {
    const pal = PALETTES[v.r]!;
    const g = v.dyn.clear();
    const t = sim.t;
    const time = this.time;
    // Mihotavá podlaha.
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const ch = p.tile(x, y);
        if (ch !== ':' && ch !== ';') continue;
        const X = x * T;
        const Y = y * T;
        const ph = blinkPhase(ch, t);
        if (ph === 'on') {
          for (let i = 0; i < 4; i++)
            g.rect(X + hash(x * 7 + y * 3 + i) * T, Y + hash(x * 5 + y * 11 + i) * T, 2, 2).fill({
              color: pal.neon,
              alpha: 0.4,
            });
          g.rect(X + 3, Y + 3, T - 6, T - 6).stroke({ width: 1, color: pal.neon, alpha: 0.15 });
          continue;
        }
        const flick = ph === 'warn' ? (Math.sin(time * 40) > 0 ? 0.35 : 0.9) : 1;
        g.rect(X, Y, T, T).fill({ color: mix(pal.floor, pal.neon, 0.12), alpha: flick });
        g.rect(X + 2, Y + 2, T - 4, T - 4).stroke({
          width: 1.5,
          color: pal.neon,
          alpha: 0.5 * flick,
        });
        if (ch === ';')
          g.moveTo(X + 8, Y + T / 2)
            .lineTo(X + T - 8, Y + T / 2)
            .stroke({ width: 1, color: pal.neon, alpha: 0.4 * flick });
      }
    // Lasery.
    for (const l of p.lasers) {
      const ph = laserPhase(l, t);
      const ex = (l.x + 0.5) * T;
      const ey = (l.y + 0.5) * T;
      const bx = ex + l.dx * (l.len + 0.5) * T;
      const by = ey + l.dy * (l.len + 0.5) * T;
      g.circle(ex, ey, 9)
        .fill({ color: 0x000000 })
        .stroke({ width: 2, color: DANGER, alpha: ph === 'off' ? 0.5 : 1 });
      g.circle(ex, ey, 3.5).fill({ color: ph === 'off' ? mix(DANGER, 0, 0.5) : WHITE });
      const sx = ex + l.dx * T * 0.3;
      const sy = ey + l.dy * T * 0.3;
      if (ph === 'on') {
        g.moveTo(sx, sy).lineTo(bx, by).stroke({ width: 10, color: DANGER, alpha: 0.35 });
        g.moveTo(sx, sy).lineTo(bx, by).stroke({ width: 4, color: DANGER, alpha: 1 });
        g.moveTo(sx, sy).lineTo(bx, by).stroke({ width: 1.5, color: WHITE, alpha: 1 });
      } else if (ph === 'warn') {
        const segs = Math.max(1, l.len * 3);
        for (let k = 0; k < segs; k += 2) {
          const a = k / segs;
          const b = (k + 1) / segs;
          g.moveTo(sx + (bx - sx) * a, sy + (by - sy) * a).lineTo(
            sx + (bx - sx) * b,
            sy + (by - sy) * b,
          );
        }
        g.stroke({ width: 1.5, color: DANGER, alpha: 0.5 + Math.sin(time * 30) * 0.3 });
      }
    }
    // Úlomky: aktuálna vlna žiari, ďalšie vlny sú len obrys.
    for (const s of p.shards) {
      if (s.taken) continue;
      const cx = s.x * T;
      const cy = s.y * T;
      const now = s.wave === sim.wave;
      const k = now ? 1 : 0.25;
      const bob = Math.sin(time * 3 + s.x + s.y) * 2;
      const r = 9 + (now ? Math.sin(time * 5 + s.x) * 1.2 : 0);
      const pts = [
        cx,
        cy - r * 1.3 + bob,
        cx + r,
        cy + bob,
        cx,
        cy + r * 1.3 + bob,
        cx - r,
        cy + bob,
      ];
      if (now) g.circle(cx, cy + bob, r * 2).fill({ color: pal.neon, alpha: 0.1 });
      g.poly(pts)
        .fill({ color: now ? WHITE : 0x000000, alpha: now ? 0.9 : 0.4 })
        .stroke({ width: 2, color: pal.neon, alpha: k });
      if (now)
        g.moveTo(cx - r, cy + bob)
          .lineTo(cx + r, cy + bob)
          .stroke({ width: 1, color: pal.neon, alpha: 0.8 });
    }
    // Píly.
    for (const s of p.saws) {
      const cx = s.x * T;
      const cy = s.y * T;
      const R = T * 0.36;
      const a0 = time * 12;
      const pts: number[] = [];
      for (let k = 0; k < 16; k++) {
        const a = a0 + (k / 16) * Math.PI * 2;
        const rr = k % 2 ? R : R * 0.72;
        pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      g.circle(cx, cy, R * 1.5).fill({ color: DANGER, alpha: 0.08 });
      g.poly(pts)
        .fill({ color: mix(DANGER, 0x000000, 0.6) })
        .stroke({ width: 2, color: DANGER });
      g.circle(cx, cy, 4).fill(WHITE);
    }
    // Veže a srdce.
    for (const gun of p.turrets) {
      const cx = gun.x * T;
      const cy = gun.y * T;
      const dx = p.x - gun.x;
      const dy = p.y - gun.y;
      const d = Math.hypot(dx, dy) || 1;
      const charge = gun.t / 2;
      g.rect(cx - 15, cy - 15, 30, 30)
        .fill({ color: 0x000000 })
        .stroke({ width: 2, color: DANGER });
      g.circle(cx, cy, 8).fill({ color: mix(0x000000, DANGER, charge) });
      g.moveTo(cx, cy)
        .lineTo(cx + (dx / d) * 20, cy + (dy / d) * 20)
        .stroke({ width: 4, color: WHITE });
    }
    for (const h of p.hearts) {
      const cx = h.x * T;
      const cy = h.y * T;
      const pulse = 1 + Math.sin(time * 4) * 0.06 + (h.t > 1.2 ? (h.t - 1.2) * 0.3 : 0);
      const R = T * 0.62 * pulse;
      g.circle(cx, cy, R * 1.8).fill({ color: WHITE, alpha: 0.06 });
      g.poly([cx, cy - R, cx + R * 0.9, cy + R * 0.6, cx - R * 0.9, cy + R * 0.6])
        .fill({ color: 0x000000 })
        .stroke({ width: 3, color: WHITE });
      PALETTES.forEach((pp, k) => {
        const a = time * 0.8 + (k / 4) * Math.PI * 2;
        g.circle(cx + Math.cos(a) * R * 0.35, cy + Math.sin(a) * R * 0.35 + R * 0.1, 3).fill(
          pp.neon,
        );
      });
    }
    // Utopenci (prenasledovatelia).
    for (const c of p.chasers) {
      const cx = c.x * T;
      const cy = c.y * T;
      const awake = t > 1;
      const wob = Math.sin(time * 6 + c.sx) * 2;
      g.circle(cx, cy, T * 0.36)
        .fill({ color: mix(0x000000, DANGER, 0.25), alpha: awake ? 1 : 0.5 })
        .stroke({ width: 2, color: DANGER, alpha: awake ? 1 : 0.5 });
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 + time * 1.5;
        g.moveTo(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12).lineTo(
          cx + Math.cos(a + 0.4) * (18 + wob),
          cy + Math.sin(a + 0.4) * (18 + wob),
        );
      }
      g.stroke({ width: 1.5, color: DANGER, alpha: 0.7 });
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      g.circle(cx + (dx / d) * 5 - (dy / d) * 4, cy + (dy / d) * 5 + (dx / d) * 4, 2.2).fill(WHITE);
      g.circle(cx + (dx / d) * 5 + (dy / d) * 4, cy + (dy / d) * 5 - (dx / d) * 4, 2.2).fill(WHITE);
    }
    // Strely.
    for (const b of p.bullets) {
      g.circle(b.x * T, b.y * T, 8).fill({ color: DANGER, alpha: 0.25 });
      g.circle(b.x * T, b.y * T, 4.5)
        .fill(WHITE)
        .stroke({ width: 2, color: DANGER });
    }
  }

  private drawCopy(v: PanelView, p: Panel, sim: Sim, i: number, dt: number): void {
    const pal = PALETTES[v.r]!;
    const g = v.copy.clear();
    const cx = p.x * T;
    const cy = p.y * T;
    v.trail = v.trail.filter((q) => (q.t += dt) < 0.25);
    if (Math.hypot(p.vx, p.vy) > 0.1) v.trail.push({ x: cx, y: cy, t: 0 });
    for (const q of v.trail)
      g.circle(q.x, q.y, 9 * (1 - q.t / 0.25)).fill({
        color: pal.neon,
        alpha: 0.25 * (1 - q.t / 0.25),
      });
    if (sim.dead) return;
    const anchored = sim.anchor === i;
    g.circle(cx, cy, T * 0.55).fill({ color: pal.neon, alpha: 0.08 + this.flash * 0.2 });
    // Postava zhora: telo, hlava, priezor v smere pohybu.
    const fx = p.fx;
    const fy = p.fy;
    g.ellipse(cx, cy + 2, 13, 10)
      .fill({ color: 0x000000, alpha: 0.6 })
      .stroke({ width: 2, color: pal.neon });
    g.circle(cx + fx * 3, cy + fy * 3, 7.5)
      .fill({ color: 0x0b0f14 })
      .stroke({ width: 2, color: pal.neon });
    g.moveTo(cx + fx * 6 - fy * 5, cy + fy * 6 - fx * 5)
      .lineTo(cx + fx * 6 + fy * 5, cy + fy * 6 + fx * 5)
      .stroke({ width: 3, color: WHITE });
    if (anchored) {
      const k = T * 0.5;
      const L = 7;
      for (const [sx, sy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const)
        g.moveTo(cx + sx * k, cy + sy * (k - L))
          .lineTo(cx + sx * k, cy + sy * k)
          .lineTo(cx + sx * (k - L), cy + sy * k);
      g.stroke({ width: 3, color: WHITE });
      g.circle(cx, cy, T * 0.7 + Math.sin(this.time * 6) * 2).stroke({
        width: 1,
        color: WHITE,
        alpha: 0.5,
      });
    }
    if (this.waiting)
      g.circle(cx, cy, T * (0.7 + ((this.time * 0.8) % 1) * 0.8)).stroke({
        width: 2,
        color: pal.neon,
        alpha: 1 - ((this.time * 0.8) % 1),
      });
  }

  private drawFx(v: PanelView, dt: number): void {
    const g = v.fx.clear();
    v.rings = v.rings.filter((r) => (r.t += dt) < 0.7);
    for (const r of v.rings) {
      const k = r.t / 0.7;
      g.circle(r.x, r.y, T * (0.4 + k * 2.2) * r.size).stroke({
        width: 3 * (1 - k),
        color: r.color,
        alpha: 1 - k,
      });
    }
    v.sparks = v.sparks.filter((s) => (s.t += dt) < s.life);
    for (const s of v.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.92;
      s.vy *= 0.92;
      const k = 1 - s.t / s.life;
      g.circle(s.x, s.y, s.size * k).fill({ color: s.color, alpha: k });
    }
  }

  /** Dotyková páčka (mimo filtra, v pixeloch obrazovky). */
  private drawUi(): void {
    const g = this.ui.clear();
    const s = this.stick;
    if (!s) return;
    const color = WHITE;
    g.circle(s.ox, s.oy, 50).stroke({ width: 2, color, alpha: 0.3 });
    g.circle(s.ox, s.oy, 50).fill({ color, alpha: 0.04 });
    const dx = s.x - s.ox;
    const dy = s.y - s.oy;
    const d = Math.hypot(dx, dy);
    const k = d > 46 ? 46 / d : 1;
    g.circle(s.ox + dx * k, s.oy + dy * k, 22)
      .fill({ color, alpha: 0.2 })
      .stroke({ width: 2, color, alpha: 0.7 });
  }
}
