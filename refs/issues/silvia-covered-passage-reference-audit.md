# Resolve the Silvia tunnel entrance, its components and connection to the lane

Task `silvia-covered-passage-reference-audit` · area **Patricia, Silvia, Jorge, Teodoro Rojo and Guillermo** · priority P1 · audit

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/seaward-lanes.md` and the contact sheet `villacana-reference/contact-sheets/seaward-lanes.jpg`
- docs: `docs/STREET_LAYOUT.md`, `docs/REFERENCE_PACK_WORKFLOW.md`
- data: `data/street_layout.json`, `data/seaward_paving.json`, `data/reference_packs/entrance.json`, `data/silvia_map.json`
- src: `src/seaward-paving.ts`, `src/silvia-map.ts`, `src/silvia-tunnel.ts`

## Photos to build from


## Build

Inspect T01–T14 and the separate Jorge comparison in the entrance pack. Confirm the owner-reported tunnel identity, register the entrance/exit against identifiable ground/registry landmarks, and assess each structural component against the actual model. Publish a bounded plan/elevation and unresolved dimensions before a separate geometry build.

## Do not

Do not transfer the Jorge radial fanlight gate or its passage length into Silvia, infer a barrel vault from an arch, propagate four-column street paving into patterned tunnel floors, or treat a material citation as a structural passage.

## Done when

- [ ] Owner-reported tunnel is identified or remains explicitly unresolved
- [ ] Every passage opening, ceiling/wall/threshold and onward connection has source/model evidence or a clear blocker
- [ ] Follow-up geometry has declared feature IDs and the existing independent measured-placement requirements
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `silvia-covered-passage-reference-audit` set to done
- [ ] Geometry work declares changed feature IDs in `features`; each has a fresh measured placement packet with independent approval; discrepancies resolved in `data/placement_reviews.json`
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `entrance-photo-reference-pack`
