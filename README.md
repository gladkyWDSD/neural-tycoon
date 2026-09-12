# Neural Tycoon

A management/strategy game where you run an AI company starting in 2022.
Build models, hire talent, manage GPUs and datacenters, fight competitors,
and become the world's most-used AI.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Controls

- All four locations render as 3D scenes; drag to orbit, scroll or pinch to zoom.
- Use the location tabs or click campus buildings to enter a room.
- Click or right-click a person to manage them. Reset view restores the camera.

- Press `` ` `` (backtick) to open the dev console (cheats: `/help`)
- Game auto-saves to your browser

## Game Design

See [GDD.md](GDD.md) for the full game design document.

## Browser checks

```bash
npx playwright install chromium
npm run test:3d
```

To use a system Chromium, set `CHROMIUM_PATH=/usr/bin/chromium`.
The browser tests cover all rooms, orbit controls, staff and building selection,
a developed company on mobile, save compatibility, and the no-WebGL fallback.

## Website deployment

The live game is https://gladkywdsd.github.io/neural-tycoon/.
GitHub Pages serves the root of the `gh-pages` branch. Pushing source to `master`
does **not** deploy it: run `npm run build`, copy the contents of `dist/` into a
separate checkout of `gh-pages`, commit and push that branch. Preserve existing
hashed assets so already-open game tabs can finish loading their code. Verify
Pages reports the deployment as built and the live HTML references the new bundle.
The relative Vite base must stay `./` so lazy-loaded 3D assets work under the repo path.
