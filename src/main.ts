import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import '@fontsource/share-tech-mono/400.css';
import './styles.css';
import { Application } from 'pixi.js';
import { Audio } from '@/audio/audio';
import { Controls, type Command } from '@/input/input';
import { Renderer } from '@/render/renderer';
import { PALETTES } from '@/render/palette';
import { CHAPTERS, LEVELS } from '@/game/levels';
import { loadSave, recordWin, writeSave, type SaveData } from '@/game/save';
import { Sim } from '@/game/sim';
import type { Ev } from '@/game/types';
import { getLang, realityName, setLang, story, t, type Lang, type StoryEntry } from '@/ui/i18n';
import { TitleArt } from '@/ui/title';

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T =>
  root.querySelector(sel) as T;

type State = 'title' | 'levels' | 'play' | 'paused' | 'clear' | 'ending';

/** Farba kapitoly: najnovšia realita, srdce je biele. */
const chapterCss = (c: number) => (c < 4 ? PALETTES[c]!.css : '#f2fbff');

/** Poradie úrovne v kapitole (1, 2, …). */
function numberInChapter(i: number): number {
  const l = LEVELS[i]!;
  return LEVELS.slice(0, i + 1).filter((x) => x.chapter === l.chapter).length;
}

function fmt(time: number): string {
  return `${time.toFixed(2)} s`;
}

