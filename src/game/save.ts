/** Uložený postup (localStorage). Čistá logika — úložisko sa podáva zvonka. */
export interface SaveData {
  /** Index komory, v ktorej hráč je (alebo SECTORS.length po dohraní). */
  chamber: number;
  /** Najvyššia odomknutá komora. */
  reached: number;
  logs: string[];
  echoes: string[];
  /** Najmenej ťahov na komoru (id → ťahy). */
  best: Record<string, number>;
  /** Ťahy spolu za celú hru. */
  moves: number;
  endings: number[];
  lang: string;
  muted: boolean;
}

const KEY = 'prizma-save-v1';

export function emptySave(lang = 'en'): SaveData {
  return {
    chamber: 0,
    reached: 0,
    logs: [],
    echoes: [],
    best: {},
    moves: 0,
    endings: [],
    lang,
    muted: false,
  };
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
