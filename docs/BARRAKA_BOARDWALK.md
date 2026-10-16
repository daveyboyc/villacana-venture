# Barraka timber beach access and optional furniture (#42)

Sources inspected: barraka-beach contact sheet, IMG_2346, IMG_2347,
IMG_2223 and IMG_2225 at full web-copy resolution, and the georeferenced aerial.
The photographs support weathered green/brown transverse timber boards, a white
painted two-tier planted BARRAKA BEACH sign, thatched parasols, and wooden beds
with cream cushions on the right of the aisle looking seaward. The blue/white
plastic loungers on the other side are a distinct type and remain unmodelled.

`data/barraka_boardwalk.json` owns this feature independently of the coast and
paseo. `src/barraka-boardwalk.ts` supplies identical sections to the reference
map and the walk scene. Planks follow the existing seaside height function, with
a 6.5 cm visual offset and no collision lip or ground-height change. The shared
route guard now includes this aisle. All furniture is Details only, checked by
its entire visible envelope against the paseo, lanes, coastal access and aisle.
No house/pool registry footprint, shoreline, paseo source or terrain is changed.

## Independent anchor and limits

The visible aerial access leaves the southeast corner of the restaurant roof.
On the native 1792-square `public/map/ground.jpg` it runs approximately from
pixel (1508,914) to (1558,972). Applying `ground.json` bounds gives roughly
[30,121] to [42,135] in map metres; this is the short modelled segment. The sign
and three representative parasol/wooden-bed pairs are placed relative to this
run and the adjacent southwest seating patch. Width (1.65 m), furniture sizes,
individual seasonal positions and the precise visible end are estimated.

The IMG_2347 camera pin [35.3,96.5] lies inside the unchanged registry building
6465801UF1366N_part5, about 25 m inland of the independently anchored boardwalk.
An exact render from that stored pin is obstructed by the building. The pin
is not used as a subject coordinate and has not been silently corrected. An
additional illustrative context render at [29,126], bearing 125 degrees, shows
the new feature from an estimated nearby viewpoint; it is not a calibrated
match to the original photograph. The before/after pair from the original pin
is retained as evidence of the unresolved disagreement.

The hidden connection to the paseo is not independently established. No extra
passage across that building, full beach furniture layout, new pavilion or
extension to the changing shoreline is invented. Check this join with the
paseo retrace and restaurant modelling issues before extending the feature.

Checks: `scripts/check_barraka_boardwalk.py` verifies citations, visible segment
extent, registry/pool preservation and full furniture envelopes. The dedicated
`scripts/test_barraka_browser.cjs` exercises actual THREE planks on seaside
heights, Layout/Details visibility and rejection when a route covers furniture.
The standard handover source checks, type check, production build and both
browser regression suites must also pass before marking the task done.
