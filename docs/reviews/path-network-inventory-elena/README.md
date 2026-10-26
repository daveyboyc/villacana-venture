# Calle Elena: source inventory before paving/detail

Task `path-network-inventory-elena`, issue #129. Runtime model baseline:
`5c1e56910a2a0e067215df383ee871f2859fd94a`.

The declared available-source inventory is independently reviewed. This completes
source accounting for this scope, not the physical map, registered boundaries,
measured dimensions, usable clearance, model reconstruction or placement approval.

## Inspect the evidence

- Canonical inspector: `/?view=map&network=1&feature=path-coverage:elena`.
- Deployed comparison pack: `/path-network/elena/index.html` (desktop side-by-side;
  mobile Photo / Drawing / Current game switches retain feature/source selection).
- [Labelled plan](plan.svg), [plan preview](plan.png),
  [tunnel sections](tunnel-section.svg), [section preview](tunnel-section.png).
- [Source/feature records](inventory.json), [pinned current-game assessments](model-comparisons.json),
  [independent review](independent-review.md) and [hash-bound review record](independent-review.json).

## Accounting and limits

60 distinct full sources inspected: 39 Elena-tagged public photos, the
public georeferenced Esri aerial and 20 private map/3D/pool-approach sources.
47 are accounted as observed and 13 as unusable for this
scope, with reasons retained. Seventeen byte-identical Drive mirrors are accounted
for separately and excluded from the distinct count. Three roof-only public frames
cannot expose Elena ground. Ten supplementary private pool frames do not identify
these Elena limits. Private originals and pixel annotations are not published.

Twenty-nine stable features account for both path margins, visible ground-wall
fragments, finite kerbs/planters, walls, doors/openings, two tunnel candidates and
roof/ground distinctions. Forty source-trace polylines and eight explicit locators
are separate from metric map traces: no source-to-world transform is asserted.
The graph retains zero registered path-side traces from this audit. Source
inspection is scoped to Elena; it does not complete other areas sharing a photo.

The covered passage is separate from the private 36/34 terminal spur and the
shallow lawn gateway. Both world portals and dimensions remain unknown. Two
smaller farther shuttered openings remain window-like/unknown, not extra doors.
The second legacy candidate is not merged with a roof-view arch. Closer private
09/12 photos show an iron-gate candidate and separate glass pool barrier beyond;
these same-direction views do not prove the reverse connection or world identity.

Five named evidence requests remain open: ground registration, concealed returns,
second-candidate identity, the south approach's reverse view, and levels/clearance.
All 29 component comparisons are semantic differences/partial coverage or explicit
not-comparable results at the pinned model. No calibrated photo match is claimed. After incorporating newer main, all 20 declared
model input digests still match the pinned comparison baseline. Upstream added
roof-camera/export work and changed a shutter appearance; it did not add the
unrepresented Elena tunnel structure. Render artifacts retain their original commit
provenance rather than being relabelled as new captures.
The private gateway's shaped head is already represented in simplified form; the
missing covered-portal arch is a different component.

## Correction queue and sequencing

- [Browser regression prerequisite #143](https://github.com/daveyboyc/villacana-venture/issues/143).
- [Ground/path registration #144](https://github.com/daveyboyc/villacana-venture/issues/144).
- [Both-portal/identity registration #145](https://github.com/daveyboyc/villacana-venture/issues/145).
- [Bounded passage structure correction #146](https://github.com/daveyboyc/villacana-venture/issues/146),
  dependent on this inventory, portal registration and browser regression work.
- [South terminal/reverse connection #147](https://github.com/daveyboyc/villacana-venture/issues/147).
- [Levels and clearance #148](https://github.com/daveyboyc/villacana-venture/issues/148).

No paving/detail or runtime geometry is delivered here. Preserve original registry
and pool footprints. Future geometry needs the placement workflow, supported
finite structure and actual-surface checks before a finish pass.

## Repeatable delivery

Inspect area-tagged full sources, then reconcile neighbouring pool/lane reverse
views and storage mirrors. Keep source-relative form and unknowns explicit. Draw
both paved margins separately from the tile field, with ground/roof/enclosure
classification and tunnel sections. Compare every component with a pinned model
or explicitly record why it is not comparable. Obtain independent actual-source,
trace, drawing and model review; bind all artifact/source revisions. Project the
same records into the graph/inspector and create correction/evidence tasks.

`data/path_network.json` references this inventory; `path_network_inventory.py`
validates source bytes/dimensions, pixel bounds, private-pixel separation,
assessment coverage and review/artifact freshness. It never converts pixels to
map metres. Only a current independent inventory review can increment the scoped
inventory-complete count. Placement approvals retain their separate authority.

## Validation

Reference generation, production build, Python source/graph/inventory tests and
the source/drawing/game viewer's desktop + 390×844, 320×568 and 844×390 checks pass.
The existing inspector regression also passes. Review screenshots are in the
ignored `layout-checks.local/elena-inventory-*.png` artifacts.

The 3D timeout investigation is recorded in [browser-timeouts.md](browser-timeouts.md).
Full serial Overview and Layout regressions passed without suppressing assertions or
changing runtime quality. Layout traversed 20 routes both ways (438 segments), checked
gate collision and retained material groups with zero page errors. Photo-map and
capture reliability work remains tracked in #143.
Software passes and successful screenshots do not establish source fidelity.
