# Independent Barraka source review — 19 October 2026

Reviewer: independent source-review agent (`/root/independent_source_review`). This is source inspection, not software verification or approval of a placement packet.

## Sources inspected

- Private decoded Drive originals IMG_2346 and IMG_2347, each 4284×5712, including native-resolution detail crops of the hut, planter, boat and boardwalk.
- Private `contact-sheets/barraka-beach.jpg`.
- Original 1792×1792 `public/map/ground.jpg`, its `ground.json` bounds, a native-pixel Barraka crop and the unchanged restaurant registry ring.
- Private Apple `05-top-down-main-pool-and-lawn.png`.
- Current `AGENTS.md`, `docs/PLACEMENT_VERIFICATION.md`, Barraka area/task brief and `docs/BARRAKA_BOARDWALK.md`.
- Follow-up inspection of `data/registry_corrections.json`, `docs/SEAFRONT.md` issue #41 history, current `notStanding` registry records and the two photo metadata records.
- User clarification supplied to this review: the green wooden walkway is immediately left of Barraka looking seaward; planter, cooking boat and cooking hut are all left of that walkway.

Private pixels and decoded originals remain outside this public repository.

## Confirmed relationships

IMG_2347 shows the weathered green transverse-plank walkway running toward the sea. The two-tier white planted BARRAKA BEACH sign, sand/ash-filled boat containing logs, and thatched cooking shelter are all to photo-left. IMG_2346 supplies a clearer broad view of the sign and shelter, with the boat beyond the sign. Planting hides the sign's rear/ground contact and much of the shelter's lower structure. The boat is a cooking feature, not a planted boat. The photos show blue/white loungers left of the aisle and wooden cream-cushioned beds to its right; their seasonal layout is not a survey.

The actual restaurant anchor is `6364501UF1366S_part8`, also named by `skeleton.seafront.restaurant.buildingId`. Its nominal ring aligns with the large separate Barraka roof on the Esri aerial. The northern `6465801UF1366N_part5/part6` polygons are separate registry parts, not this restaurant or the photographed cooking shelter. Importantly, the current model deliberately treats both as **not standing**, with floors zero. Their IMG_2346/2347 citations support the absence of the registry structures on the open paseo/sand; they are not false hut-identification citations. Preserve those citations and the earlier issue #41 manual review. My initial description of these as different buildings/false associations was incorrect.

The current aerial is consistent with that absence interpretation: the pink paseo and open pale ground continue through the parts' context without the claimed standing roofs. Current `notStanding` parts are not extruded or structural occluders. A camera inside one of those nominal rings does not imply that the camera is inside a standing building or that the current view must be obstructed. The older obstruction statement in `docs/BARRAKA_BOARDWALK.md` must be assessed in its historical renderer context rather than repeated as current fact.

With +x east and +z south, the local seaward direction is broadly southeast. Its left side is northeast. The current modeled aisle `[30,121] → [42,135]` departs beyond the restaurant's southwest/seaward corner. That is the opposite restaurant flank from the user's clarification. Moving only the planter across the existing aisle would not correct that anchor error.

## Original-pixel observations

World conversion uses the unchanged georeferenced aerial: `x = -332.27 + u * 430.36 / 1792`; `z = -98.38 + v * 430.37 / 1792`. Rounded source picks are diagnostic, not measured ground-wall vertices.

| Observation | Original Esri pixel (u,v) | Approximate world (x,z), m | What it establishes |
| --- | --- | --- | --- |
| Restaurant roof northern corner | 1506,832 | 29.41,101.43 | Identifies actual Barraka roof against nominal registry ring; roof edge is not surveyed wall toe |
| Restaurant roof eastern corner | 1544,876 | 38.54,112.00 | Same roof identification |
| Restaurant roof western corner | 1467,866 | 20.04,109.61 | Same roof identification |
| Restaurant roof southern corner | 1505,911 | 29.17,120.41 | Shows why old aisle starts beyond southwest/seaward end |
| Candidate pale run along northeast flank, inland end | 1510,829 | 30.37,100.71 | Candidate context for the corrected flank; exact walkway identity/centre unconfirmed |
| Candidate run, seaward end | 1560,886 | 42.37,114.40 | Candidate only; do not treat as approved endpoint |
| Small separate roof northeast of restaurant | 1564,832 | 43.34,101.43 | Potential cooking-shelter context; identity and ground extent unconfirmed |
| Elongated object farther northeast | 1590,850 | 49.58,105.76 | Visible seasonal structure/object; cannot certify it as the photographed boat |
| Previously cited old aisle start | 1508,914 | 29.89,121.13 | Different segment beyond restaurant's southern corner |
| Previously cited old aisle end | 1558,972 | 41.90,135.06 | Different segment farther seaward |

