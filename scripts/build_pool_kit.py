#!/usr/bin/env python3
"""Build the pool fittings headless in Blender and export them as glTF for the game.

  pip install bpy==5.2.3          (Blender as a Python module; no desktop Blender needed)
  python3 scripts/build_pool_kit.py writes public/models/pool/<fitting>.glb

The stainless fittings round the pools, as photographed (IMG_2195, IMG_2204-2206, south-pool-01/02):
- ladder: two goose-neck rails anchored on the deck about half a metre back from the edge, arching
  over the coping and down into the water, with three treads between them (IMG_2204, IMG_2195);
- step-rail: the handrail at the end of a flight of pool steps, a post on the deck carrying an upper
  and a lower bar that slope down into the water over the treads (IMG_2204, IMG_2195);
- life-ring: an orange ring with white bands and a grab line, hung from the hook of a steel post
  (IMG_2204, IMG_2195, south-pool-02).

Built from numbers here, so a rebuild is byte-identical. Each stands on its origin at deck level;
in the game (three.js, y up) x runs along the pool wall and +z points into the pool; for the
life-ring, +z faces the pool. Blender's y is the game's -z (glTF export, y up).
"""
import math
from pathlib import Path

import bpy
import bmesh  # only importable once bpy is loaded

OUT = Path(__file__).resolve().parents[1] / 'public/models/pool'

MATERIALS = {  # sRGB colour, roughness, metallic
    'steel': ('#e6eaec', 0.3, 0.85),      # brushed stainless rails, bright in the photos (IMG_2195, IMG_2204)
    'tread': ('#e9ecec', 0.45, 0.6),      # ladder treads, pale grey steel
    'ring': ('#e5532d', 0.6, 0.0),        # life ring orange, IMG_2195 and south-pool-02
    'band': ('#f2f2ee', 0.5, 0.0),        # the white bands round the ring
    'rope': ('#e8e6df', 0.9, 0.0),        # grab line
}


def linear(hex_colour):
    channel = lambda v: v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return [channel(int(hex_colour[i:i + 2], 16) / 255) for i in (1, 3, 5)] + [1.0]


def material(name):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    colour, roughness, metallic = MATERIALS[name]
    m = bpy.data.materials.new(name)
    shader = m.node_tree.nodes['Principled BSDF']
    shader.inputs['Base Color'].default_value = linear(colour)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = metallic
    return m


def P(x, y, z):
    """A point in game axes (x along the wall, y up, z into the pool) in Blender axes."""
    return (x, -z, y)


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def add(a, b, k=1.0):
    return (a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k)


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(a):
    n = math.sqrt(sum(v * v for v in a)) or 1.0
    return (a[0] / n, a[1] / n, a[2] / n)


def arc(centre, radius, a0, a1, steps):
    """Points on a circle in the game's y-z plane: angle 0 points along +z, 90 degrees up."""
    cy, cz = centre
    return [(cy + radius * math.sin(a), cz + radius * math.cos(a))
            for a in (math.radians(a0 + (a1 - a0) * i / steps) for i in range(steps + 1))]


def line(a, b, steps=1):
    return [(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps) for i in range(steps + 1)]


def join(*parts):
    out = []
    for part in parts:
        out += part[1:] if out and math.dist(out[-1], part[0]) < 1e-6 else part
    return out


