# Photo placement, evidence and validation

## Intake for a new Drive batch

Every batch goes through the same steps, so any agent can pick up any area.

1. Find new files in the Drive folder "Villacana" (newer than the last indexed
   IMG number in `public/photos-ref/manifest.json`). Download the originals to a
   private folder outside both repos.
2. `python3 scripts/index_photos.py <folder> public/photos-ref --annotations data/photo_annotations.json`
   (needs `Pillow` and `pillow-heif`). It now also records GPS altitude, which
   separates roof shots from lane shots.
   Then `python3 scripts/build_photo_map.py --thumbs` makes the photo map's
   thumbnails for the new photos (commit them with the web copies).
3. Look at every image. In `data/photo_annotations.json` give it a title,
   observation and Drive link. In `data/reference_tags.json` give it `shows`
   (every area visible, not where the camera stood), `viewpoint` (ground,
   upper-floor, roof, aerial, map) and `useFor` (layout, levels, facades,
   materials, planting, signage, view). For roof shots and any photo you will
   build from, also set `looksAt` ([x, z] of the main subject) and `subject`.
   Phone altitude is a check on `viewpoint`: ground shots read 9 m or less,
   roof and upper-floor shots more (`build_references.py --check` flags a
   mismatch). If a pin is clearly wrong or vague (worse than about ±8 m) and
   the picture fixes the spot (a sign, a step, the same scene as a good pin),
   correct it in `data/photo_positions.json` with `trust: "checked against
   photo content"`, a `locationBasis` sentence and the original `gps` kept.
4. `python3 scripts/assign_photo_map.py`, then
   `python3 scripts/build_references.py --sheets --check`.
5. Commit the web copies, tags and `refs/` here, and the contact sheets in
   `villacana-reference`. Write a short dated note (`docs/PHOTOS_<date>.md`)
   only for findings that change what we know about an area; also add those
   findings to the area's `notes` in `data/areas.json`.

## What is automatic now

`index_photos.py` takes downloaded originals from a private folder, reads phone
GPS, reported horizontal accuracy, capture date and true-north camera heading,
and creates web JPEGs and map camera pins. It preserves older manifest entries,
human descriptions and corrected locations when importing another batch. Web
copies contain pixels only: embedded EXIF/XMP is stripped; originals stay private.

`assign_photo_map.py` compares the recorded camera position with mapped streets,
parking and coastal areas. Reported GPS accuracy plus 2 m map tolerance determines
which contexts are plausible. Unknown accuracy uses a 10 m review search radius,
explicitly marked as a heuristic. Multiple named streets, poor/unknown accuracy,
solid-footprint overlap, out-of-bounds positions and conflicts with observed
street/area hints are flagged. Nothing snaps the pin to a street or changes the
model. Building centroids within 45 m and 35 degrees of the camera heading are
possible viewing-context candidates, not proven visible objects; occlusion is not
computed. Legacy headings can be approximate and carry an unknown-calibration note.

The canonical app root opens **Map & photos**. Photo IDs are on by default;
zoom reveals overlapping IDs, and the list always includes every catalogue entry.
Search by ID, area or visible subject. Selecting a photo shows its full label,
image, camera uncertainty and reviewed look-at context. Dots locate cameras;
pink crosses locate reviewed subjects approximately. A dashed radius without
reported accuracy is a 10 m search heuristic. **Photo evidence** under Layers
controls this selected-photo context. Private and unplaced sources stay listed;
private pixels are never copied to the public website.

**Copy photo link** gives a stable `?view=map&photo=<ID>` URL. **Copy agent
reference** supplies the source path, published caption, local draft caption if
any, camera-versus-subject distinction, uncertainty, model citations and recorded
checks. The same records are in `public/reference-index.json`; agents can run
`python3 scripts/find_reference.py boat` or use `--area north-pool --json`.
Keep earlier manual reviews separate from absent modern check records.

## Repeat for a new downloaded batch

Install `Pillow` and `pillow-heif` in a local Python environment, then run:

```bash
python3 scripts/index_photos.py /private/downloaded-originals public/photos-ref --annotations data/photo_annotations.json
python3 scripts/assign_photo_map.py
python3 scripts/test_photo_assignment.py
npm run build
```

`npm run photos:assign` repeats the second step after a map or annotation change.
`npm run build` also regenerates the associations/graph before the TypeScript build,
so a newly built map does not retain suggestions calculated from an older layout.
The outputs are `public/photos-ref/assignments.json` and `evidence-graph.json`.
They are deterministic, include the input digest and can be regenerated. The graph
has three deliberately separate relations: `camera-nearby`, `possibly-in-view`
and `cited-as-source`. Only the last means an author explicitly cited a photo for
an existing modeled feature; it does not establish that the feature is accurate.

Drive download/discovery currently uses the connected Drive tools. The published
static website does not monitor Drive uploads, and a Google Maps key does not
provide authenticated Drive access. This script uses original metadata rather
than image recognition. Descriptions and observed signs are inspected and authored
separately in `data/photo_annotations.json`; missing GPS remains unplaced until a
location is supplied. No vision API or unattended Drive service has been configured.

