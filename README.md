# Chemia — Interactive Chemistry Lab

Version 0.2 is an original browser-based physics and chemistry platform. Inspired by NOBOOK's public experiment catalog and the immersive 3D lesson interaction of Learn Arduino. It is **not a full NOBOOK feature-parity implementation**.

## Run locally

Requires Python 3 for the local server, and Node.js for model tests.

```sh
npm start
# Open http://localhost:4173
npm test
```

No dependency installation or build step is needed. Three.js 0.170.0 is vendored in `dist/vendor/`. Google Fonts is optional; system fonts are used if it is unavailable.

## Implemented

- Six chemistry experiments: acid–base titration, carbonate/acid gas production, water electrolysis, silver chloride precipitation, heating water, dye diffusion.
- Original procedural 3D apparatus, lighting, shadows, orbit/zoom controls, click-to-inspect labels, animated liquid colors, droplets, bubbles, precipitate, and particles.
- Parameter controls, run/pause/resume/reset, calculated readouts and a result curve.
- Scientific explanations, model assumptions, and one knowledge check per experiment.
- Searchable/filterable experiment library and apparatus reference.
- Free-lab mode switches among all 16 supported models and adds/removes up to four decorative vessels. Extra vessels do not participate in chemical reactions.
- Browser-local notebook and progress, snapshot recording, observations, entry removal with brief undo, Markdown export.
- Responsive layout, keyboard-accessible controls and dialogs, reduced-motion handling, WebGL fallback message.

- Ten physics experiments: simple pendulum, spring oscillator, projectile motion, incline/friction, collisions, series/parallel DC circuits, refraction/TIR, converging lens, string waves, and buoyancy.
- Subject navigation, topic/search filters, favorites, and unexplored filters.
- 30 physics presets, synchronized numeric/range controls, scrubbable timeline, frame stepping, 0.25×–2× playback, repeat, and fullscreen.
- Baseline comparisons, parameter sweeps, labeled measurement graphs, sampled-value tables, 101-row CSV exports, SVG graph export, and PNG scene capture.
- Notebook snapshots include restorable experiment parameters and simulation position. Existing chemistry notes remain compatible.

## Files

- `dist/model.js`: experiment content and pure scientific calculations.
- `dist/physics.js`: physics definitions, presets, assumptions, references, and scientific calculations.
- `dist/physics-scene.js`: original apparatus and dynamics for ten physics scenes.
- `dist/analysis.js`: shared sampling, graphing, and CSV export.
- `dist/scene.js`: Three.js geometry, visual states, picking, and camera.
- `dist/app.js`: application state, controls, lessons, notebook, and routing.
- `dist/style.css`: responsive visual system.
- `tests/model.test.js` and `tests/physics.test.js`: 21 scientific and analysis checks, including conservation laws, parameter boundaries, and export generation for every experiment.
- `FEATURE_SCOPE.md`: research findings, implemented scope, and remaining work.

## Scientific limits

These are educational models, not a general chemical solver. Titration assumes strong monoprotic acid/base at 25 °C with immediate mixing. Gas collection assumes ideal gas behavior at 25 °C and 1 atm. Electrolysis assumes 100% current efficiency and an inert supporting electrolyte. Precipitation neglects the small equilibrium dissolved fraction. Heating neglects heat loss and vessel heat capacity. Diffusion is qualitative, with an illustrative temperature dependence. Apparatus scales, particle sizes, and animation timing are illustrative.

## Data and deployment

All user data stays in localStorage on the browser and origin used. It is not synchronized between localhost and deployment or between devices. No account/authentication database or classroom backend is implemented. The Sites hosting manifest is in `.openai/hosting.json`; the site is initially private.

## Physics design and research

The physics selection prioritizes different experimental skills: oscillation timing, energy accounting, trajectory prediction, force balance, momentum transfer, circuit topology, ray tracing, waves, and fluid displacement. A shared investigation workflow provides predictions, control of variables, measurements, comparison curves, and export.

Physics lessons link to the relevant OpenStax University Physics chapters. Models are idealized: pendulum uses the small-angle approximation, collision is instantaneous and one-dimensional, the source and resistors are ideal, lenses use the paraxial thin-lens approximation, and buoyancy is a controlled quasi-static immersion. Read each Science tab before interpreting its results. Apparatus scale and timing are illustrative; projectile and lens views auto-scale.

## Verification

`npm test` passes 21 checks. Browser smoke tests exercised all 10 physics scenes at end-of-run, Earth/Moon presets and baseline comparison, parameter sweep selection, total internal reflection, note recording and setup restoration, subject/topic filters, and the original titration model. No console warnings/errors were found during the physics scene pass. Touch-device and multi-browser verification remain future work.
