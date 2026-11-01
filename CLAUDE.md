# Prizma

- Neónová akčná hra „Kvarteto“: jeden vstup hýbe až štyrmi kópiami hráča naraz, každá v inej realite
  (Prima, Hlbina, Jantár, Nula) a každá zrkadlene (`MIRROR` v `src/game/types.ts`). Úroveň = zobrať všetky úlomky;
  smrť jednej kópie reštartuje úroveň. Steny a kotva (jedna kópia stojí) rozpájajú pohyb, úskok dáva nezraniteľnosť.
- `src/game/` je čistá deterministická logika bez PixiJS a DOM (vynútené ESLintom): `sim.ts` (kópie, píly, lasery,
  veže, utopenci, mihotavá podlaha, srdce, vlny úlomkov), `levels.ts` (20 úrovní, legenda v hlavičke), `save.ts`.
- Okno má 11 × 11 dlaždíc s uzavretým obvodom. Kapitola k má k + 1 okien (srdce 4).
- Po zmene úrovní spusti testy: `tests/solve.ts` (hltavý riešič na mriežke s kotvou a úskokom) overí, že sa každá
  úroveň dá prejsť; test tiež stráži, že nič nezabije kópiu pred prvým pohybom. Pre prehľad ťahov:
  `LEVELS_REPORT=1 npx vitest run tests/levels.test.ts`. `par` (čas na hviezdu) ≈ ťahy bez kotvy × 0,36 + 3 + 2 × okná.
- Texty len cez `t()` / `story()` z `src/ui/i18n.ts` — kľúč pridaj do `locales/en.ts`, `sk.ts` aj `cs.ts`.
  Pozor na rod hráča (T-7) v slovenčine a češtine: žiadny minulý čas v 1. osobe ani oslovenie s rodom.
- Grafika je vektorová v kóde (`src/render/`), zvuk syntetizovaný (`src/audio/`), žiadne súbory.
- Overenie: `npm run typecheck && npm run lint && npm test`.