class Fitting:
    """Collects tubes, boxes and rings into one mesh per material."""

    def __init__(self, name):
        self.name = name
        self.meshes = {}

    def bm(self, kind):
        return self.meshes.setdefault(kind, bmesh.new())

    def tube(self, kind, path, radius, sides=10, caps=True):
        """A round tube of `radius` along a path of game points, mitred at each bend."""
        b = self.bm(kind)
        pts = [P(*p) for p in path]
        loops = []
        for i, p in enumerate(pts):
            ahead = unit(sub(pts[min(i + 1, len(pts) - 1)], pts[max(i - 1, 0)]))
            ref = (0, 0, 1) if abs(ahead[2]) < 0.9 else (1, 0, 0)
            side = unit(cross(ahead, ref))
            other = cross(ahead, side)
            loops.append([b.verts.new(add(add(p, side, radius * math.cos(2 * math.pi * j / sides)),
                                          other, radius * math.sin(2 * math.pi * j / sides))) for j in range(sides)])
        for i in range(len(loops) - 1):
            for j in range(sides):
                k = (j + 1) % sides
                b.faces.new((loops[i][j], loops[i][k], loops[i + 1][k], loops[i + 1][j])).smooth = True
        if caps:
            b.faces.new(list(reversed(loops[0])))
            b.faces.new(loops[-1])

    def box(self, kind, centre, size):
        """An axis-aligned box in game axes: centre (x, y, z) and size (x, y, z)."""
        b = self.bm(kind)
        (x, y, z), (sx, sy, sz) = centre, size
        v = [b.verts.new(P(x + dx * sx / 2, y + dy * sy / 2, z + dz * sz / 2))
             for dx in (-1, 1) for dy in (-1, 1) for dz in (-1, 1)]
        for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
            b.faces.new([v[i] for i in f])
        bmesh.ops.recalc_face_normals(b, faces=b.faces[-6:])

    def disc(self, kind, centre, radius, thickness, sides=16):
        """A flat round plate on the deck, as under each rail (escutcheons)."""
        x, y, z = centre
        self.tube(kind, [(x, y, z), (x, y + thickness, z)], radius, sides)

    def torus(self, kind, centre, major, minor, a0=0.0, a1=360.0, segments=32, sides=12):
        """A ring, or an arc of one, upright in the game's x-y plane (facing +z), round `centre`."""
        b = self.bm(kind)
        cx, cy, cz = centre
        full = abs(a1 - a0) >= 360
        count = segments if full else segments + 1
        loops = []
        for i in range(count):
            a = math.radians(a0 + (a1 - a0) * i / segments)
            out = (math.cos(a), math.sin(a))
            loops.append([b.verts.new(P(cx + (major + minor * math.cos(t)) * out[0], cy + (major + minor * math.cos(t)) * out[1],
                                        cz + minor * math.sin(t)))
                          for t in (2 * math.pi * j / sides for j in range(sides))])
        for i in range(count if full else count - 1):
            for j in range(sides):
                k, n = (j + 1) % sides, (i + 1) % count
                b.faces.new((loops[i][j], loops[i][k], loops[n][k], loops[n][j])).smooth = True
        if not full:
            b.faces.new(list(reversed(loops[0])))
            b.faces.new(loops[-1])

    def build(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        for kind, b in self.meshes.items():
            mesh = bpy.data.meshes.new(f'{self.name}-{kind}')
            b.to_mesh(mesh)
            mesh.materials.append(material(kind))
            bpy.context.collection.objects.link(bpy.data.objects.new(f'{self.name}-{kind}', mesh))
        OUT.mkdir(parents=True, exist_ok=True)
        path = OUT / f'{self.name}.glb'
        bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', export_apply=True, export_yup=True)
        print(path.relative_to(OUT.parents[2]), path.stat().st_size // 1024, 'kB',
              sum(len(b.faces) for b in self.meshes.values()), 'faces')


def ladder(f, half_width=0.25, tube=0.024):
    """Two goose-neck rails: up from a plate on the deck 0.53 m back from the lip, over an arch
    0.95 m high, and down into the water 0.13 m off the wall, turning in to a bumper on it; three
    treads between them below the water (IMG_2204 crop of the ladder on the deck tongue, IMG_2195)."""
    # (y, z) profile of each rail, in metres from the wall lip at deck level.
    rail = join(line((0.0, -0.53), (0.62, -0.53), 4),
                arc((0.62, -0.2), 0.33, 180, 0, 14),
                line((0.62, 0.13), (-0.78, 0.13), 6),
                arc((-0.78, 0.03), 0.1, 0, -90, 5))
    for side in (-1, 1):
        x = side * half_width
        f.tube('steel', [(x, y, z) for y, z in rail], tube)
        f.disc('steel', (x, 0.0, -0.53), 0.045, 0.012)
        f.disc('steel', (x, -0.88, 0.0), 0.04, 0.0)  # pad where the bumper meets the wall (hidden)
    for y in (-0.22, -0.48, -0.74):
        f.box('tread', (0.0, y, 0.11), (2 * half_width - 0.01, 0.03, 0.11))


def step_rail(f, tube=0.024):
    """The handrail at the end of a flight of steps: a post on the deck 0.4 m back from the lip,
    an upper bar bending over at 0.88 m and sloping down over the treads at their pitch, turning down
    to stand on the third tread, and a lower bar from the post to that leg (IMG_2204 north steps,
    IMG_2195 middle steps). Stood just inside the end of the treads."""
    s = math.atan2(0.84, 1.0)  # pitch of the three treads: 0.28 m rise per 0.36 m
    a = 90 - math.degrees(s)   # arc angle where the bar's tangent matches that pitch
    over = arc((0.7, -0.22), 0.18, 180, a, 8)
    top = over[-1]
    down = (top[0] - 0.95 * math.tan(s), top[1] + 0.95)
    bend = (down[0] - 0.12 * math.cos(s), down[1] - 0.12 * math.sin(s))
    turn = arc(bend, 0.12, a, 0, 5)
    upper = join(line((0.0, -0.4), (0.7, -0.4), 4), over, line(top, down, 5), turn,
                 line(turn[-1], (-0.84, turn[-1][1]), 4))
    f.tube('steel', [(0.0, y, z) for y, z in upper], tube)
    f.tube('steel', [(0.0, y, z) for y, z in line((0.4, -0.4), (-0.45, turn[-1][1]), 6)], tube * 0.9)
    f.disc('steel', (0.0, 0.0, -0.4), 0.045, 0.012)


def life_ring(f, post=1.45):
    """A steel post with a hook near the top and an orange ring hung on it facing the pool, with four
    white bands and a grab line round the outside (IMG_2204 by the north steps, IMG_2195,
    south-pool-02)."""
    f.tube('steel', [(0.0, 0.0, 0.0), (0.0, post, 0.0)], 0.024)
    hook = join(line((post - 0.06, 0.0), (post - 0.06, 0.1), 2), line((post - 0.06, 0.1), (post - 0.01, 0.13), 1))
    f.tube('steel', [(0.0, y, z) for y, z in hook], 0.011, sides=8)
    f.disc('steel', (0.0, 0.0, 0.0), 0.06, 0.01)
    major, minor = 0.3, 0.075
    cx, cy, cz = 0.0, post - 0.06 - (major - minor), 0.1
    for k in range(4):  # orange quarters between the four white bands
        a = 45 + 90 * k
        f.torus('ring', (cx, cy, cz), major, minor, a + 9, a + 81, segments=9)
        f.torus('band', (cx, cy, cz), major, minor + 0.002, a - 9, a + 9, segments=3)
    # Grab line: four shallow swags between the bands.
    swags = []
    for k in range(4):
        for i in range(8):
            a = math.radians(45 + 90 * k + 90 * i / 8)
            r = major + minor + 0.012 + 0.03 * math.sin(math.pi * i / 8)
            swags.append((cx + math.cos(a) * r, cy + math.sin(a) * r, cz))
    f.tube('rope', swags + [swags[0]], 0.007, sides=6)


def main():
    for name, build in (('ladder', ladder), ('step-rail', step_rail), ('life-ring', life_ring)):
        fitting = Fitting(name)
        build(fitting)
        fitting.build()


if __name__ == '__main__':
    main()
