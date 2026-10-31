/**
 * Úvodná animácia: biely lúč vchádza do hranola a rozkladá sa na štyri reality.
 * Obyčajné 2D plátno, aby úvodná obrazovka nečakala na PixiJS.
 */
const COLORS = ['#2ef2ff', '#ff3bd4', '#ffb52e', '#4dff88'];

export class TitleArt {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private t = 0;
  private last = 0;
  private dust: { x: number; y: number; v: number; c: number; s: number }[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    for (let i = 0; i < 90; i++)
      this.dust.push({
        x: Math.random(),
        y: Math.random(),
        v: 0.004 + Math.random() * 0.012,
        c: i % 4,
        s: Math.random(),
      });
  }

  start(): void {
    if (this.raf) return;
    this.last = performance.now();
    const loop = (now: number) => {
      this.t += Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private draw(): void {
    const c = this.canvas;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const g = this.ctx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const t = this.t;
    // Hranol pod logom (na úzkej obrazovke nižšie).
    const cx = w * 0.5;
    const size = Math.min(w, h) * 0.075;
    const cy = h - size * 0.9 - Math.max(14, h * 0.03);

    // Prach v priestore.
    for (const d of this.dust) {
      d.x -= d.v * 0.016;
      if (d.x < -0.02) d.x = 1.02;
      const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * (0.5 + d.s) + d.s * 9));
      g.fillStyle = COLORS[d.c]!;
      g.globalAlpha = 0.12 + tw * 0.25;
      g.fillRect(d.x * w, d.y * h, 1.5, 1.5);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'lighter';

    // Vstupný biely lúč zľava.
    const inY = cy + Math.sin(t * 0.7) * 2;
    const beam = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      color: string,
      width: number,
      alpha: number,
    ) => {
      g.strokeStyle = color;
      g.globalAlpha = alpha * 0.25;
      g.lineWidth = width * 5;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
      g.globalAlpha = alpha;
      g.lineWidth = width;
      g.stroke();
    };
    beam(0, inY - size * 0.9, cx - size * 0.45, cy, '#ffffff', 2, 0.85);

    // Štyri vystupujúce lúče, každý sa občas zlomí (glitch).
    COLORS.forEach((col, i) => {
      const spread = (i - 1.5) * 0.11 + Math.sin(t * 0.4 + i) * 0.01;
      const glitch = Math.sin(t * 3.1 + i * 2) > 0.985 ? (Math.random() - 0.5) * 30 : 0;
      const x1 = w + 20;
      const y1 = cy + (x1 - cx) * spread + glitch;
      beam(cx + size * 0.3, cy + i * 2 - 3, x1, y1, col, 2, 0.8);
    });

    // Hranol.
    g.globalCompositeOperation = 'source-over';
    const rot = Math.sin(t * 0.5) * 0.05;
    g.save();
    g.translate(cx, cy);
    g.rotate(rot);
    g.beginPath();
    g.moveTo(0, -size);
    g.lineTo(size * 0.9, size * 0.6);
    g.lineTo(-size * 0.9, size * 0.6);
    g.closePath();
    const grad = g.createLinearGradient(-size, 0, size, 0);
    grad.addColorStop(0, 'rgba(46,242,255,0.10)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,59,212,0.10)');
    g.fillStyle = grad;
    g.fill();
    g.strokeStyle = 'rgba(240,252,255,0.95)';
    g.lineWidth = 2;
    g.shadowColor = '#2ef2ff';
    g.shadowBlur = 18;
    g.stroke();
    g.restore();
    g.shadowBlur = 0;
    g.globalAlpha = 1;

    // Riadky obrazovky.
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  }
}
