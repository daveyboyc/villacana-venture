# All tunnel entrances are single doors

The owner clarified that every entrance should be a simple single wooden door
with a round gold knob. The earlier correction incorrectly affected only the
inner recesses, leaving the nearer entrances as doubles. This fixes all four.

Every entrance now has one plain brown leaf, at most 0.88 m wide, and exactly one
spherical gold knob. Wider near bays have white side infill around their single
doors. There are no double-door seams, panel pairs, louvres or lever handles.
Bay positions, recess depths and collision footprints remain unchanged. Earlier
paired-door interpretations remain history and are superseded by the owner.

The regression now inspects EACH of the four door groups, checking normal leaf
width, exactly one sphere knob, and absence of old double-door decorations. It
also verifies the clear central route in both directions and solid side doors.
The source/headroom/foliage check, 10 reference-pack tests, deterministic pack and
176-reference catalogue checks, TypeScript and production build pass. The actual
new render has zero browser page errors. Contact sheets regenerate identically.
The world-placement audit remains open; this correction does not claim measured
placement or attach the study to an invented resort-map footprint.

- [Previous near double doors](interior-before.png): the earlier published study
  interior, retained for comparison of the near entrances.
- [All-single-door interior](interior-after.png)
- [Recess close-up](right-recess-after.png)
- [Cutaway](plan-after.png)
- [Browser results](browser-results.json)
- [Independent review](review.md)

Live study: `/?view=walk&study=silvia&details=1`. The corrected near doors are
visible from **Entrance** and **Inside**, not only from the inner-recess presets.
