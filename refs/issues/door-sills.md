# Door sills and footpath kerbs: the small steps everywhere

Task `door-sills` · area **The whole resort** · priority P3 · levels

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from

- `public/photos-ref/IMG_2260.jpg`: Cervantes junction: white terraces and small lawns (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2261.jpg`: Cervantes junction: another view of the same terraces (ground — pin ±3.0 m)
- `public/photos-ref/IMG_2330.jpg`: Calle Elena south from the junction, towards the middle pool (ground — pin ±3.4 m)
- `public/photos-ref/IMG_2291.jpg`: Pintor Dalí: arched entrance and white facade (ground — pin ±5.6 m)
- `public/photos-ref/IMG_2293.jpg`: Pintor Dalí: lane entrance, ramp and drain (ground — pin ±5.0 m)
- `public/photos-ref/IMG_2283.jpg`: Pintor Dalí: raised stone approach and archway (ground — pin ±2.1 m)

## Levels from the photos

From `data/levels_survey.json` (check with `scripts/check_levels.py`).

- `elena-south-sills` (raised-threshold): 0.1-0.15 m above Calle Elena south, medium confidence. Model: **missing**, task `door-sills`. Single red-tread or white sills at the house doors. Elena south is level to the middle pool gate; lawns kerbed at about 0.1 m. (IMG_2260.jpg, IMG_2261.jpg, IMG_2330.jpg, IMG_2253.jpg)
- `dali-south-approach` (slope): 0.15-0.35 m above the Dalí footpath, low confidence. Model: **missing**, task `door-sills`. Flagstone approach between flared white kerbs of 0.15-0.25 m with a grooved concrete strip at its foot, rising gently towards the arch. No flight of steps. (IMG_2283.jpg)
- `dali-footpath-kerb` (raised-threshold): 0.1-0.15 m above the parking asphalt, medium confidence. Model: **missing**, task `door-sills`. The house-side footpath stands a kerb above the asphalt; passage floors under the arches are flush with it, with a slot drain at the threshold. (IMG_2291.jpg, IMG_2293.jpg)

## Build

House doors on the lanes sit one sill (0.1-0.15 m, red tread or white) above the lane; the Dalí house-side footpath stands a kerb (0.1-0.15 m) above the parking asphalt, with passages flush to it and a slot drain at the threshold. Add sills under photographed doors and the footpath kerb as Details-level geometry that the player steps over. Also the gentle flagstone approach to the arch at the south end of Dalí (IMG_2283): 0.15-0.35 m over 5-6 m between flared white kerbs, no steps. Heights: data/levels_survey.json items elena-south-sills, dali-footpath-kerb, dali-south-approach.

## Do not

No sills on doors no photo shows; do not raise house floors (their floors stay at lane level).

## Done when

- [ ] check script for sill positions against photographed doors
- [ ] layout browser test still walks every route both ways
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `door-sills` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
