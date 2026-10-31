import { cs } from './locales/cs';
import { en } from './locales/en';
import { sk } from './locales/sk';

export type Lang = 'en' | 'sk' | 'cs';

export interface StoryEntry {
  who: string;
  pages: string[];
}

export interface Locale {
  ui: Record<string, string>;
  story: Record<string, StoryEntry>;
}

const LOCALES: Record<Lang, Locale> = { en, sk, cs };
let lang: Lang = 'en';

export function setLang(l: Lang): void {
  lang = l;
  document.documentElement.lang = l;
}

export function getLang(): Lang {
  return lang;
}

/** Text rozhrania; `{x}` sa nahradí hodnotou z vars. */
export function t(key: string, vars: Record<string, string | number> = {}): string {
  const s = LOCALES[lang].ui[key] ?? LOCALES.en.ui[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export function story(id: string): StoryEntry | null {
  return LOCALES[lang].story[id] ?? LOCALES.en.story[id] ?? null;
}

export function realityName(r: number): string {
  return t(`reality${r}`);
}
