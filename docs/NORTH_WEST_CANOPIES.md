# North pool: the marked western gap (#95)

The user marked the gap between the long western row
`6165501UF1366N_part5` and the separate house `6165501UF1366N_part2`.
The screenshot is rotated: Dalí is along its bottom edge. Registration against
the separate house's four roof corners locates this gap independently of the
northern patio band completed in #36.

The georeferenced Esri aerial shows three separate terracotta roof projections
along this frontage. Private Apple Maps north-pool views 02, 08 and 09 confirm
tiled canopies above upper-floor balconies. Layout previously omitted these
roofs because it hides generated porches; those illustrative porches also did
not trace the observed individual footprints.

`data/north_west_canopies.json` records three differing roof plans. Rear corners
meet the unchanged registered facade with a 0.05 m mounting overlap; front edges
follow the independently reviewed aerial estimate. Plan accuracy is about ±1 m.
The 5.4 m rear and 4.8 m eave heights above the house datum, thickness and pitch
are estimates, not measured levels. These canopies stay structural in Layout
and Details; overlapping generated porches are suppressed. The map uses their
same roof polygons. No ground-level collision, enclosure, post, floor change or
hidden balcony division is inferred.

IMG_2206/2208 provide courtyard context but their visible brown garden doors
register farther toward the pool, outside the marked gap. They are not cited as
proof of these roofs. The actual private reference IDs appear in the evidence
graph and area brief without publishing the source imagery.

The supplied screenshot also lacks the lawn and pale pool deck. Fresh north-only
and whole-resort captures both retain those surfaces, and the deployed cover
image matches the repository. That screenshot discrepancy remains unreproduced;
this roof correction does not claim to fix it.

Independent review checked the aerial, oblique references, data, source and
paired top/oblique renders. See [the comparison images](reviews/issue-95/README.md).
This corrects the identified missing roofs; concealed ground layout remains
untraced. House/pool footprints, the northwest stair/terrace and ground levels
are unchanged.

Validation includes `scripts/check_north_west_canopies.py`, private-source
citation tests, the standard source checks, TypeScript/build and browser tests.
The layout test checks actual roof mesh height/footprint, map presence and
headroom above unchanged ground, alongside all named walking routes.
