# North pool shotgun prototype

User request: a Doom/Duke Nukem-like shotgun, tested on mobile. This change adds
an original weapon and target-practice overlay to the shared north-pool renderer.
It does not change surveyed scenery, source footprints, terrain or movement physics.

## Delivered

- Canonical `?view=fps` and visible Play button. The scene starts in first person
  at the existing north-pool spawn, ignoring stale inspection coordinates.
- Fixed canonical Walk routing: the app now forwards `view=walk` to `slice.html`.
- Original centred SVG shotgun, eight-pellet spread, 60 m maximum ray length,
  0.8-second pump cycle, recoil, muzzle flash, impact sparks and synthesised sound.
- Three floating practice targets, unlimited shells, visible hit feedback, pause,
  reset, mute and explicit start. Mobile joystick and look gestures remain independent
  of the large FIRE button. Desktop supports F or clicking without dragging to fire.
- Rendering at device pixel ratio no higher than 1 in shotgun mode; phone shotgun
  mode disables live shadows. Inspect/Walk rendering settings remain unchanged.
- No combat NPCs or original Doom/Duke Nukem assets. This is the first playable
  increment, not completion of all requirements in the FPS PRD.

## Validation

`test_shotgun_browser.cjs` covers canonical routing with stale parameters, first-person
startup, actual multitouch movement/look/fire, rapid-fire suppression, pause/blur,
reset, portrait and landscape screenshots, target scoring, opaque wall occlusion
(including hidden originals retained after static batching), resource disposal,
and returning to Inspect/Map. Its results are saved beside this file.

`test_walk_controls.cjs` passed all directions, diagonal movement, release/cancel,
blur and app-navigation resets, keyboard movement and Inspect gestures. Python
photo assignment (12), reference index (17) and placement verification unit tests
(31) passed. All 16 source/route checks from the handover passed, including map,
street layout, boundaries, terrain, pool levels, ground plan and local features.
TypeScript and production build passed; Vite reports the existing large-bundle warning.

The first concurrent full-scene browser runs timed out under software rendering.
The focused shotgun test uses a longer startup allowance and runs without another
heavy 3D suite competing for the software GPU. Screenshots are Chromium touch
emulation at 390×844 and 844×390, not physical iPhone/Android or measured 60 FPS
performance certification. Physical Safari testing remains outstanding.

`check_placement_changes.py --base origin/main` flags missing fresh placement packets
because editing `src/slice.ts` changes the shared renderer context digest. No real
resort geometry was changed. The regenerated graph/index digests are included; no
placement approvals or source checks were invented to suppress this gate.
