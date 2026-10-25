# Elena: three straight tile columns

Owner correction and full sources IMG_2201, IMG_2253 and IMG_2330 establish three
columns of plain square tiles, with joints along/across the lane and separate grey
aggregate margins. The previous world-aligned UVs made the path look diagonal.

The north/south ribbons now use path-relative UVs and a three-by-three plain tile
repeat. The north garden-door spur shares the main lane origin, axes and phase so
joints continue through the junction. The canonical map draws the same columns,
courses and grey margins. Underlying paving-mask pixels inside those existing
ribbons are repainted consistently; lawn pixels are not replaced. Other streets,
private courtyards, Silvia's four-column field and patterned tunnels keep their
materials.

Only material/UV and map display change. Original road points/widths, spur ring,
heights, registry/pool footprints and collision stay unchanged. The fitted tile
pitch follows the existing model width; it is not a measured tile dimension or
permission to infer real path width from three tiles. Grey margin width and row
origin remain estimated within the existing model extent.

## Evidence

- [North before](north-lane-context-before.png) / [after](north-lane-context-after.png).
- [South before](south-lane-context-before.png) / [after](south-lane-context-after.png).
- [Garden spur](garden-spur-context-after.png).
- [Independent source/code/render review](independent-review.md).
- [Actual first-ground-hit samples](surface-hits.json), at 10/50/90% of both runs.

All six sampled first ground hits use the corrected paving. The existing visible
floor versus player floor offsets (roughly 0.16–0.25 m) remain explicitly recorded;
this material correction does not certify level/clearance fidelity. Model-context
cameras are uncalibrated; no whole-photo match or placement approval is granted.
Registration and level tasks #144/#148 remain open.

The dedicated browser check tests tile/grout count, rotation at four path angles,
square pitch, garden-spur phase, unchanged vertex positions and canonical map
joints. Full layout/route and standard source/build checks are recorded in the PR.
