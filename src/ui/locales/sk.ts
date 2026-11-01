import type { Locale } from '../i18n';

export const sk: Locale = {
  ui: {
    tagline: 'Jedna stanica. Štyri reality. Jediná cesta von.',
    newGame: 'Nová hra',
    continue: 'Pokračovať',
    back: 'Späť',
    sound: 'Zvuk',
    on: 'zap.',
    off: 'vyp.',
    controlsKeys:
      'Pohyb: WASD / šípky · Mierenie: myš · Streľba: klik alebo J · Úskok: medzerník · Presun do reality: 1–4 alebo Q / E · Nahliadnuť: drž Shift · Hranolová šošovka: pravé tlačidlo alebo L · Mapa: M',
    controlsTouch:
      'Ľavý palec: pohyb · ✦ streľba (mieri sama) · » úskok · Ťukni na realitu pre presun · Drž ◎ a nahliadneš',
    paused: 'Pauza',
    resume: 'Pokračovať',
    toTerminal: 'Späť k poslednému terminálu',
    menu: 'Hlavné menu',
    map: 'Mapa stanice',
    mapHint:
      'Terminály ▣ ukladajú postup. Z miestnosti s terminálom sa dá presunúť k ľubovoľnému inému terminálu.',
    mapTravel: 'Vyber terminál ▣, ku ktorému sa presunieš.',
    dead: 'Signál stratený',
    deadText: 'Obnova pri poslednom termináli…',
    newGameConfirm: 'Začať odznova? Postup sa vymaže.',
    yes: 'Áno',
    no: 'Nie',
    reality0: 'Prima',
    reality1: 'Hlbina',
    reality2: 'Jantár',
    reality3: 'Nula',
    zone_kryo: 'Kryokomora',
    zone_habitat: 'Obytný prstenec',
    zone_hydro: 'Hydroponika',
    zone_reactor: 'Reaktor',
    zone_core: 'Jadro Prizmy',
    room_k1: 'Kryokapsuly',
    room_k2: 'Servisná chodba',
    room_k3: 'Laboratórium',
    room_k4: 'Zatopená križovatka',
    room_h1: 'Obytný prstenec',
    room_h2: 'Jedáleň',
    room_h3: 'Čerpacia stanica',
    room_h4: 'Šatne',
    room_h5: 'Byt riaditeľky',
    room_y1: 'Brána hydroponiky',
    room_y2: 'Záhrada',
    room_y3: 'Húština',
    room_y4: 'Trezor semien',
    room_y5: 'Veľký strom',
    room_r1: 'Brána reaktora',
    room_r2: 'Cievková hala',
    room_r3: 'Komora šošovky',
    room_r4: 'Riadiaca miestnosť',
    room_r5: 'Výťah do jadra',
    room_c1: 'Prístup k jadru',
    room_c2: 'Archív',
    room_c3: 'Interferencia',
    room_c4: 'Sieň ozvien',
    room_c5: 'Srdce Prizmy',
    boss_warden: 'Strážca reaktora',
    boss_heart: 'Srdce Prizmy',
    blockedLocked: 'Táto realita ešte nie je naladená.',
    blockedSolid: 'V realite {r} tu niečo stojí.',
    needCard: 'Zamknuté. Treba prístupovú kartu.',
    needCutter: 'Živé drevo. Pulz ho neprereže.',
    got_card: 'Prístupová karta',
    got_cutter: 'Plazmová rezačka — strely prepália liany',
    got_lens: 'Hranolová šošovka',
    gotHealth: 'Odolnosť +1',
    tunedReality: 'Naladená realita: {r}',
    saved: 'Postup uložený',
    endingTitle0: 'Kolaps',
    endingTitle1: 'Kotva',
    endingTitle2: 'Interferencia',
    endingStats:
      'Nájdené ozveny: {e} / {et} · Prečítané záznamy: {l} / {lt} · Čas: {m} min · Stratené signály: {d}',
    endingAgain: 'Späť do menu',
    choose: 'Čo urobíš?',
    choice0: 'Zavrieť Prizmu',
    choice1: 'Stať sa kotvou',
    choice2: 'Zladiť reality',
    choice2Locked: 'Zladiť reality (treba všetky ozveny: {e} / {et})',
    credits: 'Prizma — TypeScript, PixiJS a Web Audio API. Žiadne obrázky ani zvukové súbory.',
  },
  story: {
    'kryo-intro': {
      who: 'HALO',
      pages: [
        'Kryocyklus prerušený. Dobré ráno, T-7.',
        'Stanica sa momentálne… ťažko opisuje. Ochranka je stále v režime uzávery. Pokračuj prosím na východ. Opatrne.',
      ],
    },
    'kryo-pod': {
      who: 'KRYOKAPSULA 7',
      pages: [
        'Osádka: T-7, technická údržba. Stav: predčasne prebudené.',
        'Poznámka riaditeľky Sundovej: „T-7 nech spí až do skončenia Lomu-1. Pre istotu.“',
      ],
    },
    'kryo-halo': {
      who: 'HALO',
      pages: [
        'Väčšina posádky sa evakuovala pred štyridsiatimi jednou hodinami. Riaditeľka Sundová zostala v jadre.',
        'Od testu Lom-1 hlásia moje senzory štyri verzie každej miestnosti. Rozhodla som sa hlásiť len jednu.',
      ],
    },
    'hint-combat': {
      who: 'HALO',
      pages: [
        'Strážne drony. Stále si myslia, že platí uzávera a votrelec si ty.',
        'Multinástroj strieľa pulz: mier myšou a klikni, alebo stlač J. Medzerník je úskok — počas neho cez teba strely prejdú.',
      ],
    },
    'rift-intro': {
      who: 'HALO',
      pages: ['Chodba pred tebou sa zrútila. V laboratóriu zachytávam silnú rezonanciu.'],
    },
    'unlock-1': {
      who: 'HALO',
      pages: [
        'Ten úlomok je časť Prizmy. Rezonuje s… inou stanicou. Tie isté miestnosti. Zatopené.',
        'Stlač 2 a prejdeš na druhú stranu, 1 ťa vráti späť. Presunúť sa dá len tam, kde je v druhej realite voľno. Podrž Shift a najprv nahliadni.',
        'Čo existuje v jednej realite, na teba v inej nedosiahne. Ani jeho strely. A ak sa presunieš na miesto, kde tam niečo stojí… dlho stáť nebude.',
      ],
    },
    'kryo-lab': {
      who: 'DR. VERA SUNDOVÁ',
      pages: [
        'Lom-1 rozštiepi našu realitu ako svetlo v skle. Všetky možnosti vedľa seba.',
        'V jednej z nich Teo ešte žije.',
      ],
    },
    'weave-intro': {
      who: 'HALO',
      pages: ['Ani jedna verzia tejto križovatky nevedie až na koniec. Spolu by mohli.'],
    },
    'kryo-crew': {
      who: 'INŽINIERKA MIRA KASKOVÁ',
      pages: [
        'Kapsulová hala 3 je v jednej realite preč a v druhej v poriadku. Dnes som prešla stenou.',
        'Tá stena pre mňa jednoducho nebola. Do tej chodby sa už nevrátim.',
      ],
    },
    'habitat-intro': {
      who: 'HALO',
      pages: [
        'Obytný prstenec. Rozvody sú spoločné pre všetky reality — spínač v jednom svete otvorí dvere v inom.',
        'Spínač prepneš výstrelom.',
      ],
    },
    'echo-drowned': {
      who: 'OZVENA · HLBINA',
      pages: [
        '…zima. Voda prenikla stropom v druhej hodine.',
        'Prielez 4 ostal zatvorený, aby sa ostatní dostali ku kapsulám. Ak si mnou — prielez 4 neotváraj.',
      ],
    },
    'pump-intro': {
      who: 'HALO',
      pages: [
        'Zatopený prstenec má ešte funkčné čerpadlo. Keď ho spustíš, voda by mala odtiecť z celého prstenca.',
      ],
    },
    'habitat-vera': {
      who: 'DR. VERA SUNDOVÁ',
      pages: [
        'Teo by mal dnes deväť rokov.',
        'Rada schválila Lom-1 ako „energetický výskum“. Nikto sa nespýtal, čo chcem nájsť.',
      ],
    },
    'echo-pump': {
      who: 'OZVENA · HLBINA',
      pages: ['Karta je stále v skrinke. Čerpadlá by nás zachránili. Nikto na ne nemal čas.'],
    },
    'habitat-crew': {
      who: 'BOTANIK ILAN OKAFOR',
      pages: [
        'V jedálni som videl sám seba pri obede. Starého. So šedivou bradou. Zamával mi.',
        'V tej druhej realite záhrada zožrala celú stanicu.',
      ],
    },
    'hydro-intro': {
      who: 'HALO',
      pages: ['Hydroponika. Zachytávam tretiu rezonanciu. Čas tam beží rýchlejšie.'],
    },
    'unlock-2': {
      who: 'HALO',
      pages: [
        'Tretia realita: Jantár. Na tej strane ubehli stáročia. Záhrada vyhrala.',
        'Stlač 3 a prejdeš.',
      ],
    },
    'vines-intro': {
      who: 'HALO',
      pages: ['Jantárová strana mala stáročia na to, aby rástla. Pulz živé drevo neprereže.'],
    },
    'echo-elder1': {
      who: 'OZVENA · JANTÁR',
      pages: [
        'Vedelo sa, že prídeš. Aj moja cesta sa začala tu — podľa môjho rátania pred šesťdesiatimi rokmi.',
        'Rezačka je tam, kde ostala. Liany dorastajú, ale pomaly.',
      ],
    },
    'item-cutter': {
      who: 'HALO',
      pages: ['Plazmová rezačka. Strely teraz prepália liany.'],
    },
    'hydro-botanist': {
      who: 'BOTANIK ILAN OKAFOR',
      pages: [
        'Paradajky v debničke 6 v jednej realite plodia a v druhej sú prach. To isté semeno. Tá istá hodina.',
      ],
    },
    'echo-elder2': {
      who: 'OZVENA · JANTÁR',
      pages: [
        'Na tejto strane je čas lacný. Šesťdesiat rokov na premýšľanie o tom, čo riaditeľka urobila.',
        'Stále neviem, čo by som na jej mieste urobilo ja. Možno ty to budeš vedieť.',
      ],
    },
    'hydro-vera': {
      who: 'DR. VERA SUNDOVÁ',
      pages: [
        'Prizma praská. Každá prasklina je svet. Z jadra ich udržím pokope, ale nie navždy.',
        'Ak niekto prebudí T-7 — prepáč.',
      ],
    },
    'reactor-intro': {
      who: 'HALO',
      pages: [
        'Reaktorová paluba. Lúče pália a prechádzajú všetkými realitami naraz. Nájdi spínače.',
      ],
    },
    'reactor-kask': {
      who: 'INŽINIERKA MIRA KASKOVÁ',
      pages: [
        'Lasery cievok sú zablokované spínačmi. Vypni spínač a vypneš lúč.',
        'A nech robíš čokoľvek, ruky drž mimo svetla.',
      ],
    },
    'item-lens': {
      who: 'HALO',
      pages: [
        'Hranolová šošovka. Vystrelí náboj, ktorý prejde všetkými realitami naraz.',
        'Pravé tlačidlo myši alebo L. Niektoré prijímače reagujú len na svetlo zo všetkých svetov naraz.',
      ],
    },
    'echo-reactor': {
      who: 'OZVENA · PRIMA',
      pages: [
        'Tá verzia, čo ostala v Prime, našla šošovku ako prvá. Svetlu je jedno, v ktorom svete je.',
      ],
    },
    'echo-elder3': {
      who: 'OZVENA · JANTÁR',
      pages: [
        'Polovica cesty. Riaditeľka je v jadre, vo štvrtej realite — v tej, ktorá by nemala existovať.',
        'Je tam jej syn.',
      ],
    },
    'reactor-halo': {
      who: 'HALO',
      pages: [
        'Mám teraz štyri verzie seba. Tri z nich sa boja.',
        'Ja som tá štvrtá a klamem ti, že som pokojná.',
      ],
    },
    'warden-intro': {
      who: 'HALO',
      pages: [
        'Výťah do jadra je strážený. Strážca neostáva v jednej realite.',
        'Choď za ním — alebo počkaj, kým sa vráti do tej tvojej.',
      ],
    },
    'warden-down': {
      who: 'HALO',
      pages: [
        'Strážca padol. Niečo z neho vypadlo — úlomok, ktorý hučí v tónine, pre ktorú nemám meno.',
      ],
    },
    'core-intro': {
      who: 'HALO',
      pages: ['Jadro. Rezonancia je tu všade.'],
    },
    'unlock-3': {
      who: 'HALO',
      pages: [
        'Štvrtá rezonancia: Nula. Nepravdepodobná realita. Vymazáva sa.',
        'Stlač 4 a prejdeš. Čo sa zrodilo v Nule, nerešpektuje hranice medzi svetmi — pôjde to za tebou.',
      ],
    },
    'echo-glitch': {
      who: 'OZVENA · NULA',
      pages: [
        't-ty tu nemáš… byť. V Nule nič, čo sa stane… nezostane. Teo je tu skutočný. Zatiaľ.',
      ],
    },
    'interference-intro': {
      who: 'HALO',
      pages: ['Všetko naraz. Každý svet drží kúsok cesty.'],
    },
    'core-vera': {
      who: 'DR. VERA SUNDOVÁ',
      pages: [
        'Ak toto čítaš, cesta ťa doviedla až sem. Našla som ho, T-7. Je skutočný. Smeje sa na tých istých vtipoch.',
        'Ale Nula sa rozpadá a ťahá so sebou ostatné svety.',
      ],
    },
    'echo-last': {
      who: 'OZVENA · VŠETKY',
      pages: [
        'Sme každá verzia teba, ktorá sa dostala až sem. Držali sme ti cestu otvorenú.',
        'Posledná voľba je tvoja. Vždy bola.',
      ],
    },
    'heart-intro': {
      who: 'HALO',
      pages: [
        'Srdce Prizmy. Existuje vo všetkých realitách, ale naozaj je v každej chvíli len v jednej.',
        'Udri tam, kde je skutočné. Sleduj farbu jeho svetla.',
      ],
    },
    'heart-down': {
      who: 'HALO',
      pages: ['Srdce stíchlo. Prizma je otvorená.', 'Vstúp do svetla, T-7.'],
    },
    'core-halo': {
      who: 'HALO',
      pages: ['Nech zvolíš čokoľvek, T-7, budem si pamätať všetky.'],
    },
    'ending-0': {
      who: '',
      pages: [
        'Vytrhneš Prizmu z osi. Zatopené chodby, záhrada, zelený šum — všetko zmizne, zloží sa späť do toho, čo mohlo byť.',
        'Stanica je tichá a celá. Vera Sundová na nej nie je.',
        'Poslednou kapsulou letíš domov. HALO ti jediným hlasom praje dobré ráno.',
      ],
    },
    'ending-1': {
      who: '',
      pages: [
        'Vstúpiš do svetla a vezmeš všetky štyri reality do rúk. Prestanú praskať.',
        'Niekde v Nule sa chlapec smeje na maminom vtipe. Niekde v Jantári tvoja stará verzia sadí ďalší strom.',
        'Neodídeš. Nemusíš. Teraz si Prizmou ty.',
      ],
    },
    'ending-2': {
      who: '',
      pages: [
        'Každá ozvena ti dala kúsok frekvencie. Prizmu nerozbiješ — naladíš ju.',
        'Reality sa nezrútia, ale usadia sa ako svetlo, ktoré sa zloží späť do jediného lúča. Vera a Teo vystúpia z Nuly do Primy, skutoční a spolu. Utopená posádka sa prebúdza v kapsulách.',
        'HALO hovorí jediným hlasom. Prvýkrát za štyridsaťjeden hodín znie pokojne.',
      ],
    },
  },
};
