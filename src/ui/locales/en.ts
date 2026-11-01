import type { Locale } from '../i18n';

export const en: Locale = {
  ui: {
    tagline: 'One station. Four realities. One way out.',
    newGame: 'New game',
    continue: 'Continue',
    back: 'Back',
    sound: 'Sound',
    on: 'on',
    off: 'off',
    controlsKeys:
      'Move: WASD / arrows · Aim: mouse · Shoot: click or J · Dash: Space · Shift reality: 1–4 or Q / E · Look through: hold Shift · Prism lens: right click or L · Map: M',
    controlsTouch:
      'Left thumb: move · ✦ shoot (aims by itself) · » dash · Tap a reality to shift · Hold ◎ to look through',
    paused: 'Paused',
    resume: 'Resume',
    toTerminal: 'Back to the last terminal',
    menu: 'Main menu',
    map: 'Station map',
    mapHint:
      'Terminals ▣ save your progress. From a room with a terminal you can travel to any other terminal.',
    mapTravel: 'Choose a terminal ▣ to travel to.',
    dead: 'Signal lost',
    deadText: 'Restoring at the last terminal…',
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
    room_k1: 'Cryo Pods',
    room_k2: 'Service Corridor',
    room_k3: 'Laboratory',
    room_k4: 'Flooded Junction',
    room_h1: 'Habitat Ring',
    room_h2: 'Mess Hall',
    room_h3: 'Pump Room',
    room_h4: 'Lockers',
    room_h5: "Director's Quarters",
    room_y1: 'Hydroponics Gate',
    room_y2: 'Garden',
    room_y3: 'Overgrowth',
    room_y4: 'Seed Vault',
    room_y5: 'Great Tree',
    room_r1: 'Reactor Gate',
    room_r2: 'Coil Hall',
    room_r3: 'Lens Chamber',
    room_r4: 'Control Room',
    room_r5: 'Core Lift',
    room_c1: 'Core Approach',
    room_c2: 'Archive',
    room_c3: 'Interference',
    room_c4: 'Hall of Echoes',
    room_c5: 'Heart of the Prism',
    boss_warden: 'Reactor Warden',
    boss_heart: 'Heart of the Prism',
    blockedLocked: 'That reality is not tuned yet.',
    blockedSolid: 'Something is in the way in {r}.',
    needCard: 'Locked. It needs a keycard.',
    needCutter: 'Living wood. Your pulse cannot cut it.',
    got_card: 'Keycard',
    got_cutter: 'Plasma cutter — your shots burn through vines',
    got_lens: 'Prism lens',
    gotHealth: 'Integrity +1',
    tunedReality: 'Reality tuned: {r}',
    saved: 'Progress saved',
    endingTitle0: 'Collapse',
    endingTitle1: 'The Anchor',
    endingTitle2: 'Interference',
    endingStats:
      'Echoes found: {e} / {et} · Logs read: {l} / {lt} · Time: {m} min · Signals lost: {d}',
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
        'The station is… difficult to describe right now. Security is still in lockdown mode. Please proceed east, carefully.',
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
    'hint-combat': {
      who: 'HALO',
      pages: [
        'Security drones. They still think we are in lockdown, and you are the intruder.',
        'Your multitool fires a pulse: aim with the mouse and click, or press J. Space makes you dodge — bullets pass through you while you do.',
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
        'Press 2 to step across and 1 to come back. You can only step where the other reality has room for you. Hold Shift to look through first.',
        'What exists in one reality cannot touch you in another. Neither can its bullets. And if you step into the spot where something stands over there… it will not stand for long.',
      ],
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
      pages: ['Neither version of this junction goes all the way through. Together, they might.'],
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
        'Habitat ring. The wiring is shared between realities — a switch in one world can open a door in another.',
        'Shoot a switch to flip it.',
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
      pages: [
        'The flooded habitat still has a working pump. Restart it, and the water should drain from the whole ring.',
      ],
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
    'vines-intro': {
      who: 'HALO',
      pages: [
        'The Amber side has had centuries to grow. Your pulse cannot cut through living wood.',
      ],
    },
    'echo-elder1': {
      who: 'ECHO · AMBER',
      pages: [
        'I knew you would come. I came here too, once — sixty years ago, by my count.',
        'The cutter is where I left it. Vines grow back, but slowly.',
      ],
    },
    'item-cutter': {
      who: 'HALO',
      pages: ['A plasma cutter. Your shots will burn through vines now.'],
    },
    'hydro-botanist': {
      who: 'BOTANIST ILAN OKAFOR',
      pages: [
        'The tomatoes in tray 6 are fruiting in one reality and dust in the other. Same seed. Same hour.',
      ],
    },
    'echo-elder2': {
      who: 'ECHO · AMBER',
      pages: [
        'Time is cheap on this side. Sixty years to think about what the director did.',
        'I still do not know what I would have done in her place. Maybe you will.',
      ],
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
        'Reactor deck. The beams are hot and they cut through every reality at once. Find the switches.',
      ],
    },
    'reactor-kask': {
      who: 'ENGINEER MIRA KASK',
      pages: [
        'The coil lasers are interlocked. Kill the switch, kill the beam.',
        'And whatever you do, keep your hands out of the light.',
      ],
    },
    'item-lens': {
      who: 'HALO',
      pages: [
        'A prism lens. It fires a charge that passes through every reality at once.',
        'Right click, or press L. Some receptors only answer to light from all the worlds together.',
      ],
    },
    'echo-reactor': {
      who: 'ECHO · PRIMA',
      pages: [
        'The one who stayed in Prima found the lens first. Light does not care which world it is in.',
      ],
    },
    'echo-elder3': {
      who: 'ECHO · AMBER',
      pages: [
        'Halfway now. The director is in the core, in the fourth reality — the one that should not exist.',
        'Her son is there.',
      ],
    },
    'reactor-halo': {
      who: 'HALO',
      pages: [
        'I have four versions of myself now. Three of them are afraid.',
        'I am the fourth, and I am lying to you about being calm.',
      ],
    },
    'warden-intro': {
      who: 'HALO',
      pages: [
        'The core lift is guarded. The warden does not stay in one reality.',
        'Follow it — or wait for it to come back to yours.',
      ],
    },
    'warden-down': {
      who: 'HALO',
      pages: [
        'The warden is down. Something fell out of it — a shard that hums in a key I have no name for.',
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
        'Press 4 to step across. Things born in Null do not respect the borders between worlds — they will follow you.',
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
      pages: [
        'The Prism’s heart. It exists in every reality, but only one of them is truly here at a time.',
        'Strike where it is real. Watch the colour of its light.',
      ],
    },
    'heart-down': {
      who: 'HALO',
      pages: ['The heart is quiet. The Prism is open.', 'Step into the light, T-7.'],
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
