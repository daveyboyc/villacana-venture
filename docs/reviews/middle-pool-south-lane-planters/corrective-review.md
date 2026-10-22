# Corrective source review: square grilles and four tile courses

Independent reviewer: Codex source-review agent
`/root/forecourt_source_review`. Date: 22 October 2026.
Baseline implementation: `cc552a0`. This is a separate correction to the earlier
review, which remains as history. No implementation files were edited by this
reviewer and no placement approval is supplied.

## Before implementation

Reinspected actual full-size IMG_2334 and IMG_2189 after the owner's correction:
window grilles should be squared, and the lane floor is four tiles across.

The earlier review overstated a bowed grille profile by transferring a reading
of IMG_2189's perspective/style into the IMG_2334 build. IMG_2334's photo-right
window shows straight vertical bars, horizontal bands and square side returns.
The current sinusoidally varying depth (`front(t)`) is not established by that
source and produces an excessive rounded belly in the close render. A rectangular
cage with straight bars and a constant projecting front plane is the appropriate
correction. Keep fixed window cages distinct from the separate open entrance gate
and upper balcony rails. Small ornamental curls do not justify bowing the cage's
main vertical profile. Exact projection, bar cross-section/count and dimensions
remain estimates.

IMG_2189 clearly shows four longitudinal terracotta tile courses: three internal
longitudinal grout joints between the side margins. Rows run across the lane, and
the grid follows the lane, not a diagonal pattern. IMG_2334 is consistent with
four principal courses, although side cuts, foliage, wet grout, perspective and
occlusions make some full-width rows less readable. A cut/perimeter edge piece
must not be counted as a fifth full tile course.

The proposed local surface strip can encode four columns across each bounded
section, fitting the retained bed/facade edges while leaving the open doorway
approach passable. UV count is a visual construction requirement. It does not
establish the lane's surveyed width or tile size. A longitudinal pitch around
0.59 m inferred from the provisional model width divided by four must remain
labelled model-derived; it is not an independent tile measurement from these
photographs. The photo count does not authorize silently rescaling the original
house rings, bed outlines, route axes or collision corridor.

The gate identity/source registration and obscured frontage continuation remain
unresolved. Neither a corrected bar profile nor four-column paving resolves the
open placement reports.

## Refreshed render review

Inspected the actual new
`corrections/lane-close-before.png`/`corrections/lane-close-after.png`, the current
`src/middle-pool-lane-frontages.ts`, the bounded clipping call in
`src/boundaries.ts`, the four-column atlas in `src/materials.ts` and the new
`data.paving` sections. Compared their profile/count with the original full
IMG_2334 and IMG_2189. The earlier source-camera after screenshots had not yet
been recaptured at this review point and are not assessed as final corrections.

The correction is visibly effective in the close pair. Window cages now have
straight, square uprights at one constant front projection, horizontal bands and
right-angle side returns; the previous rounded belly is gone. BoxGeometry bars
replace the sinusoidally displaced vertical tubes. The small circular ornamental
motifs remain separately schematic; they do not bend the main cage profile. Brown
shutter backing and the distinction from the foreground open gate remain clear.

The floor now fills the bounded existing model gap with four lane-aligned
terracotta courses. Three principal internal longitudinal joints are visible in
the close after view. The previous narrow diagonal grid and its conspicuous
white border no longer overlay this corrected local floor. In code, one atlas
width contains four columns, one atlas height four rows, and the across-strip UV
span is exactly one atlas width. Longitudinal UV follows the retained gate frame
and the stated approximate 0.6 m pitch. Local changes at bed offsets are encoded
as separate sections; the open doorway approach is not blocked.

`outsideLanePaving` removes the old flat road ribbon only within these bounded
section quads, preserving outside fragments. The clipping orientation, section
ordering and UV construction are consistent with the drawn surface. No new
implementation error was found in the inspected changes or close render. The
original registry/route/bed rings are not rescaled by this correction.

Limits remain: the model gap varies in width, so fitting exactly four columns
slightly varies their model width; the 0.6 m row pitch is estimated, not a measured
source tile. The bounded patch terminates without claiming a whole-lane trace.
The retained view is a third-person app inspection with a player, rather than a
calibrated photograph. Hidden left planting continuation, exact bed and opening
stations, and unresolved gateway correspondence retain their earlier status.

This review confirms the requested **profile and local tile-count correction**
against the actual inspected close render. It is not full source-position
registration or a placement approval. Preserve the earlier report as a record of
the rejected bowed reading and its correction.

### Final recaptured source-camera diagnostics

Subsequently inspected the final
`corrections/IMG_2334-before.png`/`corrections/IMG_2334-after.png` and
`corrections/IMG_2189-before.png`/`corrections/IMG_2189-after.png`. These after
images include the final bounded removal of the old road ribbon. The capture log
reports both views `ok`; this reviewer inspected the saved images, not a separate
rerun of that capture.

In IMG_2334's diagnostic the lane visible through the gate now has lane-aligned
four-column paving with three internal joints, and the window cages read as
straight rectangular side profiles. The earlier diagonal ribbon no longer crosses
that corrected strip. Forecourt, open gate, bench/planters and the unchanged
surroundings remain readable; no new rendering defect was observed.

IMG_2189's diagnostic shows the correction only in the distant bounded entrance
section; the nearby historical paving and buildings remain outside the patch.
That visible endpoint is intentional scope, not evidence that actual paving
changes there. This view still cannot establish correspondence to IMG_2334's
gateway or validate the source's whole lane. The close corrected pair remains the
clearest inspection of grille shape and tile count. All registration, hidden-end
and model-width limits stated above remain open; no placement approval follows.
