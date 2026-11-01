import type { Locale } from '../i18n';

export const en: Locale = {
  ui: {
    tagline: 'One move. Four mirrors.',
    play: 'Play',
    continue: 'Continue',
    levels: 'Levels',
    back: 'Back',
    sound: 'Sound',
    on: 'on',
    off: 'off',
    controlsKeys:
      'WASD / arrows move all copies at once · Space: dash · 1–4: anchor a copy · R: restart · Esc: pause',
    controlsTouch: 'Drag anywhere to move all copies · tap a window to anchor its copy · »: dash',
    paused: 'Paused',
    resume: 'Resume',
    restart: 'Restart',
    menu: 'Main menu',
    reality0: 'Prima',
    reality1: 'Abyss',
    reality2: 'Amber',
    reality3: 'Null',
    chapter0: 'Prima',
    chapter1: 'Abyss',
    chapter2: 'Amber',
    chapter3: 'Null',
    chapter4: 'Heart of the Prism',
    start: 'Move to begin',
    anchored: 'Anchored: {r}',
    released: 'Anchor released',
    clear: 'Clear',
    time: 'Time',
    best: 'Best',
    newBest: 'New record',
    par: '★ under {t} s',
    next: 'Next',
    retry: 'Again',
    endingTitle: 'Four in one',
    endingStats: 'Total time {m}:{s} · attempts {d} · stars {st}/{stt}',
    credits: 'Prizma — TypeScript, PixiJS and the Web Audio API. No image or sound files.',
  },
  story: {
    'intro-0': {
      who: 'DIR. VERA SUND',
      pages: [
        'T-7? Good, your systems are running. Listen carefully. The Prizma experiment split the station into four realities. And you with it.',
        'For now you are only in one of them. Collect the prism shards in this room. Every shard pulls the four of you closer together.',
        'Watch out for anything red. Red kills.',
      ],
    },
    'hint-dash': {
      who: 'SYSTEM',
      pages: [
        'Dash (Space / »): a short burst. Nothing can hurt you while you dash, so you can jump over one row of spikes or through a live laser.',
      ],
    },
    'intro-1': {
      who: 'DIR. VERA SUND',
      pages: [
        'There is a second copy of you. In Abyss, the flooded version of the station.',
        'You cannot control it separately. Whatever you do, it does too, but mirrored: your left is its right.',
        'If one copy dies, both do. You are one person in two places.',
      ],
    },
    'hint-anchor': {
      who: 'SYSTEM',
      pages: [
        'Anchor (keys 1–4, or tap the window): one copy stands still while the others move. Only one at a time. A wall works the same way: a copy pressed against a wall stays put.',
      ],
    },
    'hint-drowned': {
      who: 'DIR. VERA SUND',
      pages: [
        'The drowned of Abyss. They used to be the crew. They follow your copy, and they do not stop.',
      ],
    },
    'intro-2': {
      who: 'DIR. VERA SUND',
      pages: [
        'A third copy. Amber, where centuries passed in a week. That copy is mirrored across the diagonal: your right is its down, your up is its left.',
        'The spore pods shoot. Keep moving.',
      ],
    },
    'intro-3': {
      who: 'DIR. VERA SUND',
      pages: [
        'The fourth one, Null. The reality that is being erased. Its floor flickers out of existence, so never stand where it blinks.',
        'Null mirrors across the other diagonal: right is up, up is right.',
        'Four copies now. One move, four mirrors. I know it is a lot. It is the only way back.',
      ],
    },
    'intro-4': {
      who: 'DIR. VERA SUND',
      pages: [
        'The Heart of the Prism. It exists in all four realities at once, and it will defend itself.',
        'Take the light back from it, every shard in all four. Then you can be whole again.',
      ],
    },
    ending: {
      who: 'DIR. VERA SUND',
      pages: [
        'The shards close up. Four mirrors fold into one.',
        'T-7 opens one pair of eyes. One room, one station, one reality: the original.',
        'The prism falls silent. Somewhere in the core, Director Sund finally switches it off.',
        'Thank you. Welcome back, T-7.',
      ],
    },
  },
};
