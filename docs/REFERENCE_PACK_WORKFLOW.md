# Photo reference packs before geometry

A reference pack turns a scene into numbered observations that a person or agent
can check systematically. The [entrance pilot](../public/reference-packs/entrance/index.html)
has six source sheets, 43 components, a relationship plan, form elevations,
a feature CSV/JSON and a [map-wide rollout queue](reference-packs/rollout.md).
The [source review](reference-packs/independent-source-review.md) records the
independent inspection and remaining limits.

## What the example demonstrates

The tunnel is no longer a single vague item called “passage”. T01–T14 list its
arch, flat ceiling, side walls, exit, patterned floor/pebble inset, paired side
doors/thresholds, lantern, pots, street plaque and services. Only a patterned
floor currently has an authored source citation; that does not account for the
structure or prove an open walk-through. The connection to the gate remains
unresolved. The owner has been asked which tunnel entrance they mean.

Signs identify the Silvia 1–15 set separately from Jorge 27–35. The latter's
radial fanlight gate must not be transferred into Silvia. Similarly, four square
street-tile courses and the tunnel's clipped-corner tiles with blue/white inserts
are distinct observations. The arch opening has a flat ceiling behind it; drawing
a barrel vault would add unsupported structure.

The gate and detail-view gateway also remain separate groups because their
reverse-view identity is unresolved. Separate boxes in the plan represent separate
source groups, with no asserted connecting route. Drawings preserve form/order;
they do not supply dimensions or survey coordinates. Pixel boxes are **locators**;
only explicit polylines are source **traces**. Hidden edges stay dashed/unresolved.

## Repeat for another area

1. Choose a physical scene and its neighbouring access points. Use the canonical
   map and `find_reference.py`; open full images and inspect signs, openings,
   route connections and levels. Use the highest-resolution originals available.
   The pilot uses the available 1200 × 1600 public web copies and says so.
2. Start a candidate list, for example:

   ```bash
   python3 scripts/build_reference_packs.py --template elena > /tmp/elena-pack.json
   ```

   Templates exist for all 14 fixed areas under `public/reference-packs/templates`.
   They contain catalogue candidates, empty observations and `not-started` or
   `source-needed` status. Listing a file is not inspecting its contents.
3. Split uncertain identities into separate source groups. Confirm connections
   from visible architecture/signs and identifiable landmarks. Phone GPS locates
   a camera. An observed-connection record requires cited sources and a physical
   identity basis; stylistic similarity alone stays unresolved.
4. Create stable IDs such as `elena:W01`. Inside each pack the short `W01` appears
   on the photo, drawing and checklist. Record observation, source IDs, pixel
   locator/trace, requirements, model state, unknowns and follow-up. Inspect every
   visible opening before finishes or plants. Record transient equipment as an
   exclusion rather than silently ignoring it.
5. Bind source dimensions and SHA-256 to the inspected public file. Private
   reference templates expose metadata only. Inspect/annotate private images in
   `villacana-reference`; keep their pixels out of public packs. The public builder
   accepts only existing `public/photos-ref/<id>.jpg` sources.
6. Compare every component to the actual model. “Unassessed”, “material only”,
   “structure unmapped”, “draft partial” and “identity unresolved” are useful
   results. Link any positive draft assessment to immutable model feature IDs and
   a pinned render/commit. The pilot uses **draft PR108 / 51b75f5**, separately from
   the current main branch. Do not count a generic porch as a checked tunnel.
7. Obtain independent review of the actual sources, annotations and model
   assessment. Resolve missing/incorrect IDs and overclaimed traces. Complete
   `data/reference_packs/<area>.json` using the public schema; move it into this
   folder only after observations are populated. An untouched seed deliberately
   fails validation.
8. Generate and check the pack:

   ```bash
   python3 scripts/build_reference_packs.py
   python3 scripts/build_reference_packs.py --check
   python3 scripts/test_reference_packs.py
   PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/test_reference_pack_browser.cjs
   ```

   Export shareable PNG figures with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/render_reference_pack.cjs entrance`. These are rendered overlays; original photos remain unchanged.

   Agents can retrieve a precise component with `python3 scripts/build_reference_packs.py --pack entrance --feature T02`, or use **Copy component reference** in the viewer. Both include source IDs, source hashes, pixel locators, observations and unknowns.

   For another area, author its own `data/reference_packs/<id>-plan.svg` and `<id>-elevation.svg`. The entrance schematics are specific to this example; another pack without drawings shows a pending placeholder rather than reusing entrance geometry.

   The default builds every registered pack. `--pack <id>` selects one.
   Serve `public/` or use Vite and open
   `/reference-packs/<id>/index.html` (explicit `index.html` also works in Vite).
9. Only after source identity and placement are supported, build the declared
   model features under [PLACEMENT_VERIFICATION.md](PLACEMENT_VERIFICATION.md).
   Compare source → drawing → game for **every** row, including Layout visibility,
   collision, doorway/route clearance and levels. Save before/after evidence and
   preserve earlier discrepancies. Pack readiness never grants placement approval.

## Rollout order and completion

Wave 1 finishes the entrance and tunnel associations. Wave 2 covers Elena,
Cervantes and Dalí access/levels. Wave 3 covers the pool courtyards, paseo and
Barraka. Wave 4 covers the other lanes and source gaps. The generated board keeps
public and private counts separate and identifies areas with no current sources.
Area totals overlap because one photo can show more than one area.

For each area, work one identifiable scene at a time. Require a source inventory,
component inventory, checked drawings, model comparison, follow-up for gaps and
independent review before calling its inventory complete. Surveyed placement is a
separate status. The pilot covers six source sheets and **zero complete areas**;
all sources are retained in the rollout templates, including private and unplaced
references. No completion percentage is inferred from citations or camera pins.

This is an audit/tooling task. It writes reference assets and metadata, with no
changes to runtime geometry, collision, camera positions or placement policy.
Its queue `photos` field is empty because it builds no model from photos; all six
inspected input IDs remain explicitly listed in `sourceReferences` and the pack.
Software/source-review outcomes replace invented model-camera matches.

The later `silvia-tunnel-details` geometry task adds a photo-relative 3D study,
including two owner-confirmed inner entrance recesses (T13/T14). Its guessed
depths and concealed brown doors are distinct from direct photo observations.
Open `/?view=walk&study=silvia&details=1`. This study has no global map transform;
it does not replace registration or resolve the tunnel audit.
