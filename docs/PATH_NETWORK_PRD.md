# PRD: Photo-backed paths, tunnels and boundaries

**Status:** Requirements ready for implementation; the mapping programme is not complete.  
**Owner:** Dave. **Delivery:** Villacana project maintainers and agents.  
**Baseline:** main [212f7d3](https://github.com/daveyboyc/villacana-venture/commit/212f7d3ffd56ef9aba7fede4d8e35905a4a5dcb4), following the Silvia outdoor-path example.

## 1. Intent

Extend the photo-to-drawing-to-game process used around Silvia across the resort.
First establish where routes, tunnels and physical boundaries actually are. Then
improve paving and surrounding detail within those established limits.

The result must answer, for any part of the map:

- Where does this path run, where are both edges, and what does it connect to?
- Is there a covered passage here? Where are its entrance, exit and side doors?
- Which edges are building walls, freestanding walls, fences, hedges or planters?
- What do the photos establish, what has been built, and what remains missing?
- Can someone walk the same route in the main game and compare it with its sources?

A better-looking surface does not complete an unmapped tunnel or boundary.

## 2. Starting point and gaps

These are repository inventory counts, not a claim of surveyed completeness.

| Existing asset | Baseline | Gap this programme must close |
| --- | --- | --- |
| Reference catalogue | 176 references across 14 areas | Content tagging does not mean every visible feature has been inventoried or mapped. |
| Registry layout | 230 building parts and five pool shapes | Registry parts, roofs, ground walls and private enclosure edges need distinct interpretation. |
| Passage list | Eight records in data/passages.json: one labelled photo, seven likely | No complete resort-wide tunnel census; a photo label is not measured placement approval. |
| Silvia and Jorge source groups | Separate groups in the entrance pack; Silvia has a provisional main-map model | Identity, both-end connections and world placement are not fully resolved. Do not count these as eight plus two confirmed unique tunnels. |
| Named routes | Street axes and traversal checks exist | A centreline and nominal width do not establish the actual left and right path boundaries. |
| Reference packs | Six entrance source sheets, 46 numbered components and 14 rollout templates | The pilot does not constitute a complete area inventory. Most areas need detailed observations and drawings. |
| Walls and frontage modules | Several photo-backed local fragments | Many ends, joins, openings and hidden returns remain untraced; generic scenery cannot fill these gaps. |
| Photo poses and survey terrain | Camera-solving tools and national laser-survey ground are available | Coverage and accuracy vary. Ground heights do not resolve concealed walls or tunnel identity. |

The northern-lanes area currently has zero area-tagged references. That is a source
gap, not evidence that it has no paths, walls or passages.

The Silvia example also exposed an integration risk: new terrain can cover an
otherwise correct paving mesh or intrude through a level tunnel floor. Its garden
transition remains provisional. Future work must check actual visible surfaces,
not just texture files or successful movement.

## 3. Goals and scope

### Goals

1. Inventory every tunnel already represented or suggested by existing sources,
   and systematically search all areas for additional passages.
2. Map both sides of each public/shared path, its junctions, thresholds and
   material changes, including the approaches to pools and covered passages.
3. Distinguish building ground footprints from roofs, parcels, patio enclosures
   and freestanding walls; identify missing or conflicting boundaries.
4. Make evidence, uncertainty, model coverage and remaining work inspectable on
   the canonical map and in reusable drawings/data.
5. Improve one connected area at a time without breaking neighbouring paths,
   existing structures, level relationships or iPhone controls.

### Included

All 14 existing areas, connecting streets, courtyards, pool approaches, shared
footpaths, covered passages, gates and route-defining boundaries. Record visible
private frontage where it defines the shared path; identify private doorways
without assuming access through them.

### Excluded

Inventing unseen private interiors or property boundaries; automatically changing
registry footprints; wholesale material replacement; a separate map/game world;
automatic acceptance of image-generated drawings; rewriting placement policy.
This PRD requests future implementation. It does not itself relocate features,
open passages, change levels or certify the current map.

## 4. Required product experience

Keep Map & photos, Overview and Walk on the same model and source IDs.

On the map, users must be able to toggle **Paths and edges**, **Tunnels**,
**Buildings**, **Walls and openings**, **Photo coverage**, and **Missing or
uncertain**. Use colour plus line style and text labels, with a persistent legend.
An unknown boundary must remain distinguishable from an observed wall and a
route-clearance guide.

Selecting a tunnel, route or edge must show:

- Its name/ID and location or explicitly unresolved location.
- Connected places and nearby segments; public, private, gated or unknown access.
- Relevant photos, annotated drawing and current game view.
- Separate source, identity, placement, model and review states.
- Missing components, conflicting evidence and the next task.

Users must be able to open the full photo beside the drawing/game on desktop.
On iPhone, provide one-tap switching between them while retaining the selected
feature and camera location. Retain first/third-person switching and touch walking.
An unresolved feature must remain searchable even without a defensible map pin.

## 5. Functional requirements

### FR1 — Resort-wide coverage and gap inventory (P0)

Create an overview before further isolated detail passes. Reconcile the reference
catalogue, passage list, registry/building parts, street network, existing feature
modules, reference packs and open discrepancy/task records.

For every area, list routes, candidate tunnels and boundary runs, with states for
inspected, partly inspected, source needed, identity unresolved and
excluded with reason. Inspect the supplied maps/aerials and available full photos;
do not generate the inventory only by searching filenames or existing citations.

Every source receives an accounting record: features observed and linked,
inspected but unusable with reason, duplicate with retained link, or not yet
inspected. Preserve privately held and unplaced sources. One photo can cover
several areas; counts must deduplicate sources.

A missing photo or concealed edge creates a named gap and an evidence request
describing the needed viewpoint or anchor. It must not silently become guessed
geometry.

### FR2 — Tunnel and covered-passage census (P0)

Reassess all eight existing passage records and the Silvia/Jorge source groups.
Search every mapped route and registry/aerial candidate for additional covered
connections, including areas without useful ground photos.

Give each physical candidate a stable tunnel ID independent of its host building
part. Maintain aliases for existing IDs. Merge duplicates only with recorded
identity evidence; split competing placement hypotheses when unresolved.

Each tunnel record must include both portals, direction, host building/overhead
structure, connected path segments, public/private status, opening geometry,
covered length/clear width/headroom and floor datum, with unknown values allowed.
Inventory ceiling form, side walls, recesses, side doors, steps, gates, signage and
paving transitions separately. Seeing one arch does not prove a through route or
the position of the other end.

Store source-relative observations when world placement is unresolved. Keep
doorways separate from traversable routes. Do not open a solid registry part
because a similar-looking tunnel appears elsewhere. Preserve upper floors and
roof structure when a justified ground-floor passage is carved.

### FR3 — Path extents and connectivity (P0)

Represent path segments between explicit junctions, portals and material/level
changes. Each segment has an axis plus independently supported left and right
edges, or an explicit unknown interval on either side.

Record edge type and transitions: building wall, kerb, planter, hedge, fence,
freestanding wall, grass, deck, water or unresolved. A kerb or hedge observation
does not establish a concealed masonry wall beneath it.

Map widths, tapers, turns, recesses, drains, threshold strips and paving boundaries
where supported. Keep the physical paved extent, usable pedestrian clearance and
vehicle/parking extent distinct. A nominal protected-route buffer is not a
photographically traced path edge.

Join neighbouring segments through shared junction IDs. Record whether each
connection is directly observed, inferred, disputed or blocked. Explain intentional
dead ends, private access and gated connections; detect unexplained disconnections.
A hypothetical connection must not be presented as confirmed public access.
Choose width/placement tolerances appropriate to each opening and path. If source
uncertainty consumes the usable clearance, record the width as unresolved; a
passing model walk cannot certify real-world clearance.

### FR4 — Buildings, walls and openings (P0)

Retain original registry geometry as a versioned baseline. Classify each relevant
edge as ground wall, upper-floor/roof outline, enclosure/parcel line or unresolved.
A zero-storey registry part must not automatically become a solid building or wall.

Give boundary runs stable IDs, source traces, visible extents, thickness/height
where supported, endpoints and joins. Record corners, curved returns, wall caps,
gates, windows and door openings. Maintain separate existence, location and
dimension confidence: a clearly visible wall can still be poorly located.

Only join fragments when evidence supports the join. Hidden continuations remain
unknown. Buildings, freestanding walls and path edges may share references to one
physical boundary; avoid duplicated overlapping geometry.

No building or pool footprint change is permitted without a bounded, documented
discrepancy and the applicable placement workflow. A roof overhang must not move a
ground wall. Changes must preserve material groups and valid opaque structure.

### FR5 — Paving and surrounding detail (P1, after local structure)

Within an established path extent, record material, tile shape, orientation,
visible column/course counts, borders, mortar, wear and transitions. State whether
dimensions are measured or estimated; do not infer centimetres from tile count.

Keep distinct surface families separate. The Silvia outdoor four-column squares,
indoor decorated square-and-insert field and pool-side irregular stone are an
example, not a resort-wide material rule.

Then add evidence-supported planters, hedges, window bars, doors, lights and signs.
Each needs a component ID or an explicit exclusion. Preserve owner corrections
and label owner-authorised guesses separately from direct photo observations.
Decoration cannot narrow the actual walking envelope or obscure missing structure.

### FR6 — Heights and runtime integration (P0 for each changed scene)

Use the current survey/level framework. Record the relationship between path
ground, building datum, tunnel floor, thresholds and raised beds. Review survey
limitations and source/photo disagreement before authoring a correction.

After integration, inspect the actual first-visible ground at the entrance,
middle and exit of every changed passage/path, including adjacent surface overlaps.
Test for buried paving, generic ground intrusion, exposed voids, flicker, missing
material groups and walking above/below the visible floor.

A cosmetic skirt can close a rendering void, but cannot count as resolving a
disputed level or a photographed step. Keep that discrepancy open. Do not raise
an indoor floor and doors together merely to conceal incompatible terrain.

## 6. Data and drawing contract

Extend existing authoritative records where practical. Avoid a parallel source of
truth. Schema/file names below describe logical records; implementation may
normalise them into shared files while preserving these relationships.

| Record | Minimum content |
| --- | --- |
| Area coverage | Existing area ID; source accounting; route/tunnel/boundary inventory; coverage limits; missing evidence; tasks. |
| Path segment | Stable ID; junction/portal IDs; axis; left/right edge references and unknown intervals; surface; access; levels; source/model state. |
| Tunnel | Stable ID; legacy aliases; portal IDs; host IDs; source-group identity; topology; structural components; dimensions and unknowns. |
| Boundary | Stable ID; physical kind; observed line/polygon and extent; opening references; adjacent paths/buildings; height/thickness basis; unknown returns. |
| Source observation | Source ID/revision/hash; camera versus subject; visible component IDs; pixel locator/trace; observation; limitations and interpretation history. |
| Assessment | Feature/model revision; rendered view; source comparison; measured tolerances/uncertainty where available; reviewer; discrepancies and follow-up. |

All geometry uses the existing east/south map-metre frame with units and source
transform recorded. The rotated display frame must not be reapplied to stored
coordinates. Source-relative drawings without registration are explicitly marked.

Keep these state dimensions separate:

- **Source coverage:** uninspected, partial, inspected, source needed.
- **Identity/connectivity:** unresolved, candidate, observed, disputed.
- **Model coverage:** absent, partial, represented.
- **Placement:** use existing unreviewed/incomplete/stale/disputed/verified states.
- **Visual/runtime checks:** unchecked, differs, not-comparable or checked for the
  stated scope, with artifact and revision.

Every area pack must provide a labelled plan, photo annotations and a feature
checklist. Add a section/elevation for tunnels, raised thresholds and ambiguous
roof/ground relationships. SVG plus structured JSON are preferred so agents can
reference exact IDs, vertices and source pixels. Export ordinary preview images
for quick human review.

A drawing derived from a photo preserves observations; it does not establish
missing dimensions or concealed topology. Solid/dashed lines need a legend.
Source pixels remain available and unchanged. Private images/annotations remain
in the private reference repository; public outputs contain safe metadata and
permitted imagery only.

## 7. Standard delivery loop

1. **Inventory:** inspect existing data and full sources; list all visible
   structures/openings and missing evidence before modelling.
2. **Identify:** reconcile names, signs, landmarks and opposite views. Keep
   uncertain source groups separate; phone GPS identifies the camera.
3. **Draw and register:** annotate photos; trace observed boundaries; produce
   plans/sections; register suitable sources with independent held-out controls.
4. **Compare:** put the current main-map model beside those drawings/photos.
   Describe omissions and discrepancies before proposing edits.
5. **Build structure:** implement supported boundaries, portals and connectivity
   using shared map/3D/collision inputs; retain unresolved hidden extents.
6. **Build surfaces/detail:** add local paving and components inside those limits.
7. **Verify:** compare the same before/after cameras, including both travel
   directions, thresholds and neighbouring segments; run applicable software and
   actual-surface checks.
8. **Publish and track:** merge/deploy under the owner's repository instructions,
   verify the live view, and retain unresolved gaps and provisional states.

Use the reference-pack, photo-pose and placement tools already present.
Independent review must inspect actual full sources and current renders, not
only citations or test logs. Solved cameras, drawings and laser data support
different claims; none automatically certifies the whole area.

The existing placement policy remains authoritative. The separate
MEASURED_VERIFICATION_PROPOSAL.md is a proposal, not an implemented approval route.
An authorised provisional merge is permitted under current repository instructions,
but must not increment the verified or complete counts.

## 8. Delivery phases and starting backlog

| Phase | Deliverable and exit condition |
| --- | --- |
| 0 — Whole-map baseline | Coverage overlay and gap ledger for all 14 areas; reconciliation of every existing passage/candidate and route; baseline counts published with sources and definitions. No area silently omitted. |
| 1 — Prove the repeatable method | Finish the Silvia/pool-edge inventory, keep its identity/spacing/level disputes visible, and apply the full process to a distinct passage/approach in Elena or Jorge. Select the next build from evidence readiness and route impact. |
| 2 — Main connected routes | Elena, Cervantes, Dalí, Eva and pool approaches: both path edges, wall/opening inventory, junctions and levels before material/detail passes. Preserve cross-area connections. |
| 3 — Remaining lanes and courtyards | Complete the other areas, including Silvia/Jorge/Patricia/Teodoro Rojo/Guillermo, pool courtyards, Picasso, paseo/Barraka and the northern lanes. Resolve source gaps explicitly. |
| 4 — Close and maintain | Reconcile shared edges, tunnel duplicates, unmatched observations and unresolved links; publish coverage/verification totals and evidence requests. Re-run affected comparisons after later geometry or terrain changes. |

Phase 0 is resort-wide; later phases do not postpone discovery of northern or
poorly photographed tunnels. Use the existing rollout board as a starting list,
with priorities updated for connectivity and missing structural evidence.

Initial work packages:

1. Inventory reconciliation and source-accounting report.
2. Tunnel census, aliases and both-portal/connection records.
3. Path-edge and building/wall boundary tracing packs.
4. Canonical map coverage/uncertainty layers and feature inspection.
5. One complete second-area implementation and comparison pack.
6. Route-by-route rollout with terrain/surface regression checks.

Each package needs declared scope, affected IDs, sources, dependencies, owner,
acceptance evidence and follow-up tasks. Claim one implementation task per branch.
Do not mark an entire programme complete because a planning document or template
has been delivered.

## 9. Acceptance and progress measures

Report counts with denominators and unresolved totals, separately for each area.
Derive counts from records; do not enter a subjective overall completion percent.

| Measure | Acceptance |
| --- | --- |
| Area accounting | 14/14 areas have a reviewed inventory or explicit source-needed coverage record. |
| Source accounting | 100% of catalogued sources have an accounting disposition; uninspected sources remain an outstanding total. Inventory completion requires no uninspected available relevant sources. |
| Tunnel accounting | Every existing passage record and source-discovered candidate has an ID, identity state, both portals or explicit unknowns, access/connectivity state and next action. This is not proof that all real tunnels have been discovered. |
| Route accounting | Every mapped route has a connected segment chain; both sides have evidence-linked edges or recorded unknown intervals. Unknown intervals do not count as traced. |
| Boundary accounting | Every visible relevant boundary/opening in inspected sources links to a model feature or a named missing/conflicting item. Registry/roof/ground/enclosure types are distinguished. |
| Cross-area consistency | Shared junctions and edges agree; no unexplained route through a wall/house, duplicate tunnel, conflicting edge or unrecorded disconnection. |
| Changed-scene fidelity | Every required component is compared source → drawing → game. Partial/non-comparable results retain gaps; software passes cannot turn them into visual matches. |
| Runtime quality | Changed paths/portals walk both ways at actual player radius; gate states and private doors behave correctly; surfaces remain visible and opaque with no sky holes or ground intrusion. |
| Mobile | Selection/source/game switching, walking and view toggles work at 390×844, 320×568 and 844×390 without trapping input. |
| Provenance | Source/model/artifact revisions and uncertainty are retained. Existing discrepancies cannot disappear through regeneration or a later positive check. |

Maintain three separate completion labels:

- **Inventory complete:** available relevant sources inspected and every observed
  feature accounted for; source gaps remain explicitly quantified.
- **Model complete for declared scope:** every required supported component is
  represented and checked; no missing structural component or unresolved rendering
  blocker is hidden behind decorative detail.
- **Placement verified:** only the existing applicable measured verification
  process can grant this, for its stated scope and tolerance.

An area cannot claim full verified reconstruction while concealed boundaries,
unresolved tunnel identities/connections or conflicting levels remain. A source
gap can close an audit task with a documented outcome; it cannot complete the
physical map.

## 10. Review and release checklist

For each geometry delivery, retain a source inventory, annotated plan/sections,
before/after photos and renders, discrepancy report and independent review.
Run the current handover checks plus relevant feature/level checks, production
build, real route regression and overview/photo-map/mobile checks as applicable.
Add meaningful surface-hit or visibility checks where terrain/overlaps can hide
the work. Do not add tests that merely reproduce authored coordinates.

Verify the deployed canonical app and link directly to the changed area.
Confirm original registry/pool geometry is preserved unless an explicit,
evidence-backed correction was the task. Keep uncertain work visible in the
queue even after an authorised provisional release.

The programme succeeds when the remaining gaps can be named, located, traced to
evidence and worked through systematically, and when each completed area has a
defensible path from its source photographs to the live game.

## References

- [Current layout and limits](LAYOUT_ACCURACY.md)
- [Street network](STREET_LAYOUT.md)
- [Reference index and area briefs](../refs/README.md)
- [Reference-pack method](REFERENCE_PACK_WORKFLOW.md)
- [Existing rollout board](reference-packs/rollout.md)
- [Placement policy](PLACEMENT_VERIFICATION.md)
- [Photo alignment](PHOTO_ALIGNMENT.md)
- [Levels](LEVELS.md) and [terrain](TERRAIN.md)
- [Build handover](HANDOVER.md)
- [Silvia outdoor example and integration limits](reviews/silvia-outdoor-path/README.md)
