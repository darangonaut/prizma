import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import '@fontsource/share-tech-mono/400.css';
import './styles.css';
import { Application } from 'pixi.js';
import { Audio } from '@/audio/audio';
import { Controls, type Command } from '@/input/input';
import { Renderer } from '@/render/renderer';
import { PALETTES } from '@/render/palette';
import { specFor } from '@/game/room';
import { ROOMS } from '@/game/rooms';
import { emptySave, endingAvailable, loadSave, writeSave, type SaveData } from '@/game/save';
import { Sim } from '@/game/sim';
import { NO_INPUT, type Ev } from '@/game/types';
import { getLang, realityName, setLang, story, t, type Lang, type StoryEntry } from '@/ui/i18n';
import { TitleArt } from '@/ui/title';

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T =>
  root.querySelector(sel) as T;

/** Spočíta záznamy a ozveny na celej stanici. */
function countKind(kind: 'log' | 'echo'): number {
  const ids = new Set<string>();
  for (const def of ROOMS)
    for (const rows of def.layers)
      for (const row of rows ?? [])
        for (const ch of row) {
          const s = specFor(def, ch);
          if (s?.k === kind) ids.add(s.id);
        }
  return ids.size;
}

const TOTAL_LOGS = countKind('log');
const TOTAL_ECHOES = countKind('echo');
const ZONES = [...new Set(ROOMS.map((r) => r.zone))];
/** Miestnosti s terminálom (cieľ rýchleho presunu). */
const TERMINALS = new Set(
  ROOMS.filter((d) => d.layers[0]!.some((row) => row.includes('T'))).map((d) => d.id),
);

type State = 'title' | 'play' | 'paused' | 'map' | 'dead' | 'choice' | 'ending' | 'confirm';

