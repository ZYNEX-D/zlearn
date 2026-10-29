# Chemia — Interactive Chemistry Lab

A working first release of an original browser-based chemistry platform. Inspired by NOBOOK's public experiment catalog and the immersive 3D lesson interaction of Learn Arduino. It is **not a full NOBOOK feature-parity implementation**.

## Run locally

Requires Python 3 for the local server, and Node.js for model tests.

```sh
npm start
# Open http://localhost:4173
npm test
```

No dependency installation or build step is needed. Three.js 0.170.0 is vendored in `dist/vendor/`. Google Fonts is optional; system fonts are used if it is unavailable.

## Implemented

- Six interactive experiments: acid–base titration, carbonate/acid gas production, water electrolysis, silver chloride precipitation, heating water, dye diffusion.
- Original procedural 3D apparatus, lighting, shadows, orbit/zoom controls, click-to-inspect labels, animated liquid colors, droplets, bubbles, precipitate, and particles.
- Parameter controls, run/pause/resume/reset, calculated readouts and a result curve.
- Scientific explanations, model assumptions, and one knowledge check per experiment.
- Searchable/filterable experiment library and apparatus reference.
- Free-lab mode switches among supported models and adds/removes up to four decorative vessels. Extra vessels do not participate in chemical reactions.
- Browser-local notebook and progress, snapshot recording, observations, entry removal with brief undo, Markdown export.
- Responsive layout, keyboard-accessible controls and dialogs, reduced-motion handling, WebGL fallback message.

## Files

- `dist/model.js`: experiment content and pure scientific calculations.
- `dist/scene.js`: Three.js geometry, visual states, picking, and camera.
- `dist/app.js`: application state, controls, lessons, notebook, and routing.
- `dist/style.css`: responsive visual system.
- `tests/model.test.js`: scientific invariants and parameter-boundary checks.
- `FEATURE_SCOPE.md`: research findings, implemented scope, and remaining work.

## Scientific limits

These are educational models, not a general chemical solver. Titration assumes strong monoprotic acid/base at 25 °C with immediate mixing. Gas collection assumes ideal gas behavior at 25 °C and 1 atm. Electrolysis assumes 100% current efficiency and an inert supporting electrolyte. Precipitation neglects the small equilibrium dissolved fraction. Heating neglects heat loss and vessel heat capacity. Diffusion is qualitative, with an illustrative temperature dependence. Apparatus scales, particle sizes, and animation timing are illustrative.

## Data and deployment

All user data stays in localStorage on the browser and origin used. It is not synchronized between localhost and deployment or between devices. No account/authentication database or classroom backend is implemented. The Sites hosting manifest is in `.openai/hosting.json`; the site is initially private.
