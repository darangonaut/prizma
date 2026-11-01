import type { Locale } from '../i18n';

export const sk: Locale = {
  ui: {
    tagline: 'Jeden pohyb. Štyri zrkadlá.',
    play: 'Hrať',
    continue: 'Pokračovať',
    levels: 'Úrovne',
    back: 'Späť',
    sound: 'Zvuk',
    on: 'zap.',
    off: 'vyp.',
    controlsKeys:
      'WASD / šípky hýbu všetkými kópiami naraz · Medzerník: úskok · 1–4: zakotviť kópiu · R: znova · Esc: pauza',
    controlsTouch:
      'Ťahaj prstom kdekoľvek a hýbeš všetkými kópiami · ťukni na okno a jeho kópia zakotví · »: úskok',
    paused: 'Pauza',
    resume: 'Pokračovať',
    restart: 'Znova',
    menu: 'Hlavné menu',
    reality0: 'Prima',
    reality1: 'Hlbina',
    reality2: 'Jantár',
    reality3: 'Nula',
    chapter0: 'Prima',
    chapter1: 'Hlbina',
    chapter2: 'Jantár',
    chapter3: 'Nula',
    chapter4: 'Srdce Prizmy',
    start: 'Pohni sa a začni',
    anchored: 'Zakotvené: {r}',
    released: 'Kotva uvoľnená',
    clear: 'Hotovo',
    time: 'Čas',
    best: 'Rekord',
    newBest: 'Nový rekord',
    par: '★ pod {t} s',
    next: 'Ďalej',
    retry: 'Znova',
    endingTitle: 'Štyri v jednom',
    endingStats: 'Celkový čas {m}:{s} · pokusy {d} · hviezdy {st}/{stt}',
    credits: 'Prizma — TypeScript, PixiJS a Web Audio API. Žiadne obrázky ani zvukové súbory.',
  },
  story: {
    'intro-0': {
      who: 'RIAD. VERA SUNDOVÁ',
      pages: [
        'T-7? Výborne, tvoje systémy bežia. Počúvaj pozorne. Experiment Prizma rozštiepil stanicu na štyri reality. A teba s ňou.',
        'Zatiaľ si len v jednej z nich. Pozbieraj úlomky hranola v tejto miestnosti. Každý úlomok vás štyroch pritiahne bližšie k sebe.',
        'Daj si pozor na všetko červené. Červené zabíja.',
      ],
    },
    'hint-dash': {
      who: 'SYSTÉM',
      pages: [
        'Úskok (medzerník / »): krátky výpad. Počas úskoku ťa nič nezraní, takže preskočíš jeden rad bodcov aj zapnutý laser.',
      ],
    },
    'intro-1': {
      who: 'RIAD. VERA SUNDOVÁ',
      pages: [
        'Existuje ešte jedna tvoja kópia. V Hlbine, zatopenej verzii stanice.',
        'Nedá sa ovládať zvlášť. Čo urobíš ty, urobí aj ona, ale zrkadlovo: tvoja ľavá strana je jej pravá.',
        'Keď zahynie jedna kópia, zahynú obe. Si jedna bytosť na dvoch miestach.',
      ],
    },
    'hint-anchor': {
      who: 'SYSTÉM',
      pages: [
        'Kotva (klávesy 1–4 alebo ťuknutie na okno): jedna kópia stojí, kým sa ostatné hýbu. Naraz len jedna. Rovnako funguje stena: kópia pritlačená k stene ostane na mieste.',
      ],
    },
    'hint-drowned': {
      who: 'RIAD. VERA SUNDOVÁ',
      pages: ['Utopenci z Hlbiny. Kedysi to bola posádka. Idú za tvojou kópiou a nezastavia sa.'],
    },
    'intro-2': {
      who: 'RIAD. VERA SUNDOVÁ',
      pages: [
        'Tretia kópia. Jantár, kde za týždeň ubehli storočia. Tamojšia kópia je zrkadlená cez uhlopriečku: tvoje vpravo je jej dole, tvoje hore je jej vľavo.',
        'Spórové lusky strieľajú. Nezastavuj sa.',
      ],
    },
    'intro-3': {
      who: 'RIAD. VERA SUNDOVÁ',
      pages: [
        'Štvrtá, Nula. Realita, ktorá sa vymazáva. Jej podlaha mizne, preto nikdy nestoj tam, kde bliká.',
        'Nula zrkadlí cez druhú uhlopriečku: vpravo je hore, hore je vpravo.',
        'Teraz sú kópie štyri. Jeden pohyb, štyri zrkadlá. Viem, že je to veľa. Inak sa späť nedá.',
      ],
    },
    'intro-4': {
      who: 'RIAD. VERA SUNDOVÁ',
      pages: [
        'Srdce Prizmy. Existuje vo všetkých štyroch realitách naraz a bude sa brániť.',
        'Vezmi mu svetlo späť, každý úlomok vo všetkých štyroch. Potom budeš znova celok.',
      ],
    },
    ending: {
      who: 'RIAD. VERA SUNDOVÁ',
      pages: [
        'Úlomky sa zacelia. Štyri zrkadlá sa zložia do jedného.',
        'T-7 otvára jeden pár očí. Jedna miestnosť, jedna stanica, jedna realita: tá pôvodná.',
        'Hranol stíchne. Niekde v jadre ho riaditeľka Sundová konečne vypína.',
        'Ďakujem. Vitaj späť, T-7.',
      ],
    },
  },
};
