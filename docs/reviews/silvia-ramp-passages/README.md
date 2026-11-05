# Silvia 2-20 / 22-44 ramp passages (task silvia-ramp-passages)

Photo-relative study (`silvia-ramp.html`, `src/silvia-ramp-passage.ts`, `data/silvia_ramp_passages.json`). Not placed in the map, no registry footprint, collision or Walk code changed.

Files: `<photo>-before.png` is the main app from the photo's pin and looksAt (the 1-15 west tunnel, or a plain lane for IMG_2574); `<photo>-after.png` is the study from an uncalibrated eye-height camera; `<photo>-comparison.png` puts photo, before and after side by side. Regenerate with `node scripts/shoot_silvia_ramp.cjs` and `node scripts/shoot_views.cjs <photos> --task=silvia-ramp-passages --as=before`.

What the photos establish: two passages on Calle de Silvia (plaques 2-20 and 22-44) share a porch with a red studded rubber ramp beside two plain terracotta treads and a third riser carrying the landing, brown panelled double doors with barred windows, a pebble mat, an arch and lanterns.

Open and not claimed: world position and host building of either passage; surveyed sizes, riser height and ramp slope; the main map's west tunnel (built from the 1-15 photos IMG_2190/2191/2668 taken from the same pin facing east) probably shows the wrong passage for that side of the lane (task silvia-west-passage-swap); the Patricia arch chain and the south-block arcade are unbuilt (tasks patricia-passage-reference-pack, jorge-south-arcade-identity).

Checks: `scripts/check_silvia_ramp_passages.py`; the placement change gate fails for the new feature because no measured, independently reviewed packet exists, as intended.
