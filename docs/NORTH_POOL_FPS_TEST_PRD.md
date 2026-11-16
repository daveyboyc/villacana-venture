# PRD: North Pool FPS Test

**Status:** Ready for implementation; the playable test view is not yet built.  
**Requested by:** Dave, 16 November 2026.  
**Repository:** `daveyboyc/villacana-venture`.  
**Baseline inspected:** `ffcd84dfc07bdc62490517676779f7a05fdd1e25`.

## 1. Outcome

Let Dave open the existing north pool courtyard as a first-person shooter test,
walk around at ground level, aim and shoot practice targets, and quickly restart.
The purpose is to judge whether the real-place model feels good as a playable FPS
space: scale, sightlines, movement, collision and aiming.

Deliver an optional **North Pool FPS Test** view inside the existing application.
Reuse the current resort model and its materials, terrain and source data. The
clover-shaped pool, deck, lawn, crazy-paving paths, surrounding white terraces,
garden walls and porches must remain recognisable.

This request explicitly extends the Inspect-only direction in [AGENTS.md](../AGENTS.md)
for this bounded experiment. Existing Inspect, Map & photos and legacy Walk remain
available. Evidence and placement requirements still apply to physical model changes.
This PRD defines future implementation; it does not establish photographic accuracy.

## 2. Existing foundations and gaps

| Existing code/data | What can be reused | Work needed for this test |
| --- | --- | --- |
| [app.ts](../src/app.ts) | Canonical app routing and embedded scene | Add an explicit FPS view, URL handling and lifecycle |
| [slice.ts](../src/slice.ts) | Shared resort scene, first-person camera, ground-height composition and scene readiness | Isolate FPS camera, input and gameplay from Inspect and Walk |
| [player.ts](../src/player.ts) | Movement, running, jumping, solid collision and pool entry | Validate local traversal and support FPS-specific tuning without changing Walk defaults |
| [walk-controls.ts](../src/walk-controls.ts) | Input reset on blur, visibility and parent messages | Add pointer-lock mouse look and FPS input ownership; current drag controls are not FPS aiming |
| [ground plan](../data/ground_plan_north_pool.json), [pool decks](../data/pool_decks.json), [terrain](../src/terrain.ts) | Current courtyard surfaces and levels | Derive safe spawn, play boundary and test routes from these sources |
| [static-batch.ts](../src/static-batch.ts) | Existing scene batching | Keep moving targets separate; provide reliable shot occlusion after batching |

First-person walking already exists, but the inspected paths do not implement a
shooting loop. A first-person camera toggle alone does not satisfy this PRD.

Use the [north pool brief](../refs/areas/north-pool.md),
[layout accuracy notes](LAYOUT_ACCURACY.md) and current discrepancy records for
source limitations. Do not widen paths, remove walls or invent access to make the
gameplay easier. Report model defects separately from movement defects.

## 3. MVP scope and defaults

**Audience/platform:** Dave and invited testers on desktop, with keyboard and
mouse, in current Chrome and Edge. Other browsers may work but are not an MVP
release gate. Touch-only devices get an explanation and a button back to Inspect.

**Playable area:** North pool water, deck, lawn, perimeter paths and the short
approaches immediately adjoining the courtyard. Include existing accessible steps
and openings where the model supports them. Surrounding buildings remain visible;
private interiors, roofs and routes to other pools are outside the play area.

**Game:** Single-player target practice with five reusable non-character targets.
One simple weapon, unlimited ammunition, no reload, no enemy AI and no player
damage. This is enough to test moving, aiming and firing around the courtyard.

**Deferred:** Multiplayer, combat NPCs, campaigns, inventories, realistic weapons,
destruction, scoring persistence, leaderboards, gamepads, mobile FPS controls and
resort-wide gameplay. A later combat brief can extend the test after traversal and
aiming are accepted.

These are proposed product defaults for an immediately implementable test, not
additional preferences already confirmed by Dave.

## 4. Entry and test flow

1. Select **North Pool FPS Test** from the app's view controls, or open the proposed
   canonical URL `?view=fps&area=north-pool` under the current deployment base path.
2. See the courtyard and a short control card. Start remains unavailable until
   essential scene geometry, collision and targets are ready. Show loading or a
   recoverable error instead of allowing the player to fall through an empty scene.
3. Click **Start test** to focus the scene and request pointer lock. The starting
   click must not fire a shot. A failed lock request leaves the card visible with
   retry and **Back to Inspect** actions.
