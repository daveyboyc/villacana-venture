# Paseo stamped surface

The existing west paseo rendered as flat pink. The new 27 October views
IMG_2481–2483 and close material source IMG_2351 show shallow transverse
board-shaped stamps, fine grain, staggered short joints and worn dusty-rose
colour variation. This pass adds an original procedural surface drawing to the
existing ribbon alongside the retaining-wall frontage. Eastern surfaces retain
their prior material pending their own source review.

`src/paseo-surface.ts` generates the finish without copying source pixels.
Metric UVs accumulate along the original centreline rather than restarting at
each short mesh segment. The 3 m repeat / 0.2 m course pitch are estimates.
There is no displacement or raised decking. Texture variation is schematic,
not a claim to reproduce every photographed groove or weather stain.

## Evidence and limits

- `independent-source-review.md` records independent full-source inspection and
  scoped implementation/render review.
- `surface-atlas.png` is the generated original texture.
- `IMG_2481/2482/2483-before.png` and matching `-after.png` are actual-app renders
  from identical GPS/subject bookmarks, not calibrated photographs. The baseline
  is `8b5e1f8`. Layout mode is used to isolate the visible surface.
- `geometry-comparison.json` compares the old and new seaside functions directly:
  all sand, path and bank positions/normals remain identical; it also checks UV
  continuity and that both bounded and retained material regions exist.
  Reproduce with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node
  scripts/check_paseo_surface.cjs 8b5e1f8` (requires that baseline Git object).

Original route, width, height, wall, mesh fence, edge, collision, terrain and
registry footprints remain unchanged. Existing small ribbon cracks at bends
are visible in both before/after renders; this material pass does not correct
those geometry gaps. Agaves, dry-ground verge and their extents are not added
from guessed coordinates. The existing paseo inventory task remains open for
those boundaries and the next geometry work.

The capture helper now waits for scene-ready state and rejects runtime errors
before taking normal photo-bookmark screenshots; one rejected early blank-sky
capture motivated this fix.

## Status

The material pass is provisionally delivered; the queue task remains in progress
because its inherited horizontal placement has no current independent measured
packet. The placement gate conservatively flags the shared renderer edit.
Geometry invariance and material review do not grant placement approval.
Software outcomes are recorded in validation.json. No Elena scene source changed.
