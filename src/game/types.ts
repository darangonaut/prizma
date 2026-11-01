/** Smery: 0 hore, 1 vpravo, 2 dole, 3 vľavo. */
export type Dir = 0 | 1 | 2 | 3;
export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;

/** Počet realít: 0 Prima (cyan), 1 Hlbina (purpur), 2 Jantár (jantár), 3 Nula (zelená). */
export const REALITIES = 4;

/** Rozmery miestnosti v dlaždiciach (všetky miestnosti sú rovnako veľké). */
export const ROOM_W = 21;
export const ROOM_H = 13;

export type ItemId = 'card' | 'cutter' | 'lens';

export type EnemyKind = 'drone' | 'crawler' | 'pod' | 'turret' | 'glitch' | 'warden' | 'heart';

/** Popis entity v legende miestnosti. */
export type Spec = (
  | { k: 'door'; sig: string }
  | { k: 'lock' }
  /** Spínač; `lens` = prepne ho len hranolová strela. */
  | { k: 'switch'; sig: string; lens?: boolean }
  | { k: 'emitter'; dir: Dir; sig: string }
  | { k: 'item'; item: ItemId }
  | { k: 'crystal'; reality: number }
  | { k: 'health'; id: string }
  | { k: 'log'; id: string }
  | { k: 'echo'; id: string }
  | { k: 'terminal' }
  | { k: 'core' }
  | { k: 'trigger'; msg: string }
  | { k: 'enemy'; kind: EnemyKind }
) & {
  /** Entita je vo všetkých realitách naraz (inak len v tej, do ktorej vrstvy patrí). */
  all?: boolean;
  /** Objaví sa až po porazení bossa s týmto druhom. */
  after?: EnemyKind;
};

export type SpecKind = Spec['k'];

export interface RoomDef {
  id: string;
  /** Zóna stanice (kryo, habitat, hydro, reactor, core). */
  zone: string;
  /** Poloha na mape stanice; susedné miestnosti sú prepojené otvormi na okraji. */
  mx: number;
  my: number;
  /**
   * Mapa pre každú realitu. Chýbajúce vrstvy sa odvodia z prvej (rovnaký terén, podlaha
   * podľa reality, bez entít).
   */
  layers: (string[] | null)[];
  legend?: Record<string, Spec>;
  /** Signál, ktorý vypustí hlbokú vodu `~` v tejto miestnosti. */
  drain?: string;
  /** Správa HALO pri prvom vstupe. */
  intro?: string;
}

/** Vstup hráča na jeden krok simulácie. */
export interface Input {
  /** Smer pohybu (-1..1). */
  mx: number;
  my: number;
  /** Smer mierenia; nula = mieri sa smerom pohybu (s pomocou mierenia). */
  ax: number;
  ay: number;
  fire: boolean;
  /** Jednorazové akcie (len v snímku, keď boli stlačené). */
  dash: boolean;
  lens: boolean;
  shift: number | null;
}

export const NO_INPUT: Input = {
  mx: 0,
  my: 0,
  ax: 0,
  ay: 0,
  fire: false,
  dash: false,
  lens: false,
  shift: null,
};

/** Udalosti z jedného kroku — pre zvuk, efekty, príbeh a rozhranie. */
export type Ev =
  | { t: 'shoot'; x: number; y: number }
  | { t: 'lens'; x: number; y: number }
  | { t: 'hit'; x: number; y: number; r: number; boss: boolean }
  | { t: 'kill'; kind: EnemyKind; x: number; y: number; r: number }
  | { t: 'spark'; x: number; y: number; r: number }
  | { t: 'enemyShot'; x: number; y: number; r: number }
  | { t: 'hurt'; x: number; y: number }
  | { t: 'death' }
  | { t: 'dash' }
  | { t: 'shift'; r: number }
  | { t: 'shiftBlocked'; r: number; why: 'locked' | 'solid' | 'cooldown' | 'same' }
  | { t: 'telefrag'; x: number; y: number; r: number }
  | { t: 'pickup'; item: ItemId }
  | { t: 'unlock'; r: number }
  | { t: 'health' }
  | { t: 'heal' }
  | { t: 'read'; kind: 'log' | 'echo'; id: string }
  | { t: 'msg'; id: string }
  | { t: 'switch'; x: number; y: number }
  | { t: 'open' }
  | { t: 'needItem'; item: ItemId }
  | { t: 'cut'; x: number; y: number }
  | { t: 'zap' }
  | { t: 'room'; id: string; first: boolean }
  | { t: 'save' }
  | { t: 'bossShift'; r: number }
  | { t: 'bossDown'; kind: EnemyKind }
  | { t: 'core' };
