# Reference review and feature scope

Reviewed on 2026-10-29.

## Verified reference behavior

**NOBOOK chemistry:** https://chemistry-en.nobook.com/

The public UI redirects to `/console/templates/resource`. It displays a premium experiment catalog with 138 items, thumbnails of apparatus assemblies, search, an experiment filter, a new-experiment action, My experiments, language selection, and login. Opening the first experiment displays a login dialog. The experiment editor and logged-in workflows could not be inspected. No authentication was bypassed and no proprietary source/models were reused.

**Learn Arduino:** https://learn-arduino-red.vercel.app/#rgb

The RGB lesson exposes a real-time 3D scene, camera controls, clickable apparatus/component labels, information tabs, editable values, run/stop interaction, progress, and a lesson carousel. Chemia implements its own equivalent interaction pattern with original chemistry models and a distinct visual design.

## Delivered version: 0.2

| Area | Status |
| --- | --- |
| Interactive 3D laboratory | Implemented, original procedural apparatus |
| Guided experiments | 16 working models: 10 physics + 6 chemistry |
| Adjustable variables and reaction animation | Implemented for all 16 |
| Science explanations and quizzes | Implemented for all 16 |
| Search/topic filtering | Implemented |
| Apparatus information | Implemented |
| Notebook/progress/export | Local persistence, restorable setups, Markdown/CSV/SVG/PNG exports |
| Time controls | Scrubbing, step, speed, repeat |
| Analysis | Time plots, parameter sweeps, baseline comparison, data tables |
| Physics presets | 30 presets across ten experiments |
| Free lab | Limited to supported reaction models and decorative extra vessels |
| Full 138-item NOBOOK catalog | Not implemented |
| General drag-and-connect experiment editor | Not implemented |
| Arbitrary chemical transfer, mixing and reaction rules | Not implemented |
| Saved experiment assemblies/import/export | Not implemented |
| Accounts/cloud sync | Not implemented |
| Teacher/student roles and classroom workflows | Not implemented; reference behavior not verified |
| Multilingual content | English only |
| Full physical realism/validated reaction kinetics | Not implemented |

## Path to broader parity

1. **Complete reference audit:** use an authorized NOBOOK session or a user-provided feature inventory. Document every accessible experiment, apparatus, gesture, editor action, save/export format, and account workflow. Separate observed capabilities from proposed additions.
2. **General lab engine:** introduce entities for vessels, contents, concentrations, quantities, temperature, connectors, and tools. Add collision-aware placement, snapping, pouring, volume conservation, undo/redo, and JSON scene persistence. Current `simulate()` functions can become tested reaction handlers.
3. **Chemistry rules:** create a reviewed reagent database, reaction registry, stoichiometry solver, limiting-reagent handling, acid/base equilibria, heating/cooling, gas collection, precipitation, indicators, and suitable hazard metadata.
4. **Content expansion:** implement each audited experiment with verified apparatus, observations, equations, narration/steps, assessment, and accessible alternatives. Validate each through scientific invariants and educator review.
5. **Accounts and teaching:** add authentication, a database for saved experiments and lab reports, user roles, assignments, classroom sharing and results. Establish ownership and authorization boundaries before exposing collaboration.
6. **Production verification:** mobile/touch camera QA, multiple GPU/browser tests, keyboard/screen-reader review, performance budgets, regression screenshots, data-backup testing, and model accuracy review.

## Validation completed

The original eight chemistry assertions cover titration equivalence, concentration changes, limiting acid, electrolysis ratios, precipitation mass, heating/boiling, diffusion temperature trend, and finite outputs at control boundaries. Browser smoke checks cover initial scene, simulation progression, notebook recording, quizzes, and library search. See chat handoff for any additional final checks or limitations.


## Physics expansion

Implemented ten physics models with original 3D apparatus, controls, reference-linked explanations, and challenges: pendulum, spring, projectile, inclined plane, collisions, DC circuit, refraction, converging lens, traveling wave, and buoyancy. Thirteen additional automated checks validate core physical laws, boundary behavior, sampling, plotting, and CSV exports.

The platform remains a curated simulation laboratory. It is not a general rigid-body engine, arbitrary circuit builder, arbitrary reagent solver, or full NOBOOK replacement. Accounts, cloud saves, classroom roles, and multilingual content are still not implemented.
