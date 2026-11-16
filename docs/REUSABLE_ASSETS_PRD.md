# PRD: Reusable photo-backed assets

**Status:** Proposed implementation specification; no new asset system delivered by this document.  
**Requested by:** Dave, 16 November 2026.  
**Repository:** daveyboyc/villacana-venture.  
**Repository tree inspected:** `77600c19abfca8cffa98c3e537678218926b1651`.

## 1. Outcome

Build a photographed asset once, then place or slightly adapt it elsewhere through
data. Improve the North pool scene while reducing repeated modelling and area-specific
construction code. Dave should be able to preview a piece, choose a variant and hand
its placement configuration to an implementation agent without rebuilding it.

**Primary acceptance test:** the same asset works in North pool and a second
photo-supported area with independent appearance and placement, without copying its
construction code or creating a second model for a parameter-only variation.

This PRD covers an asset library, a small preview gallery and a bounded pilot.
Implementation remains separate work. Scene detail follows the structure-first
sequence in [AGENTS.md](../AGENTS.md) and [workflow lessons](WORKFLOW_LESSONS.md).

## 2. Existing foundations

Extend the current Three.js/Vite and Blender pipeline described in
[GRAPHICS.md](GRAPHICS.md).

| Existing foundation | Reuse or improvement |
| --- | --- |
| [Facade kit](../src/facade-kit.ts), [placement data](../data/facade_kit.json), [Blender builder](../scripts/build_kit.py) | Existing doors, windows and balconies; retain instancing and distance simplification. Audit existing moulded surrounds before adding a new variant. |
| [North pool frontages](../src/north-pool-frontages.ts) and [data](../data/north_pool_frontages.json) | Extract furniture, parasols and awning construction into shared modules. Keep area placement and terrain resolution separate. |
| [Sprites](../src/sprites.ts), [plant builder](../scripts/build_plants.py), [tree builder](../scripts/build_trees.py) | Reuse models, seeded variation and mobile cards for later planting families. |
| [Materials](../src/materials.ts), [pool detail assets](../src/pool-detail-assets.ts), [pool kit](../src/pool-kit.ts) | Follow existing reusable material and fitting patterns. |
| [Reference index](../public/reference-index.json), [reference workflow](REFERENCE_PACK_WORKFLOW.md) | Use stable photo/component IDs and existing evidence records. Avoid a competing photo catalogue. |

The main gap is a consistent contract and discoverable catalogue across these
implementations. Existing models need not all be migrated to ship the pilot.

## 3. Reference scope and structural prerequisites

The supplied screenshot selects North pool. Its exact camera and foreground lane
identity remain unconfirmed; do not treat the tentative Elena association as a
placement measurement.

Start with the [North pool brief](../refs/areas/north-pool.md) and the current
[reference index](../refs/README.md). Candidate sources identified by the catalogue:

| Source | Catalogue-described use |
| --- | --- |
| [IMG_2204](../public/photos-ref/IMG_2204.jpg), [IMG_2205](../public/photos-ref/IMG_2205.jpg) | Courtyard, northern frontages, awnings, furniture and planting |
| [IMG_2206](../public/photos-ref/IMG_2206.jpg) | West gardens, patio walls and gates |
| [IMG_2207](../public/photos-ref/IMG_2207.jpg), [IMG_2208](../public/photos-ref/IMG_2208.jpg) | Roof tiles, hedges and garden details |
| [IMG_2363](../public/photos-ref/IMG_2363.jpg) | Elena approach to the North pool lawn gateway |

These are research starting points, not newly inspected source observations or
approval. Reopen full-size sources and check newer references during implementation.
Use the current in-repository reference/contact-sheet paths from the index; older
briefs may mention the former private reference repository.

Before adding detail to a particular scene, obtain reviewer sign-off in order for:
photo coverage, layout, levels, and removal of conflicting generated filler.
Then review detail with Show details. Scope these reviews to affected feature IDs.
North pool roof photographs share a station; multiple headings do not provide
independent depth measurements. Request missing viewpoints early.

Library authoring and gallery previews can proceed while a placement is blocked.
Keep that placement pending and continue supported work elsewhere. An existing
placement preserved during extraction does not acquire new accuracy approval.

## 4. MVP and deferred work

Deliver:

- Shared constructors for existing dining/bistro furniture, loungers, parasols and
  retractable awnings, with a compatibility adapter for current North pool data.
- A catalogue covering those pilot assets and their supported variants.
- One photo-supported extension to the facade kit: a moulded window-surround
  variant, only if source inspection confirms a gap in the existing kit.