4. Spawn on a validated lawn or path location, facing the pool, clear of walls,
   water, foliage and targets. Exact coordinates are selected and recorded during
   implementation; a photo-camera pin is not a valid ground-level spawn by default.
5. Move, aim and shoot targets around the courtyard. Show hits, shots and progress
   such as `3 / 5 targets`. Destroyed targets stop accepting hits.
6. After all five targets are hit, show **Course complete**, elapsed active time,
   accuracy and **Restart course**. Pause the game and release the mouse.
7. Escape pauses and releases the mouse at any time. Resume requires a deliberate
   click. **Reset position** returns to spawn without clearing course progress;
   **Restart course** resets position, targets, counters and timer.
8. **Back to Inspect** returns to the north pool inspection view and removes all
   FPS targets, HUD and input handlers. Refreshing the FPS URL opens the start card
   with a fresh course, never an automatically captured mouse.

## 5. Controls and camera

| Input | Action |
| --- | --- |
| W / A / S / D | Forward / strafe left / backward / strafe right relative to view yaw |
| Mouse | Continuous yaw and pitch while pointer-locked |
| Shift | Sprint while held |
| Space | Jump when grounded |
| Left click | Fire one shot per press while actively playing |
| R | Restart course while playing |
| Escape | Pause and release pointer lock |

Use a centred crosshair and a small weapon silhouette or simple viewmodel. Hide
the third-person avatar in this view. Start with an eye height of 1.65 m, vertical
FOV of 75 degrees, walking speed of 4 m/s and sprint speed of 6 m/s; tune through
playtesting. Clamp pitch near ±85 degrees, normalise diagonal movement and make
movement independent of render frame rate. Jump should clear a small obstacle,
not enable roof traversal or escape from the test boundary.

Provide mouse sensitivity, invert-Y, mute and an adjustable FOV (60–90 degrees)
in the paused settings. Disable head bob and camera shake by default. Essential
hit feedback must be visible without audio and understandable without colour alone.

Clear all held inputs on pause, blur, hidden tab, pointer-lock loss, restart or
view switch. No movement, firing or timer progression while paused or loading.
Returning to the tab must not cause a large movement step or accidental shot.

## 6. World interaction and shooting

### Movement and bounds

- Use the same source surfaces, levels and solid outlines as the current model.
  Buildings, garden walls and closed gates block movement; valid openings remain
  usable. Verify narrow paths, corners, steps and overhead clearance at player scale.
- Define an explicit play-area polygon in map metres (+x east, +z south), with
  a safe spawn, facing direction and named traversal checkpoints. Validate these
  against the rendered model; do not use a broad rectangle as the only boundary.
- At an artificial test edge, stop movement and show **End of test area**. Any
  debug boundary display is an FPS overlay, not a new physical resort wall.
- Allow pool entry, consistent with the existing project decision. MVP uses slow
  wading with a test-only standing depth that keeps the camera above water; no
  swimming or drowning simulation. Clearly keep this separate from surveyed pool
  depth. Provide at least one repeatable exit onto the deck and test it in both
  directions without requiring reset.
- Detect non-finite positions, leaving the allowed area or falling below the scene;
  recover to the safe spawn with a brief explanation. Reset is also always available
  from the pause menu. Neither recovery nor reset may spawn inside a collider.

### Targets and shots

- Place five clearly artificial practice targets at recorded positions across the
  lawn, path and deck. Keep paths and pool exits clear. Include close, medium and
  across-pool shots; at least one target must require repositioning to see around
  existing solid cover. Do not move the resort to create those sightlines.
- Fire a hitscan ray from the camera through the crosshair, with a proposed 60 m
  range and a maximum of four shots per second. Each accepted trigger increments
  shots once; only the first valid intersection can receive the hit.
- Walls, buildings, solid props and terrain stop shots. Decorative foliage and
  transparent water do not count as targets or opaque shot blockers. Use explicit
  target/blocker classification, not whatever objects happen to be visible in a
  render pass. Handle merged static meshes without duplicate or missing hits.
- A valid target hit gives an immediate hit marker, target reaction and optional
  sound; one hit completes that target. Misses never increase hits. Accuracy is
  hits divided by shots, shown as 0% before the first shot.
- Weapon graphics and transient effects cannot hit themselves or alter resort
  geometry. Dispose of all effects and target resources on restart or exit.

## 7. Integration requirements

