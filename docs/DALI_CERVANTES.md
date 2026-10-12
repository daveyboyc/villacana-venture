# Pintor Dalí and Calle Cervantes photo references

Sources: the eleven new photos IMG_2260–IMG_2270 in Dave's [Villacana Drive folder](https://drive.google.com/drive/folders/1y7ry8rugG_qdLqrmMuBfJdJv6VJPgELQ), uploaded 12 October 2026. Original files remain in Drive. The map uses web-sized JPEG copies without embedded EXIF, plus explicit map coordinates, headings and reported GPS accuracy in the manifest.

- IMG_2260–2261: white terraces, small lawns, palms and flowering climbers at the Cervantes junction. These positions have 10–12 m reported GPS uncertainty.
- IMG_2262–2265: the terracotta pedestrian route and junction, white curbs, clipped planting and a drainage grate. Opposing headings establish the lane toward Dalí and back into the resort. GPS uncertainty is about 4–5 m.
- IMG_2266: the path exit onto the asphalt parking road, a white planter and the opposite hedge. GPS uncertainty is 14 m, so this is a visual cross-check rather than a precise anchor.
- IMG_2267–2268: the house-side footpath, grass strip and parking bays, seen in opposing directions. GPS uncertainty is about 3 m.
- IMG_2269–2270: the asphalt lane, perpendicular parking on the house side, and a chain-link fence with hedge/tree screening on the outer side. GPS uncertainty is about 5 m.

The existing OSM centreline of Calle Pintor Dalí is reused (way 47117791). Asphalt replaces its older gravel description for this photographed reference layout. Road width, parking dimensions, fence height and the continuous fence extent are approximate. The fence sits on the outer edge; parking remains inside the boundary on the house side.

Calle Cervantes is named from Dave's identification. Its western segment is traced from Dalí across the north-block junctions. At Dave's request, the lane now continues east through the clear corridor between registry footprints, bends around the eastern terrace block, and enters the main car park at the Calle Pintor Picasso aisle. This eastern continuation is approximate and is not presented as a measured photo survey. The initial straight trace crossed registry buildings and was corrected through the open corridor. Both connection endpoints meet the mapped road/aisle; actual-player tests traverse the full route in both directions with the real building, garden-wall and fence collisions. No house or pool footprint was changed.

`data/dali_cervantes.json` is the source of the roads, parking, fence and walk anchor. `data/dali_photo_reference.json` records the per-photo observations. The skeleton incorporates these into `boundaryReference` and the street list. Both game views use the same fence line for visible mesh and collision rectangles: sprinting or jumping does not bypass the fence. Its end points are not an invented perimeter around the whole resort.

On the blueprint, use Parking & fence, Photos, Walk Dalí, and Walk Cervantes. Walk Cervantes starts at the Dalí junction facing along the connecting lane. The existing main car-park polygon and rows of bays are now rendered in 3D, using the same geometry as the blueprint. In the photo viewer, GPS uncertainty is displayed alongside the capture date. Previous/Next controls make co-located photos accessible without moving their pins. The dedicated walk starts on the road, projected from IMG_2269's reference position.

Validation: registry/map checks, street-route checks against houses and pools, stripped EXIF checks for all eleven web photos, and actual Player sprint/jump collision tests against every fence segment. The latter stopped the player's centre about 0.52 m from the fence centreline, matching player radius plus fence thickness.
