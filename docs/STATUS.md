# Where things stand (1 November 2026)

Paused at Dave's request. This is the handover for whoever picks it up next. The plan
behind it is `docs/PHOTO_LOOP_PRD.md`; the rules are in `AGENTS.md`.

## Direction

- **Focus:** a detailed 3D model of Villacana that looks like the photos when inspected.
  Walking is paused (AGENTS.md, "Current focus").
- **Google imagery** may be used, traced from and published, credited "Imagery © Google"
  with the year. Keys stay private.
- **Measured approval:** agents may change geometry, including registry pool rings,
  footprints and prop positions, when the change lines up with two solved cameras (or
  one plus the aerial) within 0.3 m rms and a second agent reviews it
  (`docs/PLACEMENT_VERIFICATION.md`, "Measured approval").
- **Pilot area:** the north pool.

## Done and merged

| PR | What |
| --- | --- |
| #170 | Pools: photo-matched water, waterline tiles, jointed coping, straight steps, louvred pump boxes, slab decks, no deck/lawn halo. Focus note in AGENTS.md. |
| #171 | Google imagery rule; `north-pool-detail-pilot` task and baseline renders. |
| #172 | Pilot step 1: CC0 Poly Haven plaster, terracotta, crazy paving and barrel tiles, recoloured to the photos (`public/textures/`). |
| #173 | Pilot step 2: 3D Strelitzia, hedges, yucca and palm built in Blender (`scripts/build_plants.py`). |
| #174 | Pilot step 3: ladders, step handrails and life rings built in Blender (`scripts/build_pool_kit.py`); rounded coping; curved middle-pool steps. |
| #175 | Pilot step 4: deck band round the small pools, its width measured through IMG_2204 (north) and the aerial (middle, south). |
| #176 | Pilot step 5: 3D trees (`scripts/build_trees.py`), about 1,150 backdrop trees, and a mountain ridge traced from IMG_2204-2206. |
| #183 | Measured approval rule; the photo-to-model loop PRD and its five slices (issues #177-#182). |

Renders and notes for every pilot step: `docs/reviews/north-pool-detail-pilot/README.md`.

## In progress: slice 1, `loop-discrepancies` (#178)

On branch `claude/zealous-galileo-4auuev` as a draft PR, **not merged**. Built so far:

- `data/discrepancies.json`, documented in `docs/DISCREPANCIES.md`, with checks in
  `scripts/discrepancies.py` and `build_references.py`.
- **52 north-pool discrepancies** from IMG_2204-2206: 51 open and 1 won't-fix (the glass
  fence, by Dave's decision). By kind: 20 missing, 11 shape, 10 look, 9 position, 2 extra.
  They include the ones Dave reported: the pool's squared deck tongue and south-west
  spur, the pump box position, and the parasols, plants and trees.
- `scripts/pixel_to_map.py`, which turns a photo pixel into a map position with
  uncertainty, and its test `scripts/test_pixel_to_map.py`.
- `scripts/compare_photo.py`, which writes a render, a blend and a numbered side-by-side
  per photo, in `docs/reviews/loop-discrepancies/`.
- Graph, area brief, scorecard and map layer (`src/differences.ts`, `src/references.ts`).

Checked: `npx tsc --noEmit`, `test_pixel_to_map.py`, `build_references.py --check` (0 problems).

To finish:
1. Run the browser tests one at a time, with the Playwright preload below:
   `test_layout_browser`, `test_overview_browser`, `test_photo_map_browser`, and
   `test_scorecard_browser` if the scorecard UI changed. Also run `npm run build`,
   `test_scorecard.py`, `test_confidence.py` and `test_reference_index.py`.
2. Review the diffs to `.github/workflows/evidence.yml`, `scripts/placement_verification.py`
   and `docs/PHOTO_LOOP_PRD.md`; slice 1 changed these in passing. Then check the map
   layer by eye on `/?view=map`.
3. **One manual step for Dave.** GitHub won't let the Claude app edit workflow files, so
   slice 1's CI change was left out. In `.github/workflows/evidence.yml`, change
   `pip install Pillow==11.3.0` to `pip install Pillow==11.3.0 numpy==2.2.6`, and add
   `&& python3 scripts/test_pixel_to_map.py` to the end of the test line. Without the
   numpy install, the Evidence check fails if a checked script imports numpy.
4. Mark the PR ready, check CI, merge (it closes #178), and set the task to done.

## To do next, in order

1. **`loop-measured-approval` (#179):** the placement gate accepts measured,
   agent-reviewed records, and stops flagging unchanged features when only shared
   renderer code changes.
2. **`loop-north-pool-fixes` (#180):** close the 51 open north-pool discrepancies with
   measured fixes and a second-agent review. That includes reshaping the pool ring with
   the deck tongue and south-west spur, the pump box, parasols, bougainvillea, the
   north-west terrace tree, awnings, patio furniture and roof equipment.
3. **`loop-camera-solving` (#181):** semi-automatic camera solving; solve IMG_2207, IMG_2208
   and the other north-pool photos.
4. **`loop-photo-intake` (#182):** `scripts/photo_loop.py --area <id>`, so that Dave uploads
   photos and an agent runs the loop.

Still open from the pilot: the bougainvillea is still a card; the trees look smoother and
greener than in the photos; the mountains have no foothills or cloud; the glass fence is
not modelled, by Dave's decision; and `gap:north-pool-west-terrace-tree` is blocked by the
route-clearance guard.

## Working notes

- **Playwright:** the repo's version wants a browser that isn't installed. Run browser
  scripts with `NODE_OPTIONS="--require $PWD/layout-checks.local/pw-preload.cjs"`, using this
  gitignored preload:
  ```js
  const pw = require(require.resolve("playwright", { paths: [process.cwd()] }));
  const launch = pw.chromium.launch.bind(pw.chromium);
  pw.chromium.launch = (options = {}) => launch({ ...options, executablePath: options.executablePath || "/opt/pw-browsers/chromium" });
  ```
- **Running tests:** run browser tests one at a time; running them in parallel crashed
  the container. The overview test takes over 10 minutes under software rendering.
- **Known failures that are not ours:**
  - `test_mobile_browser.cjs` fails on main (timeout tapping `.camera-out`).
  - `check_paseo_surface.cjs` needs commit `8b5e1f8`, which a shallow clone lacks.
- **Blender:** `pip install bpy==5.2.3`. The builders are seeded and rebuild byte-identical.
- **Merging:** Dave's rule is that agents merge their own PRs. Leave one PR comment when a
  check is red for a reason outside the change.
