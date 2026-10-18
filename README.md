# Villacana

One resort map with **Map & photos**, **Overview** and **Walk** modes.

```bash
npm install
npm run dev
```

Open `http://localhost:4731/`. The default map shows the detailed registry layout
and photo IDs. Overview and Walk use the same current geometry across all four
pool areas and the seafront. `blueprint.html` and `photos.html` redirect here and
preserve selected-photo links. `slice.html` is the underlying 3D renderer.

## Find a reference

Search an ID (`IMG_2206`), place (`north-pool`) or subject (`boat`) in **Map & photos**.
Choose a result to read its label, open the full photo, see camera uncertainty and
reviewed subject context, or **Copy agent reference**. **Copy photo link** reopens
that specific source. Overlapping pin labels appear as you zoom; all references
remain in the searchable list. Private sources link to the private repository;
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
Private imagery stays in `daveyboyc/villacana-reference`.

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

## Controls and local edits

Drag/pinch or use +/−, rotate, North and Fit. In Walk, use WASD/arrows or touch
controls; Shift runs and Space jumps. The main navigation changes mode.

Map labels/references, draft photo labels and camera reviews persist in this
browser. **Export references**, **Send changes** and **Send checks** share the
corresponding edits; they do not publish automatically or sync between devices.
Existing browser storage keys are retained. Use `scripts/apply_map_edits.py` and
`scripts/apply_photo_reviews.py` to apply exported proposals after source review.

## Checks

```bash
python3 scripts/build_references.py --check
python3 scripts/test_photo_assignment.py
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/test_photo_map_browser.cjs
```

See the handover for the complete geometry and browser suite.

Historical photo-frame assets retain their source credits in
`public/photos/album.json`: Jay Cross's Estepona beach (CC BY 2.0) and Turista
Inglesa's Playa del Cristo image (CC BY-SA 4.0). These are legacy prototype assets,
not location evidence for the current reference map.

The historical OpenStreetMap extract is © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ODbL](https://opendatacommons.org/licenses/odbl/).
