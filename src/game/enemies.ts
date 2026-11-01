import type { Enemy, Sim } from './sim';
import { ROOM_H, ROOM_W, type EnemyKind } from './types';

/** Vlastnosti nepriateľov (dlaždice, sekundy). */
export const ENEMY: Record<EnemyKind, { hp: number; rad: number; speed: number }> = {
  // Strážny dron (Prima): drží odstup, krúži a strieľa.
  drone: { hp: 3, rad: 0.36, speed: 2.4 },
  // Utopenec z Hlbiny: pláva vodou, priblíži sa a skočí.
  crawler: { hp: 2, rad: 0.36, speed: 2.7 },
  // Spórová lusk (Jantár): stojí a pľuje vejár.
  pod: { hp: 4, rad: 0.42, speed: 0 },
  // Veža reaktora: strieľa do štyroch strán.
  turret: { hp: 6, rad: 0.42, speed: 0 },
  // Glitch z Nuly: preskakuje k hráčovi a ide za ním aj do inej reality.
  glitch: { hp: 2, rad: 0.34, speed: 1 },
  // Strážca reaktora: boss, ktorý sa presúva medzi realitami.
  warden: { hp: 48, rad: 0.95, speed: 1.6 },
  // Srdce Prizmy: je vo všetkých realitách, zraniteľné len v jednej.
  heart: { hp: 72, rad: 1.1, speed: 0 },
};

export function updateEnemy(s: Sim, e: Enemy, dt: number): void {
  e.flash = Math.max(0, e.flash - dt);
  switch (e.kind) {
    case 'drone':
      drone(s, e, dt);
      break;
    case 'crawler':
      crawler(s, e, dt);
      break;
    case 'pod':
      pod(s, e, dt);
      break;
    case 'turret':
      turret(s, e, dt);
      break;
    case 'glitch':
      glitch(s, e, dt);
      break;
    case 'warden':
      warden(s, e, dt);
      break;
    case 'heart':
      heart(s, e, dt);
      break;
  }
}

function toPlayer(s: Sim, e: Enemy): { ux: number; uy: number; d: number; a: number } {
  const dx = s.p.x - e.x;
  const dy = s.p.y - e.y;
  const d = Math.hypot(dx, dy) || 1e-6;
  return { ux: dx / d, uy: dy / d, d, a: Math.atan2(dy, dx) };
}

/** Bezcieľne potulovanie; pri náraze do steny zmení smer. */
function wander(s: Sim, e: Enemy, dt: number, speed: number, swim: boolean): void {
  e.t2 -= dt;
  if (e.t2 <= 0) {
    e.ang = s.rand() * Math.PI * 2;
    e.t2 = 1 + s.rand() * 1.6;
  }
  const hit = s.moveBox(
    e,
    Math.cos(e.ang) * speed * dt,
    Math.sin(e.ang) * speed * dt,
    e.rad * 0.8,
    e.r,
    swim,
  );
  if (hit) e.ang += Math.PI * (0.5 + s.rand());
}

function drone(s: Sim, e: Enemy, dt: number): void {
  if (!s.sees(e, 10)) {
    wander(s, e, dt, 0.9, true);
    e.t = Math.max(e.t, 0.6);
    return;
  }
  const { ux, uy, d, a } = toPlayer(s, e);
  e.t3 -= dt;
  if (e.t3 <= 0) {
    e.t3 = 1.2 + s.rand() * 1.4;
    e.st = s.rand() < 0.5 ? 1 : -1;
  }
  let vx = ux * (d - 4.5) * 0.9 - uy * e.st * 1.3;
  let vy = uy * (d - 4.5) * 0.9 + ux * e.st * 1.3;
  const v = Math.hypot(vx, vy);
  const max = ENEMY.drone.speed;
  if (v > max) {
    vx *= max / v;
    vy *= max / v;
  }
  if (s.moveBox(e, vx * dt, vy * dt, e.rad * 0.8, e.r, true)) e.st = -e.st;
  e.ang = a;
  e.t -= dt;
  if (e.t <= 0) {
    e.t = 1.5 + s.rand() * 0.7;
    s.fire(e, e.r, a + (s.rand() - 0.5) * 0.12, 6);
    s.emit({ t: 'enemyShot', x: e.x, y: e.y, r: e.r });
  }
}

