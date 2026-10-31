import type { Dir } from '@/game/types';

export type Action =
  | { t: 'move'; dir: Dir }
  | { t: 'shift'; r: number }
  | { t: 'cycle'; d: 1 | -1 }
  | { t: 'undo' }
  | { t: 'reset' }
  | { t: 'pause' }
  | { t: 'confirm' };

const KEY_DIR: Record<string, Dir> = {
  arrowup: 0,
  w: 0,
  arrowright: 1,
  d: 1,
  arrowdown: 2,
  s: 2,
  arrowleft: 3,
  a: 3,
};

/** Prvé opakovanie pri držaní smeru a potom interval (s). */
const REPEAT_DELAY = 0.22;
const REPEAT_EVERY = 0.13;

/**
 * Klávesnica, dotykový ovládač a švihnutie po plátne. Akcie sa zbierajú do fronty,
 * hra si ich vyberá po jednej, keď hrdina dokončí krok.
 */
export class Controls {
  private queue: Action[] = [];
  private held: Dir[] = [];
  private holdTime = 0;
  private repeatTimer = 0;
  private peekKeys = new Set<string>();
  private peekTouch = false;
  touchMode = false;
  onTouchMode: () => void = () => {};
  /** Akákoľvek prvá interakcia (odomknutie zvuku). */
  onAny: () => void = () => {};

  constructor(surface: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      this.onAny();
      const k = e.key.toLowerCase();
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const dir = KEY_DIR[k];
      if (dir !== undefined) {
        e.preventDefault();
        if (!e.repeat) this.press(dir);
        return;
      }
      if (e.repeat) return;
      if (k >= '1' && k <= '4') this.queue.push({ t: 'shift', r: Number(k) - 1 });
      else if (k === 'q') this.queue.push({ t: 'cycle', d: -1 });
      else if (k === 'e' || k === 'tab') {
        e.preventDefault();
        this.queue.push({ t: 'cycle', d: 1 });
      } else if (k === 'z' || k === 'backspace' || k === 'u') this.queue.push({ t: 'undo' });
      else if (k === 'r') this.queue.push({ t: 'reset' });
      else if (k === 'escape' || k === 'p') this.queue.push({ t: 'pause' });
      else if (k === 'enter') this.queue.push({ t: 'confirm' });
      else if (k === ' ' || k === 'shift') {
        e.preventDefault();
        this.peekKeys.add(k);
        if (k === ' ') this.queue.push({ t: 'confirm' });
      }
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      const dir = KEY_DIR[k];
      if (dir !== undefined) this.release(dir);
      this.peekKeys.delete(k);
    });
    window.addEventListener('blur', () => {
      this.held = [];
      this.peekKeys.clear();
      this.peekTouch = false;
    });

    // Švihnutie po plátne.
    let sx = 0;
    let sy = 0;
    let id: number | null = null;
    surface.addEventListener('pointerdown', (e) => {
      this.onAny();
      if (e.pointerType !== 'touch') return;
      this.enterTouch();
      id = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
    });
    surface.addEventListener('pointerup', (e) => {
      if (e.pointerId !== id) return;
      id = null;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
        this.queue.push({ t: 'confirm' });
        return;
      }
      const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
      this.queue.push({ t: 'move', dir });
    });
  }

  private enterTouch(): void {
    if (this.touchMode) return;
    this.touchMode = true;
    this.onTouchMode();
  }

  /** Dotykový smerový ovládač (tlačidlá s data-dir). */
  bindPad(pad: HTMLElement): void {
    pad.querySelectorAll<HTMLElement>('[data-dir]').forEach((btn) => {
      const dir = Number(btn.dataset.dir) as Dir;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.onAny();
        this.enterTouch();
        btn.setPointerCapture(e.pointerId);
        btn.classList.add('down');
        this.press(dir);
      });
      const up = () => {
        btn.classList.remove('down');
        this.release(dir);
      };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
    });
  }

  bindPeek(btn: HTMLElement): void {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onAny();
      btn.setPointerCapture(e.pointerId);
      this.peekTouch = true;
    });
    const up = () => (this.peekTouch = false);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
  }

  push(a: Action): void {
    this.queue.push(a);
  }

  private press(dir: Dir): void {
    this.held = this.held.filter((d) => d !== dir);
    this.held.push(dir);
    this.holdTime = 0;
    this.repeatTimer = 0;
    this.queue.push({ t: 'move', dir });
  }

  private release(dir: Dir): void {
    this.held = this.held.filter((d) => d !== dir);
  }

  get peek(): boolean {
    return this.peekKeys.has('shift') || this.peekKeys.has(' ') || this.peekTouch;
  }

  /** Opakovanie pri držaní smeru. */
  update(dt: number): void {
    const dir = this.held[this.held.length - 1];
    if (dir === undefined) return;
    this.holdTime += dt;
    if (this.holdTime < REPEAT_DELAY) return;
    this.repeatTimer -= dt;
    if (this.repeatTimer <= 0) {
      this.repeatTimer = REPEAT_EVERY;
      if (!this.queue.some((a) => a.t === 'move')) this.queue.push({ t: 'move', dir });
    }
  }

  next(): Action | undefined {
    return this.queue.shift();
  }

  clear(): void {
    this.queue = [];
  }
}
