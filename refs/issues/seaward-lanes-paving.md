# Seaward lanes: octagonal paving and covered passages

Task `seaward-lanes-paving` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P3 · materials

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`
- src: `src/seaward-paving.ts`

## Photos to build from

- `public/photos-ref/IMG_2235.jpg`: Lane paved in octagonal tiles between a white wall and lawn (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2237.jpg`: Octagonal-tiled lane with lantern and hedges (ground — pin ±4.7 m)
- `public/photos-ref/IMG_2239.jpg`: Yuccas and palms beside an octagonal-tiled lane (ground — pin ±2.4 m)
- `public/photos-ref/IMG_2185.jpg`: Covered arched passage, patterned terracotta tiles, sea at the far end (ground — pin ±2.9 m)
- `public/photos-ref/IMG_2190.jpg`: Covered arched passage with potted plants, patterned tiles (ground — pin ±3.5 m)

## Build

An octagonal terracotta paving texture for the lanes that use it, and patterned-tile floors in the covered passages.

## Do not

Materials only; no geometry changes.

## Done when

- [ ] render from IMG_2235
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `seaward-lanes-paving` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
