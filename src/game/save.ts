import type { EnemyKind, ItemId } from './types';

/** Postup hráča: čo má, čo už spravil a kde naposledy uložil (terminál). */
export interface Progress {
  /** Posledný terminál: miestnosť, poloha a realita, kde sa hráč obnoví. */
  room: string;
  x: number;
  y: number;
  r: number;
  unlocked: number[];
  items: ItemId[];
  /** Zapnuté spínače (signály platia v celej stanici). */
  signals: string[];
  /** Zobraté predmety, otvorené zámky (uid entity). */
  taken: string[];
  /** Prerezané liany (miestnosť:realita:x:y). */
  cut: string[];
  bosses: EnemyKind[];
  visited: string[];
  /** Už zobrazené úvody miestností a spúšťače. */
  seen: string[];
  maxHp: number;
  logs: string[];
  echoes: string[];
  deaths: number;
  /** Čas hrania v sekundách. */
  time: number;
}

export interface SaveData extends Progress {
  started: boolean;
  endings: number[];
  lang: string;
  muted: boolean;
}

const KEY = 'prizma-save-v2';
export const START_HP = 4;

export function newProgress(): Progress {
  return {
    room: 'k1',
    x: 4.5,
    y: 6.5,
    r: 0,
    unlocked: [0],
    items: [],
    signals: [],
    taken: [],
    cut: [],
    bosses: [],
    visited: [],
    seen: [],
    maxHp: START_HP,
    logs: [],
    echoes: [],
    deaths: 0,
    time: 0,
  };
}

export function emptySave(lang = 'en'): SaveData {
  return { ...newProgress(), started: false, endings: [], lang, muted: false };
}

export interface Storage {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export function loadSave(store: Storage | null, lang = 'en'): SaveData {
  try {
    const raw = store?.getItem(KEY);
    if (!raw) return emptySave(lang);
    const data = JSON.parse(raw) as Partial<SaveData>;
    return { ...emptySave(lang), ...data };
  } catch {
    return emptySave(lang);
  }
}

export function writeSave(store: Storage | null, data: SaveData): void {
  try {
    store?.setItem(KEY, JSON.stringify(data));
  } catch {
    // Súkromné okno alebo plné úložisko — hra ide ďalej bez ukladania.
  }
}

/** Ktoré konce sú dostupné: tretí len so všetkými ozvenami. */
export function endingAvailable(choice: number, echoes: number, totalEchoes: number): boolean {
  return choice < 2 || echoes >= totalEchoes;
}
