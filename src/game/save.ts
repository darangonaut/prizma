/** Uložený postup: odomknuté úrovne, najlepšie časy, počet pokusov a nastavenia. */
export interface SaveData {
  /** Index najvzdialenejšej odomknutej úrovne. */
  unlocked: number;
  /** Najlepší čas úrovne v sekundách (podľa id). */
  best: Record<string, number>;
  deaths: number;
  /** Už zobrazené príbehové texty. */
  seen: string[];
  finished: boolean;
  lang: string;
  muted: boolean;
}

const KEY = 'prizma-save-v3';

export function emptySave(lang = 'en'): SaveData {
  return { unlocked: 0, best: {}, deaths: 0, seen: [], finished: false, lang, muted: false };
}

export function loadSave(store: Storage | null, lang: string): SaveData {
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
    // Úložisko môže byť plné alebo zakázané; hra beží ďalej bez ukladania.
  }
}

/** Zapíše dokončenie úrovne: odomkne ďalšiu a uloží lepší čas. Vráti true pri novom rekorde. */
export function recordWin(
  save: SaveData,
  index: number,
  id: string,
  time: number,
  count: number,
): boolean {
  save.unlocked = Math.max(save.unlocked, Math.min(count - 1, index + 1));
  if (index === count - 1) save.finished = true;
  const old = save.best[id];
  if (old !== undefined && old <= time) return false;
  save.best[id] = Math.round(time * 100) / 100;
  return true;
}