function crawler(s: Sim, e: Enemy, dt: number): void {
  if (e.st === 1) {
    // Nádych pred skokom.
    e.t3 -= dt;
    if (e.t3 <= 0) {
      e.st = 2;
      e.t3 = 0.28;
      e.vx = Math.cos(e.ang) * 8.5;
      e.vy = Math.sin(e.ang) * 8.5;
    }
    return;
  }
  if (e.st === 2) {
    e.t3 -= dt;
    const hit = s.moveBox(e, e.vx * dt, e.vy * dt, e.rad * 0.8, e.r, true);
    if (hit || e.t3 <= 0) {
      e.st = 0;
      e.t = 0.9;
    }
    return;
  }
  e.t -= dt;
  if (!s.sees(e, 8)) {
    wander(s, e, dt, 0.7, true);
    return;
  }
  const { ux, uy, d, a } = toPlayer(s, e);
  e.ang = a;
  if (d < 2.7 && e.t <= 0) {
    e.st = 1;
    e.t3 = 0.42;
    return;
  }
  s.moveBox(
    e,
    ux * ENEMY.crawler.speed * dt,
    uy * ENEMY.crawler.speed * dt,
    e.rad * 0.8,
    e.r,
    true,
  );
}

function pod(s: Sim, e: Enemy, dt: number): void {
  if (!s.sees(e, 9)) {
    e.t = Math.max(e.t, 0.8);
    return;
  }
  const { a } = toPlayer(s, e);
  e.ang = a;
  e.t -= dt;
  if (e.t <= 0) {
    e.t = 2.2 + s.rand() * 0.4;
    for (const o of [-0.3, 0, 0.3]) s.fire(e, e.r, a + o, 4.2, { rad: 0.17 });
    s.emit({ t: 'enemyShot', x: e.x, y: e.y, r: e.r });
  }
}

function turret(s: Sim, e: Enemy, dt: number): void {
  const p = s.p;
  e.ang += dt * 0.8;
  if (p.r !== e.r || Math.hypot(p.x - e.x, p.y - e.y) > 12) {
    e.t = Math.max(e.t, 0.7);
    return;
  }
  e.t -= dt;
  if (e.t <= 0) {
    e.t = 1.3;
    e.st = e.st ? 0 : 1;
    for (let k = 0; k < 4; k++) s.fire(e, e.r, (e.st * Math.PI) / 4 + (k * Math.PI) / 2, 5);
    s.emit({ t: 'enemyShot', x: e.x, y: e.y, r: e.r });
  }
}

function glitch(s: Sim, e: Enemy, dt: number): void {
  const p = s.p;
  // Ide za hráčom aj do inej reality, keď je tam miesto.
  if (e.r !== p.r) {
    e.t3 += dt;
    if (e.t3 > 1 && s.boxFree(p.r, e.x, e.y, e.rad * 0.7)) {
      e.r = p.r;
      e.t3 = 0;
      e.t = Math.max(e.t, 0.6);
      s.emit({ t: 'spark', x: e.x, y: e.y, r: e.r });
    }
    return;
  }
  e.t3 = 0;
  if (e.st === 1) {
    e.t2 -= dt;
    if (e.t2 <= 0) {
      e.st = 0;
      if (s.sees(e, 12)) {
        s.fire(e, e.r, toPlayer(s, e).a, 6.5);
        s.emit({ t: 'enemyShot', x: e.x, y: e.y, r: e.r });
      }
    }
  }
  e.t -= dt;
  if (e.t > 0) {
    e.ang += dt * 9;
    return;
  }
  e.t = 2.3 + s.rand() * 0.8;
  for (let i = 0; i < 12; i++) {
    const a = s.rand() * Math.PI * 2;
    const d = 2.6 + s.rand() * 1.2;
    const nx = p.x + Math.cos(a) * d;
    const ny = p.y + Math.sin(a) * d;
    if (nx < 1 || ny < 1 || nx > ROOM_W - 1 || ny > ROOM_H - 1) continue;
    if (!s.boxFree(e.r, nx, ny, e.rad) || !s.los(e.r, nx, ny, p.x, p.y)) continue;
    s.emit({ t: 'spark', x: e.x, y: e.y, r: e.r });
    e.x = nx;
    e.y = ny;
    e.st = 1;
    e.t2 = 0.5;
    break;
  }
}