- A small development gallery using the production constructors and materials.
- Configuration-only reuse of at least one extracted family in a second area.
  Elena is a candidate; choose the actual area from inspected evidence and reviewed
  structure, and record that decision before placement.

Later batches can add pots, planters, climbers, mixed planting and additional
facade ornament. Gate, pergola and wall kits require their own structural evidence.

Defer a drag-and-drop scene editor, external asset service, universal migration,
automatic whole-resort placement and new gameplay. This work does not implement
the separate FPS test PRD or change Walk controls.

## 5. Asset and placement contract

Keep three concepts separate:

| Record | Required information |
| --- | --- |
| Asset definition | Stable ID, revision, constructor or model path, nominal dimensions, local origin/orientation, allowed parameters and ranges, materials, preview, source references, mobile/distant representation |
| Named variant | Base asset ID/revision and validated overrides such as colour, width, stripes, seat count, open/furled canopy or seeded plant shape |
| Area placement | Stable feature ID, existing area ID, asset/variant, transform or wall anchor, ground/terrace datum, parameter overrides, evidence, confidence and relevant review/discrepancy links |

Use metres, Y-up, and the existing map convention of +x east and +z south. Define
the local forward direction and origin per family. Floor props should use a base
origin; wall fittings use a documented attachment plane. Keep adapters for existing
chair/awning orientations so extraction does not rotate or offset the scene.

Reusable constructors operate in local coordinates and do not import area JSON
or resolve global terrain. Area adapters resolve world placement and ground once.
Preserve stable feature IDs, structural/detail flags, clearance metadata and
generated-filler suppression rules.

Expose only supported variations. Changing width must preserve sensible frame
thickness and proportions; use a parametric rebuild or a specific variant where
stretching a mesh would distort it. Shared geometries/materials are cached by
asset revision and effective parameters. A colour change must not mutate unrelated
instances; batch compatible instances and clone resources only when necessary.

Reject unknown IDs, invalid dimensions and unsupported parameters with actionable
diagnostics. Seed procedural variation. Record generator/tool versions and repeatable
build commands. Breaking defaults or origins require a revision and migration;
do not silently move every existing instance.

Maintain asset appearance evidence separately from placement evidence. A photograph
of a chair establishes its form, not permission to put that chair in every courtyard.
Use existing confidence, photo-check, discrepancy and placement-review records as
the authority; catalogue entries link to them rather than duplicating approval states.

## 6. Preview and authoring workflow

1. Search existing assets before modelling. Inspect the area's sources and select
   a specific component with its visible details and unknowns.
2. Reuse an asset, add a named variant, or author a new family when shape warrants it.
3. Preview it at true scale in the gallery under the same lighting/material setup
   as Inspect. Show name, dimensions, variant controls, reference links and mobile
   fallback. Include reset and copy-configuration actions.
4. Add a placement record to a structurally reviewed scene. Resolve datum, anchors,
   visibility and clearance through the area adapter.
5. Compare the result with source photographs in Inspect, using the established
   camera/render workflow and independent review.
6. Reuse the accepted family in another supported scene and record which
   configuration changed.

The gallery must work under the deployed base path and load only selected assets
or a bounded selection. It is a development tool, not an alternate resort renderer.
Copied configuration identifies the asset and variant but must not fabricate world
coordinates or evidence. Reference links must respect which images are public;
unbundled source pixels do not enter the public gallery.

Proposed implementation locations are `src/assets/` for shared builders and types,
`data/asset_catalog.json` for the catalogue, and a development gallery entry.
Final routing should follow the existing app conventions. These are proposed paths.
Retain `public/models/`, the current Blender scripts and current area data where
adapters suffice; introducing a new loader or relocating every model is unnecessary.

## 7. Quality and performance requirements

- Preserve current mobile cards, simplified distant representations and lazy loading.
  Reusing an asset must not fetch the same model or texture once per placement.
- Use instancing/batching for compatible repeated pieces. Parameter/material variants
  may produce separate batches, but must share reusable geometry where possible.
- Record triangles, draw calls, asset bytes, texture dimensions and frame times for
  baseline and pilot on identical hardware, browser, viewport, camera and settings.
- Proposed pilot performance gate: extraction adds no asset payload and no more than
  5% median or p95 frame-time regression across three warmed 60-second runs.
  An expanded scene should stay within 10% of baseline; report absolute values too.
  Measure desktop and one actual mobile device. Emulation alone cannot certify mobile
  performance. These are targets, not measured results.
- Missing device measurements remain an explicit open acceptance item. If the baseline
  is already slow, report it; a relative pass does not claim acceptable absolute FPS.
