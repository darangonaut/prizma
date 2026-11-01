import type { Ev } from '@/game/types';

/**
 * Syntetizovaný zvuk (Web Audio): každá realita má vlastnú ambientnú plochu, medzi ktorými
 * sa pri presune prelína. Žiadne zvukové súbory.
 */

/** Tóniny realít (frekvencie akordu) — Prima jasná, Hlbina tlmená, Jantár teplá, Nula rozladená. */
const CHORDS = [
  [130.81, 196.0, 246.94, 329.63, 493.88],
  [110.0, 164.81, 207.65, 261.63, 329.63],
  [146.83, 220.0, 277.18, 369.99, 440.0],
  [123.47, 174.61, 233.08, 311.13, 415.3],
];

interface Pad {
  r: number;
  gain: GainNode;
  nodes: AudioScheduledSourceNode[];
}

export class Audio {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private pad: Pad | null = null;
  private current = 0;
  private arpTimer = 0;
  private arpStep = 0;
  private noise!: AudioBuffer;
  muted = false;

  /** Spustí sa pri prvej interakcii (prehliadače blokujú zvuk vopred). */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(ctx.destination);
    this.music = ctx.createGain();
    this.music.gain.value = 0.32;
    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.55;
    // Jemný dozvuk cez spätnú väzbu oneskorenia.
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.31;
    const fb = ctx.createGain();
    fb.gain.value = 0.38;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(this.master);
    this.music.connect(this.master);
    this.music.connect(delay);
    this.sfx.connect(this.master);
    this.sfx.connect(delay);

    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.setReality(this.current, true);
  }

  /** Plocha jednej reality; beží len tá aktuálna (a pri prelínaní dve). */
  private makePad(chord: number[], r: number): Pad {
    const ctx = this.ctx!;
    const nodes: AudioScheduledSourceNode[] = [];
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = [1400, 520, 900, 2200][r]!;
    filter.Q.value = r === 3 ? 6 : 1;
    filter.connect(gain).connect(this.music);
    const type: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square'];
    chord.slice(0, 4).forEach((f, i) => {
      for (const det of [-6, 7]) {
        const o = ctx.createOscillator();
        o.type = i < 2 ? 'sine' : type[r]!;
        o.frequency.value = f;
        o.detune.value = det + (r === 3 ? Math.random() * 30 - 15 : 0);
        const g = ctx.createGain();
        g.gain.value = (i < 2 ? 0.09 : 0.035) / (r >= 2 ? 1.6 : 1);
        // Pomalé dýchanie hlasitosti.
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.05 + i * 0.031 + r * 0.01;
        const lg = ctx.createGain();
        lg.gain.value = g.gain.value * 0.6;
        lfo.connect(lg).connect(g.gain);
        o.connect(g).connect(filter);
        o.start();
        lfo.start();
        nodes.push(o, lfo);
      }
    });
    // Hlbina: filter sa pomaly vlní ako pod vodou.
    if (r === 1) {
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.12;
      const lg = ctx.createGain();
      lg.gain.value = 220;
      lfo.connect(lg).connect(filter.frequency);
      lfo.start();
      nodes.push(lfo);
    }
    return { r, gain, nodes };
  }

  setReality(r: number, instant = false): void {
    this.current = r;
    if (!this.ctx || this.pad?.r === r) return;
    const now = this.ctx.currentTime;
    const old = this.pad;
    if (old) {
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setTargetAtTime(0, now, instant ? 0.01 : 0.35);
      for (const n of old.nodes) n.stop(now + (instant ? 0.1 : 2));
    }
    const pad = this.makePad(CHORDS[r]!, r);
    pad.gain.gain.setTargetAtTime(1, now, instant ? 0.01 : 0.35);
    this.pad = pad;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  /** Volá sa každý snímok: arpeggio podľa reality. */
  update(dt: number): void {
    if (!this.ctx || this.muted) return;
    this.arpTimer -= dt;
    if (this.arpTimer > 0) return;
    const r = this.current;
    this.arpTimer = [0.9, 1.6, 1.2, 0.45][r]! * (0.8 + Math.random() * 0.5);
    const chord = CHORDS[r]!;
    const pattern = [0, 2, 4, 3, 1, 4, 2, 3];
    const f = chord[pattern[this.arpStep++ % pattern.length]!]! * (r === 3 ? 4 : 2);
    if (r === 1) this.bubble();
    else if (r === 2 && Math.random() < 0.3) this.chirp();
    else if (r === 3) this.blip(f * (Math.random() < 0.2 ? 1.5 : 1), 0.05, 'square', 0.04);
    else this.blip(f, 1.2, 'sine', 0.05);
  }

  // ---------- zvukové efekty ----------

  private blip(
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    to?: number,
    delay = 0,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private hiss(dur: number, freq: number, vol: number, q = 1, to?: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(freq, t);
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.sfx);
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
  }

  private bubble(): void {
    const f = 300 + Math.random() * 500;
    this.blip(f, 0.12, 'sine', 0.05, f * 2.2);
  }

  private chirp(): void {
    const f = 2400 + Math.random() * 1600;
    this.blip(f, 0.06, 'sine', 0.025, f * 1.3);
    this.blip(f * 1.1, 0.05, 'sine', 0.02, f * 1.4, 0.09);
  }

  play(ev: Ev[]): void {
    if (!this.ctx) return;
    let shots = 0;
    for (const e of ev) {
      switch (e.t) {
        case 'shoot':
          this.blip(880 + Math.random() * 80, 0.07, 'square', 0.035, 440);
          break;
        case 'lens':
          this.hiss(0.4, 1200, 0.25, 3, 6000);
          CHORDS[0]!
            .slice(0, 3)
            .forEach((f, i) => this.blip(f * 4, 0.35, 'sine', 0.06, f * 8, i * 0.03));
          break;
        case 'enemyShot':
          // Viac výstrelov v jednom snímku znie ako jeden.
          if (shots++ === 0) this.blip(300 + e.r * 60, 0.12, 'sawtooth', 0.025, 180);
          break;
        case 'hit':
          this.blip(e.boss ? 140 : 220, 0.06, 'square', 0.05, 90);
          break;
        case 'kill':
          this.hiss(0.35, 800, 0.25, 1, 200);
          this.blip(
            e.kind === 'warden' || e.kind === 'heart' ? 60 : 160,
            0.3,
            'sawtooth',
            0.08,
            40,
          );
          break;
        case 'spark':
          break;
        case 'hurt':
          this.blip(120, 0.25, 'sawtooth', 0.12, 50);
          this.hiss(0.2, 400, 0.2, 2);
          break;
        case 'death':
          this.blip(220, 1.2, 'sawtooth', 0.12, 30);
          this.hiss(1.2, 300, 0.3, 1, 60);
          break;
        case 'dash':
          this.hiss(0.18, 900, 0.18, 2, 2600);
          break;
        case 'telefrag':
          this.hiss(0.5, 200, 0.35, 1, 5000);
          this.blip(90, 0.4, 'square', 0.1, 30);
          break;
        case 'shift': {
          this.hiss(0.45, 300, 0.35, 2, 4000);
          const base = CHORDS[e.r]![0]! * 2;
          this.blip(base, 0.5, 'sine', 0.12, base * 2);
          this.blip(base * 1.5, 0.6, 'triangle', 0.06, base * 3, 0.05);
          this.setReality(e.r);
          break;
        }
        case 'shiftBlocked':
          if (e.why === 'solid' || e.why === 'locked') {
            this.blip(160, 0.18, 'sawtooth', 0.06, 60);
            this.hiss(0.15, 900, 0.12, 4);
          }
          break;
        case 'pickup':
        case 'health':
          [0, 4, 7, 12].forEach((s, i) =>
            this.blip(523.25 * 2 ** (s / 12), 0.25, 'sine', 0.08, undefined, i * 0.06),
          );
          break;
        case 'heal':
          this.blip(660, 0.15, 'sine', 0.06, 990);
          break;
        case 'unlock':
          CHORDS[e.r]!.forEach((f, i) => this.blip(f * 2, 1.6, 'sine', 0.07, undefined, i * 0.09));
          this.hiss(1.2, 200, 0.25, 1, 6000);
          break;
        case 'read':
          for (let i = 0; i < 3; i++)
            this.blip(1200 + i * 200, 0.05, 'square', 0.03, undefined, i * 0.07);
          break;
        case 'switch':
          this.blip(660, 0.1, 'square', 0.05);
          this.blip(990, 0.15, 'square', 0.04, undefined, 0.08);
          break;
        case 'open':
          this.blip(523.25, 0.2, 'sine', 0.08);
          this.blip(783.99, 0.3, 'sine', 0.08, undefined, 0.1);
          break;
        case 'save':
          [0, 7, 12].forEach((s, i) =>
            this.blip(392 * 2 ** (s / 12), 0.4, 'triangle', 0.06, undefined, i * 0.08),
          );
          break;
        case 'cut':
          this.hiss(0.2, 2500, 0.2, 2, 800);
          break;
        case 'zap':
          this.hiss(0.25, 3000, 0.2, 6, 900);
          break;
        case 'needItem':
          this.blip(220, 0.15, 'square', 0.04, 200, 0.1);
          break;
        case 'room':
          this.hiss(0.3, 500, 0.08, 1, 1500);
          break;
        case 'bossShift':
          this.hiss(0.6, 150, 0.3, 2, 3000);
          break;
        case 'bossDown':
        case 'core':
          CHORDS[0]!.forEach((f, i) => this.blip(f * 2, 1.4, 'triangle', 0.07, f * 4, i * 0.07));
          break;
        default:
          break;
      }
    }
  }

  click(): void {
    this.blip(900, 0.04, 'square', 0.03);
  }
}