function warden(s: Sim, e: Enemy, dt: number): void {
  const p = s.p;
  const half = e.hp < e.max / 2;
  // Presun medzi realitami (ohlási sa vopred).
  e.t2 -= dt;
  if (e.t2 < 1.3 && e.warn < 0) {
    const opts = [0, 1, 2].filter((r) => r !== e.r && s.prog.unlocked.includes(r));
    e.warn = opts[Math.floor(s.rand() * opts.length)] ?? e.r;
  }
  if (e.t2 <= 0) {
    e.r = e.warn;
    e.warn = -1;
    e.t2 = half ? 5.5 : 7;
    s.emit({ t: 'bossShift', r: e.r });
  }
  const tx = ROOM_W / 2 + Math.cos(s.time * 0.35) * 5.5;
  const ty = ROOM_H / 2 + Math.sin(s.time * 0.5) * 2.6;
  const dx = tx - e.x;
  const dy = ty - e.y;
  const d = Math.hypot(dx, dy);
  if (d > 0.05) {
    const v = Math.min(ENEMY.warden.speed, d * 2);
    e.x += (dx / d) * v * dt;
    e.y += (dy / d) * v * dt;
  }
  e.ang += dt * (half ? 1.1 : 0.6);
  // Prstenec striel.
  e.t -= dt;
  if (e.t <= 0) {
    e.t = half ? 1.7 : 2.4;
    const n = 14;
    const off = s.rand() * Math.PI;
    for (let k = 0; k < n; k++) s.fire(e, e.r, off + (k * Math.PI * 2) / n, 4.4, { rad: 0.18 });
    s.emit({ t: 'enemyShot', x: e.x, y: e.y, r: e.r });
  }
  // Mierená trojica, keď je ranený.
  if (e.hp < e.max * 0.65 && p.r === e.r) {
    e.t3 -= dt;
    if (e.t3 <= 0) {
      e.t3 = 1.2;
      const a = toPlayer(s, e).a;
      for (const o of [-0.2, 0, 0.2]) s.fire(e, e.r, a + o, 6);
    }
  }
  // Privolá drony.
  if (e.hp < e.max * 0.35) {
    e.t4 -= dt;
    if (e.t4 <= 0) {
      e.t4 = 6;
      const drones = s.enemies.filter((o) => o.kind === 'drone' && !o.dead).length;
      if (drones < 2) s.spawn('drone', e.x, e.y, e.r);
    }
  }
}

function heart(s: Sim, e: Enemy, dt: number): void {
  const p = s.p;
  const realities = s.prog.unlocked;
  e.ang += dt * 0.6;
  // Zraniteľná realita sa strieda.
  e.t2 -= dt;
  if (e.t2 <= 0) {
    e.t2 = 5;
    const i = realities.indexOf(e.warn);
    e.warn = realities[(i + 1) % realities.length] ?? 0;
    s.emit({ t: 'bossShift', r: e.warn });
  }
  // Salva: najprv sa ohlási farbou reality, potom vystrelí len v nej.
  e.t -= dt;
  if (e.t < 0.6 && e.aim < 0) {
    e.aim = s.rand() < 0.6 ? p.r : (realities[Math.floor(s.rand() * realities.length)] ?? p.r);
  }
  if (e.t <= 0) {
    const r = e.aim;
    const pattern = Math.floor(e.t3) % 3;
    e.t3++;
    if (pattern === 0) {
      const off = s.rand() * Math.PI;
      for (let k = 0; k < 18; k++) s.fire(e, r, off + (k * Math.PI * 2) / 18, 4.2, { rad: 0.18 });
    } else if (pattern === 1) {
      const a = toPlayer(s, e).a;
      for (let k = -3; k <= 3; k++) s.fire(e, r, a + k * 0.15, 5.5);
    } else {
      const off = s.rand() * Math.PI;
      for (let k = 0; k < 9; k++) {
        s.fire(e, r, off + (k * Math.PI * 2) / 9, 3.6, { rad: 0.18 });
        s.fire(e, r, off + ((k + 0.5) * Math.PI * 2) / 9, 5.2);
      }
    }
    s.emit({ t: 'enemyShot', x: e.x, y: e.y, r });
    e.aim = -1;
    e.t = e.hp < e.max / 4 ? 1.1 : e.hp < e.max / 2 ? 1.35 : 1.6;
  }
  // Glitche, keď slabne.
  if (e.hp < e.max / 2) {
    e.t4 -= dt;
    if (e.t4 <= 0) {
      e.t4 = 8;
      const n = s.enemies.filter((o) => o.kind === 'glitch' && !o.dead).length;
      if (n < 2) {
        const r = realities[Math.floor(s.rand() * realities.length)] ?? 0;
        s.spawn('glitch', e.x + (s.rand() < 0.5 ? -2.5 : 2.5), e.y + 1.5, r);
      }
    }
  }
}
