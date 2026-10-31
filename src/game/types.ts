/** Smery: 0 hore, 1 vpravo, 2 dole, 3 vľavo. */
export type Dir = 0 | 1 | 2 | 3;
export const DX = [0, 1, 0, -1] as const;
export const DY = [-1, 0, 1, 0] as const;

/** Počet realít v hre: 0 Prima (cyan), 1 Hlbina (purpur), 2 Jantár (jantár), 3 Nula (zelená). */
export const REALITIES = 4;

/** Popis entity v legende sektora. */
export type EntSpec =
  | { k: 'door'; open: string[] }
  | { k: 'lock'; item: string }
  | { k: 'plate'; sig: string }
  | { k: 'switch'; sig: string; on?: boolean }
  | { k: 'crate'; twin?: boolean }
  | { k: 'item'; item: string }
  | { k: 'crystal'; reality: number }
  | { k: 'log'; id: string }
  | { k: 'echo'; id: string }
  | { k: 'emitter'; dir: Dir }
  | { k: 'mirror'; o: 0 | 1; fixed?: boolean }
  | { k: 'phase'; to: number }
  | { k: 'receiver'; sig: string }
  | { k: 'exit' }
  | { k: 'trigger'; msg: string }
  | { k: 'core' };

export type EntKind = EntSpec['k'];

export interface SectorDef {
  id: string;
  /** Zóna stanice (kryo, habitat, hydro, reactor, core) — názov sa zobrazí pri prvej komore. */
  zone: string;
  /** Mapa pre každú realitu (rovnaké rozmery). Počet vrstiev = počet realít v sektore. */
  layers: string[][];
  /** Znaky entít nad rámec predvolených. */
  legend?: Record<string, EntSpec>;
  /** Signál, ktorý vypustí hlbokú vodu `~`. */
  drain?: string;
  /** Správa HALO pri vstupe. */
  intro?: string;
  /** Reality, bez ktorých sa komora nesmie dať prejsť (test); predvolene všetky naladené. */
  needs?: number[];
}

/** Udalosti z jednej akcie — pre zvuk, efekty a príbeh. */
export type Ev =
  | { t: 'step' }
  | { t: 'blocked'; why: 'wall' | 'beam' | 'door' | 'lock' | 'vines' | 'crate' | 'solid' }
  | { t: 'shift'; r: number }
  | { t: 'shiftBlocked'; r: number; why: 'locked' | 'solid' | 'beam' | 'same' }
  | { t: 'push'; twin: boolean }
  | { t: 'rotate' }
  | { t: 'toggle'; on: boolean }
  | { t: 'pickup'; item: string }
  | { t: 'unlock'; r: number }
  | { t: 'read'; kind: 'log' | 'echo'; id: string }
  | { t: 'msg'; id: string }
  | { t: 'needItem'; item: string }
  | { t: 'open' }
  | { t: 'cut' }
  | { t: 'doors'; opened: number; closed: number }
  | { t: 'receiver'; lit: boolean }
  | { t: 'exit' }
  | { t: 'core' };
