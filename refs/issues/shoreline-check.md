# Beach: shoreline outline vs IMG_2285 (pin falls in the sea)

Task `shoreline-check` · area **Barraka and the beach** · priority P2 · layout

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/barraka-beach.md` and the contact sheet `villacana-reference/contact-sheets/barraka-beach.jpg`
- docs: `docs/SEAFRONT.md`
- src: `src/seafront.ts`, `src/seaside.ts`

## Photos to build from

- `public/photos-ref/IMG_2285.jpg`: Beach: resort and restaurant frontage (ground — pin ±2.9 m)
- `public/photos-ref/IMG_2298.jpg`: Beach: white seaward houses and palm (ground — pin ±2.5 m)
- `public/photos-ref/IMG_2299.jpg`: Beach: houses along the shore (ground — pin ±3.2 m)
- `public/photos-ref/IMG_2300.jpg`: Beach: pebbles, sand and distant coastline (ground — pin ±3.6 m)

## Build

Check the sea/beach outline against the beach photos and the aerial; IMG_2285 was taken on the beach but its pin is in the map sea polygon. Correct the outline only with independent map evidence.

## Do not

Do not move the outline to fit one GPS pin.

## Done when

- [ ] check_seafront.py passes
- [ ] note added to docs/SEAFRONT.md
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `shoreline-check` set to done
- [ ] Before/after renders from the photos' cameras attached to the PR (`scripts/shoot_views.cjs`)
