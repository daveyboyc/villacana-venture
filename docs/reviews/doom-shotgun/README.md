# Doom-inspired shotgun appearance

17 November 2026. Replaces the simple SVG weapon with a detailed generated,
transparent pixel-art sprite: centred dark steel barrel and receiver, worn metal
highlights, ribbed brown fore-end and visible supporting hands. The sprite is
`public/art/shotgun-doom.png` (1086×1448 RGBA, transparent outside the silhouette).
It is new generated artwork, not an extracted game asset.

The HUD crops the larger sprite at the bottom of the screen. A separate stepped
muzzle flash sits at the barrel tip; the weapon kicks back and tilts during the
existing 0.8-second firing cycle. Reduced-motion settings disable the recoil.
Gameplay, aiming, target positions, shot spread, cooldown and touch controls are
unchanged.

Validation: production build/typecheck and reference validation pass. A lightweight
browser fixture mounted the actual `createShotgun` HUD/controller with its real
stylesheet and image, at 390×792 and 844×338 (the app's space below navigation).
The PNG decoded at its expected size, the fire action triggered the animation,
and no page errors occurred. The portrait/landscape/firing PNGs here are HUD
previews against a simple background, not new renders of the resort geometry.
The full mobile gameplay suite passed in the preceding shotgun implementation;
this visual-only change did not rerun that expensive full-scene suite.

The reference generator refreshes shared context digests. The placement gate
flags missing fresh packets after the context changes; this update modifies no
real-world geometry, terrain, collision or placement approvals.