## How the images currently inform the build

Registry footprints and checked map street axes provide the layout. Ground photos
inform white wall versus low curb distinctions, patio/lawn/path ordering, openings,
steps and ramps, facade details, planting, and texture/sprite choices. Some materials,
plant distributions, doors/balconies and frontage outlines remain stylised or
procedural. A photo identifies what is visible; GPS is the camera location, not the
surveyed coordinate or height of the thing ahead. The source-citation graph is an
audit of recorded links, not a count of every photo that influenced visual choices.

At this pass there are 106 indexed camera pins, 22 suggested contexts, 84 associations
requiring review, and 15 photos explicitly cited by 18 model features in the tracked
wall/frontage/passage/ramp datasets. Older photos often have no accuracy field, so
many review flags reflect missing metadata rather than a known layout error. These
numbers do not mean 84 photographs are incorrectly positioned, or that all 106
have been compared with the rendered model.

## Validation: evidence checks versus software checks

1. Inspect originals for visible signs, surfaces, openings and level changes. Keep
   observations distinct from inferred names/positions; compare different views.
2. Cross-check GPS, heading and uncertainty against satellite/standard map context
   and unchanged registry fronts. Flag incompatible interpretations rather than
   silently move a pin or assert a subject position.
3. Record which feature cites which photos and which assumptions remain estimated.
   Compare rendered views from similar camera positions where possible:
   `node scripts/shoot_views.cjs IMG_xxxx --details` renders the game from a
   photo's pin, facing its `looksAt` (or, with a warning, the phone heading) into
   `layout-checks.local/views/`; `--task=<id> --as=before|after` also saves it in
   `docs/reviews/<id>/`. Each comparison is recorded in `data/photo_checks.json`
   (matches, differs with an open follow-up task, or not-comparable) and becomes a
   `checked-against` edge in `refs/graph.json`. A done task must have one for every
   photo it builds from; tasks done before 18 October are the verification backlog
   in `refs/QUEUE.md`. There is still no calibrated pixel comparison or
   photogrammetry: the comparison is by eye, against measured distances read from
   the photo.
4. Geometry checks catch paths through houses/water, wall/kerb clearance and closed
   openings. Actual Player traversals catch blocked routes and collision errors.
   Type/build and browser checks catch loading, controls and label persistence.
   These establish usable software/geometry, not photographic fidelity.

### New batch: IMG_2285–IMG_2300

All 16 originals in the existing Villacana Drive folder were downloaded and visually
inspected. Their camera pins, true-north headings, reported uncertainty, descriptions
and original Drive links are indexed; the originals are unchanged. They add a clear
side-by-side ramp/steps view at Elena, a CALLE MIGUEL sign inside a passage in the
Cervantes area, more Dalí facade/path/lawn/parking views, the flagstone covered
access and coastal gate, and pebble/sand beach views.

Specific review items:

- IMG_2286 reports ±14 m GPS at the Elena/Cervantes junction. The separate steps
  beside its smooth ramp need detailed model comparison; the current ramp alone
  does not establish that the stair arrangement matches.
- IMG_2288 visibly says CALLE MIGUEL. Its relation to the mapped full Miguel de
  Cervantes name is interpretation, not text read from the complete plaque.
- IMG_2291's camera overlaps a solid registry part within GPS uncertainty. Check
  original GPS drift and facade alignment before drawing conclusions.
- IMG_2285 is visibly taken on the beach, but its GPS falls in the current map sea
  polygon. The script flags this disagreement. Shoreline/area outline alignment
  needs checking with independent map context before changing it.
- IMG_2298–IMG_2300 share one camera position with different headings. This is
  legitimate multiple-direction coverage, not three independent spatial anchors.

No street, building, wall, ramp or coastline geometry is changed in this photo pass.

## Reviews from the photo map

Photo checks live in the canonical app's selected-photo card, under **Label and
camera review**. `photos.html` redirects there. The page uses the detailed map;
there is no separate simplified photo-map renderer. `build_photo_map.py --thumbs`
still maintains public thumbnails and the legacy data export, while
`build_references.py` generates the shared reference index. Reviews retain
`villacana-photo-checks-v1` in browser storage. **Send checks** copies the same
importable review records; it does not publish a correction. Older exports from
the artifact review store remain accepted by `apply_photo_reviews.py`.

Dave checks pins on the photo map page. For each
photo he can mark the position right, move the pin (where he stood, and
optionally where it points), mark it unsure, and add a note. The page keeps
these in browser storage, using the original per-photo keys. To apply a batch:

1. Export the store (Claude: `ArtifactData` `list` of `reviews` with `out_dir`),
   or save the pasted "Send checks" text to a file.
2. `python3 scripts/apply_photo_reviews.py <export folder>`: confirmed and
   moved pins go to `data/photo_positions.json` and the manifest as
   "checked against photo content" (original GPS kept under `gps`); notes go
   into the photo's `note` in `data/reference_tags.json`. Running it twice
   changes nothing.
3. Look at each reviewed photo and improve its tag if the note says more
   (`shows`, `subject`, `looksAt`), then run `assign_photo_map.py` and
   `build_references.py`.

