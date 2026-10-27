# Cervantes inventory validation · 2026-10-26

Scope: authored evidence, schematics, inspector projection and comparison viewer.
No runtime geometry/collision/terrain or registry footprint is changed.

- All 76 Python tests pass (`unittest discover -s scripts -p 'test_*.py'`).
- Reference generation/check: 176 sources, zero problems. Reference-pack outputs
  current. Contact sheets regenerated in an isolated private worktree at
  `2611124`; no resulting private changes, so no private commit is needed.
- All 14 HANDOVER source/layout/terrain/levels checks pass.
- Production TypeScript/Vite build passes (existing large-bundle advisory).
- Existing path inspector regression passes. Cervantes viewer regression passes:
  actual Miguel search/deep link, unlocated portals, full public source, drawings,
  pinned game image, private image exclusion, and 390×844, 320×568, 844×390 viewports.
- Full Layout browser regression passes: 20 routes in both directions, 438
  segments, closed/open gate collision and material groups, zero page errors.
- Canonical photo-map browser regression passes all 176-source discovery,
  camera/subject separation, full-photo, links, private/unplaced and mobile checks.
- Six current-game captures are pinned in `capture-log.json` to immutable
  `83ca94df5f0cdab85e5972a8ac8c8cce69daced9`; all report zero page errors.
  Later main PR155 changed diagnostic camera/pose tooling, not these scene objects.

The placement change gate is red. `data/path_network.json` is currently included
among geometry inputs by the generic fingerprint policy, so inventory metadata
changes alter all 375 context digests. All 375 model digests remain unchanged;
35 pre-existing declared model features are flagged without fresh placement
packets. No approval, fingerprint exemption or task-kind workaround was added.
This audit does not resolve their placement. AGENTS.md permits merging with the
failure recorded; future geometry work retains the placement workflow.

The first Overview run timed out waiting for the zoom state while another browser
was active. A serial retry is recorded below. Browser/capture reliability remains
tracked separately in issue #143; no assertions or rendering quality were reduced.

Serial Overview retry: PASS zoom, rotation, north reset, focus notes, overlay
toggle, walk visibility and mobile toolbar. The initial concurrent timeout remains
recorded above; the successful retry does not establish general performance stability.

27 October resume: final independent-review hashes match the inventory, both
schematics, all comparisons and six captures; zero review blockers. Regenerated
projection reports Cervantes inventoryComplete/reviewCurrent true for this scoped
inventory. Rechecked Python tests, viewer and production build before merge.
