# Silvia tunnel in the main map

The normal resort scene now reuses `createSilviaTunnel`, the same component as the
study. This is a bounded **approximate west-side candidate**, not a surveyed or
photo-registered location. The source's compass direction conflicts with this
candidate; the opposite host remains possible. The world-registration audit and
both discrepancy reports remain open. See the independent location review.

The canonical Map shows its approach, passage walls and closed side entrances.
The Silvia tunnel navigation button opens normal Walk at the entrance with
Details enabled (`?view=walk&place=silvia&details=1`); no `study` parameter is used.
The component exists in ordinary Walk and Overview regardless of that spawn link.
Map, lower host cut-out, collision and camera all use the same placement transform.

The shallow registry portal is opened below its canopy. Only the finite ground
corridor and four recess envelopes are subtracted from the adjoining building;
the original roof, upper storey, outer outline and courtyard outline are retained.
Other buildings retain their previous collision behavior. Four single 0.88 m
brown wooden leaves, each with one spherical gold knob, are unchanged from the
owner-corrected study. First-person camera clearance applies near the tunnel and
within this courtyard; ordinary walking controls continue to work.

Graphics use the same Three.js model, procedural tile/wood/plaster materials,
arches, mouldings, inset, plaque, services, lantern and Details plants. The main
scene retains its own lighting, exposure and wider shadow bounds; two subdued
lights keep the covered passage legible. It therefore has the same graphics
assets, but is not pixel-identical to the separately lit study. Layout omits
optional plants. The courtyard beyond the exit is still the basic high-walled
registry courtyard: the photograph's garden context has not been reconstructed.
Do not call this a complete photographic match.

`registry-candidate-overlay.png` uses the existing public Esri aerial bounds as
one affine transform, with original registry in yellow and candidate corridor in
cyan. The 0.13 m exit/courtyard midpoint agreement is model-to-model compatibility,
not an independent source measurement or residual. Ground edges beneath roofs and
hidden recesses are not traced. Roughly 1–2 m local uncertainty does not include
the much larger discrete opposite-host alternative.

`main-entrance-before.png` is from the unchanged PR112 worktree (bb3f13b), using
the same entrance at/look bookmark. Before uses the original chase camera; after
uses the new clearance camera. These are functional scene comparisons, not a
calibrated image pair. The distinct main entrance/interior/courtyard/mobile PNGs
are actual canonical-app renders. Source-ID diagnostics in `../silvia-main-map/`
retain the unreviewed catalogue aim; they do not register this candidate to the
source photos.

Validation: production build, 60 Python unit checks, street/terrain/levels and
Silvia source checks; main-browser navigation/render assertions and layout route
suite. The latter uses the same transformed cut-outs and collision rings and
walks street-to-courtyard both ways plus the existing resort routes. Main-browser
assertions check explicit player coordinates and first-person camera state,
including 3.8 m past the exit, rather than treating timed key presses as proof.

The required placement change gate remains **FAIL** (`placement-gate.txt`): no
fresh independently measured placement packet is available. Shared rendering and
collision edits also invalidate existing contextual fingerprints. No verified
edges, invented controls or policy exceptions have been added. This branch is
reviewable but must not be described as deployed or placement approved.

Catalogue diagnostics were successfully rerun for IMG_2190 and IMG_2191 after an
initial screenshot timeout under concurrent browser load. IMG_2190's unchanged
unreviewed aim faces the opposite facade's generic shutters, not the new tunnel.
This illustrates the unresolved direction/identity issue. These captures are not
recorded as matching photo checks, and the task remains in progress. No catalogue
subject was moved to manufacture a match.
