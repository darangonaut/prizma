// Prieskum stanice do šírky: kam sa hráč dostane s tým, čo postupne nájde.
// Uzol = (miestnosť, dlaždica, realita); presun do inej reality kdekoľvek, kde je tam miesto.
import { Room, specFor } from '@/game/room';
import { ROOMS } from '@/game/rooms';
import { newProgress, type Progress } from '@/game/save';
import { REALITIES, ROOM_H, ROOM_W, type ItemId, type RoomDef } from '@/game/types';

export interface Found {
  rooms: Set<string>;
  items: Set<ItemId>;
  unlocked: Set<number>;
  signals: Set<string>;
  bosses: Set<string>;
  logs: Set<string>;
  echoes: Set<string>;
  health: Set<string>;
  core: boolean;
}

/** `ban`: čo hráč nesmie získať (napr. 'card', 'crystal:2', 'boss:warden', 'sig:pump'). */
export function explore(ban: string[] = []): Found {
  const f: Found = {
    rooms: new Set(),
    items: new Set(),
    unlocked: new Set([0]),
    signals: new Set(),
    bosses: new Set(),
    logs: new Set(),
    echoes: new Set(),
    health: new Set(),
    core: false,
  };
  const byPos = new Map(ROOMS.map((r) => [`${r.mx},${r.my}`, r]));
  for (let round = 0; round < 40; round++) {
    const before = JSON.stringify([...f.items, ...f.unlocked, ...f.signals, ...f.bosses]);
    const prog: Progress = {
      ...newProgress(),
      signals: [...f.signals],
      bosses: [...f.bosses] as Progress['bosses'],
    };
    const rooms = new Map<string, Room>(ROOMS.map((d) => [d.id, new Room(d, prog)]));
    const pass = (room: Room, r: number, x: number, y: number): boolean => {
      if (room.tile(r, x, y) === '%') return f.items.has('cutter');
      if (room.walkable(r, x, y)) return true;
      const b = room.blocker(r, x, y);
      return b?.spec.k === 'lock' && f.items.has('card');
    };
    const seen = new Set<string>();
    const queue: [string, number, number, number][] = [['k1', 4, 6, 0]];
    seen.add('k1,4,6,0');
    const visit = (id: string, x: number, y: number, r: number) => {
      const k = `${id},${x},${y},${r}`;
      if (seen.has(k)) return;
      seen.add(k);
      queue.push([id, x, y, r]);
    };
    while (queue.length) {
      const [id, x, y, r] = queue.shift()!;
      const room = rooms.get(id)!;
      f.rooms.add(id);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_H) {
          const def = room.def;
          const next = byPos.get(`${def.mx + dx},${def.my + dy}`);
          if (!next) continue;
          const tx = (nx + ROOM_W) % ROOM_W;
          const ty = (ny + ROOM_H) % ROOM_H;
          if (pass(rooms.get(next.id)!, r, tx, ty)) visit(next.id, tx, ty, r);
          continue;
        }
        if (pass(room, r, nx, ny)) visit(id, nx, ny, r);
      }
      for (const r2 of f.unlocked) if (r2 !== r && pass(room, r2, x, y)) visit(id, x, y, r2);
    }
    // Zber: predmety na dosiahnutých dlaždiciach, spínače na dostrel, bossovia v dosiahnutej miestnosti.
    const at = new Set([...seen]);
    for (const [id, room] of rooms) {
      if (!f.rooms.has(id)) continue;
      for (const e of room.ents) {
        if (!room.present(e)) continue;
        const rs = e.r === -1 ? [...Array(REALITIES).keys()] : [e.r];
        const s = e.spec;
        const reached = rs.some((r) => at.has(`${id},${e.x},${e.y},${r}`));
        if (s.k === 'switch') {
          if (s.lens && !f.items.has('lens')) continue;
          if (ban.includes(`sig:${s.sig}`)) continue;
          if (rs.some((r) => shootable(room, r, e.x, e.y, at))) f.signals.add(s.sig);
          continue;
        }
        if (!reached) continue;
        if (s.k === 'item' && !ban.includes(s.item)) f.items.add(s.item);
        if (s.k === 'crystal' && !ban.includes(`crystal:${s.reality}`)) f.unlocked.add(s.reality);
        if (s.k === 'log') f.logs.add(s.id);
        if (s.k === 'echo') f.echoes.add(s.id);
        if (s.k === 'health') f.health.add(s.id);
        if (s.k === 'core') f.core = true;
      }
      for (const kind of bossesIn(room.def)) {
        if (ban.includes(`boss:${kind}`)) continue;
        f.bosses.add(kind);
        f.signals.add(kind);
      }
    }
    const after = JSON.stringify([...f.items, ...f.unlocked, ...f.signals, ...f.bosses]);
    if (after === before) break;
  }
  return f;
}

function bossesIn(def: RoomDef): string[] {
  const out: string[] = [];
  def.layers.forEach((rows) =>
    rows?.forEach((row) =>
      [...row].forEach((ch) => {
        const s = specFor(def, ch);
        if (s?.k === 'enemy' && (s.kind === 'warden' || s.kind === 'heart')) out.push(s.kind);
      }),
    ),
  );
  return out;
}

/** Dá sa spínač trafiť z niektorej dosiahnutej dlaždice (priamka do 12 dlaždíc)? */
function shootable(room: Room, r: number, sx: number, sy: number, at: Set<string>): boolean {
  const id = room.def.id;
  for (let y = 0; y < ROOM_H; y++)
    for (let x = 0; x < ROOM_W; x++) {
      if (!at.has(`${id},${x},${y},${r}`)) continue;
      const d = Math.hypot(sx - x, sy - y);
      if (d > 12) continue;
      const n = Math.ceil(d / 0.2);
      let ok = true;
      for (let i = 1; i < n && ok; i++) {
        const px = Math.floor(x + 0.5 + ((sx - x) * i) / n);
        const py = Math.floor(y + 0.5 + ((sy - y) * i) / n);
        if (px === sx && py === sy) break;
        if (room.blocksShot(r, px, py)) ok = false;
      }
      if (ok) return true;
    }
  return false;
}
