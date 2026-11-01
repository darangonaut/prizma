# Prizma

**One move. Four mirrors.** A neon action game where you control four copies of yourself at once, each in a different reality, each moving as a different mirror image of what you do.

Research station Prizma tried to split reality like light through a prism, and it worked too well. Maintenance technician T-7 was split along with it. Collect the prism shards in every reality and become whole again.

**▶ Play online: https://darangonaut.github.io/prizma/**

![Prizma title screen](docs/screenshots/title.png)

## How it plays

The screen shows up to four windows, one per reality. A single input moves every copy at the same time, but each reality mirrors it in its own way:

| Key | Reality   | Your → becomes | Your ↑ becomes | What lives there                     |
| --- | --------- | -------------- | -------------- | ------------------------------------ |
| 1   | **Prima** | →              | ↑              | saws and security lasers             |
| 2   | **Abyss** | ←              | ↑              | the drowned, who follow your copy    |
| 3   | **Amber** | ↓              | ←              | spore pods that shoot                |
| 4   | **Null**  | ↑              | →              | floor that flickers out of existence |

Take every shard in every window to clear the level. If one copy dies, they all do, and the level restarts at once.

- **Walls desync your copies.** A copy pressed against a wall stays put while the others keep moving.
- **Anchor** one copy (keys 1–4, or tap its window) and it stands still while the rest move. Only one at a time.
- **Dash** (Space, or » on a phone) makes you untouchable for a moment: jump a row of spikes or slip through a live laser.
- The clock starts with your first move, so take a look at the windows first. Every level has a star time.

Twenty levels in five chapters. Each chapter adds one reality: Prima alone, then Abyss, Amber and Null, and at the end the **Heart of the Prism**, which exists in all four windows and fires rings of light while the shards come in three waves.

<table>
<tr>
<td><img src="docs/screenshots/abyss.png" alt="Prima and Abyss"><br><sub>Prima and Abyss: left and right are swapped, and the drowned are coming</sub></td>
<td><img src="docs/screenshots/amber.png" alt="Three realities"><br><sub>Amber mirrors across the diagonal; lasers in Prima, turrets in Amber</sub></td>
</tr>
<tr>
<td><img src="docs/screenshots/null.png" alt="Four realities"><br><sub>All four realities, with Null's flickering floor</sub></td>
<td><img src="docs/screenshots/heart.png" alt="Heart of the Prism"><br><sub>The Heart of the Prism</sub></td>
</tr>
</table>

## Controls

| Action          | Keyboard       | Gamepad    | Touch          |
| --------------- | -------------- | ---------- | -------------- |
| Move (all four) | WASD / arrows  | left stick | drag anywhere  |
| Dash            | Space or Shift | A          | »              |
| Anchor a copy   | 1 2 3 4, Q / E | LB / RB    | tap the window |
| Restart, pause  | R, Esc         | Y, Start   | ↻, ❚❚          |

English (default), Slovak and Czech. Progress and best times are saved in the browser.

<p align="center"><img src="docs/screenshots/mobile.png" alt="Prizma on a phone" width="640"></p>

## Development

TypeScript, Vite and PixiJS 8. All graphics are vector shapes drawn in code, finished by a full-screen shader (`src/render/post.ts`) that adds the glow, the chromatic aberration and the scanlines. Music and sounds are synthesized with the Web Audio API. There are no image or audio files.

```bash
npm install
npm run dev          # local server
npm test             # tests, including a solver that proves every level can be cleared
npm run deploy:pages # build and publish to GitHub Pages
```

- `src/game/` holds pure, deterministic game logic with no PixiJS or DOM: the simulation (`sim.ts`), the mirrors (`types.ts`) and the levels (`levels.ts`). Each window is an 11 × 11 ASCII map; the legend is at the top of `levels.ts`.
- `tests/solve.ts` solves every level on the grid: all copies step at once, each mirrored, with anchors and dashes, avoiding spikes. The tests check that every level can be cleared, that nothing can kill you before you move, and that each chapter adds exactly one reality.
- `tests/sim.test.ts` covers the mirrors, walls, anchors, every hazard, shard waves and saving.
- `src/render/` holds the renderer and the shader, `src/audio/` the synth, `src/input/` keyboard, touch and gamepad, and `src/ui/` the texts in three languages and the title animation.
