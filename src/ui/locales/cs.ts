import type { Locale } from '../i18n';

export const cs: Locale = {
  ui: {
    tagline: 'Jedna stanice. Čtyři reality. Jediná cesta ven.',
    newGame: 'Nová hra',
    continue: 'Pokračovat',
    back: 'Zpět',
    sound: 'Zvuk',
    on: 'zap.',
    off: 'vyp.',
    controlsKeys:
      'Pohyb: WASD / šipky · Míření: myš · Střelba: klik nebo J · Úskok: mezerník · Přesun do reality: 1–4 nebo Q / E · Nahlédnout: drž Shift · Hranolová čočka: pravé tlačítko nebo L · Mapa: M',
    controlsTouch:
      'Levý palec: pohyb · ✦ střelba (míří sama) · » úskok · Ťukni na realitu pro přesun · Drž ◎ a nahlédneš',
    paused: 'Pauza',
    resume: 'Pokračovat',
    toTerminal: 'Zpět k poslednímu terminálu',
    menu: 'Hlavní menu',
    map: 'Mapa stanice',
    mapHint:
      'Terminály ▣ ukládají postup. Z místnosti s terminálem se dá přesunout k libovolnému jinému terminálu.',
    mapTravel: 'Vyber terminál ▣, ke kterému se přesuneš.',
    dead: 'Signál ztracen',
    deadText: 'Obnova u posledního terminálu…',
    newGameConfirm: 'Začít znovu? Postup se smaže.',
    yes: 'Ano',
    no: 'Ne',
    reality0: 'Prima',
    reality1: 'Hlubina',
    reality2: 'Jantar',
    reality3: 'Nula',
    zone_kryo: 'Kryokomora',
    zone_habitat: 'Obytný prstenec',
    zone_hydro: 'Hydroponie',
    zone_reactor: 'Reaktor',
    zone_core: 'Jádro Prizmy',
    room_k1: 'Kryokapsle',
    room_k2: 'Servisní chodba',
    room_k3: 'Laboratoř',
    room_k4: 'Zatopená křižovatka',
    room_h1: 'Obytný prstenec',
    room_h2: 'Jídelna',
    room_h3: 'Čerpací stanice',
    room_h4: 'Šatny',
    room_h5: 'Byt ředitelky',
    room_y1: 'Brána hydroponie',
    room_y2: 'Zahrada',
    room_y3: 'Houština',
    room_y4: 'Trezor semen',
    room_y5: 'Velký strom',
    room_r1: 'Brána reaktoru',
    room_r2: 'Cívková hala',
    room_r3: 'Komora čočky',
    room_r4: 'Řídicí místnost',
    room_r5: 'Výtah do jádra',
    room_c1: 'Přístup k jádru',
    room_c2: 'Archiv',
    room_c3: 'Interference',
    room_c4: 'Síň ozvěn',
    room_c5: 'Srdce Prizmy',
    boss_warden: 'Strážce reaktoru',
    boss_heart: 'Srdce Prizmy',
    blockedLocked: 'Tahle realita ještě není naladěná.',
    blockedSolid: 'V realitě {r} tu něco stojí.',
    needCard: 'Zamčeno. Je potřeba přístupová karta.',
    needCutter: 'Živé dřevo. Pulz ho nepřeřízne.',
    got_card: 'Přístupová karta',
    got_cutter: 'Plazmová řezačka — střely propálí liány',
    got_lens: 'Hranolová čočka',
    gotHealth: 'Odolnost +1',
    tunedReality: 'Naladěná realita: {r}',
    saved: 'Postup uložen',
    endingTitle0: 'Kolaps',
    endingTitle1: 'Kotva',
    endingTitle2: 'Interference',
    endingStats:
      'Nalezené ozvěny: {e} / {et} · Přečtené záznamy: {l} / {lt} · Čas: {m} min · Ztracené signály: {d}',
    endingAgain: 'Zpět do menu',
    choose: 'Co uděláš?',
    choice0: 'Zavřít Prizmu',
    choice1: 'Stát se kotvou',
    choice2: 'Sladit reality',
    choice2Locked: 'Sladit reality (je potřeba všech ozvěn: {e} / {et})',
    credits: 'Prizma — TypeScript, PixiJS a Web Audio API. Žádné obrázky ani zvukové soubory.',
  },
  story: {
    'kryo-intro': {
      who: 'HALO',
      pages: [
        'Kryocyklus přerušen. Dobré ráno, T-7.',
        'Stanice se teď… těžko popisuje. Ostraha je pořád v režimu uzávěry. Pokračuj prosím na východ. Opatrně.',
      ],
    },
    'kryo-pod': {
      who: 'KRYOKAPSLE 7',
      pages: [
        'Osádka: T-7, technická údržba. Stav: předčasně probuzeno.',
        'Poznámka ředitelky Sundové: „T-7 ať spí až do konce Lomu-1. Pro jistotu.“',
      ],
    },
    'kryo-halo': {
      who: 'HALO',
      pages: [
        'Většina posádky se evakuovala před jednačtyřiceti hodinami. Ředitelka Sundová zůstala v jádře.',
        'Od testu Lom-1 hlásí moje senzory čtyři verze každé místnosti. Rozhodla jsem se hlásit jen jednu.',
      ],
    },
    'hint-combat': {
      who: 'HALO',
      pages: [
        'Strážní drony. Pořád si myslí, že platí uzávěra a vetřelec jsi ty.',
        'Multinástroj střílí pulz: miř myší a klikni, nebo stiskni J. Mezerník je úskok — během něj tebou střely projdou.',
      ],
    },
    'rift-intro': {
      who: 'HALO',
      pages: ['Chodba před tebou se zřítila. V laboratoři zachycuji silnou rezonanci.'],
    },
    'unlock-1': {
      who: 'HALO',
      pages: [
        'Ten úlomek je část Prizmy. Rezonuje s… jinou stanicí. Tytéž místnosti. Zatopené.',
        'Stiskni 2 a přejdeš na druhou stranu, 1 tě vrátí zpět. Přesunout se dá jen tam, kde je v druhé realitě volno. Podrž Shift a nejdřív nahlédni.',
        'Co existuje v jedné realitě, na tebe v jiné nedosáhne. Ani jeho střely. A když se přesuneš na místo, kde tam něco stojí… dlouho stát nebude.',
      ],
    },
    'kryo-lab': {
      who: 'DR. VERA SUNDOVÁ',
      pages: [
        'Lom-1 rozštěpí naši realitu jako světlo ve skle. Všechny možnosti vedle sebe.',
        'V jedné z nich Teo ještě žije.',
      ],
    },
    'weave-intro': {
      who: 'HALO',
      pages: ['Ani jedna verze téhle křižovatky nevede až na konec. Spolu by mohly.'],
    },
    'kryo-crew': {
      who: 'INŽENÝRKA MIRA KASKOVÁ',
      pages: [
        'Kapslová hala 3 je v jedné realitě pryč a v druhé v pořádku. Dnes jsem prošla zdí.',
        'Ta zeď pro mě prostě nebyla. Do té chodby už se nevrátím.',
      ],
    },
    'habitat-intro': {
      who: 'HALO',
      pages: [
        'Obytný prstenec. Rozvody jsou společné pro všechny reality — spínač v jednom světě otevře dveře v jiném.',
        'Spínač přepneš výstřelem.',
      ],
    },
    'echo-drowned': {
      who: 'OZVĚNA · HLUBINA',
      pages: [
        '…zima. Voda pronikla stropem ve druhé hodině.',
        'Průlez 4 zůstal zavřený, aby se ostatní dostali ke kapslím. Jestli jsi mnou — průlez 4 neotvírej.',
      ],
    },
    'pump-intro': {
      who: 'HALO',
      pages: [
        'Zatopený prstenec má ještě funkční čerpadlo. Když ho spustíš, voda by měla odtéct z celého prstence.',
      ],
    },
    'habitat-vera': {
      who: 'DR. VERA SUNDOVÁ',
      pages: [
        'Teovi by dnes bylo devět.',
        'Rada schválila Lom-1 jako „energetický výzkum“. Nikdo se nezeptal, co chci najít.',
      ],
    },
    'echo-pump': {
      who: 'OZVĚNA · HLUBINA',
      pages: ['Karta je pořád ve skříňce. Čerpadla by nás zachránila. Nikdo na ně neměl čas.'],
    },
    'habitat-crew': {
      who: 'BOTANIK ILAN OKAFOR',
      pages: [
        'V jídelně jsem viděl sám sebe u oběda. Starého. Se šedivým plnovousem. Zamával mi.',
        'V té druhé realitě zahrada sežrala celou stanici.',
      ],
    },
    'hydro-intro': {
      who: 'HALO',
      pages: ['Hydroponie. Zachycuji třetí rezonanci. Čas tam běží rychleji.'],
    },
    'unlock-2': {
      who: 'HALO',
      pages: [
        'Třetí realita: Jantar. Na té straně uběhla staletí. Zahrada vyhrála.',
        'Stiskni 3 a přejdeš.',
      ],
    },
    'vines-intro': {
      who: 'HALO',
      pages: ['Jantarová strana měla staletí na to, aby rostla. Pulz živé dřevo nepřeřízne.'],
    },
    'echo-elder1': {
      who: 'OZVĚNA · JANTAR',
      pages: [
        'Vědělo se, že přijdeš. I moje cesta začala tady — podle mého počítání před šedesáti lety.',
        'Řezačka je tam, kde zůstala. Liány dorůstají, ale pomalu.',
      ],
    },
    'item-cutter': {
      who: 'HALO',
      pages: ['Plazmová řezačka. Střely teď propálí liány.'],
    },
    'hydro-botanist': {
      who: 'BOTANIK ILAN OKAFOR',
      pages: [
        'Rajčata v truhlíku 6 v jedné realitě plodí a v druhé jsou prach. Stejné semeno. Stejná hodina.',
      ],
    },
    'echo-elder2': {
      who: 'OZVĚNA · JANTAR',
      pages: [
        'Na téhle straně je čas levný. Šedesát let na přemýšlení o tom, co ředitelka udělala.',
        'Pořád nevím, co bych na jejím místě udělalo já. Možná ty to budeš vědět.',
      ],
    },
    'hydro-vera': {
      who: 'DR. VERA SUNDOVÁ',
      pages: [
        'Prizma praská. Každá prasklina je svět. Z jádra je udržím pohromadě, ale ne navždy.',
        'Jestli někdo probudí T-7 — promiň.',
      ],
    },
    'reactor-intro': {
      who: 'HALO',
      pages: [
        'Reaktorová paluba. Paprsky pálí a procházejí všemi realitami najednou. Najdi spínače.',
      ],
    },
    'reactor-kask': {
      who: 'INŽENÝRKA MIRA KASKOVÁ',
      pages: [
        'Lasery cívek jsou blokované spínači. Vypni spínač a vypneš paprsek.',
        'A ať děláš cokoli, ruce drž mimo světlo.',
      ],
    },
    'item-lens': {
      who: 'HALO',
      pages: [
        'Hranolová čočka. Vystřelí náboj, který projde všemi realitami najednou.',
        'Pravé tlačítko myši nebo L. Některé přijímače reagují jen na světlo ze všech světů najednou.',
      ],
    },
    'echo-reactor': {
      who: 'OZVĚNA · PRIMA',
      pages: [
        'Ta verze, co zůstala v Primě, našla čočku jako první. Světlu je jedno, ve kterém světě je.',
      ],
    },
    'echo-elder3': {
      who: 'OZVĚNA · JANTAR',
      pages: [
        'Polovina cesty. Ředitelka je v jádře, ve čtvrté realitě — v té, která by neměla existovat.',
        'Je tam její syn.',
      ],
    },
    'reactor-halo': {
      who: 'HALO',
      pages: [
        'Mám teď čtyři verze sebe. Tři z nich se bojí.',
        'Já jsem ta čtvrtá a lžu ti, že jsem klidná.',
      ],
    },
    'warden-intro': {
      who: 'HALO',
      pages: [
        'Výtah do jádra je hlídaný. Strážce nezůstává v jedné realitě.',
        'Jdi za ním — nebo počkej, až se vrátí do té tvé.',
      ],
    },
    'warden-down': {
      who: 'HALO',
      pages: [
        'Strážce padl. Něco z něj vypadlo — úlomek, který bzučí v tónině, pro kterou nemám jméno.',
      ],
    },
    'core-intro': {
      who: 'HALO',
      pages: ['Jádro. Rezonance je tu všude.'],
    },
    'unlock-3': {
      who: 'HALO',
      pages: [
        'Čtvrtá rezonance: Nula. Nepravděpodobná realita. Vymazává se.',
        'Stiskni 4 a přejdeš. Co se zrodilo v Nule, nerespektuje hranice mezi světy — půjde to za tebou.',
      ],
    },
    'echo-glitch': {
      who: 'OZVĚNA · NULA',
      pages: ['t-ty tu nemáš… být. V Nule nic, co se stane… nezůstane. Teo je tu skutečný. Zatím.'],
    },
    'interference-intro': {
      who: 'HALO',
      pages: ['Všechno najednou. Každý svět drží kousek cesty.'],
    },
    'core-vera': {
      who: 'DR. VERA SUNDOVÁ',
      pages: [
        'Jestli tohle čteš, cesta tě dovedla až sem. Našla jsem ho, T-7. Je skutečný. Směje se stejným vtipům.',
        'Ale Nula se rozpadá a táhne s sebou ostatní světy.',
      ],
    },
    'echo-last': {
      who: 'OZVĚNA · VŠECHNY',
      pages: [
        'Jsme každá verze tebe, která se dostala až sem. Držely jsme ti cestu otevřenou.',
        'Poslední volba je tvoje. Vždycky byla.',
      ],
    },
    'heart-intro': {
      who: 'HALO',
      pages: [
        'Srdce Prizmy. Existuje ve všech realitách, ale doopravdy je v každé chvíli jen v jedné.',
        'Udeř tam, kde je skutečné. Sleduj barvu jeho světla.',
      ],
    },
    'heart-down': {
      who: 'HALO',
      pages: ['Srdce utichlo. Prizma je otevřená.', 'Vstup do světla, T-7.'],
    },
    'core-halo': {
      who: 'HALO',
      pages: ['Ať zvolíš cokoli, T-7, budu si pamatovat všechny.'],
    },
    'ending-0': {
      who: '',
      pages: [
        'Vytrhneš Prizmu z osy. Zatopené chodby, zahrada, zelený šum — všechno zmizí, složí se zpět do toho, co mohlo být.',
        'Stanice je tichá a celá. Vera Sundová na ní není.',
        'Poslední kapslí letíš domů. HALO ti jediným hlasem přeje dobré ráno.',
      ],
    },
    'ending-1': {
      who: '',
      pages: [
        'Vstoupíš do světla a vezmeš všechny čtyři reality do rukou. Přestanou praskat.',
        'Někde v Nule se chlapec směje maminčinu vtipu. Někde v Jantaru tvoje stará verze sází další strom.',
        'Neodejdeš. Nemusíš. Teď jsi Prizmou ty.',
      ],
    },
    'ending-2': {
      who: '',
      pages: [
        'Každá ozvěna ti dala kousek frekvence. Prizmu nerozbiješ — naladíš ji.',
        'Reality se nezhroutí, ale usadí se jako světlo, které se složí zpět do jediného paprsku. Vera a Teo vystoupí z Nuly do Primy, skuteční a spolu. Utopená posádka se probouzí v kapslích.',
        'HALO mluví jediným hlasem. Poprvé za jednačtyřicet hodin zní klidně.',
      ],
    },
  },
};
