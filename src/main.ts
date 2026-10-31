import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import '@fontsource/share-tech-mono/400.css';
import './styles.css';
import { Application } from 'pixi.js';
import { Audio } from '@/audio/audio';
import { Controls, type Action } from '@/input/input';
import { Renderer } from '@/render/renderer';
import { PALETTES } from '@/render/palette';
import { endingAvailable, loadSave, writeSave, type SaveData } from '@/game/save';
import { SECTORS, unlockedAt } from '@/game/sectors';
import type { Ev } from '@/game/types';
import { World, type Snap } from '@/game/world';
import type { Action as SolverAction } from '@/game/solver';
import { getLang, realityName, setLang, story, t, type Lang, type StoryEntry } from '@/ui/i18n';
import { TitleArt } from '@/ui/title';

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T =>
  root.querySelector(sel) as T;

/** Spočíta entity daného druhu vo všetkých komorách. */
function countKind(kind: 'log' | 'echo'): number {
  let n = 0;
  for (const s of SECTORS) {
    const chars = Object.entries(s.legend ?? {})
      .filter(([, spec]) => spec.k === kind)
      .map(([ch]) => ch);
    for (const rows of s.layers)
      for (const row of rows) for (const ch of row) if (chars.includes(ch)) n++;
  }
  return n;
}

const TOTAL_LOGS = countKind('log');
const TOTAL_ECHOES = countKind('echo');
const ZONES = [...new Set(SECTORS.map((s) => s.zone))];

/** Poradie komory v zóne (1-based) a počet komôr zóny. */
function chamberNo(i: number): { zone: number; no: number; of: number } {
  const zone = SECTORS[i]!.zone;
  const inZone = SECTORS.map((s, j) => [s, j] as const).filter(([s]) => s.zone === zone);
  return {
    zone: ZONES.indexOf(zone),
    no: inZone.findIndex(([, j]) => j === i) + 1,
    of: inZone.length,
  };
}

type State = 'title' | 'play' | 'paused' | 'cleared' | 'choice' | 'ending' | 'chambers' | 'confirm';

class Game {
  private renderer: Renderer;
  private controls: Controls;
  private audio = new Audio();
  private save: SaveData;
  private store: Storage | null;
  private world: World | null = null;
  private index = 0;
  private history: Snap[] = [];
  private start: Snap | null = null;
  private moves = 0;
  private state: State = 'title';
  private cooldown = 0;
  private dialog: { entries: StoryEntry[]; page: number; shown: number; full: string } | null =
    null;
  private toastTimer = 0;
  private titleArt = new TitleArt($<HTMLCanvasElement>('.title-art'));
  private worker: Worker | null = null;
  private hintId = 0;
  private hintTimer = 0;

  constructor(private app: Application) {
    this.store = (() => {
      try {
        return window.localStorage;
      } catch {
        return null;
      }
    })();
    const nav = (navigator.language || 'en').slice(0, 2);
    const guess: Lang = nav === 'sk' ? 'sk' : nav === 'cs' ? 'cs' : 'en';
    this.save = loadSave(this.store, guess);
    setLang((['en', 'sk', 'cs'].includes(this.save.lang) ? this.save.lang : 'en') as Lang);
    this.audio.muted = this.save.muted;

    this.renderer = new Renderer(app);
    this.controls = new Controls(app.canvas);
    this.controls.onAny = () => this.audio.unlock();
    this.controls.onTouchMode = () => {
      document.body.classList.add('touch');
      this.layout();
      this.applyTexts();
    };
    this.controls.bindPad($('.pad'));
    this.controls.bindPeek($('.peek'));
    this.bindUi();
    this.applyTexts();
    window.addEventListener('resize', () => this.layout());
    app.ticker.add((tk) => this.tick(Math.min(0.05, tk.deltaMS / 1000)));
    this.showTitle();
  }

  // ---------- rozhranie ----------

