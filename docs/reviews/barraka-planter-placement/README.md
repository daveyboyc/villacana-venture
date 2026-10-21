# Barraka: correct the restaurant flank before the planter

The two linked originals are IMG_2346 and IMG_2347. They clearly show the planted
BARRAKA BEACH sign, cooking boat and thatched cooking shelter to the **left of
the green wooden path when looking towards the sea**. The boat is farther
seaward than the sign. This relationship is confirmed by the project owner and
[independent inspection of the actual originals and maps](independent-source-review.md).

The concrete model error is the anchor: the current aisle starts beyond the
restaurant's southwest/seaward corner, on the opposite restaurant flank from the
one the owner identifies. Moving just the planter across that old aisle would
retain the error. The proposed correction moves the aisle to the northeast flank
and carries the planter with it, retaining the photographed left-side relation.

## Sources and frame inspected before geometry changes

- Drive originals [IMG_2346](https://drive.google.com/file/d/1uZX4ixz0rYBGp-qL1nFeh77ItS_bTBhh/view)
  and [IMG_2347](https://drive.google.com/file/d/1ltk9Ij2tLsPTQS6Klg5SYfqVSLBDOGyc/view),
  both decoded at 4284×5712 outside the public repo; public 1200×1600 copies also inspected.
- Original 1792×1792 georeferenced Esri aerial and `ground.json` bounds; unchanged
  restaurant registry footprint `6364501UF1366S_part8`; nearby registry context.
- Private Barraka contact sheet, Apple main-pool/restaurant view 05, Google
  satellite and standard-map screenshots 02/01; public IMG_2223 at full web-copy
  size confirms the boat's logs and smoke. The Google and Apple screenshots crop
  or obscure the northeast restaurant flank and cannot measure this placement.

Common frame remains +x east and +z south in metres. The existing aerial bounds
map pixels with `x=-332.27+u*430.36/1792`,
`z=-98.38+v*430.37/1792`. No local warps, registry translations or source-image
deformation are used. Identifiable restaurant roof corners agree with the
registry to approximately half a metre in the sampled picks, with roof/parallax
and picking uncertainty still present. This is a local image/registry diagnostic,
not proof of absolute survey accuracy or a visible wall toe.

The wider site registration and its independent Google/Esri validation landmarks
remain documented in the [north-pool alignment audit](../north-pool-alignment-audit/README.md).
Its cross-source residuals do not establish planter coordinates. This smaller
comparison uses the existing fixed aerial frame, three local roof diagnostics
and a held-out southern roof corner; it is not a complete placement packet.

## Comparison artifacts

- [Old versus candidate aisle/sign overlay](alignment-comparison.png), identical
  Esri crop/frame with unchanged restaurant registry ring.
- [Pixel observations and displacement](observations.json).
- IMG_2346 [before](IMG_2346-before.png) / [after](IMG_2346-after.png);
  IMG_2347 [before](IMG_2347-before.png) / [after](IMG_2347-after.png).
  Each pair uses that photo's unchanged stored pin and the same illustrative
  look-at `[38,106]`, with Details enabled. Third-person camera offset,
  foreground obstruction and missing boat/hut prevent a photographic match.
- [Independent source review](independent-source-review.md), including review of
  the actual final draft renders against the originals.
- [Validation and outstanding evidence gate](validation.md).

## Discrepancies and proposed correction

| ID | Evidence and observed difference | Proposed change | Confidence / limits |
| --- | --- | --- | --- |
| B-01: `barraka-boardwalk` | Owner identifies northeast flank. Existing axis `[30,121]→[42,135]` departs beyond the opposite, southwest roof corner. | Proposed axis `[31,101]→[43,115]`, a `[+1,-20]` m change from the old run; retain estimated width 1.65 m. | High confidence in wrong flank; candidate axis/endpoints remain estimated, with several metres of identification uncertainty. The pale aerial strip may include roof/facade edges. |
| B-02: `barraka-sign-planter` | Both photos put sign left of green aisle; old centre `[35,122]` inherits the wrong aisle anchor. | Carry the local arrangement to candidate `[36,102]`, approximately 20 m from old centre; retain estimated dimensions. | Side/order confirmed; centre/corners are not directly visible in aerial. This is a reviewable layout proposal, not ≤2 m approval. |
| B-03: sign orientation | In photos its lettered face looks back towards the inland approach; existing yaw puts its long axis approximately along the aisle. | Orient the sign across the shared aisle direction, facing the inland approach. | High confidence in facing/order; exact angle remains estimated. |
| B-04: cooking boat and hut | Both originals put them left of aisle; IMG_2223 distinguishes the cooking boat from the planter. | Preserve separate labelled subjects and follow-up modelling work; do not infer precise footprints from ambiguous aerial objects. | Presence/side/order clear; ground extents and dimensions unresolved. |
| B-05: camera interpretation | Previous “25 m inland” claim compared GPS with the wrong southwest aisle. | Retract that claim; retain original GPS and uncertainty. | A pin inside non-standing registry part5 is not a standing-building obstruction. Exact camera calibration remains unavailable. |

The model coordinates above describe a **candidate correction**, not independently
measured endpoints or approval of the full area. The comparison must show old and
candidate positions together. The new evidence gate remains in force: this task
stays in progress and the placement dispute stays open until a complete measured
packet receives independent approval. No approval is fabricated from the owner's
side description, an illustrative render, or software PASS.

## Source limits and preserved history

IMG_2346 clearly shows the sign and hut; foliage hides the planter's rear contact
and the hut's lower perimeter, while the frame cuts most of the walkway. IMG_2347
establishes both sides of the aisle and the boat beyond the planter, but crops the
planter and hut on the left. Neither has a calibrated camera or surveyed scale.
IMG_2223 is useful for hull construction/logs and local side relationship, not a
whole restaurant footprint. Aerial dates and movable beach-object positions differ.

The citations on northern registry parts `6465801UF1366N_part5/part6` support their
**absence as standing buildings**, as documented in `registry_corrections.json`.
They are retained. They must not be mistaken for evidence identifying the cooking
hut or the actual Barraka roof. Earlier reviews are preserved with this correction
to the aisle interpretation.

The automatic photo association now excludes these `notStanding` records from
solid-camera warnings and visible-building suggestions, while retaining their
evidence citations. A camera inside an absent registry structure is not evidence
of GPS drift or a blocked view.
