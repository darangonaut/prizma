import type { Locale } from '../i18n';

export const en: Locale = {
  ui: {
    tagline: 'One station. Four realities. One way out.',
    newGame: 'New game',
    continue: 'Continue',
    chambers: 'Chambers',
    back: 'Back',
    sound: 'Sound',
    on: 'on',
    off: 'off',
    controlsKeys:
      'Move: arrows / WASD · Shift reality: 1–4 or Q / E · Look through: hold Space · Undo: Z · Restart: R · Hint: H',
    controlsTouch: 'Swipe or use the pad · Tap a reality to shift · Hold ◎ to look through',
    hintThinking: 'Thinking…',
    hintNone: 'No way out from here. Undo or restart.',
    paused: 'Paused',
    resume: 'Resume',
    restart: 'Restart chamber',
    menu: 'Main menu',
    undo: 'Undo',
    moves: 'Moves',
    chamber: 'Chamber',
    cleared: 'Chamber cleared',
    clearedMoves: '{n} moves',
    best: 'best {n}',
    next: 'Continue',
    logs: 'Logs',
    echoes: 'Echoes',
    locked: 'Locked',
    newGameConfirm: 'Start again? Your progress will be erased.',
    yes: 'Yes',
    no: 'No',
    reality0: 'Prima',
    reality1: 'Abyss',
    reality2: 'Amber',
    reality3: 'Null',
    zone_kryo: 'Cryo Bay',
    zone_habitat: 'Habitat',
    zone_hydro: 'Hydroponics',
    zone_reactor: 'Reactor',
    zone_core: 'Prism Core',
    blockedLocked: 'That reality is not tuned yet.',
    blockedSolid: 'Something is in the way in {r}.',
    blockedBeam: 'A beam cuts through that spot in {r}.',
    needCard: 'Locked. It needs a keycard.',
    needCutter: 'Overgrown. You need something sharp.',
    gotCard: 'Keycard',
    gotCutter: 'Plasma cutter',
    tunedReality: 'Reality tuned: {r}',
    tapToContinue: 'tap or press Enter',
    endingTitle0: 'Collapse',
    endingTitle1: 'The Anchor',
    endingTitle2: 'Interference',
    endingStats: 'Echoes found: {e} / {et} · Logs read: {l} / {lt} · Moves: {m}',
    endingAgain: 'Back to the menu',
    choose: 'What will you do?',
    choice0: 'Close the Prism',
    choice1: 'Become the anchor',
    choice2: 'Tune the realities',
    choice2Locked: 'Tune the realities (needs all echoes: {e} / {et})',
    credits:
      'Prizma — made with TypeScript, PixiJS and the Web Audio API. No images, no audio files.',
  },
  story: {
    'kryo-intro': {
      who: 'HALO',
      pages: [
        'Cryo cycle interrupted. Good morning, T-7.',
        'The station is… difficult to describe right now. Please proceed to the cryo bay exit.',
      ],
    },
    'kryo-pod': {
      who: 'CRYO POD 7',
      pages: [
        'Occupant: T-7, maintenance technician. Status: revived early.',
        'Note from Director Sund: “Keep this one asleep until after Lom-1. Just in case.”',
      ],
    },
    'kryo-halo': {
      who: 'HALO',
      pages: [
        'Most of the crew evacuated forty-one hours ago. Director Sund stayed behind in the core.',
        'Since the Lom-1 test my sensors report four versions of every room. I am choosing to report only one.',
      ],
    },
    'hint-push': {
      who: 'HALO',
      pages: [
        'Crates can be pushed. A pressure plate holds a door open while something rests on it.',
      ],
    },
    'rift-intro': {
      who: 'HALO',
      pages: [
        'The corridor ahead has collapsed. I am detecting a strong resonance in the laboratory.',
      ],
    },
    'unlock-1': {
      who: 'HALO',
      pages: [
        'That shard is a piece of the Prism. It resonates with… another station. The same rooms. Flooded.',
        'Press 2 to step across. Press 1 to come back. You can only step where the other reality has room for you.',
      ],
    },
    'hint-shift': {
      who: 'HALO',
      pages: ['Hold Space (or ◎) to look through into the other realities before you step.'],
    },
    'kryo-lab': {
      who: 'DR. VERA SUND',
      pages: [
        'Lom-1 will split our reality like light through glass. Every possibility, side by side.',
        'Somewhere in one of them, Teo is still alive.',
      ],
    },
    'weave-intro': {
      who: 'HALO',
      pages: ['Neither version of this corridor goes all the way through. Together, they might.'],
    },
    'kryo-crew': {
      who: 'ENGINEER MIRA KASK',
      pages: [
        'Pod bay 3 is gone in one reality and fine in the other. I walked through a wall today.',
        'The wall just was not there for me. I am not going back to that corridor.',
      ],
    },
    'habitat-intro': {
      who: 'HALO',
      pages: [
        'Habitat ring. The wiring is shared between realities — a plate in one world can open a door in another.',
      ],
    },
    'echo-drowned': {
      who: 'ECHO · ABYSS',
      pages: [
        '…cold. The water came through the ceiling in the second hour.',
        'Hatch 4 stayed shut, so the others could reach the pods. If you are me — do not open hatch 4.',
      ],
    },
    'pump-intro': {
      who: 'HALO',
      pages: ['The flooded habitat still has a working pump. It is wired to this side.'],
    },
    'habitat-vera': {
      who: 'DR. VERA SUND',
      pages: [
        'Teo would have been nine today.',
        'The board approved Lom-1 as “energy research”. Nobody asked what I intended to find.',
      ],
    },
    'echo-pump': {
      who: 'ECHO · ABYSS',
      pages: [
        'The keycard is still in the locker. The pumps would have saved us. Nobody had the time.',
      ],
    },
    'double-intro': {
      who: 'HALO',
      pages: ['Two plates, two worlds, one door. Both must be held at the same time.'],
    },
    'habitat-crew': {
      who: 'BOTANIST ILAN OKAFOR',
      pages: [
        'In the mess hall I saw myself eating lunch. Old. Grey beard. He waved at me.',
        'In that other reality the garden has eaten the whole station.',
      ],
    },
    'hydro-intro': {
      who: 'HALO',
      pages: ['Hydroponics. I am detecting a third resonance. Time runs faster there.'],
    },
    'unlock-2': {
      who: 'HALO',
      pages: [
        'Reality three: Amber. Centuries have passed on that side. The garden won.',
        'Press 3 to step across.',
      ],
    },
    'echo-elder1': {
      who: 'ECHO · AMBER',
      pages: [
        'I knew you would come. I came here too, once — sixty years ago, by my count.',
        'The cutter is where I left it. Vines grow back, but slowly.',
      ],
    },
    'hydro-botanist': {
      who: 'BOTANIST ILAN OKAFOR',
      pages: [
        'The tomatoes in tray 6 are fruiting in one reality and dust in the other. Same seed. Same hour.',
      ],
    },
    'twin-intro': {
      who: 'HALO',
      pages: [
        'This crate is entangled. It exists in every reality at once and moves in all of them together.',
        'It only moves if there is room for it everywhere.',
      ],
    },
    'echo-elder2': {
      who: 'ECHO · AMBER',
      pages: [
        'Entangled things are stubborn. They move everywhere or nowhere. Like us, I suppose.',
      ],
    },
    'bundle-intro': {
      who: 'HALO',
      pages: ['Two entangled crates. Think about where each world leaves them room.'],
    },
    'hydro-vera': {
      who: 'DR. VERA SUND',
      pages: [
        'The Prism is cracking. Every crack is a world. I can hold them together from the core, but not forever.',
        'If someone wakes T-7 — I am sorry.',
      ],
    },
    'reactor-intro': {
      who: 'HALO',
      pages: [
        'Reactor deck. The beams are hot. Rotate the mirrors to guide the light to the receiver.',
      ],
    },
    'reactor-kask': {
      who: 'ENGINEER MIRA KASK',
      pages: [
        'The reactor lasers are the Prism’s tuning fork. The mirrors are manual.',
        'Rotate them by hand, and keep your hands out of the beam.',
      ],
    },
    'echo-reactor': {
      who: 'ECHO · PRIMA',
      pages: [
        'The one who stayed in Prima tried the mirrors first. Light does not care which world it is in.',
      ],
    },
    'phase-intro': {
      who: 'HALO',
      pages: ['Phase windows. A beam that enters one comes out in another reality.'],
    },
    'echo-elder3': {
      who: 'ECHO · AMBER',
      pages: [
        'Halfway now. The director is in the core, in the fourth reality — the one that should not exist.',
        'Her son is there.',
      ],
    },
    'shadow-intro': {
      who: 'HALO',
      pages: ['An entangled crate casts a shadow in every reality at once.'],
    },
    'reactor-halo': {
      who: 'HALO',
      pages: [
        'I have four versions of myself now. Three of them are afraid.',
        'I am the fourth, and I am lying to you about being calm.',
      ],
    },
    'core-intro': {
      who: 'HALO',
      pages: ['The core. The resonance is everywhere here.'],
    },
    'unlock-3': {
      who: 'HALO',
      pages: [
        'The fourth resonance: Null. The improbable reality. It is being erased.',
        'Press 4 to step across. Watch your step — the floor forgets itself there.',
      ],
    },
    'echo-glitch': {
      who: 'ECHO · NULL',
      pages: [
        'y-you are not supposed to… here. In Null nothing that happens… stays. Teo is real here. For now.',
      ],
    },
    'interference-intro': {
      who: 'HALO',
      pages: ['Everything at once. Every world is holding a piece of the way.'],
    },
    'core-vera': {
      who: 'DR. VERA SUND',
      pages: [
        'If you are reading this, you came all the way. I found him, T-7. He is real. He laughs at the same jokes.',
        'But Null is unraveling, and it is pulling the other worlds with it.',
      ],
    },
    'echo-last': {
      who: 'ECHO · ALL',
      pages: [
        'We are every version of you that made it this far. We kept the way open.',
        'The last choice is yours. It always was.',
      ],
    },
    'heart-intro': {
      who: 'HALO',
      pages: ['The Prism’s heart. Every reality touches here.'],
    },
    'core-halo': {
      who: 'HALO',
      pages: ['Whatever you choose, T-7, I will remember all of them.'],
    },
    'ending-0': {
      who: '',
      pages: [
        'You pull the Prism out of alignment. The flooded corridors, the garden, the green static — gone, folded back into what might have been.',
        'The station is quiet and whole. Vera Sund is not on it.',
        'You take the last pod home. HALO, with a single voice, wishes you a good morning.',
      ],
    },
    'ending-1': {
      who: '',
      pages: [
        'You step into the light and take all four realities into your hands. They stop cracking.',
        'Somewhere in Null, a boy laughs at his mother’s joke. Somewhere in Amber, an old version of you plants another tree.',
        'You do not leave. You do not need to. You are the Prism now.',
      ],
    },
    'ending-2': {
      who: '',
      pages: [
        'Every echo gave you a fragment of the frequency. You tune the Prism instead of breaking it.',
        'The realities do not collapse — they settle, like light folding back into a single beam. Vera and Teo step out of Null into Prima, real and together. The drowned crew wakes in their pods.',
        'HALO speaks with one voice. For the first time in forty-one hours, it sounds calm.',
      ],
    },
  },
};