  private bindUi(): void {
    const click = (sel: string, fn: () => void) =>
      $(sel).addEventListener('click', () => {
        this.audio.unlock();
        this.audio.click();
        fn();
      });
    click('#title .new', () => {
      if (this.save.reached > 0) this.showScreen('confirm');
      else this.newGame();
    });
    click('#title .continue', () =>
      this.startChamber(Math.min(this.save.chamber, SECTORS.length - 1)),
    );
    click('#title .chambers-btn', () => this.showChambers());
    click('#chambers .back', () => this.showTitle());
    click('#confirm .yes', () => this.newGame());
    click('#confirm .no', () => this.showTitle());
    click('#paused .resume', () => this.resume());
    click('#paused .restart', () => {
      this.resume();
      this.controls.push({ t: 'reset' });
    });
    click('#paused .sound', () => this.toggleMute());
    click('#paused .to-menu', () => this.showTitle());
    click('#cleared .next', () => this.nextChamber());
    click('#ending .ending-menu', () => this.showTitle());
    click('#hud .hint', () => this.controls.push({ t: 'hint' }));
    click('#hud .undo', () => this.controls.push({ t: 'undo' }));
    click('#hud .reset', () => this.controls.push({ t: 'reset' }));
    click('#hud .mute', () => this.toggleMute());
    click('#hud .pause', () => this.controls.push({ t: 'pause' }));
    $('#dialog').addEventListener('click', () => this.advanceDialog());
    document.querySelectorAll<HTMLButtonElement>('.langs button').forEach((b) =>
      b.addEventListener('click', () => {
        setLang(b.dataset.lang as Lang);
        this.save.lang = getLang();
        writeSave(this.store, this.save);
        this.applyTexts();
      }),
    );
  }

  private applyTexts(): void {
    const set = (sel: string, text: string) => ($(sel).textContent = text);
    set('#title .tagline', t('tagline'));
    set('#title .new', t('newGame'));
    set('#title .continue', t('continue'));
    set('#title .chambers-btn', t('chambers'));
    const controls = document.body.classList.contains('touch')
      ? t('controlsTouch')
      : t('controlsKeys');
    set('#title .controls', controls);
    set('#paused .paused-controls', controls);
    set('#chambers .chambers-title', t('chambers'));
    set('#chambers .back', t('back'));
    set('#confirm .confirm-text', t('newGameConfirm'));
    set('#confirm .yes', t('yes'));
    set('#confirm .no', t('no'));
    set('#paused .paused-title', t('paused'));
    set('#paused .resume', t('resume'));
    set('#paused .restart', t('restart'));
    set('#paused .to-menu', t('menu'));
    set('#cleared .next', t('next'));
    set('#ending .ending-menu', t('endingAgain'));
    set('#ending .ending-credits', t('credits'));
    this.updateSoundLabel();
    document
      .querySelectorAll<HTMLButtonElement>('.langs button')
      .forEach((b) => b.classList.toggle('active', b.dataset.lang === getLang()));
    if (this.world) this.updateHud();
  }

  private updateSoundLabel(): void {
    $('#paused .sound').textContent = `${t('sound')}: ${this.save.muted ? t('off') : t('on')}`;
    $('#hud .mute').style.opacity = this.save.muted ? '0.4' : '1';
  }

  private showScreen(id: string | null): void {
    document.querySelectorAll<HTMLElement>('.screen').forEach((s) => (s.hidden = s.id !== id));
    if (id) this.state = id as State;
  }

  private setAccent(r: number): void {
    document.documentElement.style.setProperty('--accent', PALETTES[r]!.css);
  }

  private toast(text: string): void {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('show');
    this.toastTimer = 2.2;
  }

  private layout(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const touch = document.body.classList.contains('touch');
    if (!touch) this.renderer.insets = { top: 62, bottom: 74, left: 16, right: 16 };
    else if (w > h) this.renderer.insets = { top: 56, bottom: 10, left: 190, right: 200 };
    else this.renderer.insets = { top: 60, bottom: 220, left: 8, right: 8 };
    this.renderer.layout();
  }

  // ---------- obrazovky ----------

  private showTitle(): void {
    this.world = null;
    this.setAccent(0);
    $('#hud').hidden = true;
    this.closeDialog();
    this.showScreen('title');
    $('#title .continue').hidden = !(this.save.reached > 0 || this.save.chamber > 0);
    this.titleArt.start();
    this.app.canvas.style.visibility = 'hidden';
  }

