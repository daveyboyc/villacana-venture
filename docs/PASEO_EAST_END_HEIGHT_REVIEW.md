# Paseo east-end height: issue #40 evidence review

Reviewed 15 October 2026 after `paseo-retrace-line` (#35), commit `776d892`.
Task `paseo-east-end-height` remains in-progress and evidence blocked. Issue #40
stays open. No terrain, pool, beach, wall or paseo heights are changed.

## Observations

Reviewed the paseo contact sheet, the public full-size copies of IMG_2227,
IMG_2226, IMG_2350, IMG_2349, IMG_2352 and IMG_2354, the private originals of
IMG_2227/2226, the ground aerial and the current level data. The latest
`docs/LEVELS.md` and `data/levels_survey.json` corroborate the south-lawn wall
height but contain no independent east-end garden/paseo height observation.

IMG_2227 shows a relatively thin sandstone band below the fence, ending by the
corner garden. IMG_2226 gives the adjacent main-pool/Barraka context. These
beach views do not expose a continuous paseo surface at the wall foot: foreground
sand, vegetation and perspective prevent reading the complete retaining height.
The apparent band therefore cannot be converted into a surveyed height.

IMG_2350 looks east along the paseo towards the wall termination. The visible
stone/fence proportions remain broadly comparable towards that end, supporting
the concern about a model wall that grows to 3 m. The distant foot and garden
floor are not resolved well enough to distinguish a change in paseo height from
a change in the garden ground behind it. IMG_2349 fixes the wall beside the south
pool, while IMG_2352/2354 show the western stretch; none supplies that missing
east-end cross-section. The aerial establishes plan position, not ground height.

## What produces the model discrepancy

The paseo profile in `data/main_pool.json` changes from height -1 m at turned
x = -110 to -3 m at x = -76. The wall top follows inland ground rather than a
stored wall height (`src/paseo-wall.ts`). Against the approximately level inland
ground, this produces the following nominal retaining differences, excluding
coping and the buried mesh extension:

| Wall-face turned x | Paseo height | Nominal retaining difference |
| --- | --- | --- |
| -110.67 | -1.00 m | 1.00 m |
| -96.48 | -1.80 m | 1.80 m |
| -81.94 | -2.65 m | 2.65 m |
| -73.51 (east endpoint) | -3.00 m | 3.00 m |

These are outputs of the existing interpolation, not observations. The profile
coordinates are approximate and the photographs do not determine a replacement
profile. A lower garden could also yield a low wall without changing pool level;
that alternative is equally unmeasured. Dave's 3 m main/children's-pool drop and
the latest terrain work are retained.

## Observation needed to continue

> At the east end of the sandstone wall by Calle Guillermo, is the coping about
> waist-height above the paseo, and do the garden/house floors fall towards the
> main-pool lawn? Please take a side-on view showing the paseo surface, wall foot,
> coping and garden floor together, ideally with a person or measured reference
> beside the wall, plus a view along the paseo towards the pool lawn showing any
> ramp, steps or change of grade.

That cross-section and connection would distinguish paseo grade from inland
garden grade. Revisit the appropriate ground surface only once established;
changing the main-pool level requires independent evidence.

## Verification limits

`check_pool_levels.py` and `check_paseo_wall.py` pass on the reviewed baseline.
Their reported 0.4–3.0 m wall range verifies consistency with the model rules,
not photographic fidelity. A baseline camera-render attempt using system
Chromium timed out during screenshot capture; no completed render or visual
acceptance is claimed. There is no after render because geometry is unchanged.
The queue, area notes and survey photo request record this unresolved work.

For this review, `build_references.py --check`, `check_levels.py`,
`check_pool_levels.py`, `check_paseo_wall.py` and the ten photo-assignment tests
all pass after regeneration. Production and browser checks are not rerun for
these documentation/data-note changes; no geometry acceptance is claimed.
