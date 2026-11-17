# Shotgun audio and reload

17 November 2026. Reuses **Howler.js 2.2.4** (MIT) for decoded playback, mobile
unlocking, muting and unloading, and five unmodified **Freedoom** WAV effects
(BSD-3-Clause) for the blast, pump and reload. Exact upstream revision, file hashes,
full licences and credits ship in `public/audio/shotgun/` and `public/licenses/`.
These are Freedoom replacement effects, not recordings taken from id Software's
Doom. The application-specific reload state machine is new; no Doom engine code
is being presented as reused code.

## Behaviour

Eight loaded shells, unlimited reserve. RELOAD / R opens the reload, inserts one
shell every 0.55 seconds after a 0.4-second opening, then closes in 0.3 seconds.
The HUD displays the count and the lowered weapon shows a moving shell. Firing
interrupts a reload once a shell is available. Empty fire gives a short mechanical
click and a reload prompt without increasing shots. The normal 0.8-second firing
cycle includes a pump sound at 0.24 seconds.

Pause/blur cancels reload work and retains already inserted shells. Stop, mute,
reset and disposal cancel pending audio playback. Start/Resume unlocks mobile audio;
an idle suspended context is resumed before playback. Downloads are never queued
as late weapon sounds. Restart restores eight shells. The last shot's sound may
finish when course completion opens the menu; manually pausing stops sound.

## Verification

- `node scripts/test_shotgun_cycle.mjs`: ammo limits, pump lockout, empty fire,
  reload stages, firing interruption, cancellation, reset and invalid time deltas.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium node scripts/test_shotgun_reload_browser.cjs`:
  actual Howler WAV loading/decoding and AudioBufferSource starts for the blast,
  pump and reload; mobile controls, keyboard, partial reload, empty fire,
  pause/blur, mute/unmute, idle-context resume, reset and disposal.
- Portrait and landscape touch buttons are at least 44 px and do not overlap.
  The images here are the real HUD/controller in a lightweight browser fixture
  against a simple background, not another render of the resort geometry.
- TypeScript, production build and reference validation pass. This did not repeat
  the full slow resort traversal suite: movement, world geometry and collisions
  were not edited. Physical iPhone/Safari listening remains unverified.

The placement gate flags shared context-digest changes. There are no changes to
surveyed geometry, terrain, collision, evidence or placement approval records.