  private showChambers(): void {
    const grid = $('#chambers .grid');
    grid.innerHTML = '';
    ZONES.forEach((zone, zi) => {
      const label = document.createElement('div');
      label.className = 'zone-label';
      label.textContent = t(`zone_${zone}`);
      label.style.color = PALETTES[Math.min(zi, 3)]!.css;
      grid.appendChild(label);
      SECTORS.forEach((s, i) => {
        if (s.zone !== zone) return;
        const b = document.createElement('button');
        const { no } = chamberNo(i);
        const best = this.save.best[s.id];
        const open = i <= this.save.reached;
        b.innerHTML = `${zi + 1}-${no} ${open ? t(`ch_${s.id}`) : ''}<small>${best ? t('best', { n: best }) : open ? '—' : t('locked')}</small>`;
        b.disabled = i > this.save.reached;
        b.addEventListener('click', () => {
          this.audio.unlock();
          this.startChamber(i);
        });
        grid.appendChild(b);
      });
    });
    this.showScreen('chambers');
  }

  private newGame(): void {
    const { lang, muted } = this.save;
    this.save = { ...loadSave(null), lang, muted };
    writeSave(this.store, this.save);
    this.startChamber(0);
  }

  private startChamber(i: number): void {
    this.titleArt.stop();
    this.app.canvas.style.visibility = 'visible';
    this.index = i;
    const def = SECTORS[i]!;
    const world = new World(def, unlockedAt(i));
    // Už prečítané záznamy sa nespúšťajú znova.
    for (const e of world.ents) {
      const s = e.spec;
      if (
        (s.k === 'log' && this.save.logs.includes(s.id)) ||
        (s.k === 'echo' && this.save.echoes.includes(s.id))
      )
        e.on = true;
    }
    this.world = world;
    this.history = [];
    this.start = world.snap();
    this.moves = 0;
    this.save.chamber = i;
    writeSave(this.store, this.save);
    this.showScreen(null);
    this.state = 'play';
    $('#hud').hidden = false;
    this.renderer.setWorld(world);
    this.layout();
    this.audio.setReality(world.pr, true);
    this.setAccent(world.pr);
    this.buildRealityButtons();
    this.updateHud();
    this.controls.clear();
    const { zone, no } = chamberNo(i);
    const first = i === 0 || SECTORS[i - 1]!.zone !== def.zone;
    if (first) {
      const card = $('#zone-card');
      $('.zc-zone', card).textContent = t(`zone_${def.zone}`);
      $('.zc-no', card).textContent = `${zone + 1}-${no} · ${t(`ch_${def.id}`)}`;
      card.style.setProperty('--accent', PALETTES[Math.min(zone, 3)]!.css);
      card.classList.add('show');
      setTimeout(() => card.classList.remove('show'), 1900);
    }
    if (def.intro) {
      const entry = story(def.intro);
      if (entry)
        setTimeout(() => this.world === world && this.openDialog([entry]), first ? 1500 : 250);
    }
  }

  private nextChamber(): void {
    if (this.index + 1 < SECTORS.length) this.startChamber(this.index + 1);
    else this.showTitle();
  }

  private pause(): void {
    if (this.state !== 'play') return;
    this.showScreen('paused');
  }

  private resume(): void {
    this.showScreen(null);
    this.state = 'play';
  }

  private toggleMute(): void {
    this.save.muted = !this.save.muted;
    this.audio.setMuted(this.save.muted);
    writeSave(this.store, this.save);
    this.updateSoundLabel();
  }

  // ---------- HUD ----------

