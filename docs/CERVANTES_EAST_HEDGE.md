# Cervantes east plumbago kerb (#43)

IMG_2356 shows a low white kerb beneath tall clipped plumbago with pale blue
flowers on the north side of the tiled lane. IMG_2360 supplies roof-level lane
and registry-frontage context; it does not establish the kerb's end points.

`data/cervantes_east_hedge.json` records one short 8 m kerb immediately east of
Elena. The checked Cervantes axis and registry/aerial context anchor its location.
The 4.5 m camera uncertainty is preserved; its GPS pin is not used as a wall
coordinate. Exact alignment, ends, 0.38 m height, thickness and hedge dimensions
are estimates. No continuation along the remaining eastern frontage is asserted.

The existing Cervantes wall renderer, collision rings and blueprint all consume
the same additional wall record. Layout shows the white kerb; Details adds a
bounded green hedge with pale blue flowers. Its complete visible radius passes
the scene's shared route-clearance guard. Generated frontage clutter is suppressed
only near the short reviewed segment. Buildings, terrain and street data are unchanged.

Validation: `check_cervantes_east_hedge.py` verifies evidence, bounded length,
registry footprints, wall clearance and hedge radius against every street.
The layout browser regression additionally checks the map wall and its collision.

At implementation handoff, all source checks, photo assignment tests, reference
checks, TypeScript and production build passed. Browser/render verification is queued
under `/tmp/villacana-browser.lock`; task remains in-progress pending those results.
The script is `layout-checks.local/issue-43/verify.sh`; each of before, after,
layout and overview writes a `.log` and `.exit` file there. Baseline source is
archived at claim commit 4c9361c into that directory's `before-source`, so a queued
render cannot accidentally use the edited model. Before image will be
`before-source/layout-checks.local/views/IMG_2356.png`; after image will be
`layout-checks.local/views/IMG_2356.png` in the task worktree. Check the screenshots
and all four exit codes before setting the queue task done and rebuilding references.
