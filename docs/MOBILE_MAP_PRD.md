# Mobile map overview and surface detail

## Problem
On phones, a left-hand touch becomes a walking joystick before a second finger
can pinch. The 3D toolbar and reference tools wrap over much of the map, and the
2D fit action is far along a scrolling bar. Ground detail baked into a single
2048-pixel image becomes coarse when viewing multiple courtyards.

The requested PRD skill was unavailable in this session; this document records
the requirements and acceptance criteria directly.

## Required experience
- Reach zoom in, zoom out and Fit area without scrolling in the 3D walk. Fit area
  enters a north-up top-down overview; Walk returns to walking height.
- Pinch anywhere on the 3D canvas with two fingers, including one finger on each
  half. Pinching must stop joystick movement and must not leave movement stuck
  after release, cancellation, or switching view.
- Zoom out beyond the fitted overview; Fit area restores a useful starting view.
- Keep primary camera controls on one row on phones, with rotation and alignment
  tools behind More. Reference tools scroll instead of covering additional rows.
- Put Fit whole resort beside the 2D map zoom buttons.
- Show the same grass and paving materials on mobile and desktop, in Layout and
  Details. Repeating grass detail uses a fixed metre scale rather than stretching
  across the resort. Preserve existing lawn masks, pools, heights and footprints.
- Respect screen safe areas and provide at least 44-pixel camera tap targets.

## Acceptance
Browser regression checks cover 390×844, 320×568 and 844×390 touch viewports,
zoom buttons, cross-screen pinch, pan/rotate, cancellation, fit/reset, view
switches, 2D fit discoverability and desktop controls. Render the real grass
material on mobile and desktop and verify visible variation, opaque coverage,
matching output and absence of shader errors. Retain before/after screenshots.
Run the production build, reference consistency, photo assignment, structural
source checks, layout browser regression and overview regression.

## Scope and limits
The private villacana-reference repository supplies the existing photo evidence;
no source images need changing or publishing. The public villacana-venture
repository owns controls and materials. This work changes presentation and input,
not surveyed geometry, collision or claims of photographic accuracy. Tiny grass
blades should naturally blend at whole-resort distances through mipmapping.
