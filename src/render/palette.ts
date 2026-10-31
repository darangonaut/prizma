/** Farby realít: neón, pozadie, stena a tmavý odtieň podlahy. */
export interface RealityPalette {
  neon: number;
  bg: number;
  floor: number;
  wall: number;
  css: string;
}

export const PALETTES: RealityPalette[] = [
  // Prima — pôvodná stanica, studený cyan.
  { neon: 0x2ef2ff, bg: 0x03070d, floor: 0x071420, wall: 0x0a2230, css: '#2ef2ff' },
  // Hlbina — zatopená stanica, purpur.
  { neon: 0xff3bd4, bg: 0x08030b, floor: 0x170818, wall: 0x2c0c2c, css: '#ff3bd4' },
  // Jantár — prerastená stanica po storočiach, jantár.
  { neon: 0xffb52e, bg: 0x0a0602, floor: 0x1a1006, wall: 0x2e1c08, css: '#ffb52e' },
  // Nula — vymazávaná realita, zelený glitch.
  { neon: 0x4dff88, bg: 0x010804, floor: 0x061a0c, wall: 0x0a2c14, css: '#4dff88' },
];

export const WHITE = 0xf2fbff;
export const DANGER = 0xff4d5e;

export function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
    Math.round(ab + (bb - ab) * t)
  );
}
