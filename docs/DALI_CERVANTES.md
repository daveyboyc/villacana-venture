# Pintor Dalí and Calle Cervantes photo references

Sources: the eleven new photos IMG_2260–IMG_2270 in Dave's [Villacana Drive folder](https://drive.google.com/drive/folders/1y7ry8rugG_qdLqrmMuBfJdJv6VJPgELQ), uploaded 12 October 2026. Original files remain in Drive. The map uses web-sized JPEG copies without embedded EXIF, plus explicit map coordinates, headings and reported GPS accuracy in the manifest.

- IMG_2260–2261: white terraces, small lawns, palms and flowering climbers at the Cervantes junction. These positions have 10–12 m reported GPS uncertainty.
- IMG_2262–2265: the terracotta pedestrian route and junction, white curbs, clipped planting and a drainage grate. Opposing headings establish the lane toward Dalí and back into the resort. GPS uncertainty is about 4–5 m.
- IMG_2266: Calle Cervantes exits onto the Pintor Dalí asphalt parking road, beside a white planter and opposite the hedge. GPS uncertainty is 14 m, so this is a visual cross-check rather than a precise anchor.
- IMG_2267–2268: the house-side footpath, grass strip and parking bays, seen in opposing directions. GPS uncertainty is about 3 m.
- IMG_2269–2270: the asphalt lane, perpendicular parking on the house side, and a chain-link fence with hedge/tree screening on the outer side. GPS uncertainty is about 5 m.

The aerial was rechecked closely against the Cervantes route: its west end connects to the parking along Pintor Dalí, and its east end connects to the Picasso car park. Both are now explicit, named car-park areas on the blueprint, with marked Cervantes entrances. The Dalí car-park area includes the asphalt aisle as well as the house-side bays.

Google’s satellite and standard maps, together with walking-route checks, place Calle Pintor Dalí and the straight Calle Miguel de Cervantes axis. The Dalí parking and photographed outer fence remain offset from that checked street line. Road/path widths, bay dimensions, fence height and extent are approximate.

Dave identified the pedestrian-lane photos as Cervantes. Google confirms the full name **Calle Miguel de Cervantes** and its straight connection between Dalí and the Picasso car park. The axis is angled slightly across the 26° block frame; it is not a horizontal line in that frame. Its eastern end joins the unnamed car-park access aisle. The named **Calle Pintor Picasso** lies along the other side of the car park. Local sub-metre refinements keep the player clear of original registry frontages. All building and pool footprints now use the original registry shapes, with no active frontage setbacks. The photos still establish the ramp and drain, not measured elevations.

`data/dali_cervantes.json` is the source of Dalí, Cervantes, parking, fence and walk anchor; `data/street_layout.json` records the adjoining Google/photo-checked streets and their source precision. `data/dali_photo_reference.json` records the per-photo observations. The skeleton incorporates these into `boundaryReference` and the street list. Both game views use the same fence line for visible mesh and collision rectangles: sprinting or jumping does not bypass the fence. Its end points are not an invented perimeter around the whole resort.

On the blueprint, use Parking & fence, Photos, Walk Dalí, and Walk Cervantes. Walk Cervantes starts at the Dalí junction facing along the connecting lane. The existing main car-park polygon and rows of bays are now rendered in 3D, using the same geometry as the blueprint. In the photo viewer, GPS uncertainty is displayed alongside the capture date. Previous/Next controls make co-located photos accessible without moving their pins. The dedicated walk starts on the road, projected from IMG_2269's reference position.

Validation: registry/map checks, street-route checks against houses and pools, stripped EXIF checks for all eleven web photos, and actual Player sprint/jump collision tests against every fence segment. The latter stopped the player's centre about 0.52 m from the fence centreline, matching player radius plus fence thickness.

The ramp visible in IMG_2262 and IMG_2265 is now represented at the Cervantes/Elena junction with a terracotta slope, upper landing, white edging/retaining faces and a transverse drain at its foot. Road vertex heights drive both rendering and player ground height in both game views. The estimated rise is 0.4 m over about 7 m; placement, height, length and the gradual western approach remain approximate rather than a measured elevation survey. Original house and pool footprints are preserved. Open `slice.html?pool=north,middle&view=ramp` to inspect the ramp from its lower end. The blueprint marks its location.

## Dalí refitted to the house boundaries (2026-10-13)

Dave reported that Pintor Dalí sat too close to the houses. Measured against the
registry outlines, the bay outline ran inside house footprints in places and the
carriageway edge came within 0.8 m of a house. The road has been refitted
between the photographed fence and the registry house fronts, and checked by eye
against the aerial:

- One 4 m lane running 0.4 m inside the fence (was a 6 m carriageway).
- Nose-in bays 4.4 m deep on the house side, drawn only where a full bay stands
  at least 0.8 m clear of a house front. `parking.runs` lists those stretches.
  Elsewhere, where the aerial shows cars parked along the lane, no bays are drawn.
- Cervantes, Eva and Jorge are carried on to meet the new centre line.
- `check_street_layout.py` now fails if the bays come within 0.6 m of a house or
  the carriageway within 1.5 m.

Still approximate: the fence itself was not moved, and at the north end (by
Loira) the aerial suggests the real road is 1 to 2 m further west than the fence
is drawn. Bay spacing and which stretches are nose-in or parallel are estimates.
