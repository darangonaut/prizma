import { NO_INPUT, type Input } from '@/game/types';

/** Jednorazové povely mimo pohybu. */
export type Command =
  | { t: 'anchor'; p: number }
  | { t: 'anchorCycle'; d: 1 | -1 }
  | { t: 'tap'; x: number; y: number }
  | { t: 'pause' }
  | { t: 'restart' }
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

interface Touch {
  id: number;
  ox: number;
  oy: number;
  x: number;
  y: number;
  t: number;
  stick: boolean;
}

/**
 * Klávesnica, dotyk (plávajúca páčka kdekoľvek, ťuknutie na okno = kotva) a gamepad.
 * Plynulý pohyb sa číta každý snímok, jednorazové povely sa zbierajú do fronty.
 */
export class Controls {
  private keys = new Set<string>();
  private commands: Command[] = [];
  private dashQueued = false;
  private touches = new Map<number, Touch>();
  private padPrev: boolean[] = [];
  touchMode = false;
  onTouchMode: () => void = () => {};
  /** Prvá interakcia (odomknutie zvuku). */
  onAny: () => void = () => {};

  constructor(surface: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      this.onAny();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (MOVE[k] || k === ' ') e.preventDefault();
      if (e.repeat) return;
      this.keys.add(k);
      if (k >= '1' && k <= '4') this.commands.push({ t: 'anchor', p: Number(k) - 1 });
      else if (k === 'q') this.commands.push({ t: 'anchorCycle', d: -1 });
      else if (k === 'e') this.commands.push({ t: 'anchorCycle', d: 1 });
      else if (k === ' ' || k === 'shift' || k === 'k') {
        this.dashQueued = true;
        if (k === ' ') this.commands.push({ t: 'confirm' });
      } else if (k === 'escape' || k === 'p') this.commands.push({ t: 'pause' });
      else if (k === 'r') this.commands.push({ t: 'restart' });
      else if (k === 'enter') this.commands.push({ t: 'confirm' });
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.touches.clear();
    });

    surface.addEventListener('contextmenu', (e) => e.preventDefault());
    surface.addEventListener('pointerdown', (e) => {
      this.onAny();
      if (e.pointerType !== 'touch') {
        this.commands.push({ t: 'tap', x: e.clientX, y: e.clientY });
        return;
      }
      this.enterTouch();
      surface.setPointerCapture(e.pointerId);
      this.touches.set(e.pointerId, {
        id: e.pointerId,
        ox: e.clientX,
        oy: e.clientY,
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
        stick: false,
      });
    });
    surface.addEventListener('pointermove', (e) => {
      const tch = this.touches.get(e.pointerId);
      if (!tch) return;
      tch.x = e.clientX;
      tch.y = e.clientY;
      // Prst, ktorý sa pohne, sa stane páčkou (ak ešte žiadna nie je).
      if (!tch.stick && Math.hypot(tch.x - tch.ox, tch.y - tch.oy) > 12 && !this.stickTouch())
        tch.stick = true;
    });
    const up = (e: PointerEvent) => {
      const tch = this.touches.get(e.pointerId);
      if (!tch) return;
      this.touches.delete(e.pointerId);
      if (!tch.stick && performance.now() - tch.t < 350)
        this.commands.push({ t: 'tap', x: tch.ox, y: tch.oy });
    };
    surface.addEventListener('pointerup', up);
    surface.addEventListener('pointercancel', (e) => this.touches.delete(e.pointerId));
  }

  private stickTouch(): Touch | undefined {
    for (const t of this.touches.values()) if (t.stick) return t;
    return undefined;
  }

  private enterTouch(): void {
    if (this.touchMode) return;
    this.touchMode = true;
    this.onTouchMode();
  }

  /** Dotykové tlačidlo úskoku. */
  bindDash(btn: HTMLElement): void {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onAny();
      this.enterTouch();
      btn.classList.add('down');
      this.dashQueued = true;
    });
    const release = () => btn.classList.remove('down');
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
  }

  /** Páčka na obrazovke (pre vykreslenie): stred a výchylka v pixeloch. */
  get stickView(): { ox: number; oy: number; x: number; y: number } | null {
    return this.stickTouch() ?? null;
  }

  read(): Input {
    const input: Input = { ...NO_INPUT };
    for (const [k, [x, y]] of Object.entries(MOVE))
      if (this.keys.has(k)) {
        input.mx += x;
        input.my += y;
      }
    input.mx = Math.max(-1, Math.min(1, input.mx));
    input.my = Math.max(-1, Math.min(1, input.my));
    const st = this.stickTouch();
    if (st) {
      const dx = st.x - st.ox;
      const dy = st.y - st.oy;
      const d = Math.hypot(dx, dy);
      const max = 46;
      if (d > 8) {
        const k = Math.min(1, d / max) / d;
        input.mx = dx * k;
        input.my = dy * k;
      }
      // Páčka sa ťahá za prstom, keď ide príliš ďaleko.
      if (d > max * 1.4) {
        st.ox = st.x - (dx / d) * max * 1.4;
        st.oy = st.y - (dy / d) * max * 1.4;
      }
    }
    input.dash = this.dashQueued;
    this.dashQueued = false;
    this.readPad(input);
    return input;
  }

  private readPad(input: Input): void {
    const pad = navigator.getGamepads?.().find((p) => p && p.connected);
    if (!pad) return;
    const dead = (v: number | undefined) => (v !== undefined && Math.abs(v) > 0.22 ? v : 0);
    const lx = dead(pad.axes[0]);
    const ly = dead(pad.axes[1]);
    if (lx || ly) {
      input.mx = lx;
      input.my = ly;
    }
    if (pad.buttons[14]?.pressed) input.mx = -1;
    if (pad.buttons[15]?.pressed) input.mx = 1;
    if (pad.buttons[12]?.pressed) input.my = -1;
    if (pad.buttons[13]?.pressed) input.my = 1;
    const pressed = (i: number) => !!pad.buttons[i]?.pressed;
    const edge = (i: number) => pressed(i) && !this.padPrev[i];
    if (edge(0)) {
      input.dash = true;
      this.commands.push({ t: 'confirm' });
    }
    if (edge(4)) this.commands.push({ t: 'anchorCycle', d: -1 });
    if (edge(5)) this.commands.push({ t: 'anchorCycle', d: 1 });
    if (edge(9)) this.commands.push({ t: 'pause' });
    if (edge(8) || edge(3)) this.commands.push({ t: 'restart' });
    this.padPrev = pad.buttons.map((b) => b.pressed);
  }
}