  private buildRealityButtons(): void {
    const w = this.world!;
    const box = $('#hud .realities');
    box.innerHTML = '';
    for (let r = 0; r < w.layers; r++) {
      if (!w.unlocked.has(r)) continue;
      const b = document.createElement('button');
      b.dataset.r = String(r);
      b.style.setProperty('--c', PALETTES[r]!.css);
      b.innerHTML = `<span class="key">${r + 1}</span>${realityName(r)}`;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.audio.unlock();
        this.controls.push({ t: 'shift', r });
      });
      box.appendChild(b);
    }
    // S jedinou realitou nie je čo prepínať.
    box.style.visibility = box.children.length > 1 ? 'visible' : 'hidden';
    $('#hud .peek').style.visibility = box.children.length > 1 ? 'visible' : 'hidden';
  }

  private updateHud(): void {
    const w = this.world;
    if (!w) return;
    const { zone, no, of } = chamberNo(this.index);
    $('#hud .zone').textContent = `${zone + 1}-${no}`;
    $('#hud .chamber-no').textContent = t(`ch_${SECTORS[this.index]!.id}`);
    $('#hud .chamber-no').title = `${t(`zone_${SECTORS[this.index]!.zone}`)} ${no}/${of}`;
    $('#hud .moves').textContent = `${t('moves')} ${this.moves}`;
    $('#hud .logs').textContent = `❏ ${this.save.logs.length}/${TOTAL_LOGS}`;
    $('#hud .echoes').textContent = `◈ ${this.save.echoes.length}/${TOTAL_ECHOES}`;
    const inv: string[] = [];
    if (w.inv.has('card')) inv.push(`▭ ${t('gotCard')}`);
    if (w.inv.has('cutter')) inv.push(`⟋ ${t('gotCutter')}`);
    $('#hud .inv').textContent = inv.join('  ');
    document.querySelectorAll<HTMLButtonElement>('#hud .realities button').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.r) === w.pr);
      const key = b.querySelector('.key');
      b.textContent = realityName(Number(b.dataset.r));
      if (key) b.prepend(key);
    });
  }

  private denyReality(r: number): void {
    const b = document.querySelector<HTMLButtonElement>(`#hud .realities button[data-r="${r}"]`);
    if (!b) return;
    b.classList.remove('denied');
    void b.offsetWidth;
    b.classList.add('denied');
  }

  // ---------- dialóg ----------

  private openDialog(entries: StoryEntry[]): void {
    if (this.dialog) {
      this.dialog.entries.push(...entries);
      return;
    }
    if (!entries.length) return;
    this.dialog = { entries, page: 0, shown: 0, full: '' };
    $('#dialog').hidden = false;
    this.showPage();
  }

  private showPage(): void {
    const d = this.dialog!;
    const entry = d.entries[0]!;
    d.full = entry.pages[d.page] ?? '';
    d.shown = 0;
    const who = $('#dialog .who');
    who.textContent = entry.who;
    $('#dialog').style.setProperty(
      '--accent',
      entry.who.includes('·') ? this.echoColor(entry.who) : PALETTES[this.world?.pr ?? 0]!.css,
    );
    $('#dialog .text').textContent = '';
    this.audio.play([{ t: 'read', kind: 'log', id: '' }]);
  }

  private echoColor(who: string): string {
    const names = [0, 1, 2, 3].map((r) => realityName(r).toUpperCase());
    const r = names.findIndex((n) => who.includes(n));
    return r >= 0 ? PALETTES[r]!.css : '#ffffff';
  }

  private advanceDialog(): void {
    const d = this.dialog;
    if (!d) return;
    if (d.shown < d.full.length) {
      d.shown = d.full.length;
      $('#dialog .text').textContent = d.full;
      return;
    }
    const entry = d.entries[0]!;
    if (d.page + 1 < entry.pages.length) {
      d.page++;
      this.showPage();
      return;
    }
    d.entries.shift();
    if (d.entries.length) {
      d.page = 0;
      this.showPage();
      return;
    }
    this.closeDialog();
  }

  private closeDialog(): void {
    this.dialog = null;
    $('#dialog').hidden = true;
  }

  // ---------- hra ----------

  private tick(dt: number): void {
    this.controls.update(dt);
    this.audio.update(dt);
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) $('#toast').classList.remove('show');
    }
    if (this.dialog && this.dialog.shown < this.dialog.full.length) {
      this.dialog.shown = Math.min(this.dialog.full.length, this.dialog.shown + dt * 60);
      $('#dialog .text').textContent = this.dialog.full.slice(0, Math.floor(this.dialog.shown));
    }
    this.cooldown -= dt;
    if (this.hintTimer > 0) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) this.renderer.hint = [];
    }
    if (this.state === 'play' && this.world) {
      this.renderer.peekTarget = this.controls.peek && !this.dialog ? 1 : 0;
      while (this.cooldown <= 0) {
        const a = this.controls.next();
        if (!a) break;
        this.handle(a);
      }
    } else {
      // Mimo hry sa fronta zahadzuje (okrem potvrdenia dialógu).
      const a = this.controls.next();
      if (a?.t === 'pause' && this.state === 'paused') this.resume();
    }
    this.renderer.frame(dt);
  }

  private handle(a: Action): void {
    const w = this.world!;
    if (this.dialog) {
      if (a.t === 'confirm' || a.t === 'move') this.advanceDialog();
      else if (a.t === 'pause') this.pause();
      return;
    }
    if (a.t !== 'confirm' && a.t !== 'pause') this.clearHint();
    switch (a.t) {
      case 'hint':
        this.requestHint();
        break;
      case 'move':
      case 'shift':
      case 'cycle': {
        let r = 0;
        if (a.t === 'cycle') {
          const list = [...Array(w.layers).keys()].filter((x) => w.unlocked.has(x));
          if (list.length < 2) return;
          const i = list.indexOf(w.pr);
          r = list[(i + a.d + list.length) % list.length]!;
        } else if (a.t === 'shift') r = a.r;
        const before = w.snap();
        const key = w.key();
        const ev = a.t === 'move' ? w.move(a.dir) : w.shift(r);
        if (w.key() !== key || ev.some((e) => e.t === 'read' || e.t === 'msg')) {
          this.history.push(before);
          if (this.history.length > 2000) this.history.shift();
          this.moves++;
        }
        this.cooldown = a.t === 'move' ? 0.085 : 0.16;
        this.onEvents(ev);
        break;
      }
      case 'undo': {
        const s = this.history.pop();
        if (!s) return;
        w.restore(s);
        this.moves = Math.max(0, this.moves - 1);
        this.audio.undo();
        this.audio.setReality(w.pr);
        this.setAccent(w.pr);
        this.renderer.events([]);
        this.updateHud();
        this.cooldown = 0.08;
        break;
      }
      case 'reset': {
        if (!this.start) return;
        w.restore(this.start);
        // Prečítané záznamy ostanú prečítané.
        for (const e of w.ents) {
          const s = e.spec;
          if (
            (s.k === 'log' && this.save.logs.includes(s.id)) ||
            (s.k === 'echo' && this.save.echoes.includes(s.id))
          )
            e.on = true;
        }
        this.history = [];
        this.moves = 0;
        this.renderer.snap();
        this.renderer.events([{ t: 'shift', r: w.pr }]);
        this.audio.setReality(w.pr);
        this.setAccent(w.pr);
        this.buildRealityButtons();
        this.updateHud();
        break;
      }
      case 'pause':
        this.pause();
        break;
      case 'confirm':
        break;
    }
  }

  private onEvents(ev: Ev[]): void {
    const w = this.world!;
    this.renderer.events(ev);
    this.audio.play(ev);
    const dialogs: StoryEntry[] = [];
    for (const e of ev) {
      switch (e.t) {
        case 'shift':
          this.setAccent(e.r);
          break;
        case 'shiftBlocked':
          if (e.why === 'same') break;
          this.denyReality(e.r);
          this.toast(
            e.why === 'locked'
              ? t('blockedLocked')
              : e.why === 'beam'
                ? t('blockedBeam', { r: realityName(e.r) })
                : t('blockedSolid', { r: realityName(e.r) }),
          );
          break;
        case 'needItem':
          this.toast(e.item === 'card' ? t('needCard') : t('needCutter'));
          break;
        case 'pickup':
          this.toast(e.item === 'card' ? t('gotCard') : t('gotCutter'));
          break;
        case 'unlock': {
          this.toast(t('tunedReality', { r: realityName(e.r) }));
          this.buildRealityButtons();
          const entry = story(`unlock-${e.r}`);
          if (entry) dialogs.push(entry);
          break;
        }
        case 'read': {
          const list = e.kind === 'log' ? this.save.logs : this.save.echoes;
          if (!list.includes(e.id)) list.push(e.id);
          writeSave(this.store, this.save);
          const entry = story(e.id);
          if (entry) dialogs.push(entry);
          break;
        }
        case 'msg': {
          const entry = story(e.id);
          if (entry) dialogs.push(entry);
          break;
        }
        case 'exit':
          this.cleared();
          break;
        case 'core':
          this.showChoice();
          break;
        default:
          break;
      }
    }
    if (dialogs.length) this.openDialog(dialogs);
    this.updateHud();
    void w;
  }

  // ---------- nápoveda ----------

  private requestHint(): void {
    const w = this.world;
    if (!w) return;
    if (!this.worker) {
      this.worker = new Worker(new URL('./hint.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent<{ id: number; steps: SolverAction[] | null }>) =>
        this.showHint(e.data.id, e.data.steps);
    }
    const id = ++this.hintId;
    this.toast(t('hintThinking'));
    this.worker.postMessage({ id, index: this.index, unlocked: [...w.unlocked], snap: w.snap() });
  }

  private showHint(id: number, steps: SolverAction[] | null): void {
    const w = this.world;
    if (!w || id !== this.hintId) return;
    if (!steps) {
      this.toast(t('hintNone'));
      return;
    }
    // Prehranie riešenia na kópii sveta, aby šípky stáli tam, kde budú kroky.
    const sim = new World(SECTORS[this.index]!, w.unlocked);
    sim.restore(w.snap());
    const hint: Renderer['hint'] = [];
    for (const step of steps.slice(0, 6)) {
      if ('m' in step) {
        hint.push({ x: sim.px, y: sim.py, r: sim.pr, dir: step.m });
        sim.move(step.m);
      } else {
        sim.shift(step.s);
        hint.push({ x: sim.px, y: sim.py, r: step.s, shift: true });
      }
    }
    this.renderer.hint = hint;
    this.hintTimer = 10;
    $('#toast').classList.remove('show');
  }

  private clearHint(): void {
    this.hintId++;
    this.renderer.hint = [];
  }

  private cleared(): void {
    const def = SECTORS[this.index]!;
    const prev = this.save.best[def.id];
    if (!prev || this.moves < prev) this.save.best[def.id] = this.moves;
    this.save.moves += this.moves;
    this.save.reached = Math.max(this.save.reached, this.index + 1);
    this.save.chamber = Math.min(this.index + 1, SECTORS.length - 1);
    writeSave(this.store, this.save);
    this.state = 'cleared';
    setTimeout(() => {
      $('#cleared .cleared-title').textContent = t('cleared');
      $('#cleared .cleared-moves').textContent =
        t('clearedMoves', { n: this.moves }) + ' · ' + t('best', { n: this.save.best[def.id]! });
      this.closeDialog();
      this.showScreen('cleared');
    }, 650);
  }

  private showChoice(): void {
    const box = $('#choice .choices');
    box.innerHTML = '';
    $('#choice .choice-title').textContent = t('choose');
    const echoes = this.save.echoes.length;
    for (let c = 0; c < 3; c++) {
      const b = document.createElement('button');
      const ok = endingAvailable(c, echoes, TOTAL_ECHOES);
      b.textContent = ok ? t(`choice${c}`) : t('choice2Locked', { e: echoes, et: TOTAL_ECHOES });
      b.disabled = !ok;
      b.className = 'big';
      b.addEventListener('click', () => this.ending(c));
      box.appendChild(b);
    }
    this.showScreen('choice');
  }

  private ending(c: number): void {
    this.audio.play([{ t: 'unlock', r: c === 2 ? 0 : c === 1 ? 2 : 3 }]);
    this.save.moves += this.moves;
    this.save.reached = SECTORS.length - 1;
    if (!this.save.endings.includes(c)) this.save.endings.push(c);
    writeSave(this.store, this.save);
    const entry = story(`ending-${c}`)!;
    $('#ending .ending-title').textContent = t(`endingTitle${c}`);
    $('#ending .ending-text').textContent = entry.pages.join('\n\n');
    $('#ending .ending-stats').textContent = t('endingStats', {
      e: this.save.echoes.length,
      et: TOTAL_ECHOES,
      l: this.save.logs.length,
      lt: TOTAL_LOGS,
      m: this.save.moves,
    });
    this.setAccent(c === 2 ? 0 : c === 1 ? 2 : 3);
    $('#hud').hidden = true;
    this.showScreen('ending');
  }
}

async function boot(): Promise<void> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: 0x03070d,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
  });
  $('#game').appendChild(app.canvas);
  const game = new Game(app);
  (window as unknown as { __prizma: Game }).__prizma = game;
}

void boot();
