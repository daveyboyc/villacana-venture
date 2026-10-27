# Area scorecard

One card per area of `data/areas.json`, saying what has been measured there and what has not.
The game shows the card for the area the player stands in (or, in Overview, the area at the
centre of the view); `refs/SCORECARD.md` has every area side by side. Each figure is a count or a
measurement with its unit. Nothing is scored out of 100, and a good figure on one line does not
vouch for another: ground that matches the survey says nothing about where a wall stands.

## Colour and photo spots

Each area is red, amber or green, from `data/photo_requests.json` and the build queue:

- **Red: photos needed.** The area has a photo request still waiting for photos. Each request says
  where to stand (`at`), what to point at (`look`), what to photograph (`ask`) and what it unblocks
  (`why`).
- **Amber: photos in, checking or building.** No request is waiting, but photos that answer one are
  waiting for review, or build tasks or placement discrepancies are open there.
- **Green: up to date.** Nothing open.

When a new batch is indexed (`docs/PHOTO_MAP_WORKFLOW.md`), `scripts/photo_requests.py` matches each
photo taken on or after a request's `since` date to the request whose spot it was taken from (within
its radius, plus up to 5 m of GPS accuracy) and facing its `look` point (reviewed `looksAt`, or the
compass within 60 degrees). The request then counts as received and the area turns amber. An agent
looks at the photos and sets `status: answered` with `answeredBy` and a `note`, or leaves it open and
says what is still missing; photos that matched by position but do not show the spot go in
`notAnswering`, which turns the request back to red. `scripts/build_references.py` adds each request to the evidence graph
(`photo-request:<id>`, `in-area`, `unblocks` a task, and an `answers` edge from each matching photo,
basis position or reviewed) and fails on an answered request without photos and a note.

## In the game

`slice.html` (Walk and Overview) shows a panel at the top left, edged in the area's colour:
`<area> · photos needed` (or `checking`, `up to date`). It lists the area's photo spots, numbered,
with the live distance and direction from you, and keeps the figures under **Measurements**. While
the panel is open, a numbered beacon stands at each spot with an arrow to what to photograph (no
collision; not part of the model). Click the title to open or close it; the choice is remembered in
the browser. It starts open on wide screens and collapsed on phones, changes as you walk from one
area into the next, and between areas shows the whole resort. It links to the photo spots on the
map, the area's brief (`refs/areas/<id>.md`) and the full table.

The panel is off in automated renders: with `?photocam=` and in any browser driven by Playwright
(`navigator.webdriver`), so `shoot_views.cjs` and the layout tests see the scene as before. Add
`&scorecard=1` to show it there, or `&scorecard=0` to hide it anywhere (`src/scorecard.ts`).

## On the map

Map & photos tints every area in its colour and shows each photo spot as a numbered pin (red: photos
needed, amber: photos in) with a dashed line to what to photograph; hover for the request. The
**Photo spots** layer button hides them.

## Which area a place belongs to

`scripts/area_map.py` uses the same `match` rules as the reference briefs. An area owns its
streets (out to half their mapped width), car parks and seafront shapes, and a circle round its
pools. A point goes to the nearest of those within 15 m. A pool courtyard owns the ground within
8 m of its water outright and competes by distance beyond that, so the Elena lanes past the north
pool stay Elena. A house belongs to the area most of its corners fall in; back gardens and inner
courtyards go with the nearest house within 15 m. The result is committed as a 4 m grid in
`public/scorecard.json`, which the game reads, so Python and the game agree. The houses east of
Pintor Picasso fall outside every area and count only toward the whole resort.

## What each figure means

