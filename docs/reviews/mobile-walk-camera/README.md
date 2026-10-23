# Mobile walking and camera choice

The old Walk view had no visible movement control; its instructions were hidden
below 700px. A one-finger drag on the left half could move the actual player in
our baseline reproduction, but the input handler discarded that walking gesture
when a second canvas pointer arrived. Trying to look with the other thumb thus
cancelled movement. This does not establish a device-specific iPhone failure.
The before capture records the missing affordance, not a claim that all touch
movement was broken.

Normal Walk now has a visible mobile thumb pad. Hold/drag up or down to walk,
left/right to strafe, and drag the scene with the other thumb to look. Touch axes
persist independently of keyboard polling. Release, cancellation, blur, resize,
and navigation reset held input. Existing one-finger left-canvas walking remains
available; overview pinch/twist, mouse pan/wheel and keyboard movement remain.
Compact mobile labels keep all navigation buttons visible at 320px and above.

First person and Third person buttons switch the camera without moving the
player. The selected view is retained in local storage and canonical camera links
(`camera=first` or `camera=third`), including after changing Details. Before any
choice, the tunnel retains its previous automatic first-person behavior. An
explicit first-person choice works throughout the resort. Third person pulls the
camera forward before walls/ceilings, widens the view in tight spaces and hides
the avatar if the camera is too close. Overview remains separate. The original
study keeps its own controls and does not show the main scene's new pad.

No map placements, source geometry, collision boundaries, materials, terrain or
movement physics were changed. Original Silvia placement and garden discrepancies
remain open. Shared slice/camera code changes still invalidate conservative
renderer fingerprints; this is not a new measured placement approval.

## Validation

- `test_mobile_walk.cjs`: actual canonical app and tunnel, 390×844 portrait and
  844×390 landscape, native Chromium touch events, simultaneous walking/looking,
  release/cancel stop, actual player coordinates, camera switch without movement,
  stored preference and URL synchronization, screenshots and no page errors.
- `test_walk_controls.cjs`: actual shared input module and Player in a lightweight
  fixture in Chromium and WebKit. All directions/diagonal, cancel, blur,
  app-navigation reset, keyboard and overview mouse pan/zoom. WebKit uses native
  mouse pointers in a touch-enabled narrow viewport; Chromium supplies the full
  multi-touch test. These are browser automation tests, not a physical iPhone test.
- Existing layout, overview and photo-map browser regressions; 60 Python unit
  checks, reference generation, type check and production build.

An initial narrow-desktop overview regression caught the expanded toolbar
covering the Overview button. Compact controls and separate touch jump/overview
positions fix that. An initial WebKit harness wheel test used mobile mode, where
Playwright does not support mouse-wheel injection; that engine's pointer/keyboard
fixture uses desktop mode with touch enabled. Both are test setup/UI issues, not
source or placement evidence.

The photo-map regression also exposed header overflow after adding the Silvia shortcut. Compact Map/Silvia/Photos labels and hiding the brand on small screens keep every mode visible; accessible button labels remain descriptive.