class Game {
  private renderer: Renderer;
  private controls: Controls;
  private audio = new Audio();
  private save: SaveData;
  private store: Storage | null;
  private sim: Sim | null = null;
  private state: State = 'title';
  private dialog: { entries: StoryEntry[]; page: number; shown: number; full: string } | null =
    null;
  private toastTimer = 0;
  private deadTimer = 0;
  private titleArt = new TitleArt($<HTMLCanvasElement>('.title-art'));
  private zone = '';
  private pendingShift: number | null = null;
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
    this.controls.bindButton($('.t-fire'), 'fire');
    this.controls.bindButton($('.t-dash'), 'dash');
    this.controls.bindButton($('.t-lens'), 'lens');
    this.controls.bindButton($('.t-peek'), 'peek');
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
      if (this.save.started) this.showScreen('confirm');
      else this.newGame();
    });
    click('#title .continue', () => this.startGame());
    click('#confirm .yes', () => this.newGame());
    click('#confirm .no', () => this.showTitle());
    click('#paused .resume', () => this.resume());
    click('#paused .restart', () => {
      // Návrat k poslednému terminálu (predmety ostanú, nepočíta sa ako smrť).
      const sim = this.sim;
      if (!sim) return;
      sim.respawn();
      this.save.deaths = Math.max(0, this.save.deaths - 1);
      this.afterRespawn();
      this.resume();
    });
    click('#paused .sound', () => this.toggleMute());
    click('#paused .to-menu', () => this.showTitle());
    click('#map .map-close', () => this.resume());
    click('#ending .ending-menu', () => this.showTitle());
    click('#hud .map-btn', () => this.controls.push({ t: 'map' }));
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
    const controls = document.body.classList.contains('touch')
      ? t('controlsTouch')
      : t('controlsKeys');
    set('#title .controls', controls);
    set('#paused .paused-controls', controls);
    set('#confirm .confirm-text', t('newGameConfirm'));
    set('#confirm .yes', t('yes'));
    set('#confirm .no', t('no'));
    set('#paused .paused-title', t('paused'));
    set('#paused .resume', t('resume'));
    set('#paused .restart', t('toTerminal'));
    set('#paused .to-menu', t('menu'));
    set('#map .map-title', t('map'));
    set('#map .map-close', t('back'));
    set('#dead .dead-title', t('dead'));
    set('#dead .dead-text', t('deadText'));
    set('#ending .ending-menu', t('endingAgain'));
    set('#ending .ending-credits', t('credits'));
    this.updateSoundLabel();
    document
      .querySelectorAll<HTMLButtonElement>('.langs button')
      .forEach((b) => b.classList.toggle('active', b.dataset.lang === getLang()));
    if (this.sim) {
      this.buildRealityButtons();
      this.hudKey = '';
      this.updateHud();
    }
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

  private toast(text: string, time = 2.2): void {
    const el = $('#toast');
    el.textContent = text;
    el.classList.add('show');
    this.toastTimer = time;
  }

  private layout(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const touch = document.body.classList.contains('touch');
    if (!touch) this.renderer.insets = { top: 64, bottom: 64, left: 12, right: 12 };
    else if (w > h) this.renderer.insets = { top: 58, bottom: 54, left: 8, right: 8 };
    else this.renderer.insets = { top: 120, bottom: 230, left: 6, right: 6 };
    this.renderer.layout();
  }

  // ---------- obrazovky ----------

  private showTitle(): void {
    this.sim = null;
    this.renderer.setSim(null);
    this.setAccent(0);
    $('#hud').hidden = true;
    this.closeDialog();
    this.showScreen('title');
    $('#title .continue').hidden = !this.save.started;
    this.titleArt.start();
    this.app.canvas.style.visibility = 'hidden';
  }

  private newGame(): void {
    const { lang, muted, endings } = this.save;
    this.save = { ...emptySave(lang), muted, endings, started: true };
    writeSave(this.store, this.save);
    this.startGame();
  }

  private startGame(): void {
    this.titleArt.stop();
    this.app.canvas.style.visibility = 'visible';
    this.save.started = true;
    // Uložený stav je zároveň postupom simulácie (mení sa priamo).
    const sim = new Sim(ROOMS, this.save, Date.now() & 0xffff);
    this.sim = sim;
    this.zone = '';
    this.showScreen(null);
    this.state = 'play';
    $('#hud').hidden = false;
    this.renderer.setSim(sim);
    this.layout();
    this.controls.clear();
    this.audio.setReality(sim.p.r, true);
    this.setAccent(sim.p.r);
    this.buildRealityButtons();
    this.hudKey = '';
    this.onEvents(sim.step(0, NO_INPUT));
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

  // ---------- mapa a rýchly presun ----------

  private showMap(): void {
    const sim = this.sim;
    if (!sim) return;
    const grid = $('#map .map-grid');
    grid.innerHTML = '';
    const canTravel = TERMINALS.has(sim.room.def.id) && !sim.enemies.some((e) => e.boss);
    const w = Math.max(...ROOMS.map((r) => r.mx)) + 1;
    const h = Math.max(...ROOMS.map((r) => r.my)) + 1;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const def = ROOMS.find((r) => r.mx === x && r.my === y);
        const b = document.createElement('button');
        b.className = 'cell';
        b.disabled = true;
        if (def && this.save.visited.includes(def.id)) {
          const zi = ZONES.indexOf(def.zone);
          b.classList.add('seen');
          b.style.setProperty('--c', zi === 4 ? '#ffffff' : PALETTES[zi]!.css);
          b.textContent = t(`room_${def.id}`);
          if (def.id === sim.room.def.id) b.classList.add('here');
          if (canTravel && TERMINALS.has(def.id) && def.id !== sim.room.def.id) {
            b.classList.add('travel');
            b.disabled = false;
            b.addEventListener('click', () => this.travel(def.id));
          }
        } else if (!def) b.style.visibility = 'hidden';
        grid.appendChild(b);
      }
    $('#map .map-hint').textContent = canTravel ? t('mapTravel') : t('mapHint');
    this.showScreen('map');
  }

  /** Rýchly presun k terminálu inej miestnosti. */
  private travel(id: string): void {
    const sim = this.sim;
    if (!sim) return;
    const def = ROOMS.find((r) => r.id === id)!;
    let tx = 10.5;
    let ty = 6.5;
    def.layers[0]!.forEach((row, y) => {
      const x = row.indexOf('T');
      if (x >= 0) {
        tx = x + 0.5;
        ty = y + 0.5;
      }
    });
    sim.load(id, tx, ty + 1, 0);
    // Voľné miesto vedľa terminálu.
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
      [-1, 0],
      [0, -1],
    ] as const)
      if (sim.boxFree(0, tx + dx, ty + dy, 0.3)) {
        sim.p.x = tx + dx;
        sim.p.y = ty + dy;
        break;
      }
    this.resume();
    this.audio.setReality(0);
    this.setAccent(0);
    this.onEvents(sim.step(0, NO_INPUT));
  }

  // ---------- HUD ----------

  private buildRealityButtons(): void {
    const sim = this.sim;
    if (!sim) return;
    const box = $('#hud .realities');
    box.innerHTML = '';
    for (const r of sim.prog.unlocked) {
      const b = document.createElement('button');
      b.dataset.r = String(r);
      b.style.setProperty('--c', PALETTES[r]!.css);
      b.innerHTML = `<span class="key">${r + 1}</span>${realityName(r)}`;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.audio.unlock();
        this.pendingShift = r;
      });
      box.appendChild(b);
    }
    box.style.visibility = box.children.length > 1 ? 'visible' : 'hidden';
    $('#hud .t-peek').style.visibility = box.children.length > 1 ? 'visible' : 'hidden';
  }

  private updateHud(): void {
    const sim = this.sim;
    if (!sim) return;
    const p = sim.p;
    const prog = sim.prog;
    const boss = sim.enemies.find((e) => e.boss);
    const key = [
      sim.room.def.id,
      p.hp,
      prog.maxHp,
      p.r,
      prog.items.join(),
      prog.logs.length,
      prog.echoes.length,
      boss ? `${Math.ceil((boss.hp / boss.max) * 100)}:${boss.r}:${boss.warn}` : '',
      getLang(),
    ].join('|');
    if (key === this.hudKey) return;
    this.hudKey = key;
    const def = sim.room.def;
    $('#hud .zone').textContent = t(`zone_${def.zone}`);
    $('#hud .room-name').textContent = t(`room_${def.id}`);
    const hp = $('#hud .hp');
    hp.innerHTML = '';
    for (let i = 0; i < prog.maxHp; i++) {
      const cell = document.createElement('i');
      if (i < p.hp) cell.className = 'full';
      hp.appendChild(cell);
    }
    const inv: string[] = [];
    if (prog.items.includes('card')) inv.push('▭');
    if (prog.items.includes('cutter')) inv.push('⟋');
    if (prog.items.includes('lens')) inv.push('◇');
    $('#hud .inv').textContent = inv.join(' ');
    $('#hud .t-lens').hidden = !prog.items.includes('lens');
    $('#hud .logs').textContent = `❏ ${prog.logs.length}/${TOTAL_LOGS}`;
    $('#hud .echoes').textContent = `◈ ${prog.echoes.length}/${TOTAL_ECHOES}`;
    document.querySelectorAll<HTMLButtonElement>('#hud .realities button').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.r) === p.r);
    });
    const bossBox = $('#hud .boss');
    bossBox.hidden = !boss;
    if (boss) {
      $('.boss-name', bossBox).textContent = t(`boss_${boss.kind}`);
      const r = boss.kind === 'heart' ? boss.warn : boss.r;
      bossBox.style.setProperty('--boss', PALETTES[r]?.css ?? '#ffffff');
      $('.boss-bar i', bossBox).style.width = `${(boss.hp / boss.max) * 100}%`;
    }
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
    $('#dialog .who').textContent = entry.who;
    $('#dialog').style.setProperty(
      '--accent',
      entry.who.includes('·') ? this.echoColor(entry.who) : PALETTES[this.sim?.p.r ?? 0]!.css,
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
    this.controls.clear();
  }

  private closeDialog(): void {
    this.dialog = null;
    $('#dialog').hidden = true;
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
    const sim = this.sim;
    this.renderer.stick = this.state === 'play' ? this.controls.stickView : null;
    for (let c = this.controls.next(); c; c = this.controls.next()) this.command(c);
    if (this.state === 'dead') {
      this.deadTimer -= dt;
      if (this.deadTimer <= 0 && sim) {
        sim.respawn();
        this.afterRespawn();
        this.resume();
      }
    }
    if (this.state === 'play' && sim && !this.dialog) {
      this.renderer.peekTarget = this.controls.peek ? 1 : 0;
      const input = this.controls.read(dt, this.renderer.toScreen(sim.p.x, sim.p.y));
      if (this.pendingShift !== null) {
        input.shift = this.pendingShift;
        this.pendingShift = null;
      }
      this.onEvents(sim.step(dt, input));
    } else {
      this.renderer.peekTarget = 0;
      // Mimo hry sa jednorazové stlačenia zahodia.
      this.controls.read(dt, { x: 0, y: 0 });
      this.pendingShift = null;
    }
    this.renderer.frame(dt);
  }

  private command(c: Command): void {
    const sim = this.sim;
    if (this.dialog) {
      if (c.t === 'confirm') this.advanceDialog();
      else if (c.t === 'pause') this.pause();
      return;
    }
    if (c.t === 'pause') {
      if (this.state === 'play') this.pause();
      else if (this.state === 'paused' || this.state === 'map') this.resume();
      return;
    }
    if (c.t === 'map') {
      if (this.state === 'play') this.showMap();
      else if (this.state === 'map') this.resume();
      return;
    }
    if (this.state !== 'play' || !sim) return;
    if (c.t === 'shift') this.pendingShift = c.r;
    else if (c.t === 'cycle') {
      const list = sim.prog.unlocked;
      if (list.length < 2) return;
      const i = list.indexOf(sim.p.r);
      this.pendingShift = list[(i + c.d + list.length) % list.length]!;
    }
  }

  private afterRespawn(): void {
    const sim = this.sim;
    if (!sim) return;
    this.renderer.setSim(sim);
    this.audio.setReality(sim.p.r, true);
    this.setAccent(sim.p.r);
    this.buildRealityButtons();
    this.hudKey = '';
    this.onEvents(sim.step(0, NO_INPUT));
    writeSave(this.store, this.save);
  }

  private onEvents(ev: Ev[]): void {
    const sim = this.sim;
    if (!sim) return;
    this.renderer.events(ev);
    this.audio.play(ev);
    const dialogs: StoryEntry[] = [];
    let save = false;
    for (const e of ev) {
      switch (e.t) {
        case 'shift':
          this.setAccent(e.r);
          break;
        case 'shiftBlocked':
          if (e.why === 'same' || e.why === 'cooldown') break;
          this.denyReality(e.r);
          this.toast(
            e.why === 'locked' ? t('blockedLocked') : t('blockedSolid', { r: realityName(e.r) }),
          );
          break;
        case 'needItem':
          this.toast(e.item === 'card' ? t('needCard') : t('needCutter'));
          break;
        case 'pickup': {
          this.toast(t(`got_${e.item}`), 3);
          const entry = story(`item-${e.item}`);
          if (entry) dialogs.push(entry);
          save = true;
          break;
        }
        case 'health':
          this.toast(t('gotHealth'));
          save = true;
          break;
        case 'unlock': {
          this.toast(t('tunedReality', { r: realityName(e.r) }));
          this.buildRealityButtons();
          const entry = story(`unlock-${e.r}`);
          if (entry) dialogs.push(entry);
          save = true;
          break;
        }
        case 'read':
        case 'msg': {
          const entry = story(e.id);
          if (entry) dialogs.push(entry);
          save = true;
          break;
        }
        case 'save':
          this.toast(t('saved'));
          save = true;
          break;
        case 'switch':
        case 'open':
        case 'cut':
          save = true;
          break;
        case 'room': {
          const zone = sim.room.def.zone;
          if (zone !== this.zone) {
            const fresh = this.zone === '';
            this.zone = zone;
            if (!fresh || e.first) this.zoneCard(zone);
          }
          save = true;
          break;
        }
        case 'bossDown': {
          const entry = story(`${e.kind}-down`);
          if (entry) dialogs.push(entry);
          save = true;
          break;
        }
        case 'death':
          this.state = 'dead';
          this.deadTimer = 2.2;
          setTimeout(() => this.state === 'dead' && this.showScreen('dead'), 500);
          break;
        case 'core':
          this.showChoice();
          break;
        default:
          break;
      }
    }
    if (save) writeSave(this.store, this.save);
    if (dialogs.length) this.openDialog(dialogs);
    this.updateHud();
  }

  private zoneCard(zone: string): void {
    const card = $('#zone-card');
    const zi = ZONES.indexOf(zone);
    $('.zc-zone', card).textContent = t(`zone_${zone}`);
    $('.zc-no', card).textContent = `${zi + 1} / ${ZONES.length}`;
    card.style.setProperty('--accent', zi === 4 ? '#ffffff' : PALETTES[zi]!.css);
    card.classList.add('show');
    setTimeout(() => card.classList.remove('show'), 1900);
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
      m: Math.floor(this.save.time / 60),
      d: this.save.deaths,
    });
    this.setAccent(c === 2 ? 0 : c === 1 ? 2 : 3);
    $('#hud').hidden = true;
    this.sim = null;
    this.renderer.setSim(null);
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
