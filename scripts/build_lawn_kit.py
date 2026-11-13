#!/usr/bin/env python3
"""Build the main-pool lawn fittings headless in Blender and export them as glTF for the game.

  pip install bpy==5.2.3          (Blender as a Python module; no desktop Blender needed)
  python3 scripts/build_lawn_kit.py writes public/models/lawn/<fitting>.glb

The small fittings along the pink lawn paths, as photographed in November 2026:
- bollard: the low path light, a dark green round body on a pale concrete collar, a dark band, and a
  frosted cream diffuser with a rounded top; about 0.6 m tall (IMG_2764, IMG_2765, IMG_2603, IMG_2760
  close up, IMG_2763);
- bin: the litter bin, dark brown vertical wooden slats round a drum held by two dark steel hoops,
  a dark liner inside, raised a little off the grass on two short steel feet (IMG_2764, IMG_2765,
  IMG_2603, IMG_2759, IMG_2761);
- cover: a square grey steel service lid set flush in the lawn in a slightly darker frame
  (IMG_2759, IMG_2760, IMG_2761).

Sizes are read by eye against the 2.4 m paths and the 0.2 m tiles, not measured. Built from numbers
here with the pool kit's helpers (scripts/build_pool_kit.py), so a rebuild is byte-identical. Each
stands on its origin at ground level, y up; the bin's slats run round its axis, the cover is square
to its axes.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_pool_kit as kit  # noqa: E402  (loads bpy)

kit.OUT = Path(__file__).resolve().parents[1] / 'public/models/lawn'
kit.MATERIALS.update({
    'body': ('#2c4a3a', 0.55, 0.25),      # bollard body, dark bottle green (IMG_2760, IMG_2764)
    'collar': ('#cfcabd', 0.9, 0.0),      # pale concrete collar the bollard stands in (IMG_2760)
    'band': ('#22302a', 0.5, 0.4),        # dark band under the diffuser
    'diffuser': ('#f1ead6', 0.35, 0.0),   # frosted cream diffuser (IMG_2760, IMG_2763)
    'slat': ('#5b3b27', 0.85, 0.0),       # dark brown wooden slats (IMG_2764, IMG_2603)
    'hoop': ('#26282a', 0.5, 0.6),        # dark steel hoops and feet
    'liner': ('#1b1c1c', 0.8, 0.2),       # the liner seen over the rim
    'lid': ('#73766f', 0.6, 0.55),        # grey chequered steel lid (IMG_2761)
    'frame': ('#575a55', 0.7, 0.5),       # the lid's frame
})


def bollard(f):
    """Collar 0.26 m across at the grass, a 0.18 m body to 0.44 m, a dark band, and a 0.16 m
    diffuser to 0.58 m with a domed top."""
    f.tube('collar', [(0.0, -0.02, 0.0), (0.0, 0.03, 0.0)], 0.13, sides=20)
    f.tube('body', [(0.0, 0.03, 0.0), (0.0, 0.44, 0.0)], 0.09, sides=20)
    f.tube('band', [(0.0, 0.44, 0.0), (0.0, 0.47, 0.0)], 0.092, sides=20)
    f.tube('diffuser', [(0.0, 0.47, 0.0), (0.0, 0.56, 0.0)], 0.08, sides=20, caps=False)
    # Domed top: a few shrinking rings closing over the diffuser.
    dome = [(0.0, 0.56 + 0.03 * math.sin(math.radians(a)), 0.0) for a in (0, 30, 60, 85)]
    for (x0, y0, z0), (x1, y1, z1), r0, r1 in zip(dome, dome[1:], (0.08, 0.069, 0.04), (0.069, 0.04, 0.007)):
        f.tube('diffuser', [(x0, y0, z0), (x1, y1, z1)], (r0 + r1) / 2, sides=20)


def litter_bin(f, radius=0.22, height=0.68, lift=0.08, slats=18):
    """Eighteen slats round a 0.44 m drum from 0.08 m to 0.76 m, two hoops, a liner and two feet."""
    width = 2 * math.pi * radius / slats * 0.78
    for k in range(slats):
        a = 2 * math.pi * k / slats
        x, z = math.sin(a) * radius, math.cos(a) * radius
        # A slat is a thin box turned to face out from the axis: build it as a short tube of 4 sides.
        side = (math.cos(a) * width / 2, -math.sin(a) * width / 2)
        out = (math.sin(a) * 0.012, math.cos(a) * 0.012)
        corners = [(x + side[0] + out[0], z + side[1] + out[1]), (x - side[0] + out[0], z - side[1] + out[1]),
                   (x - side[0] - out[0], z - side[1] - out[1]), (x + side[0] - out[0], z + side[1] - out[1])]
        b = f.bm('slat')
        lo = [b.verts.new(kit.P(cx, lift, cz)) for cx, cz in corners]
        hi = [b.verts.new(kit.P(cx, lift + height, cz)) for cx, cz in corners]
        for i in range(4):
            j = (i + 1) % 4
            b.faces.new((lo[i], lo[j], hi[j], hi[i]))
        b.faces.new(list(reversed(lo)))
        b.faces.new(hi)
        kit.bmesh.ops.recalc_face_normals(b, faces=b.faces[-6:])
    for y in (lift + 0.1, lift + height - 0.08):
        f.torus('hoop', (0.0, y, 0.0), radius + 0.014, 0.009, segments=36, sides=6)
    f.tube('liner', [(0.0, lift + 0.05, 0.0), (0.0, lift + height - 0.04, 0.0)], radius - 0.02, sides=24)
    for side in (-1, 1):
        f.tube('hoop', [(side * (radius - 0.05), 0.0, 0.0), (side * (radius - 0.05), lift + 0.12, 0.0)], 0.014, sides=8)


def _flat_torus(f, kind, centre, major, minor, segments, sides):
    """A ring lying flat (round the y axis), for the bin hoops."""
    b = f.bm(kind)
    cx, cy, cz = centre
    loops = []
    for i in range(segments):
        a = 2 * math.pi * i / segments
        out = (math.sin(a), math.cos(a))
        loops.append([b.verts.new(kit.P(cx + (major + minor * math.cos(t)) * out[0], cy + minor * math.sin(t),
                                        cz + (major + minor * math.cos(t)) * out[1]))
                      for t in (2 * math.pi * j / sides for j in range(sides))])
    for i in range(segments):
        for j in range(sides):
            k, n = (j + 1) % sides, (i + 1) % segments
            b.faces.new((loops[i][j], loops[i][k], loops[n][k], loops[n][j])).smooth = True


def cover(f, size=0.56, frame=0.035):
    """A 0.56 m square lid 1 cm proud of the grass in a 3.5 cm frame."""
    f.box('frame', (0.0, 0.004, 0.0), (size + 2 * frame, 0.008, size + 2 * frame))
    f.box('lid', (0.0, 0.01, 0.0), (size, 0.006, size))
    # Two lifting slots across the lid.
    for z in (-size * 0.3, size * 0.3):
        f.box('frame', (0.0, 0.0135, z), (0.08, 0.002, 0.016))


def main():
    # The pool kit's upright torus would stand the hoops on edge; lay them flat here.
    kit.Fitting.torus = lambda self, kind, centre, major, minor, a0=0.0, a1=360.0, segments=32, sides=12: \
        _flat_torus(self, kind, centre, major, minor, segments, sides)
    for name, build in (('bollard', bollard), ('bin', litter_bin), ('cover', cover)):
        fitting = kit.Fitting(name)
        build(fitting)
        fitting.build()


if __name__ == '__main__':
    main()
