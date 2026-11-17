# Villacana

A 3D model of the resort, matched to the map and the reference photos, and
looked at in **Inspect**. **Walk is not the current work.** Layout is the clear
structural view. **Show details** is where the photo-backed fittings have to be
visible. Map & photos is the registry layout and the reference index.

```bash
npm install
npm run dev
```

Open `http://localhost:4731/`. **Inspect** opens the 3D resort without a character.
Use **Jump to inspect** to start at any pool, named lane, the coastal gate,
Barraka or the west paseo. **Calle Jorge · east detail** frames the photographed
fittings on that lane. [Start at the west paseo](https://daveyboyc.github.io/villacana-venture/?view=overview&area=paseo-west)
to review the recent stamped-paving section. Area links survive refresh.
**Map & photos** (`?view=map`) shows the detailed registry layout and photo IDs.
Inspect uses the current geometry across all four pool areas and the seafront.
Walk is left as it is and is not part of this work. `blueprint.html` and
`photos.html` redirect here and
preserve selected-photo links. `slice.html` is the underlying 3D renderer.

Inspect draws the Layout pieces first. With **Show details**, the detail pieces
(planting, props, shutters and porches, garden walls, the facade kit) are added over
the next frames, nearest where the camera is looking first, so the model is on
screen before they are all in. `#scene` gets `data-ready="true"` once they are all
in (`data-details` reads `loading`, then `done`), so automated checks wait for the
whole scene. Photo renders (`?photocam=`) and exports build everything before the
first frame.

Once built, static pieces that draw alike are merged into one mesh per material and
64 m square (`src/static-batch.ts`), which cuts the draw calls about sixfold. The
originals stay in the scene hidden, so names and clicks still find them. Anything
that moves or shows and hides is marked `userData.dynamic` and left as it is. Photo
renders and exports are not merged; `?batch=0` turns merging off to compare.

## Play the north pool

[Play the shotgun test](https://daveyboyc.github.io/villacana-venture/?view=fps)
(or choose **Play**). Tap **Start playing**, move with the left thumb joystick,
drag the scene to aim, and tap **FIRE**. On desktop use WASD, drag to aim, and
click or press F to fire. The original arcade shotgun has spread, recoil, a pump
cycle, sound and unlimited shells. Hit the three floating practice targets over
the north pool. **Pause** offers restart and a return to Inspect; sound can be muted.
Landscape gives more room for the touch controls. This is a target-practice prototype,
without enemies; it does not implement the complete [FPS PRD](docs/NORTH_POOL_FPS_TEST_PRD.md).

## Find a reference

Search an ID (`IMG_2206`), place (`north-pool`) or subject (`boat`) in **Map & photos**.
Choose a result to read its label, open the full photo, see camera uncertainty and
reviewed subject context, or **Copy agent reference**. **Copy photo link** reopens
that specific source. Overlapping pin labels appear as you zoom; all references
remain in the searchable list. Reference images under `reference/` link to the
repository rather than being bundled into the deployed site;
unplaced references stay searchable without invented coordinates.

For an agent working in the repository:

```bash
python3 scripts/find_reference.py boat
python3 scripts/find_reference.py --area north-pool
python3 scripts/find_reference.py IMG_2206 --json
```

Read [AGENTS.md](AGENTS.md), [docs/HANDOVER.md](docs/HANDOVER.md) and the area's
brief in [refs/README.md](refs/README.md). Inspect full images before editing.
The complete generated discovery index is `public/reference-index.json`.
Additional reference images (Apple Maps screenshots, Google screenshots, Dave's
photos, contact sheets and web references) live in `reference/` and are excluded
from the deployed GitHub Pages bundle.

## Sources and limits

Buildings and pools mainly use Spanish registry footprints. The ground aerial is
Esri imagery georeferenced by `public/map/ground.json`. Checked streets and local
features share metre coordinates across the SVG map, 3D and collision. The old
OSM prototype data remains historical input; it no longer supplies a separate
published default world. This is not a direct Google satellite reconstruction.

Photo GPS locates the camera, not the subject. Pink crosses are reviewed look-at
landmarks, with stated uncertainty, not traced footprints. Citations show which
sources informed a feature; recorded checks and earlier manual reviews must be
read separately. Software tests do not prove real-world accuracy.

See [docs/LAYOUT_ACCURACY.md](docs/LAYOUT_ACCURACY.md),
[docs/PHOTO_MAP_WORKFLOW.md](docs/PHOTO_MAP_WORKFLOW.md) and
[docs/UNIFIED_REFERENCE_MAP.md](docs/UNIFIED_REFERENCE_MAP.md).

## Path and tunnel mapping programme

The [path network PRD](docs/PATH_NETWORK_PRD.md) specifies a resort-wide inventory
of tunnels, both path edges, building ground boundaries and walls, followed by
photo-backed improvements one connected area at a time. It distinguishes mapped,
missing and unverified features; the programme is not yet complete.

## Controls and local edits

In Inspect the desktop controls follow Google Maps: drag to pan; Ctrl-, Shift-
or right-drag rotates and tilts about the point under the pointer; the mouse
wheel, a trackpad scroll or a pinch zooms towards the pointer. The arrow keys or
WASD move forward, back and sideways. **Orbit** makes a plain drag rotate instead
and **Pan** switches back. On a phone those buttons are hidden and the controls work like a
map app: the resort opens in details without place or photo labels, one finger
pans, two fingers twist to turn and slide up or down to tilt, and a pinch zooms
towards the point between your fingers. **Map** opens the reference map and **Photos** shows the photo
pins. **Whole resort**
resets the camera, and **More** contains Top down, North, photo labels and map checks.
Walk is still on the page and is left unchanged. It is not part of the current
model work.

Map labels/references, draft photo labels and camera reviews persist in this
browser. **Export references**, **Send changes** and **Send checks** share the
corresponding edits; they do not publish automatically or sync between devices.
Existing browser storage keys are retained. Use `scripts/apply_map_edits.py` and
`scripts/apply_photo_reviews.py` to apply exported proposals after source review.

## Checks

Continuous build/validation work and scoped missing photo/map requests:

```bash
python3 scripts/photo_loop.py --area north-pool
```

See [the agent loop](docs/CONTINUOUS_LOOP.md), [acceptance standard](docs/ACCEPTANCE_STANDARD.md)
and [current work/evidence flags](refs/LOOP.md). Missing evidence blocks only the
declared feature; it does not stop supported work elsewhere.

```bash
python3 scripts/build_references.py --check
python3 scripts/test_photo_assignment.py
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/test_inspection_browser.cjs
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/test_photo_map_browser.cjs
```

See the handover for the complete geometry and browser suite.

## Analytics

Production builds on GitHub Pages send lightweight PostHog usage analytics (`app: "villacana-roam"`); local dev, preview, and Playwright checks do not initialize PostHog. See [docs/ANALYTICS.md](docs/ANALYTICS.md) for the event list and configuration.

Historical photo-frame assets retain their source credits in
`public/photos/album.json`: Jay Cross's Estepona beach (CC BY 2.0) and Turista
Inglesa's Playa del Cristo image (CC BY-SA 4.0). These are legacy prototype assets,
not location evidence for the current reference map.

The historical OpenStreetMap extract is © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ODbL](https://opendatacommons.org/licenses/odbl/).
