import type { Locale } from '../i18n';

export const cs: Locale = {
  ui: {
    tagline: 'Jedna stanice. Čtyři reality. Jediná cesta ven.',
    newGame: 'Nová hra',
    continue: 'Pokračovat',
    chambers: 'Komory',
    back: 'Zpět',
    sound: 'Zvuk',
    on: 'zap.',
    off: 'vyp.',
    controlsKeys:
      'Pohyb: šipky / WASD · Přesun do reality: 1–4 nebo Q / E · Nahlédnout: drž mezerník · Zpět: Z · Restart: R · Nápověda: H',
    controlsTouch: 'Švihni nebo použij ovladač · Ťukni na realitu pro přesun · Drž ◎ a nahlédneš',
    hintThinking: 'Přemýšlím…',
    hintNone: 'Odsud už to nejde. Vrať tah nebo restartuj.',
    paused: 'Pauza',
    resume: 'Pokračovat',
    restart: 'Restartovat komoru',
    menu: 'Hlavní menu',
    undo: 'Zpět',
    moves: 'Tahy',
    chamber: 'Komora',
    cleared: 'Komora dokončena',
    clearedMoves: '{n} tahů',
    best: 'nejlépe {n}',
    next: 'Pokračovat',
    logs: 'Záznamy',
    echoes: 'Ozvěny',
    locked: 'Zamčeno',
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
    blockedLocked: 'Tahle realita ještě není naladěná.',
    blockedSolid: 'V realitě {r} tu něco stojí.',
    blockedBeam: 'V realitě {r} tudy vede paprsek.',
    needCard: 'Zamčeno. Je potřeba přístupová karta.',
    needCutter: 'Zarostlé. Je potřeba něco ostrého.',
    gotCard: 'Přístupová karta',
    gotCutter: 'Plazmová řezačka',
    tunedReality: 'Naladěná realita: {r}',
    tapToContinue: 'ťukni nebo stiskni Enter',
    endingTitle0: 'Kolaps',
    endingTitle1: 'Kotva',
    endingTitle2: 'Interference',
    endingStats: 'Nalezené ozvěny: {e} / {et} · Přečtené záznamy: {l} / {lt} · Tahy: {m}',
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
        'Stanice se teď… těžko popisuje. Pokračuj prosím k východu z kryokomory.',
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
    'hint-push': {
      who: 'HALO',
      pages: ['Bedny se dají tlačit. Tlaková deska drží dveře otevřené, dokud na ní něco leží.'],
    },
    'rift-intro': {
      who: 'HALO',
      pages: ['Chodba před tebou se zřítila. V laboratoři zachycuji silnou rezonanci.'],
    },
    'unlock-1': {
      who: 'HALO',
      pages: [
        'Ten úlomek je část Prizmy. Rezonuje s… jinou stanicí. Tytéž místnosti. Zatopené.',
        'Stiskni 2 a přejdeš na druhou stranu, 1 tě vrátí zpět. Přesunout se dá jen tam, kde je v druhé realitě volno.',
      ],
    },
    'hint-shift': {
      who: 'HALO',
      pages: ['Podrž mezerník (nebo ◎) a nahlédneš do ostatních realit dřív, než přejdeš.'],
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
      pages: ['Žádná verze téhle chodby nevede až na konec. Společně by mohly.'],
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
        'Obytný prstenec. Rozvody jsou společné pro všechny reality — deska v jednom světě otevře dveře v jiném.',
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
      pages: ['Zatopený prstenec má ještě funkční čerpadlo. Je zapojené na tuhle stranu.'],
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
    'double-intro': {
      who: 'HALO',
      pages: ['Dvě desky, dva světy, jedny dveře. Obě musí být stisknuté najednou.'],
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
    'echo-elder1': {
      who: 'OZVĚNA · JANTAR',
      pages: [
        'Vědělo se, že přijdeš. I moje cesta začala tady — podle mého počítání před šedesáti lety.',
        'Řezačka je tam, kde zůstala. Liány dorůstají, ale pomalu.',
      ],
    },
    'hydro-botanist': {
      who: 'BOTANIK ILAN OKAFOR',
      pages: [
        'Rajčata v truhlíku 6 v jedné realitě plodí a v druhé jsou prach. Stejné semeno. Stejná hodina.',
      ],
    },
    'twin-intro': {
      who: 'HALO',
      pages: [
        'Tahle bedna je provázaná. Je ve všech realitách najednou a hýbe se ve všech zároveň.',
        'Pohne se, jen když má místo všude.',
      ],
    },
    'echo-elder2': {
      who: 'OZVĚNA · JANTAR',
      pages: ['Provázané věci jsou tvrdohlavé. Pohnou se všude, nebo nikde. Jako my, asi.'],
    },
    'bundle-intro': {
      who: 'HALO',
      pages: ['Dvě provázané bedny. Mysli na to, kde jim který svět nechá místo.'],
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
      pages: ['Reaktorová paluba. Paprsky pálí. Otáčej zrcadla a přiveď světlo k přijímači.'],
    },
    'reactor-kask': {
      who: 'INŽENÝRKA MIRA KASKOVÁ',
      pages: [
        'Lasery reaktoru jsou ladičkou Prizmy. Zrcadla jsou ruční.',
        'Otáčej je rukou a ruce drž mimo paprsek.',
      ],
    },
    'echo-reactor': {
      who: 'OZVĚNA · PRIMA',
      pages: [
        'Ta verze, co zůstala v Primě, zkoušela zrcadla jako první. Světlu je jedno, ve kterém světě je.',
      ],
    },
    'phase-intro': {
      who: 'HALO',
      pages: ['Fázová okna. Paprsek, který vejde do jednoho, vyjde v jiné realitě.'],
    },
    'echo-elder3': {
      who: 'OZVĚNA · JANTAR',
      pages: [
        'Polovina cesty. Ředitelka je v jádře, ve čtvrté realitě — v té, která by neměla existovat.',
        'Je tam její syn.',
      ],
    },
    'shadow-intro': {
      who: 'HALO',
      pages: ['Provázaná bedna vrhá stín ve všech realitách najednou.'],
    },
    'reactor-halo': {
      who: 'HALO',
      pages: [
        'Mám teď čtyři verze sebe. Tři z nich se bojí.',
        'Já jsem ta čtvrtá a lžu ti, že jsem klidná.',
      ],
    },
    'core-intro': {
      who: 'HALO',
      pages: ['Jádro. Rezonance je tu všude.'],
    },
    'unlock-3': {
      who: 'HALO',
      pages: [
        'Čtvrtá rezonance: Nula. Nepravděpodobná realita. Maže se.',
        'Stiskni 4 a přejdeš. Dávej pozor, kam šlapeš — podlaha tam na sebe zapomíná.',
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
      pages: ['Srdce Prizmy. Tady se dotýkají všechny reality.'],
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
