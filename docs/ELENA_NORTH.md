# Calle Elena north and the steps at Cervantes

Built on 14 October 2026 from the roof photos taken that day (IMG_2360–2365) and
the ground photos of 11–13 October (IMG_2197–2203, IMG_2262, IMG_2286). Before
this pass, Elena north was a tiled strip across open paving. The roof photos show
what actually lines it.

## What is built

`data/elena_north.json`, drawn by `src/elena-north.ts` in the pool scene and by
`src/blueprint.ts` on the reference map. Collision uses the same outlines.

| Feature | From | Notes |
| --- | --- | --- |
| Arched gateway onto the north pool lawn | IMG_2363 | White wall across the gap between the two terraces, 1.5 m opening, arch crown 2.2 m. A brown garden door in its east part faces the patio. Bougainvillea over it in Details. |
| Patio wall, east side, north half | IMG_2363 | Estimated 1.85 m privacy wall with 1.8 m timber door; replaces the incorrect 1.15 m wall/1.0 m door. Gateway return meets the house; one visible divider and bounded first-patio floor are represented. |
| Planting strip, west side, north half | IMG_2363 | Low kerb along the west houses up to the covered walkway. |
| Magnolia bed | IMG_2365, IMG_2364, IMG_2362 | Raised 0.3 m white-kerbed bed of tall glossy shrubs, edged with strap-leaved plants. |
| Two hedged beds with pollarded trees | IMG_2197–2201, IMG_2365 | Boxed by a clipped hedge, spider-plant-like strap leaves inside. A short path to a garden door runs between them. |
| Two white planter boxes | IMG_2201, IMG_2198 | Against the west house front under the barred window. |

Beds, planter boxes and walls are solid; the gateway is open. Generated garden
walls, gates, porch props and scattered planting are suppressed inside the
reviewed band (`review` in the data file), so nothing invented is drawn over the
traced features. Hedges and plants are Details only; beds, kerbs and walls show
in Layout too. The new sprite kind `magnolia` is painted in `src/sprites.ts`.

## Steps beside the Cervantes ramp

IMG_2286 and IMG_2262 show the lane at the Elena junction split in two: a smooth
ramp on the south half and three shallow steps on the north half, with one
drain across the foot. Each step stands a little above the ramp beside it, so
the whole 0.5 m rise happens within about 3 m, not the 7 m the terrain rule used.

- `data/terrain.json` `localRuns` shortens the slope to 3 m where the foot line
  crosses Cervantes, blending back to 7 m over 3 m either side. The rest of the
  foot line is unchanged. `runAt` in `src/terrain.ts` and `run_at` in
  `scripts/check_terrain.py` apply the same rule.
- The ramp record in `data/dali_cervantes.json` now ends at the Cervantes vertex
  3 m up from the drain.
- `data/cervantes_elena_steps.json` and `src/ramp-steps.ts` build the three
  steps: white risers, terracotta treads, risers at 0.4, 0.92 and 1.45 m. The
  player's ground follows the treads (`stepsGroundOffset`), one riser at a time.
- Tread spacing (issue #56, 16 October 2026): IMG_2286, IMG_2355 and IMG_2328
  show the bottom riser one tile row up from the drain and each tread as one
  0.4 m tile plus a grey stone nosing, about 0.5 m. The risers moved from 0.4,
  1.0 and 1.6 m to 0.4, 0.92 and 1.45 m. The 3 m local run is kept: the first
  tread now ends a little over 1 cm above the ramp beside it (it was level, and
  below at the north edge), the second about 9 cm above; a run under about
  2.8 m would sink the first tread. The garden door at the foot
  (`data/cervantes_garden_door.json`) takes its base from the unchanged
  terrain, so its levels are as before. `check_terrain.py` checks the spacing
  and that every tread stays above the ramp; `check_levels.py` compares the
  flight's 0.5 m with the survey.

## Checks

- `python3 scripts/check_elena_north.py`: every feature cites indexed photos,
  keeps every lane's width clear, stays off houses and pools and inside the
  reviewed band; the gateway opening is wide and tall enough to walk through.
- `python3 scripts/check_terrain.py`: the local run is photographed and no
  steeper than 22% (it is 17%).
- `npm run test:layout` now also walks up and down the steps (three risers,
  top level with the ramp), walks through the gateway, and checks every bed is
  solid, as well as all 20 routes both ways.
- `node scripts/shoot_views.cjs IMG_2201 --details` renders the game from a
  photo's camera pin and heading into `layout-checks.local/views/`, to compare
  with the photo by eye.

## Limits

Audit correction (18 October 2026): IMG_2202 shows the covered-building arch looking toward the private paired gates numbered 36/34, also seen in IMG_2361. IMG_2203 looks out the opposite end onto Elena. These are distinct from the lawn gateway in IMG_2363. The former IMG_2202 citations on the lawn gateway and planting strip were incorrect and are removed; no geometry is moved. See [the measured north-pool audit](reviews/north-pool-alignment-audit/README.md).

Positions are traced against the registry fronts and the aerial to roughly
0.5–1 m. Wall heights, the gateway arch, bed sizes and tread lengths are
estimated from tiles and doors in the photos, not measured. Door positions in
the patio wall are approximate. The concealed interiors of the east-side patios
beyond the beds remain unmodelled; their visible enclosure is documented in
ELENA_EAST_PATIOS.md, and the separate private gated entry has its own model.
The garden-door approach
is covered by the issue #34 addition below.

## Garden-door approach (issue #34, 15 October 2026)

IMG_2199, IMG_2200 and IMG_2201 support a short terracotta spur between the
existing hedged beds to a closed brown timber door. `gardenPath` now records
that open approach; it adds no collision. The finite `elena-north-garden-wall`
runs behind the planted beds from `[-151.43, 35.13]` to `[-144.30, 47.36]`,
terminating at the photographed door surround rather than continuing across
untraced patios. The door centre is `[-144.631888, 46.790716]`.

The barred dark window visible looking north sits in a short transverse return
at the north end of the bed, `[-153.69, 36.44]` to `[-151.43, 35.13]`, rather
than in the long wall. Both wall outlines are shared by map and collision;
the window remains impassable and the timber door is visibly closed. The
layout browser regression enters the spur, returns to the lane, and confirms
that forward movement stops at the door. No terrain or registry footprint is
changed. Wall heights (1.85–2 m), window/door dimensions and the alignment
against existing bed backs are estimates, not surveyed measurements. The
unseen east patios and the gated entry west of the walkway remain separate work.

## Front-patio correction (issue #153, 26 October 2026)

The full IMG_2363 recheck supports a full-height wall/door, the gateway-side
return into the house, and one visible divider. Connected Elena wall meshes now
use shared vertex ground instead of independent midpoint offsets. The garden
door has raised shallow curved coping. Plain square tiles cover only the visible
first patio; the garden spur retains the lane's three-column grid phase in both
map and scene. Other private decorative tile fields remain distinct.

The short foliage-hidden connection to the window return is estimated continuity,
and all heights/private floor levels remain estimates. See the [source plan,
before/after views and independent review](reviews/elena-patio-wall-correction/README.md).