Extend routing in `src/app.ts` and view controls in `index.html`; keep the current
default Inspect view. Route parsing, browser back/forward and refresh must recognise
FPS. The new route must select the north pool even when stale photo, camera, `at`
or `look` parameters remain from an earlier inspection link.

Keep gameplay in dedicated modules, for example `src/fps-controls.ts` and
`src/fps-test.ts`, with a proposed `data/north_pool_fps_test.json` for spawn,
boundary, target positions and tuning. Those paths are implementation suggestions,
not files already delivered. Avoid a second fork of the courtyard scene.

The app embeds `slice.html`; test pointer lock and focus in that actual iframe
configuration on the deployed base path. Parent/scene messages must verify both
origin and source. Choose one active input controller at a time, and give it an
explicit teardown/reset path. The existing Walk controller must not also consume
FPS mouse clicks or keyboard events.

Reuse scene readiness signals and current static batching. Mark gameplay objects
dynamic so they are not baked into static meshes. Cosmetic details may finish
loading after essentials, but authoritative collision and shot blockers must be
ready before Start becomes available. No new backend or account is required.

## 8. Acceptance criteria

| ID | Release gate |
| --- | --- |
| A1 Entry | Menu and direct URL open the same north-pool test; refresh, back/forward and deployed base-path navigation work. Pointer lock only follows an explicit click. |
| A2 Traversal | A recorded route covers spawn → lawn → deck → perimeter path → an accessible step/opening → spawn. Complete it walking and sprinting without wall penetration, ground clipping or an unrecoverable snag. |
| A3 Water | Enter the pool, move while wading and exit to the deck three consecutive times without reset or falling below the scene. |
| A4 Aim | Mouse look remains continuous across screen edges; crosshair and hit ray agree at close range and across the pool. Strafing does not turn the aim. |
| A5 Occlusion | A visible target takes exactly one hit; the same target behind solid cover takes none. Nearest-hit handling works with static batching enabled. |
| A6 Course | Five targets can be completed; shots, hits, accuracy and active timer are correct. Restart restores the same course and zero counters. |
| A7 Lifecycle | Escape, tab blur, pointer-lock loss and view changes stop input and timer immediately. Resume never repeats a held shot. After ten enter/restart/exit cycles there are no duplicate inputs, targets or retained gameplay resources. |
| A8 Recovery | Invalid/out-of-bounds positions recover safely. Reset position preserves course progress; restart clears it. Unsupported input or failed loading has a visible recovery action. |
| A9 Regression | Inspect Layout, Show details, Map & photos and existing Walk retain their controls and model. No FPS targets or HUD appear outside FPS. |
| A10 Performance | On a recorded reference desktop at 1920×1080 with details enabled, target median ≥60 FPS and 95th-percentile frame time ≤33 ms during a two-minute route including firing. Record browser, hardware and render settings; do not claim this for all devices. |

Success means Dave can open the view, complete the course and repeat it without
help, and assess the courtyard's scale, sightlines and movement. A functional pass
does not certify the physical model's accuracy.

## 9. Delivery and validation

1. **View and traversal:** Add routing, start/pause states, pointer lock, camera,
   spawn, bounds and pool handling. Capture the tested route and collision defects.
2. **Shooting loop:** Add weapon presentation, targets, occluded hits, HUD, completion
   and reset. Keep all test objects scoped to FPS.
3. **Release check:** Add focused browser coverage (proposed
   `scripts/test_north_pool_fps.cjs`) for routing, hit/occlusion, resets and lifecycle;
   manually verify actual mouse capture and feel in Chrome and Edge. Run relevant
   existing Walk/control, layout, inspection and map regressions plus typecheck and
   production build. Apply repository source/placement checks to any model edits.
4. **Reviewable handoff:** Document the launch URL, controls, actual reference
   hardware/performance, screenshots of the start screen and gameplay, test results,
   and remaining model discrepancies. Link the PRD and playable view from README
   once the view exists.

No full-resort geometry audit is a prerequisite for this scoped experiment. A local
defect that prevents a required test route must be fixed with appropriate evidence
or the playable bounds narrowed explicitly before release. Any geometry correction
still follows [placement verification](PLACEMENT_VERIFICATION.md), including its
independent source review; gameplay overlays do not represent real-world features.

The main implementation uncertainties are exact spawn/target placement, compatibility
of existing collision with ground-level FPS movement, and performance with details
enabled. Resolve these in the first traversal milestone. Enemy combat, larger maps
and additional platforms remain separate follow-up decisions.
