# Prizma

- Neónová sci-fi príbehová hádanka zhora: jedna stanica v štyroch realitách (Prima, Hlbina, Jantár, Nula).
- `src/game/` je čistá logika bez PixiJS a DOM (vynútené ESLintom) — testy vo `tests/`.
- Komory sú ASCII mapy v `src/game/sectors.ts` (jedna vrstva na realitu, legenda v hlavičke súboru).
  Každú komoru overuje solver (`tests/solver.ts`, BFS cez celý stav) — po zmene mapy spusti testy.
- Ťažšie komory vznikajú v kováčni hádaniek: predloha v `tests/templates*.ts`, spustenie
  `FORGE=id FORGE_ITER=800 npx vitest run tests/forge.test.ts`; výpis riešenia komôr
  `DEV_SECTOR=all npx vitest run tests/dev-solve.test.ts`.
- Texty len cez `t()` / `story()` z `src/ui/i18n.ts` — kľúč pridaj do `locales/en.ts`, `sk.ts` aj `cs.ts`.
  Pozor na rod hráča (T-7) v slovenčine a češtine: žiadny minulý čas v 1. osobe ani oslovenie s rodom.
- Grafika je vektorová v kóde (`src/render/`), zvuk syntetizovaný (`src/audio/`), žiadne súbory.
- Overenie: `npm run typecheck && npm run lint && npm test`.
