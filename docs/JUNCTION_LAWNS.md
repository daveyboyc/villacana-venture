# Cervantes / Elena junction lawns (#45)

IMG_2329 and IMG_2342 show the same pollarded tree near the junction corner,
beside low white edging and a drainage grate. IMG_2358 and IMG_2367 show three
distinct clipped trees beside the lane: two on the nearer lawn, and one beyond
the front-door approach. IMG_2260 corroborates the last two and that approach.

`data/junction_lawns.json` records the three estimated positions, sizes and
individual evidence. `src/junction-lawns.ts`, called by the existing frontage
builder, uses the existing pollarded-tree sprite. The shared sprite guard keeps
the complete visible footprint clear of named routes and omits it in Layout.
Existing scene draping places it on the site levels. No collision is added.

The existing lawn rings and white-kerb outlines in `frontage_divisions.json` are
retained and now cite the additional ground and roof views. Those images support
the relationship of lane, lawns and door approach, but do not supply a calibrated
metric trace. Sizes and positions remain estimates within those approximate
outlines; no registry footprint, lane or level has been moved.

`python3 scripts/check_junction_lawns.py` checks photo citations, the full tree
footprints inside their lawns, named-route clearance including the guard margin,
the door approach, houses/pools, and matching lawn/kerb outlines. Render acceptance
and the standard browser regressions remain required before marking the task done.
