# Prizma

- Neónová sci-fi akčná hra zhora (prieskum + boj): jedna stanica v štyroch realitách (Prima, Hlbina, Jantár, Nula).
  Nepriatelia a ich strely existujú len vo svojej realite; presun je únik, skratka aj zbraň (roztrhne nepriateľa).
- `src/game/` je čistá deterministická logika bez PixiJS a DOM (vynútené ESLintom): `sim.ts` (hráč, strely,
  zariadenia, prechody), `enemies.ts` (správanie nepriateľov a bossov), `room.ts` (terén, entity, lúče).
- Mapa stanice je v `src/game/rooms.ts`: miestnosti 21 × 13, jedna ASCII vrstva na realitu (chýbajúce sa odvodia
  z prvej), legenda v hlavičke súboru. Okraje susedov musia sedieť v každej realite.
- Po zmene mapy spusti testy: `tests/explore.ts` prehľadá stanicu do šírky a overí, že sa hra dá dohrať, všetko
  nájsť a že brány (kryštály, karta, rezačka, šošovka, strážca, čerpadlo) držia.
- Texty len cez `t()` / `story()` z `src/ui/i18n.ts` — kľúč pridaj do `locales/en.ts`, `sk.ts` aj `cs.ts`.
  Pozor na rod hráča (T-7) v slovenčine a češtine: žiadny minulý čas v 1. osobe ani oslovenie s rodom.
- Grafika je vektorová v kóde (`src/render/`), zvuk syntetizovaný (`src/audio/`), žiadne súbory.
- Overenie: `npm run typecheck && npm run lint && npm test`.
