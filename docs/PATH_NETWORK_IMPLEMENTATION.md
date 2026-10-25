# Path network implementation status

The first implementation task is `path-network-baseline`: graph-backed software
accounting and an inspector on the canonical map. This does **not** complete phase
0's full-source survey, nor any geometry delivery in phases 1–4.

Open `/?view=map&network=1`, or choose **Layers & editing → Path network**.
Search includes candidates with no location. `feature=<namespaced ID>` preserves
selection on reload and when switching to source photos. Select a placed route
context to compare in Overview; the existing Walk and camera controls are retained.
The map uses existing east/south metres and applies display rotation once.

## Authoritative records and graph

- `data/path_network.json`: authored, host-independent tunnel IDs and aliases,
  separate signed Silvia/Jorge source groups, source accounting overrides.
- `scripts/path_network.py`: extension called by `build_references.py`, using the
  same catalogue, areas, model placement states and runtime route/registry inputs.
- `refs/graph.json`: additive `path-*` nodes and `in-area`, `segment-of`, `ends-at`,
  `accounts-for`, `candidate-source`, `represented-by`, `follow-up` relations.
  Existing source, model, discrepancy and approval nodes/edges are preserved.
- `public/path-network.json`: generated projection for the map, with input hashes.
  No private pixels or raw private photo metadata are exported.
- `refs/PATH_NETWORK.md`: generated counts, definitions and area gap ledger.

The graph stays version 2; existing `model:*` node and approval semantics are
unchanged. New inventory nodes cannot grant placement approval. Existing model
placement blockers and photo diagnostics appear separately in feature inspection.

Every catalogue ID is accounted for once globally, including private and unplaced
sources. Per-area source counts overlap. The initial accounting disposition is
`not-yet-inspected`, referring specifically to the PRD's **feature inventory**:
existing content tagging and previous reviews remain valid for their stated scope.
After full-source inspection, an override needs disposition, reviewer, source
revision and reason; `observed` needs linked feature IDs, `duplicate` a distinct
retained source. Graph integrity rejects unknown linked feature/source IDs.

All 24 runtime clearance guides are imported unchanged. Each consecutive axis
pair has explicit junction references and two whole-length unknown edge intervals.
Exact shared coordinates share junction IDs; approximate joins and intersections
are not snapped or certified. These are initial import segments, not completed
segmentation at every material/level/portal change. Axis-vertex IDs are coordinate
hashes and segment IDs use route order; future geometry edits require explicit
migration of authored references rather than assuming their identity is stable.

The eight legacy passages have host-independent IDs `tun-001`–`tun-008`. Silvia
and Jorge remain separate source groups, with unresolved relationships to legacy
candidates. Ten candidate records do not mean ten unique tunnels. Both portals,
physical dimensions, datum, topology and access are explicitly unknown. Existing
host models and photo-relative study are context only. No candidate map pins,
through-route claims or registry cuts were invented.

The 230 registry outlines retain their input geometry and hashes. Zero-storey
parts are enclosure/parcel candidates; other outlines remain ground/roof
unresolved. Existing wall/opening/hedge model fragments are linked as context,
not promoted to exhaustive observed boundary records. The inspector never feeds
geometry or collision.

## Remaining programme

All 14 `path-network-inventory-<area>` audit tasks remain open in the build queue,
including northern lanes with zero area-tagged sources. Each requires full images
and aerial inspection, a component census, explicit evidence requests, annotated
plans and sections. Subsequent tasks must add actual evidence-linked edge traces,
source-relative observations and registrations, cross-area topology reconciliation,
assessments, structural builds and actual-surface runtime checks under the PRD and
placement policy. No inventory, model-complete or placement-verified total was
incremented by this tooling task.

## Validation

Run the standard HANDOVER checks plus:

```sh
python3 scripts/test_path_network.py
node scripts/test_path_network_browser.cjs
```

The Python tests cover source/area completeness, legacy aliases, separate signed
identities, unknown edges/portals, original route/outline preservation, graph
integrity and invalid accounting. Browser tests cover unresolved-candidate search,
source switching, selection deep links, mobile bounds at all three PRD viewports
and map controls after closing the inspector. CI checks the generated public
projection as well as graph outputs. Software checks establish these behaviours;
they do not inspect or certify real-world placement.