- Structural parts remain visible in Layout; decorative fittings appear with Show
  details. Preserve footprints and clearance behaviour, including the documented
  photographed canopy-overhang exception. Missing or failed models have a visible
  fallback and a diagnostic.

## 8. Implementation milestones

| Stage | Work | Exit condition |
| --- | --- | --- |
| P0: Inventory | Audit existing builders/variants and active tasks; inspect source components; identify structural readiness and second-area evidence; capture baseline | Bounded pilot list, affected IDs, source gaps and measurements recorded; no duplicate facade-kit effort |
| P1: Extract | Move furniture/parasol/awning construction behind a shared contract; adapt existing North pool calls | Existing data still renders the same shapes, transforms, materials and visibility; no unintended placement changes |
| P2: Catalogue and preview | Add validated definitions/variants and the gallery | Each pilot asset previews at scale; copied variant config reproduces it; unsupported inputs fail clearly |
| P3: Extend and reuse | Add the evidenced surround variant and reuse an extracted family in a second reviewed area | Second placement changes data only; independent parameters work; photographic and placement reviews meet the existing policy |
| P4: Handoff | Validate performance, visual regressions and repeatability; document adding the next asset | Acceptance table completed with evidence links and remaining limits; short worked example available |

P2 depends on P1. New scene placements in P3 depend on scoped structural reviews,
not simply on completing the gallery. Register implementation tasks using
[HANDOVER.md](HANDOVER.md), one task per branch/PR, after checking the current queue.
This document does not mark existing tasks complete or create implementation claims.

## 9. Acceptance criteria

| ID | Required result and evidence |
| --- | --- |
| A1 Reuse | One family appears in North pool and another supported area; the second placement adds no copied builder or duplicate model for parameter-only variation. |
| A2 Independent variants | At least two configurations coexist. Changing one instance's supported colour/dimensions does not change the other or leak shared material state. |
| A3 Extraction parity | Fixed-camera before/after comparisons show no unintended changes to the existing North pool instances. Preserve IDs, origins, ground offsets and visibility. |
| A4 Source traceability | Every pilot asset links to inspected source observations; every new placement has its own evidence/confidence. Unknown depth and hidden boundaries remain explicit. |
| A5 Structural readiness | Each new detail placement records the prerequisite stage reviews. Placement acceptance follows the existing measured policy; citations and gallery approval do not substitute. |
| A6 Preview | Gallery uses the runtime asset code, shows dimensions/variants/fallbacks, and copies valid configuration. It does not expose private source pixels. |
| A7 Performance | Baseline and pilot measurements satisfy the proposed budgets on recorded desktop/mobile hardware; instancing and resource reuse are demonstrated. |
| A8 Regression | Typecheck, production build, relevant source checks and Inspect/map browser checks pass. Layout and Show details retain intended behaviour. |
| A9 Repeatability | A clean documented build recreates pilot assets; random generation is seeded, tool versions are recorded, and reused resources are not repeatedly allocated on reload. |
| A10 Handoff | A worked example explains selecting a reference, configuring an asset, placing it in another area, and recording its validation. |

Use [ACCEPTANCE_STANDARD.md](ACCEPTANCE_STANDARD.md),
[PLACEMENT_VERIFICATION.md](PLACEMENT_VERIFICATION.md) and
[PHOTO_ALIGNMENT.md](PHOTO_ALIGNMENT.md) for actual scene acceptance, including
independent full-size source/render review, held-out measurements and scoped
uncertainty. Software tests cannot establish photographic fidelity.

Test meaningful risks: transforms/datums after extraction, variant isolation,
missing assets, resource reuse and visibility. Run the applicable repository checks
from HANDOVER for implementation changes. Preserve before/after captures and
results in a dedicated review folder, with links from task records.

## 10. Risks and decisions to resolve in P0

- **Wrong structure:** new ornaments can hide layout errors. Enforce prerequisite
  reviews and continue gallery work while a specific placement awaits evidence.
- **Over-generalisation:** a universal builder can cost more than it saves. Limit
  the first contract to the extracted families and one evidenced facade variant.
- **Duplicate work:** the facade/plant kits already exist and other agents may be
  editing them. Reconcile current task ownership before creating new families.
- **Mobile cost:** leaves, shadows and material variants can increase draw calls.
  Keep fallbacks and measure the actual pilot before expanding.
- **Second-area evidence:** Elena is provisional. Select a supported location after
  source review; if none qualifies, keep A1 pending rather than inventing a placement.
- **Facade scope:** determine whether existing surrounds need parameterisation or
  a genuinely new profile. Reuse existing geometry wherever it already matches.

Success is a demonstrated, documented second use with no copied construction code,
not the number of models added to the library.
