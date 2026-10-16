# North pool issue #36: reconciled review draft

The 15 October levels survey supersedes the earlier northwest patio model.
Issue #36 remains **open**, blocked on `raised-terraces` (#54). This branch adds
review material only; its final diff against main changes no terrain, geometry,
collision, houses, pool footprints, ground sampler, rendering or browser tests.

## Two distinct structures

| Survey item | Scope | Level above lawn path | Steps | Owner |
| --- | --- | --- | --- | --- |
| `north-pool-north-patios` | Lower ground-floor patios across the north side | 0.25–0.4 m | One or two white-nosed steps in the observed openings | #36 |
| `north-pool-west-stair` | Northwest terrace, curved retaining frontage and tiled stair with handrail | 0.9–1.1 m | Six risers | #54 |

Read `docs/LEVELS.md`, `data/levels_survey.json`, and the updated
`refs/issues/north-pool-garden-walls.md` before implementing. #36 must use the
raised-terrace module supplied by #54, without raising the pool, lawn or houses.
Its white north-patio plinth walls are about 0.3–0.4 m high, with hedges above.
The original issue title/build paragraph also mentions metre-high curved walls;
that wording must not be used to transfer the northwest terrace back into #36.

## Evidence retained and hypotheses withdrawn

IMG_2204, IMG_2205, IMG_2207, IMG_2208 and private photos 03–07 were inspected
full size, together with the contact sheet, aerial and registry outlines. They
show the northwest retaining frontage and tiled stair separately from the lower
plinth walls and small steps across the lawn. Camera pins remain camera locations.

The earlier implementation is preserved at `4ad9519`. It added a five-riser,
0.75 m flight and local plateau under issue #36. That level/riser interpretation
and task ownership are withdrawn. Commit `cbdf902` removes the implementation;
the following merge brings in the updated survey and main's terrain. The
western/middle-pool terrain and steps are retained exactly as main supplies them.

`docs/reviews/issue-36/trace-draft.json` preserves the exact old candidate wall
polylines and paving arc for later comparison. They are **not runtime data** and
are not imported by the game, map, collision or reference-feature builder. Their
northwest frontage belongs to #54's review, rather than an implementation of #54
on this branch. No candidate wall fragment is sufficiently tied to an individual
lower north-side patio to retain as live #36 geometry.

The old claim of 1–2 m registration accuracy is withdrawn. Its stair foot at
(-181.9, 12.0) lies about 7.5 m from the new low-confidence survey centre
(-187, 17.5), outside the survey's stated ±6 m. These coordinates therefore need
re-registration; passing collision tests would not settle that discrepancy.
The survey's separate north-patio centre (-166, 8) has ±8 m uncertainty and does
not identify each opening or boundary endpoint.

## What unblocks #36

1. #54 provides the shared terrace outline/floor/faces/openings/stair and player
   ground-height module, with its own northwest terrace implementation.
2. Trace each lower north-side patio and visible one/two-step opening against
   registry frontages using IMG_2204/2205/2207. Preserve unseen boundary ends as
   unknowns; the historical northwest arc is not a template for repeated walls.
3. Build those patios to the survey's 0.25–0.4 m range through that module, keeping
   map, mesh, collision and ground height consistent, then perform the required
   camera, movement, build and browser acceptance checks.

## Validation scope

This reconciliation runs the source checks including `check_levels.py`, photo
assignment validation and reference generation/`--check`. It also verifies that
terrain and source files match main. Earlier browser/camera outputs in ignored
`layout-checks.local/issue-36/` describe the withdrawn model and must not be used
as acceptance evidence for this review draft. No new browser jobs are queued.