| Figure | Source | Meaning |
| --- | --- | --- |
| Open ground within 0.25 m | model ground vs the 2020-21 1 m survey (`measure`) | Share of 2 m cells of open ground within 15 m of a house (buildings and pools left out) where the model is within 0.25 m of the surveyed ground. Cell count in brackets. |
| Worst street miss | `docs/reviews/lidar-levels/measurements.json` | Largest model-minus-survey difference along the area's mapped streets. |
| Pool decks | the same | Model deck height minus surveyed deck, per pool. |
| Roofs | the same | Houses of the area with a surveyed roof (2014-15 surface model); median of model height minus surveyed roof. Parapets and roof terraces make the survey higher. |
| Photo-read steps | the same | Level changes read from photos (`data/levels_survey.json`) and how many fall outside the photo range. |
| Footprints on surveyed roof | registry footprints vs the 2014-15 surface model (`measure`) | Share of each footprint, 1 m in from its edge, standing on surveyed roof at least 2 m above the ground. Every house with a corner in the area counts. |
| Best shift | the same | The footprint shift (metres east, south) that best correlates with the surveyed roofs, and the correlation. The survey grid is 2 m and pixel-is-point, so about 1 m is within its own uncertainty; every area shows the same 1-1.5 m southward offset as the whole resort. Below a correlation of 0.2 the shift means nothing and is not given. |
| Photos / placed | `public/reference-index.json` | Photos catalogued for the area (phone, own and web photos), and how many have a camera position. All catalogued photos are tagged after review. |
| Photo checks | `data/photo_checks.json` | Renders compared with those photos: matches, differs, not comparable. |
| Cameras solved, stations holding | `data/photo_poses.json` | Photos with a solved camera (`docs/PHOTO_ALIGNMENT.md`). A station (or a photo solved alone) holds when its position is known to within 1 m east and south (one sigma) and a held-out check measured the model through it. The north-pool station holds; the Elena roof solves do not. |
| Held-out misfit | the same | RMS misfit in metres of each solved photo's held-out checks, holding or not. |
| Kit parts traced / all | the scene in the Details view (`measure`) | Facade-kit doors, windows and balconies placed from photos (`data/facade_kit.json`) against all placed, including the generated ones. |
| How sure | `public/confidence.json` (`docs/CONFIDENCE.md`) | Features of the area that are photographed, estimated and inferred, and known gaps. A judgement for the game, not placement approval. |
| Placement verified / features | `refs/graph.json` | Model features in the area with a current `placement-verified-by` approval, of all registered there (`docs/PLACEMENT_VERIFICATION.md`). |
| Open discrepancies | the same | Unresolved placement reports on the area's features. |
| Tasks | `data/build_queue.json` | Open and in-progress queue tasks for the area. |

## Updating it

`public/scorecard.json` and `refs/SCORECARD.md` are generated. `python3 scripts/build_references.py`
rewrites them on every run (and so does `npm run build` through its prebuild), and
`scripts/test_scorecard.py` (run with `test_reference_index.py` in CI) fails when the committed
copies are stale. To rewrite them alone: `python3 scripts/build_scorecard.py`.

The survey and scene measures need the survey tiles and a browser, so they are run by hand and
committed in `docs/reviews/area-scorecard/measures.json`:

```bash
python3 scripts/lidar_check.py fetch                 # once: survey tiles to layout-checks.local/lidar
node scripts/shoot_views.cjs --model --kit           # the scene as built: model.json and kit.json
python3 scripts/build_scorecard.py measure           # writes docs/reviews/area-scorecard/measures.json
python3 scripts/build_references.py                  # rebuilds the scorecard
```

Re-run them after changing ground levels, footprints or the facade kit. The card gives the date
and commit they were measured at, and says so if the area boundaries have changed since.

`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium node scripts/test_scorecard_browser.cjs`
checks the panel in the game and rewrites the screenshots in `docs/reviews/area-scorecard/`.

## Not measured

- Plan positions of walls, patios, planters and other traced features: only a placement review
  measures those, and none is approved yet.
- Footprints of Barraka and the beach (one building) and anything built after the 2014-15 survey.
  The main-pool and Picasso footprints barely correlate with the surveyed roofs (24% and 46% on
  surveyed roof). Most of those buildings are one storey, but why they miss is not yet known: an
  open question, not a measured offset.
- Facade heights, roof shapes and planting.
- Photos that show an area from elsewhere count where they are catalogued, not where the camera
  stood.
