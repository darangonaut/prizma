import { NO_INPUT, type Input } from '@/game/types';

/** Jednorazové povely mimo pohybu (rozhranie). */
export type Command =
  | { t: 'shift'; r: number }
  | { t: 'cycle'; d: 1 | -1 }
  | { t: 'pause' }
  | { t: 'map' }
  | { t: 'confirm' };

const MOVE: Record<string, [number, number]> = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
};

/**
 * Klávesnica + myš (mierenie kurzorom), dotyk (virtuálna páčka a tlačidlá) a gamepad.
 * Plynulé ovládanie sa číta každý snímok, jednorazové povely sa zbierajú do fronty.
 */
export class Controls {
  private keys = new Set<string>();
  private commands: Command[] = [];
  private dashQueued = false;
  private lensQueued = false;
  private mouse = { x: 0, y: 0, down: false, active: false, idle: 0 };
  private stick: { id: number; ox: number; oy: number; x: number; y: number } | null = null;
  private fireTouch = false;
  private peekTouch = false;
  private padPrev: boolean[] = [];
  private padAim = false;
  touchMode = false;
  onTouchMode: () => void = () => {};
  /** Prvá interakcia (odomknutie zvuku). */
  onAny: () => void = () => {};

  constructor(surface: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      this.onAny();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (MOVE[k] || k === ' ' || k === 'tab') e.preventDefault();
      if (e.repeat) return;
      this.keys.add(k);
      if (k >= '1' && k <= '4') this.commands.push({ t: 'shift', r: Number(k) - 1 });
      else if (k === 'q') this.commands.push({ t: 'cycle', d: -1 });
      else if (k === 'e') this.commands.push({ t: 'cycle', d: 1 });
      else if (k === ' ' || k === 'k') {
        this.dashQueued = true;
        if (k === ' ') this.commands.push({ t: 'confirm' });
      } else if (k === 'l' || k === 'c') this.lensQueued = true;
      else if (k === 'escape' || k === 'p') this.commands.push({ t: 'pause' });
      else if (k === 'm' || k === 'tab') this.commands.push({ t: 'map' });
      else if (k === 'enter') this.commands.push({ t: 'confirm' });
      else if (k === 'j' || k === 'x') this.commands.push({ t: 'confirm' });
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse.down = false;
      this.stick = null;
      this.fireTouch = false;
      this.peekTouch = false;
    });

    surface.addEventListener('contextmenu', (e) => e.preventDefault());
    surface.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') {
        if (this.stick && e.pointerId === this.stick.id) {
          this.stick.x = e.clientX;
          this.stick.y = e.clientY;
        }
        return;
      }
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
      this.mouse.idle = 0;
    });
    surface.addEventListener('pointerdown', (e) => {
      this.onAny();
      if (e.pointerType === 'touch') {
        this.enterTouch();
        // Ľavá polovica obrazovky = páčka (kdekoľvek sa prstom dotkne).
        if (!this.stick && e.clientX < window.innerWidth * 0.55) {
          this.stick = {
            id: e.pointerId,
            ox: e.clientX,
            oy: e.clientY,
            x: e.clientX,
            y: e.clientY,
          };
          surface.setPointerCapture(e.pointerId);
        } else this.commands.push({ t: 'confirm' });
        return;
      }
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.active = true;
      this.mouse.idle = 0;
      if (e.button === 0) this.mouse.down = true;
      if (e.button === 2) this.lensQueued = true;
      this.commands.push({ t: 'confirm' });
    });
    const up = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (this.stick && e.pointerId === this.stick.id) this.stick = null;
        return;
      }
      if (e.button === 0) this.mouse.down = false;
    };
    surface.addEventListener('pointerup', up);
    surface.addEventListener('pointercancel', up);
  }

  private enterTouch(): void {
    if (this.touchMode) return;
    this.touchMode = true;
    this.mouse.active = false;
    this.onTouchMode();
  }

  /** Dotykové tlačidlá: držanie (streľba, nahliadnutie) a stlačenie (úskok, šošovka). */
  bindButton(btn: HTMLElement, kind: 'fire' | 'dash' | 'lens' | 'peek'): void {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onAny();
      this.enterTouch();
      btn.setPointerCapture(e.pointerId);
      btn.classList.add('down');
      if (kind === 'fire') this.fireTouch = true;
      else if (kind === 'peek') this.peekTouch = true;
      else if (kind === 'dash') this.dashQueued = true;
      else this.lensQueued = true;
      this.commands.push({ t: 'confirm' });
    });
    const release = () => {
      btn.classList.remove('down');
      if (kind === 'fire') this.fireTouch = false;
      if (kind === 'peek') this.peekTouch = false;
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
  }

  push(c: Command): void {
    this.commands.push(c);
  }

  next(): Command | undefined {
    return this.commands.shift();
  }

  clear(): void {
    this.commands = [];
    this.dashQueued = false;
    this.lensQueued = false;
  }

  get peek(): boolean {
    return this.keys.has('shift') || this.peekTouch || this.padButton(3);
  }

  /** Páčka na obrazovke (pre vykreslenie): stred a výchylka v pixeloch. */
  get stickView(): { ox: number; oy: number; x: number; y: number } | null {
    return this.stick;
  }

  private padButton(i: number): boolean {
    const pad = navigator.getGamepads?.().find((p) => p && p.connected);
    return !!pad?.buttons[i]?.pressed;
  }

  /**
   * Vstup na tento snímok. `player` = poloha hráča na obrazovke (pre mierenie myšou).
   */
  read(dt: number, player: { x: number; y: number }): Input {
    const input: Input = { ...NO_INPUT };
    for (const [k, [x, y]] of Object.entries(MOVE))
      if (this.keys.has(k)) {
        input.mx += x;
        input.my += y;
      }
    if (this.stick) {
      const dx = this.stick.x - this.stick.ox;
      const dy = this.stick.y - this.stick.oy;
      const d = Math.hypot(dx, dy);
      const max = 46;
      if (d > 6) {
        const k = Math.min(1, d / max) / d;
        input.mx = dx * k;
        input.my = dy * k;
      }
      // Páčka sa ťahá za prstom, keď ide príliš ďaleko.
      if (d > max * 1.4) {
        this.stick.ox = this.stick.x - (dx / d) * max * 1.4;
        this.stick.oy = this.stick.y - (dy / d) * max * 1.4;
      }
    }
    this.mouse.idle += dt;
    if (this.mouse.active && !this.touchMode) {
      input.ax = this.mouse.x - player.x;
      input.ay = this.mouse.y - player.y;
      // Ak myš dlho stojí a hráč strieľa klávesnicou, mieri sa smerom pohybu.
      if (this.mouse.idle > 2.5 && !this.mouse.down) {
        input.ax = 0;
        input.ay = 0;
      }
    }
    input.fire = this.mouse.down || this.fireTouch || this.keys.has('j') || this.keys.has('x');
    input.dash = this.dashQueued;
    input.lens = this.lensQueued;
    this.dashQueued = false;
    this.lensQueued = false;
    this.readPad(input);
    return input;
  }

  private readPad(input: Input): void {
    const pad = navigator.getGamepads?.().find((p) => p && p.connected);
    if (!pad) return;
    const dead = (v: number | undefined) => (v !== undefined && Math.abs(v) > 0.22 ? v : 0);
    const lx = dead(pad.axes[0]);
    const ly = dead(pad.axes[1]);
    const rx = dead(pad.axes[2]);
    const ry = dead(pad.axes[3]);
    if (lx || ly) {
      input.mx = lx;
      input.my = ly;
    }
    if (pad.buttons[14]?.pressed) input.mx = -1;
    if (pad.buttons[15]?.pressed) input.mx = 1;
    if (pad.buttons[12]?.pressed) input.my = -1;
    if (pad.buttons[13]?.pressed) input.my = 1;
    const aim = Math.hypot(rx, ry) > 0.35;
    if (aim) {
      input.ax = rx;
      input.ay = ry;
      input.fire = true;
    }
    this.padAim = aim;
    const pressed = (i: number) => !!pad.buttons[i]?.pressed;
    const edge = (i: number) => pressed(i) && !this.padPrev[i];
    if (pressed(7) || pressed(2)) input.fire = true;
    if (edge(0)) {
      input.dash = true;
      this.commands.push({ t: 'confirm' });
    }
    if (edge(1) || edge(6)) input.lens = true;
    if (edge(4)) this.commands.push({ t: 'cycle', d: -1 });
    if (edge(5)) this.commands.push({ t: 'cycle', d: 1 });
    if (edge(9)) this.commands.push({ t: 'pause' });
    if (edge(8)) this.commands.push({ t: 'map' });
    this.padPrev = pad.buttons.map((b) => b.pressed);
    if (lx || ly || aim || this.padPrev.some(Boolean)) this.mouse.active = false;
  }

  /** Mieri hráč práve pravou páčkou gamepadu? */
  get aiming(): boolean {
    return this.padAim;
  }
}
