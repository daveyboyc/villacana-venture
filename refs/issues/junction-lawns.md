# Cervantes/Elena junction lawns: pollarded trees and kerbs from the new photos

Task `junction-lawns` · area **Calle Miguel de Cervantes** · priority P3 · planting

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/cervantes.md` and the contact sheet `villacana-reference/contact-sheets/cervantes.jpg`
- docs: `docs/DALI_CERVANTES.md`, `docs/STREET_LAYOUT.md`, `docs/FRONTAGE_DIVISIONS.md`, `docs/ELENA_NORTH.md`, `docs/LEVELS.md`, `docs/CERVANTES_DOOR_STEPS_REVIEW.md`
- data: `data/dali_cervantes.json`, `data/dali_cervantes_threshold.json`, `data/cervantes_patio_walls.json`, `data/passages.json`, `data/frontage_divisions.json`, `data/cervantes_elena_steps.json`, `data/junction_lawns.json`, `data/levels_survey.json`
- src: `src/cervantes-walls.ts`, `src/dali-threshold.ts`, `src/frontages.ts`, `src/ramp-steps.ts`, `src/junction-lawns.ts`

## Photos to build from

- `public/photos-ref/IMG_2329.jpg`: Cervantes/Elena junction: lawn with a pollarded tree and white kerb (ground — pin ±3.6 m)
- `public/photos-ref/IMG_2342.jpg`: Cervantes/Elena junction: lawn corner with pollarded tree and drain (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2358.jpg`: Roof by Elena: looking down on Elena south and the junction lawns (roof — pin ±2.0 m; looks at The junction lawns south of Cervantes)
- `public/photos-ref/IMG_2367.jpg`: Roof by Elena: looking south over the Cervantes/Elena junction (roof — pin ±3.9 m; looks at The Cervantes/Elena junction)
- `public/photos-ref/IMG_2260.jpg`: Cervantes junction: white terraces and small lawns (ground — pin ±3.0 m)

## Build

Place the pollarded trees and check the lawn outlines and white kerbs in data/frontage_divisions.json against the roof views (IMG_2358, IMG_2367).

## Do not

Change lawn rings only where a roof shot shows them clearly.

## Done when

- [ ] frontage regions still pass their checks
- [ ] render from IMG_2329
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `junction-lawns` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
