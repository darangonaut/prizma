import type { Locale } from '../i18n';

export const cs: Locale = {
  ui: {
    tagline: 'Jeden pohyb. Čtyři zrcadla.',
    play: 'Hrát',
    continue: 'Pokračovat',
    levels: 'Úrovně',
    back: 'Zpět',
    sound: 'Zvuk',
    on: 'zap.',
    off: 'vyp.',
    controlsKeys:
      'WASD / šipky hýbou všemi kopiemi naráz · Mezerník: úskok · 1–4: ukotvit kopii · R: znovu · Esc: pauza',
    controlsTouch:
      'Táhni prstem kdekoli a hýbeš všemi kopiemi · ťukni na okno a jeho kopie se ukotví · »: úskok',
    paused: 'Pauza',
    resume: 'Pokračovat',
    restart: 'Znovu',
    menu: 'Hlavní menu',
    reality0: 'Prima',
    reality1: 'Hlubina',
    reality2: 'Jantar',
    reality3: 'Nula',
    chapter0: 'Prima',
    chapter1: 'Hlubina',
    chapter2: 'Jantar',
    chapter3: 'Nula',
    chapter4: 'Srdce Prizmy',
    start: 'Pohni se a začni',
    anchored: 'Ukotveno: {r}',
    released: 'Kotva uvolněna',
    clear: 'Hotovo',
    time: 'Čas',
    best: 'Rekord',
    newBest: 'Nový rekord',
    par: '★ pod {t} s',
    next: 'Dál',
    retry: 'Znovu',
    endingTitle: 'Čtyři v jednom',
    endingStats: 'Celkový čas {m}:{s} · pokusy {d} · hvězdy {st}/{stt}',
    credits: 'Prizma — TypeScript, PixiJS a Web Audio API. Žádné obrázky ani zvukové soubory.',
  },
  story: {
    'intro-0': {
      who: 'ŘED. VERA SUNDOVÁ',
      pages: [
        'T-7? Výborně, tvoje systémy běží. Poslouchej pozorně. Experiment Prizma rozštěpil stanici na čtyři reality. A tebe s ní.',
        'Zatím jsi jen v jedné z nich. Posbírej úlomky hranolu v této místnosti. Každý úlomek vás čtyři přitáhne blíž k sobě.',
        'Dej si pozor na všechno červené. Červené zabíjí.',
      ],
    },
    'hint-dash': {
      who: 'SYSTÉM',
      pages: [
        'Úskok (mezerník / »): krátký výpad. Během úskoku tě nic nezraní, takže přeskočíš jednu řadu bodců i zapnutý laser.',
      ],
    },
    'intro-1': {
      who: 'ŘED. VERA SUNDOVÁ',
      pages: [
        'Existuje ještě jedna tvoje kopie. V Hlubině, zatopené verzi stanice.',
        'Nedá se ovládat zvlášť. Co uděláš ty, udělá i ona, ale zrcadlově: tvoje levá strana je její pravá.',
        'Když zahyne jedna kopie, zahynou obě. Jsi jedna bytost na dvou místech.',
      ],
    },
    'hint-anchor': {
      who: 'SYSTÉM',
      pages: [
        'Kotva (klávesy 1–4 nebo ťuknutí na okno): jedna kopie stojí, zatímco se ostatní hýbou. Najednou jen jedna. Stejně funguje zeď: kopie přitisknutá ke zdi zůstane na místě.',
      ],
    },
    'hint-drowned': {
      who: 'ŘED. VERA SUNDOVÁ',
      pages: ['Utopenci z Hlubiny. Kdysi to byla posádka. Jdou po tvé kopii a nezastaví se.'],
    },
    'intro-2': {
      who: 'ŘED. VERA SUNDOVÁ',
      pages: [
        'Třetí kopie. Jantar, kde za týden uběhla staletí. Tamní kopie je zrcadlená přes úhlopříčku: tvoje vpravo je její dolů, tvoje nahoru je její vlevo.',
        'Sporové lusky střílejí. Nezastavuj se.',
      ],
    },
    'intro-3': {
      who: 'ŘED. VERA SUNDOVÁ',
      pages: [
        'Čtvrtá, Nula. Realita, která se maže. Její podlaha mizí, proto nikdy nestůj tam, kde bliká.',
        'Nula zrcadlí přes druhou úhlopříčku: vpravo je nahoru, nahoru je vpravo.',
        'Teď jsou kopie čtyři. Jeden pohyb, čtyři zrcadla. Vím, že je to hodně. Jinak se zpátky nedá.',
      ],
    },
    'intro-4': {
      who: 'ŘED. VERA SUNDOVÁ',
      pages: [
        'Srdce Prizmy. Existuje ve všech čtyřech realitách naráz a bude se bránit.',
        'Vezmi mu světlo zpátky, každý úlomek ve všech čtyřech. Pak budeš zase celek.',
      ],
    },
    ending: {
      who: 'ŘED. VERA SUNDOVÁ',
      pages: [
        'Úlomky se zacelí. Čtyři zrcadla se složí v jedno.',
        'T-7 otevírá jeden pár očí. Jedna místnost, jedna stanice, jedna realita: ta původní.',
        'Hranol utichne. Někde v jádru ho ředitelka Sundová konečně vypíná.',
        'Děkuju. Vítej zpátky, T-7.',
      ],
    },
  },
};
