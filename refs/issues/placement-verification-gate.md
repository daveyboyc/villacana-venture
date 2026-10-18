# Gate graph placement verification on fresh measured evidence and independent review

Task `placement-verification-gate` · area **The whole resort** · priority P1 · tooling

## Read first

- `AGENTS.md`, `docs/HANDOVER.md`
- `refs/areas/whole-resort.md` and the contact sheet `villacana-reference/contact-sheets/whole-resort.jpg`
- docs: `docs/OVERVIEW.md`, `docs/LAYOUT_ACCURACY.md`, `docs/TERRAIN.md`, `docs/SPEC.md`, `docs/LEVELS.md`
- data: `data/terrain.json`, `data/levels_survey.json`
- src: `src/world.ts`, `src/terrain.ts`

## Photos to build from


## Build

Separate placement verification from photo diagnostics and software checks. Require feature-specific evidence packets, independent validation controls and reviews, current source/model/artifact digests and explicit discrepancy resolution. Show the Barraka planter report as disputed. Gate new geometry completion and PR geometry changes; expose blockers in graph, briefs, map agent references and CLI.

## Do not

Do not invent a planter correction, fabricate photographic matches or erase previous manual reviews. A citation, task done flag, unrelated photo check or software PASS must not verify a placement.

## Done when

- [ ] Positive and negative policy tests including partial checks, stale evidence, wrong-feature citations, review identity and open discrepancy blockers
- [ ] Barraka planter is disputed and reports a concrete follow-up
- [ ] Reference generation, handover source/build/browser checks and PR gate pass
- [ ] Standard checks in `docs/HANDOVER.md` pass (source checks, build, both browser tests)
- [ ] New features cite their photos in `evidence`; area notes updated; `build_references.py --check` passes
- [ ] `data/build_queue.json`: `placement-verification-gate` set to done
- [ ] Before/after renders from each photo's camera (`scripts/shoot_views.cjs <photos> --task=<id> --as=before|after`), each compared with its photo and recorded in `data/photo_checks.json` (matches, or differs with an open follow-up task); `--check` fails without them

Depends on: `unified-reference-map`