The candidate northeast run is approximately parallel to the restaurant's northeast roof edge. A small separate roof and an elongated object lie on its northeast/left side, broadly compatible with the user's description. However, a pale roof-edge/facade strip can resemble paving or timber access in this aerial. These picks do not establish that every selected pixel belongs to the green boardwalk. The earlier southwest segment should not be relabelled as the photographed aisle simply because it is visibly an access surface.

Apple05 corroborates the separate restaurant, pool lawn and beach-access context, but its crop/UI conceal the northeast restaurant flank needed here. It cannot provide independent fine placement of this aisle, planter or boat.

## Camera interpretation

IMG_2347's retained phone camera `[35.3,96.5]` has reported horizontal accuracy ±4.2 m and EXIF true-north heading 125°. Its shortest distance to the old modeled aisle `[30,121] → [42,135]` is approximately **25.1 m**, but this measures against the wrong southwest segment. Against the tentative northeast-flank candidate `[30.37,100.71] → [42.37,114.40]`, the distance is approximately **6.5 m**. The camera lies near the candidate's landward context, northeast/left of its inland end. That substantially weakens the earlier claim that the GPS must be about 25 m wrong.

This is a distance between a phone estimate and a tentative map axis, not a measured GPS error or camera fit. A camera beside the aisle can legitimately lie off its axis; the original photo also places most of the aisle toward image-right. The candidate's identity/position uncertainty and phone uncertainty remain separate. The records are compatible with the northeast-side interpretation, but do not establish an exact camera pose, axis location or planter footprint. IMG_2346 is a nearby view; its original reported GPS accuracy was 14 m, while its current 4.2 m assessment was inherited through a previous content-based association with IMG_2347. It should not be treated as a second independent high-precision camera control.

## Disposition and limits

- **High confidence:** correct restaurant identity; photo-left ordering; current aisle/planter anchor uses the wrong restaurant flank relative to the user clarification.
- **Tentative only:** northeast-flank candidate axis near `[30,101] → [42,114]`. Allow several metres of identification/registration uncertainty; do not claim a tolerance of 2 m or less from these picks.
- **Unresolved:** planter ground centre/corners, exact boardwalk endpoints/width, cooking-shelter footprint, boat identity/outline in the aerial, and the hidden landward join. The photographs have no calibrated pose or surveyed scale. Image dates differ or remain unknown; lightweight cooking/furniture features can move.
- **Not approved:** no final model packet, current proposed render, distributed control/held-out measurements or all-vertex source trace was available to this independent review. No `placement-verified-by` approval is granted. A precise repositioning would require a clearer independently registered view or additional ground-to-plan evidence.

This finding supports correcting the restaurant/walkway interpretation and documenting the wrong-flank discrepancy now. Preserve the legitimate non-standing registry citations and review history. It does not support replacing the old coordinates with another exact-looking estimate or inventing unseen geometry.

## Draft comparison review

Inspected `alignment-comparison.png` and both IMG_2346/2347 before/after diagnostic renders against the original photos and aerial already inspected above. The proposed aisle `[31,101] → [36,107] → [43,115]` now follows the restaurant's northeast flank; the sign `[36,102]` lies northeast/left of that aisle looking seaward. This improves the confirmed wrong-flank relationship and agrees with the owner's stated ordering. I found no source contradiction to this broad relative arrangement. The comparison correctly labels the proposed anchor as estimated and its exact position as unapproved.

The sign's lettering is visible from the landward diagnostic views, consistent with the photographed sign presenting its lettered face to an arriving observer looking toward the sea. This supports the revised facing direction qualitatively; the precise yaw and dimensions remain estimates. Boat and shelter are absent from the model rather than assigned invented footprints, so their pictured relationship is only documented, not visually reproduced.

The after renders show the sign to the left of the planks and actual restaurant wall to their right, improving the relative layout. They do **not** match the whole photographs: the original views contain an open sea horizon, the cooking boat and shelter, planted containers and beach seating, while the diagnostic renders have a large blank restaurant wall, broad shadow and foreground brown geometry obscuring part of the ground. The player and third-person diagnostic framing also differ. These occlusions/framing differences do not establish a newly standing registry structure or prove a GPS error; they prevent a whole-photo agreement claim. The shared stored camera and illustrative look-at `[38,106]` make the before/after pair useful for comparison, not calibrated photo reproduction.

Disposition remains **unapproved draft**. The side/facing corrections are qualitatively supported; the planter centre/corners, aisle endpoints/width and exact map registration still lack sufficient independent measurements for approval within 2 m. Keep the discrepancy open and task in progress. This review does not authorize a `placement-verified-by` edge or claim current full photographic agreement.
