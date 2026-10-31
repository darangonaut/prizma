import type { Locale } from '../i18n';

export const sk: Locale = {
  ui: {
    tagline: 'Jedna stanica. Štyri reality. Jediná cesta von.',
    newGame: 'Nová hra',
    continue: 'Pokračovať',
    chambers: 'Komory',
    back: 'Späť',
    sound: 'Zvuk',
    on: 'zap.',
    off: 'vyp.',
    controlsKeys:
      'Pohyb: šípky / WASD · Presun do reality: 1–4 alebo Q / E · Nahliadnuť: drž medzerník · Späť: Z · Reštart: R · Nápoveda: H',
    controlsTouch: 'Švihni alebo použi ovládač · Ťukni na realitu pre presun · Drž ◎ a nahliadneš',
    hintThinking: 'Premýšľam…',
    hintNone: 'Odtiaľto sa to už nedá. Vráť ťah alebo reštartuj.',
    paused: 'Pauza',
    resume: 'Pokračovať',
    restart: 'Reštartovať komoru',
    menu: 'Hlavné menu',
    undo: 'Späť',
    moves: 'Ťahy',
    chamber: 'Komora',
    cleared: 'Komora prejdená',
    clearedMoves: '{n} ťahov',
    best: 'najlepšie {n}',
    next: 'Pokračovať',
    logs: 'Záznamy',
    echoes: 'Ozveny',
    locked: 'Zamknuté',
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
    blockedLocked: 'Táto realita ešte nie je naladená.',
    blockedSolid: 'V realite {r} tu niečo stojí.',
    blockedBeam: 'V realite {r} tadiaľto ide lúč.',
    needCard: 'Zamknuté. Treba prístupovú kartu.',
    needCutter: 'Zarastené. Treba niečo ostré.',
    gotCard: 'Prístupová karta',
    gotCutter: 'Plazmová rezačka',
    tunedReality: 'Naladená realita: {r}',
    tapToContinue: 'ťukni alebo stlač Enter',
    endingTitle0: 'Kolaps',
    endingTitle1: 'Kotva',
    endingTitle2: 'Interferencia',
    endingStats: 'Nájdené ozveny: {e} / {et} · Prečítané záznamy: {l} / {lt} · Ťahy: {m}',
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
        'Stanica sa momentálne… ťažko opisuje. Pokračuj prosím k východu z kryokomory.',
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
    'hint-push': {
      who: 'HALO',
      pages: ['Bedne sa dajú tlačiť. Tlaková doska drží dvere otvorené, kým na nej niečo leží.'],
    },
    'rift-intro': {
      who: 'HALO',
      pages: ['Chodba pred tebou sa zrútila. V laboratóriu zachytávam silnú rezonanciu.'],
    },
    'unlock-1': {
      who: 'HALO',
      pages: [
        'Ten úlomok je časť Prizmy. Rezonuje s… inou stanicou. Tie isté miestnosti. Zatopené.',
        'Stlač 2 a prejdeš na druhú stranu, 1 ťa vráti späť. Presunúť sa dá len tam, kde je v druhej realite voľno.',
      ],
    },
    'hint-shift': {
      who: 'HALO',
      pages: ['Podrž medzerník (alebo ◎) a nahliadneš do ostatných realít skôr, než prejdeš.'],
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
      pages: ['Ani jedna verzia tejto chodby nevedie až na koniec. Spolu by mohli.'],
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
        'Obytný prstenec. Rozvody sú spoločné pre všetky reality — doska v jednom svete otvorí dvere v inom.',
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
      pages: ['Zatopený prstenec má ešte funkčné čerpadlo. Je zapojené na túto stranu.'],
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
    'double-intro': {
      who: 'HALO',
      pages: ['Dve dosky, dva svety, jedny dvere. Obe musia byť stlačené naraz.'],
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
    'echo-elder1': {
      who: 'OZVENA · JANTÁR',
      pages: [
        'Vedelo sa, že prídeš. Aj moja cesta sa začala tu — podľa môjho rátania pred šesťdesiatimi rokmi.',
        'Rezačka je tam, kde ostala. Liany dorastajú, ale pomaly.',
      ],
    },
    'hydro-botanist': {
      who: 'BOTANIK ILAN OKAFOR',
      pages: [
        'Paradajky v debničke 6 v jednej realite plodia a v druhej sú prach. To isté semeno. Tá istá hodina.',
      ],
    },
    'twin-intro': {
      who: 'HALO',
      pages: [
        'Táto bedňa je previazaná. Je vo všetkých realitách naraz a hýbe sa vo všetkých spolu.',
        'Pohne sa, len ak má miesto všade.',
      ],
    },
    'echo-elder2': {
      who: 'OZVENA · JANTÁR',
      pages: ['Previazané veci sú tvrdohlavé. Pohnú sa všade alebo nikde. Ako my, asi.'],
    },
    'bundle-intro': {
      who: 'HALO',
      pages: ['Dve previazané bedne. Mysli na to, kde im ktorý svet nechá miesto.'],
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
      pages: ['Reaktorová paluba. Lúče pália. Otáčaj zrkadlá a priveď svetlo k prijímaču.'],
    },
    'reactor-kask': {
      who: 'INŽINIERKA MIRA KASKOVÁ',
      pages: [
        'Lasery reaktora sú ladičkou Prizmy. Zrkadlá sú ručné.',
        'Otáčaj ich rukou a ruky drž mimo lúča.',
      ],
    },
    'echo-reactor': {
      who: 'OZVENA · PRIMA',
      pages: [
        'Tá verzia, čo ostala v Prime, skúšala zrkadlá ako prvá. Svetlu je jedno, v ktorom svete je.',
      ],
    },
    'phase-intro': {
      who: 'HALO',
      pages: ['Fázové okná. Lúč, ktorý vojde do jedného, vyjde v inej realite.'],
    },
    'echo-elder3': {
      who: 'OZVENA · JANTÁR',
      pages: [
        'Polovica cesty. Riaditeľka je v jadre, vo štvrtej realite — v tej, ktorá by nemala existovať.',
        'Je tam jej syn.',
      ],
    },
    'shadow-intro': {
      who: 'HALO',
      pages: ['Previazaná bedňa vrhá tieň vo všetkých realitách naraz.'],
    },
    'reactor-halo': {
      who: 'HALO',
      pages: [
        'Mám teraz štyri verzie seba. Tri z nich sa boja.',
        'Ja som tá štvrtá a klamem ti, že som pokojná.',
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
        'Stlač 4 a prejdeš. Daj pozor, kam stúpaš — podlaha tam na seba zabúda.',
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
      pages: ['Srdce Prizmy. Tu sa dotýkajú všetky reality.'],
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
