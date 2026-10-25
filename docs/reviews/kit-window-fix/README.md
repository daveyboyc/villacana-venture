# Facade kit: closed shutters instead of navy glass

The kit's rectangular window (`shutter-window`) had its shutters folded open over a glossy dark
pane. Under the sky lighting from the graphics pilot the pane reflected the sky and read as a navy
panel, worst close up (Cervantes, right edge). The north-pool photos show every one of these
windows with its brown louvred shutters shut (IMG_2204 and IMG_2205, the block east of the pool),
so no open variant is kept.

- `scripts/build_kit.py`: the window is now two closed louvred leaves (rails, stiles and slats)
  over a matt dark recess; the glossy glass material is gone. `public/models/shutter-window.glb`
  rebuilt with bpy 5.2.3 (36 kB, was 29 kB); the other parts rebuild byte-identical.
- `src/facade-kit.ts`: the flat panel used for this window beyond 120 m is shutter brown, not navy.

Before and after: `IMG_2204-before-photo-after.jpg`, `IMG_2205-before-photo-after.jpg` (solved
station cameras, Details view) and `cervantes-before-after.jpg` (walking view). Draw calls are
unchanged (2,112 on Cervantes). No footprint, ground or collision changed.