class Game {
  private renderer: Renderer;
  private controls: Controls;
  private audio = new Audio();
  private save: SaveData;
  private store: Storage | null;
  private sim: Sim | null = null;
  private index = 0;
  private state: State = 'title';
  private dialog: { entries: StoryEntry[]; page: number; shown: number; full: string } | null =
    null;
  private toastTimer = 0;
  private titleArt = new TitleArt($<HTMLCanvasElement>('.title-art'));
  /** Čas beží až od prvého pohybu. */
  private started = false;
  private restartTimer = 0;
  private winTimer = 0;
  private lastChapter = -1;
  private hudKey = '';

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
    this.controls.bindDash($('.t-dash'));
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
    click('#title .continue', () => this.startLevel(this.save.unlocked));
    click('#title .levels-btn', () => this.showLevels());
    click('#levels .levels-back', () => this.showTitle());
    click('#paused .resume', () => this.resume());
    click('#paused .restart', () => this.retry());
    click('#paused .to-levels', () => this.showLevels());
    click('#paused .sound', () => this.toggleMute());
    click('#paused .to-menu', () => this.showTitle());
    click('#clear .clear-next', () => this.next());
    click('#clear .clear-retry', () => this.startLevel(this.index));
    click('#clear .clear-levels', () => this.showLevels());
    click('#ending .ending-menu', () => this.showTitle());
    click('#hud .restart-btn', () => this.controls.push({ t: 'restart' }));
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
    const fresh = this.save.unlocked === 0 && !Object.keys(this.save.best).length;
    set('#title .continue', fresh ? t('play') : t('continue'));
    set('#title .levels-btn', t('levels'));
    const controls = document.body.classList.contains('touch')
      ? t('controlsTouch')
      : t('controlsKeys');
    set('#title .controls', controls);
    set('#paused .paused-controls', controls);
    set('#levels .levels-title', t('levels'));
    set('#levels .levels-back', t('back'));
    set('#paused .paused-title', t('paused'));
    set('#paused .resume', t('resume'));
    set('#paused .restart', t('restart'));
    set('#paused .to-levels', t('levels'));
    set('#paused .to-menu', t('menu'));
    set('#clear .clear-next', t('next'));
    set('#clear .clear-retry', t('retry'));
    set('#clear .clear-levels', t('levels'));
    set('#ending .ending-menu', t('menu'));
    set('#ending .ending-credits', t('credits'));
    set('#hud .start-hint', t('start'));
    this.renderer.names = [0, 1, 2, 3].map((r) => realityName(r));
    this.renderer.layout();
    this.updateSoundLabel();
    document
      .querySelectorAll<HTMLButtonElement>('.langs button')
      .forEach((b) => b.classList.toggle('active', b.dataset.lang === getLang()));
    if (this.state === 'levels') this.showLevels();
    this.hudKey = '';
  }

  private updateSoundLabel(): void {
    $('#paused .sound').textContent = `${t('sound')}: ${this.save.muted ? t('off') : t('on')}`;
    $('#hud .mute').style.opacity = this.save.muted ? '0.4' : '1';
  }

  private showScreen(id: string | null): void {
    document.querySelectorAll<HTMLElement>('.screen').forEach((s) => (s.hidden = s.id !== id));
    if (id) this.state = id as State;
  }

  private setAccent(css: string): void {
    document.documentElement.style.setProperty('--accent', css);
  }

  private toast(text: string, time = 1.4): void {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('show');
    this.toastTimer = time;
  }

  private layout(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const touch = document.body.classList.contains('touch');
    if (!touch) this.renderer.insets = { top: 64, bottom: 40, left: 16, right: 16 };
    else if (w > h) this.renderer.insets = { top: 54, bottom: 10, left: 10, right: 104 };
    else this.renderer.insets = { top: 60, bottom: 130, left: 8, right: 8 };
    this.renderer.layout();
  }

  // ---------- obrazovky ----------

  private showTitle(): void {
    this.leaveLevel();
    this.setAccent(PALETTES[0]!.css);
    this.applyTexts();
    this.showScreen('title');
    this.titleArt.start();
    this.app.canvas.style.visibility = 'hidden';
  }

  private leaveLevel(): void {
    this.sim = null;
    this.renderer.setSim(null);
    this.lastChapter = -1;
    $('#hud').hidden = true;
    this.closeDialog();
  }

  private showLevels(): void {
    this.leaveLevel();
    this.titleArt.stop();
    this.app.canvas.style.visibility = 'hidden';
    const box = $('#levels .chapters');
    box.innerHTML = '';
    for (let c = 0; c < CHAPTERS; c++) {
      const row = document.createElement('div');
      row.className = 'chapter';
      row.style.setProperty('--c', chapterCss(c));
      const name = document.createElement('div');
      name.className = 'chapter-name';
      name.textContent = t(`chapter${c}`);
      row.appendChild(name);
      LEVELS.forEach((l, i) => {
        if (l.chapter !== c) return;
        const b = document.createElement('button');
        b.className = 'lv';
        const best = this.save.best[l.id];
        if (best !== undefined && best <= l.par) b.classList.add('star');
        b.innerHTML = `${numberInChapter(i)}<small>${best !== undefined ? `${best <= l.par ? '★ ' : ''}${best.toFixed(1)}` : '&nbsp;'}</small>`;
        b.disabled = i > this.save.unlocked;
        b.addEventListener('click', () => {
          this.audio.unlock();
          this.audio.click();
          this.startLevel(i);
        });
        row.appendChild(b);
      });
      box.appendChild(row);
    }
    this.showScreen('levels');
  }

  private startLevel(i: number): void {
    const level = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, i))]!;
    this.index = LEVELS.indexOf(level);
    this.titleArt.stop();
    this.app.canvas.style.visibility = 'visible';
    this.closeDialog();
    this.showScreen(null);
    this.state = 'play';
    $('#hud').hidden = false;
    this.setAccent(chapterCss(level.chapter));
    this.retry();
    this.layout();
    const top = Math.max(...level.panels.map((p) => p.r));
    if (level.chapter !== this.lastChapter) {
      this.audio.enter(top);
      this.chapterCard(level.chapter);
      this.lastChapter = level.chapter;
    }
    if (level.intro && !this.save.seen.includes(level.intro)) {
      this.save.seen.push(level.intro);
      writeSave(this.store, this.save);
      const entry = story(level.intro);
      if (entry) this.openDialog([entry]);
    }
  }

  /** Nový pokus tej istej úrovne. */
  private retry(): void {
    const level = LEVELS[this.index]!;
    this.sim = new Sim(level);
    this.started = false;
    this.restartTimer = 0;
    this.winTimer = 0;
    this.renderer.setSim(this.sim);
    this.renderer.waiting = true;
    this.controls.clear();
    this.hudKey = '';
    if (this.state === 'paused' || this.state === 'clear') {
      this.showScreen(null);
      this.state = 'play';
    }
  }

  private next(): void {
    if (this.index + 1 < LEVELS.length) this.startLevel(this.index + 1);
    else this.showEnding();
  }

  private pause(): void {
    if (this.state !== 'play') return;
    this.showScreen('paused');
  }

  private resume(): void {
    this.showScreen(null);
    this.state = 'play';
    this.controls.clear();
  }

  private toggleMute(): void {
    this.save.muted = !this.save.muted;
    this.audio.setMuted(this.save.muted);
    writeSave(this.store, this.save);
    this.updateSoundLabel();
  }

  private chapterCard(c: number): void {
    const card = $('#zone-card');
    $('.zc-zone', card).textContent = t(`chapter${c}`);
    $('.zc-no', card).textContent = `${c + 1} / ${CHAPTERS}`;
    card.style.setProperty('--accent', chapterCss(c));
    card.classList.add('show');
    setTimeout(() => card.classList.remove('show'), 1700);
  }

  private showClear(time: number, record: boolean): void {
    const level = LEVELS[this.index]!;
    $('#clear .clear-title').textContent =
      `${t('clear')} · ${t(`chapter${level.chapter}`)} ${level.chapter + 1}-${numberInChapter(this.index)}`;
    $('#clear .clear-time').textContent = fmt(time);
    const best = $('#clear .clear-best');
    best.textContent = record ? t('newBest') : `${t('best')}: ${fmt(this.save.best[level.id]!)}`;
    best.classList.toggle('new', record);
    const star = $('#clear .clear-star');
    star.textContent = t('par', { t: level.par });
    star.classList.toggle('got', time <= level.par);
    this.showScreen('clear');
  }

  private showEnding(): void {
    this.leaveLevel();
    const entry = story('ending')!;
    $('#ending .ending-title').textContent = t('endingTitle');
    $('#ending .ending-text').textContent = entry.pages.join('\n\n');
    const total = LEVELS.reduce((s, l) => s + (this.save.best[l.id] ?? 0), 0);
    const stars = LEVELS.filter((l) => (this.save.best[l.id] ?? Infinity) <= l.par).length;
    $('#ending .ending-stats').textContent = t('endingStats', {
      m: Math.floor(total / 60),
      s: String(Math.floor(total % 60)).padStart(2, '0'),
      d: this.save.deaths,
      st: stars,
      stt: LEVELS.length,
    });
    this.setAccent('#f2fbff');
    this.audio.play([{ t: 'win', time: 0 }]);
    this.showScreen('ending');
  }

  // ---------- HUD ----------

  private updateHud(): void {
    const sim = this.sim;
    if (!sim) return;
    const level = sim.level;
    const key = [level.id, sim.t.toFixed(1), sim.taken(), sim.wave, this.started, getLang()].join(
      '|',
    );
    if (key === this.hudKey) return;
    this.hudKey = key;
    $('#hud .chap').textContent = t(`chapter${level.chapter}`);
    $('#hud .lvl').textContent = `${level.chapter + 1}-${numberInChapter(this.index)}`;
    $('#hud .time').textContent = `${sim.t.toFixed(1)} s`;
    const waves = sim.waves > 1 ? `  ${Math.min(sim.wave + 1, sim.waves)}/${sim.waves}` : '';
    $('#hud .shards').textContent = `◆ ${sim.taken()}/${sim.total()}${waves}`;
    $('#hud .start-hint').classList.toggle('show', !this.started && !this.dialog);
  }

  // ---------- dialóg ----------

  private openDialog(entries: StoryEntry[]): void {
    if (!entries.length) return;
    this.dialog = { entries, page: 0, shown: 0, full: '' };
    $('#dialog').hidden = false;
    this.showPage();
    this.hudKey = '';
  }

  private showPage(): void {
    const d = this.dialog!;
    const entry = d.entries[0]!;
    d.full = entry.pages[d.page] ?? '';
    d.shown = 0;
    $('#dialog .who').textContent = entry.who;
    $('#dialog').style.setProperty('--accent', chapterCss(LEVELS[this.index]?.chapter ?? 0));
    $('#dialog .text').textContent = '';
  }

  private advanceDialog(): void {
    const d = this.dialog;
    if (!d) return;
    this.audio.click();
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
    this.controls.clear();
  }

  private closeDialog(): void {
    this.dialog = null;
    $('#dialog').hidden = true;
    this.hudKey = '';
  }

  // ---------- hra ----------

  private tick(dt: number): void {
    this.audio.update(dt);
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) $('#toast').classList.remove('show');
    }
    if (this.dialog && this.dialog.shown < this.dialog.full.length) {
      this.dialog.shown = Math.min(this.dialog.full.length, this.dialog.shown + dt * 60);
      $('#dialog .text').textContent = this.dialog.full.slice(0, Math.floor(this.dialog.shown));
    }
    this.renderer.stick = this.state === 'play' ? this.controls.stickView : null;
    for (let c = this.controls.next(); c; c = this.controls.next()) this.command(c);
    const sim = this.sim;
    const input = this.controls.read();
    if (this.state === 'play' && sim && !this.dialog) {
      if (this.restartTimer > 0) {
        this.restartTimer -= dt;
        if (this.restartTimer <= 0) this.retry();
      } else if (this.winTimer > 0) {
        this.winTimer -= dt;
        if (this.winTimer <= 0) this.afterWin();
      } else {
        if (!this.started && (Math.hypot(input.mx, input.my) > 0.2 || input.dash)) {
          this.started = true;
          this.renderer.waiting = false;
        }
        if (this.started) this.onEvents(sim.step(dt, input));
      }
    }
    if (this.state === 'play') this.updateHud();
    this.renderer.frame(dt);
  }

  private command(c: Command): void {
    const sim = this.sim;
    if (this.dialog) {
      if (c.t === 'confirm' || c.t === 'tap') this.advanceDialog();
      return;
    }
    if (c.t === 'pause') {
      if (this.state === 'play') this.pause();
      else if (this.state === 'paused') this.resume();
      else if (this.state === 'levels') this.showTitle();
      return;
    }
    if (this.state === 'clear') {
      if (c.t === 'confirm') this.next();
      else if (c.t === 'restart') this.startLevel(this.index);
      return;
    }
    if (this.state !== 'play' || !sim) return;
    if (c.t === 'restart') {
      if (!sim.won) this.retry();
    } else if (c.t === 'anchor') this.onEvents(sim.toggleAnchor(c.p));
    else if (c.t === 'anchorCycle') {
      const n = sim.panels.length;
      const next = ((sim.anchor + 1 + c.d + n + 1) % (n + 1)) - 1;
      this.onEvents(next < 0 ? sim.toggleAnchor(sim.anchor) : sim.toggleAnchor(next));
    } else if (c.t === 'tap') {
      const i = this.renderer.panelAt(c.x, c.y);
      if (i >= 0) this.onEvents(sim.toggleAnchor(i));
    }
  }

  private onEvents(ev: Ev[]): void {
    const sim = this.sim;
    if (!sim || !ev.length) return;
    this.renderer.events(ev);
    this.audio.play(ev);
    for (const e of ev) {
      if (e.t === 'death') {
        this.save.deaths++;
        writeSave(this.store, this.save);
        this.restartTimer = 0.75;
      } else if (e.t === 'win') {
        this.winTimer = 0.9;
      } else if (e.t === 'anchor') {
        this.toast(
          e.p >= 0 ? t('anchored', { r: realityName(sim.panels[e.p]!.r) }) : t('released'),
        );
      }
    }
  }

  private afterWin(): void {
    const sim = this.sim;
    if (!sim) return;
    const level = sim.level;
    const record = recordWin(this.save, this.index, level.id, sim.t, LEVELS.length);
    writeSave(this.store, this.save);
    if (this.index === LEVELS.length - 1) this.showEnding();
    else this.showClear(sim.t, record);
  }
}

async function boot(): Promise<void> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: 0x02050a,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
  });
  $('#game').appendChild(app.canvas);
  const game = new Game(app);
  (window as unknown as { __prizma: Game }).__prizma = game;
}

void boot();
