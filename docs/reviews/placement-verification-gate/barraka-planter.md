# Barraka planter placement discrepancy

Reported by the user in this conversation on 18 October 2026: the BARRAKA BEACH
planter is in the wrong place. This is an open placement report, not an independently
measured correction. Its current centre is [35,122], estimated in
`data/barraka_boardwalk.json`. No replacement coordinate is asserted here.

Inspected full public IMG_2346 and IMG_2347, the Barraka contact sheet and the
georeferenced Esri aerial. Photos establish the two-tier planted sign beside the
thatched hut, to the left of the boardwalk looking seaward, with the separate
sand-filled barbecue boat farther along. They do not by themselves establish a
surveyed coordinate. The old documented photo camera [35.3,96.5] conflicts with
the aerial-anchored beach access; content identification did not validate that pin.

Earlier review documentation exists in `docs/BARRAKA_BOARDWALK.md`. Its illustrative
context view and software checks do not establish that the sign's coordinate or
orientation matches the source. The browser test checks one sign plus three
seating groups and route clearance; the Python check protects geometry consistency.
There are no modern sign-specific comparison records. This report preserves those
limits and blocks graph placement verification until fresh measured evidence and
an independent approval resolve it.

Follow-up task: `barraka-planter-placement`. Recheck the boardwalk anchor, hut,
planter and boat together. Register imagery to fixed landmarks, reserve independent
validation points, record offsets and uncertainty, and compare the actual Details
render with IMG_2346/2347. Leave placement unresolved if the available sources do
not support a sufficiently precise correction. Do not move it to the phone GPS.
