# shoot_views.cjs renders from the photo again

`scripts/shoot_views.cjs` built `slice.html?pool=…&at=…&look=…`, but the page now opens in Inspect's
whole-resort overview unless the address says `view=walk` (`src/slice.ts`, `let overview`). So every
pin render showed the overview. The script now asks for `view=walk&camera=first` (eye height, no
avatar) and hides the page's buttons before the screenshot (`--controls` keeps them). The `--pose`
path (`photocam=`) replaces the camera after the overview logic and was never affected.

Proof (26 Nov 2026, software GL):
- `IMG_3124-details-after.png`: `node scripts/shoot_views.cjs IMG_3124 --pool=north,middle,south,main --details`.
  It shows the substation's green sliding door and the long wall running down the road, as in the photo.
- `IMG_2613-after.png`: the lane to the beach, from the paseo looking north.
- `IMG_3099-pose-initial.png`: `--pose --initial` through IMG_3099's starting pose.
