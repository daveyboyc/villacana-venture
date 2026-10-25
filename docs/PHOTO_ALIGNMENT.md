# Looking through a photo's camera

A phone pin is good to a few metres and its compass to tens of degrees. Rendering the game
from the pin (the older `shoot_views.cjs` default) gives a third-person view that does not line
up with the photo, so most photo checks ended as `not-comparable`. This workflow finds where
each photo was actually taken, renders the model through that camera at the photo's own size,
and measures the model against the photo in pixels and metres.

## Steps

```bash
python3 scripts/photo_pose.py init IMG_2204                 # starting camera from the pin and looksAt
node scripts/shoot_views.cjs IMG_2204 --pose --initial      # render through it; writes layout-checks.local/model.json
python3 scripts/photo_pose.py guide IMG_2204                # photo with numbered model corners, and a plan with the same labels
#   record matches in data/photo_poses.json (below)
python3 scripts/photo_pose.py solve IMG_2204 --write        # fit the camera, report every residual
node scripts/shoot_views.cjs IMG_2204 --pose --task=<id> --as=after
python3 scripts/photo_pose.py overlay IMG_2204 --task=<id>  # photo with render edges, and a 50/50 blend
```

In the app, `slice.html?pool=north,middle,south,main&photocam=IMG_2204` looks through the solved
camera with the photo laid over the render and an opacity slider. `&pose=initial` shows the
starting camera. Nothing in the scene changes, and the camera stays fixed whatever you press.

## Matches

Each entry under a photo's `points` in `data/photo_poses.json`:

| Entry | Means |
| --- | --- |
| `{"pixel": [u, v], "ref": "building:<id>:<i>:corner"}` | the pixel lies on the upright edge at footprint corner `i` |
| `{"pixel": [u, v], "ref": "building:<id>:<i>:top"}` (or `base`) | the roof (or ground) corner itself |
| `{"pixel": [u, v], "ref": "building:<id>:<i>-<j>:top"}` | anywhere on that footprint edge |
| `{"pixel": [u, v], "ref": "pool:<id>"}` | anywhere on the traced water edge |
| `{"pixel": [u, v], "ref": "world:x,y,z"}` | a point in scene metres |
| `{"vertical": [[u, v], [u, v]]}` | two pixels on any upright edge; uses no model geometry |
| `{"pixel": [u, v], "ref": "building:<id>:*:top"}` (or `base`) | anywhere on that building's roofline (or base); easy to slide onto the wrong face, so use it with upright edges |
| `{"pixel": [u, v], "ref": "edge:<feature>"}` | anywhere on a rendered edge of a traced wall, step, kerb, bed or terrace (`edge:<feature>@<k>` for one segment); `guide` labels them E<n> |
| `{"pixel": [u, v], "ref": "road:<id>:left"}` (or `right`) | anywhere on a mapped street edge, half its mapped width from the centre line; left is left looking along the road's points; `guide` labels them R<n> |

`"use": "control"` fits the camera; `"use": "check"` is held out and measures the model.
Fit with things you trust (registry footprint corners as upright edges, the traced pool edge,
real verticals) and hold out what you want to test (roof heights, a facade step, a wall). Read
pixels off a gridded zoom of the full photo, not the thumbnail. Each match is weighted by its
pixel error plus the model's own uncertainty at that distance (pool trace 0.3 m, footprints 0.2 m,
traced walls and steps 0.3 m, street edges 0.6 m because mapped widths are approximate). A photo's
`"heightPrior": [y, sigma]` holds the camera height, for example a surveyed roof plus eye level.

Photos taken from one spot get the same `"station"` and are solved together: one position and
lens, a direction each. This matters: a single photo that shows a pool edge and one corner leaves
its distance and focal length tangled. In the north-pool test below, IMG_2206 alone landed 6 m
from where the station solve puts it; IMG_2204 and IMG_2205 alone agreed to about 2 m.

The focal length is solved unless the manifest has `focal35` (the lens's 35 mm-equivalent focal
length, which `index_photos.py` now records from the original's EXIF). Web copies carry no EXIF,
so photos indexed before this change rely on the solve and a loose 24 mm prior.

## What a result means

- Control residuals say how well the camera fits; a few pixels is normal. A control far off
  usually means a wrong match, not a wrong model.
- Check residuals measure the model against the photo, in pixels and in metres at that distance.
  They carry the camera's own uncertainty (the `sigma` stored with the solve), so treat anything
  under about 0.3 m as agreement.
- A solved camera is a measurement tool. It does not grant placement approval
  (`docs/PLACEMENT_VERIFICATION.md`), and the model export currently covers registry buildings
  and pool edges only; walls, steps and planters are compared by eye in the overlay.
