/** Rozmer jedného okna (reality) v dlaždiciach vrátane obvodovej steny. */
export const SIZE = 11;
export const REALITIES = 4;

/**
 * Ako sa jeden pohyb hráča zrkadlí v realite r: (x, y) → (a·x + b·y, c·x + d·y).
 * Všetky štyri sú zrkadlá: Prima je pôvodná, Hlbina otáča vľavo a vpravo,
 * Jantár zrkadlí cez uhlopriečku (vpravo → dole) a Nula cez druhú uhlopriečku (vpravo → hore).
 */
export const MIRROR: readonly (readonly [number, number, number, number])[] = [
  [1, 0, 0, 1],
  [-1, 0, 0, 1],
  [0, 1, 1, 0],
  [0, -1, -1, 0],
];

export function mirror(r: number, x: number, y: number): [number, number] {
  const [a, b, c, d] = MIRROR[r]!;
  return [a * x + b * y || 0, c * x + d * y || 0];
}

/** Jedno okno úrovne: realita a jej mapa (SIZE riadkov po SIZE znakov). */
export interface PanelDef {
  r: number;
  map: string[];
}

export interface LevelDef {
  id: string;
  /** Kapitola 0–4 (Prima, Hlbina, Jantár, Nula, Srdce). */
  chapter: number;
  panels: PanelDef[];
  /** Čas na hviezdu v sekundách. */
  par: number;
  /** Príbehový text pred úrovňou (kľúč v locales). */
  intro?: string;
}

export interface Input {
  /** Smer pohybu (-1 až 1), ešte nezrkadlený. */
  mx: number;
  my: number;
  dash: boolean;
}

export const NO_INPUT: Input = { mx: 0, my: 0, dash: false };

export type DeathCause = 'spike' | 'void' | 'saw' | 'laser' | 'shot' | 'chaser';

export type Ev =
  | { t: 'shard'; p: number; x: number; y: number; left: number }
  | { t: 'wave'; n: number }
  | { t: 'death'; p: number; x: number; y: number; cause: DeathCause }
  | { t: 'dash' }
  | { t: 'anchor'; p: number }
  | { t: 'fire'; p: number; x: number; y: number }
  | { t: 'win'; time: number };
