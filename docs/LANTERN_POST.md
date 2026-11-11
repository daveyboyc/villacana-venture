# The lantern post

Task `lantern-post-asset` (11 November 2026). `src/lantern-post.ts` is one shared model of the
resort's traditional lamp post. It replaces five different stand-in lamps.

## The real fitting

Read from close crops of four photos:

| Photo | Shows |
| --- | --- |
| IMG_2552 | The whole post and lantern at the Eva / Dalí corner, with a camera clamped below the head |
| IMG_2336 | The lantern against the sky: frosted glass, the pale lamp inside, the weathered roof |
| IMG_2597 | The post beside the CALLE DE JORGE plinth |
| IMG_2503 | The square base plate with four bolts, on the Eva lawn |

The fitting has:

- a bottle-green tapered steel post, with a thicker sleeve at the foot, on a bolted square plate;
- a collar and a ball near the top, then four curved arms cradling the lantern;
- a four-sided black lantern, taller than wide and wider at the top, with frosted glass and a
  pale tubular lamp inside;
- a straight-sided pyramid roof in weathered black, with a vent chimney, a wider cap and a finial.

## The model

- Built from numbers in the browser, with drawn textures: no photo pixels and no downloaded
  model.
- Geometry and materials are built once and shared by every post.
- About 3.5 m to the finial by default. The Dalí lanterns keep their recorded 3.2 m.
- Materials respond to the scene's sky lighting: painted metal for the post, weathered paint
  for the roof, and reflective frosted glass.
- The lamp inside glows only faintly, as in daylight photos. Night lighting is not modelled.

`docs/reviews/lantern-post-asset/asset-sheet.jpg` puts the model beside the photo crops.

## Where it is used

| Place | Module | Before |
| --- | --- | --- |
| Calle Jorge: the plinth lamp and three along the lane | `src/jorge-lane.ts` | a thin post with a grey box |
| Calle Eva west: the lawn-island lamp | `src/eva-lane.ts` | a green post with a cream four-sided head and cone |
| Calle Eva: the lawn lamp by the Teodoro Rojo junction | `src/eva-walled-lawn.ts` | the same |
| Pintor Dalí: ten house-side lanterns | `src/dali-street.ts` | a black post with a glowing yellow box and cone |
| The one generic `lamp_post` prop | `src/slice.ts` | a dark post with a flat yellow box |

Positions are unchanged. Only the model at each position changed.

## Not replaced

These are different fittings and keep their own models:

- the hanging lanterns in the covered passages (Elena walkway, Silvia passages);
- the wall lanterns;
- the green bollard lights;
- the modern flat-headed solar lamps on the paseo.

## Limits

- Sizes are read from photo proportions, not measured.
- The security camera clamped to the IMG_2552 post is not modelled.
- The real roof edge has a fine scalloped trim that is left out.

## Checks

- `python3 scripts/check_lantern_post.py` checks:
  - the asset cites its photos and has all five parts;
  - it is built once and shared;
  - all five places use it, and none still builds a stand-in lamp;
  - the Dalí route-guard radius covers the lantern's footprint.
- Before and after renders through four photo cameras are in `docs/reviews/lantern-post-asset/`
  and recorded in `data/photo_checks.json`.
