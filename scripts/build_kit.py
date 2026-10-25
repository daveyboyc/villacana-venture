#!/usr/bin/env python3
"""Build the facade kit headless in Blender and export it as glTF for the game.

  pip install bpy==5.2.3          (Blender as a Python module; no desktop Blender needed)
  python3 scripts/build_kit.py    writes public/models/<part>.glb

Every part is built from numbers here, so it can be rebuilt and reviewed like code. Sizes are
read from the north-pool photos (IMG_2204, IMG_2205, IMG_2206) against the 3 m storey and the
0.2 m tiles: arched shutter doors about 1.2 m wide and 2.3 m to the top of the arch, black iron
balconies about 1.8 m wide on a slab 0.45 m deep, and wooden balconies about 3 m wide and
0.9 m deep with posts carrying a small barrel-tile roof, rectangular windows about 1.4 m wide
with their louvred shutters folded open, and narrow arched windows about 0.7 m wide. Each part
faces +Z in the game, with its origin on the wall face at the floor of its storey (windows carry
their own sill height).
"""
import math
from pathlib import Path

import bpy
import bmesh  # only importable once bpy is loaded

OUT = Path(__file__).resolve().parents[1] / 'public/models'
SEGMENTS = 12  # arch and roof-tile smoothness

COLOURS = {  # sRGB, from the photos
    'shutter': ('#5b3622', 0.75),
    'plaster': ('#f3f1ea', 0.95),
    'iron': ('#1d1d1f', 0.55),
    'timber': ('#4a2c1a', 0.7),
    'tile': ('#b4643f', 0.85),
    'glass': ('#1f2326', 0.25),
}


def linear(hex_colour):
    channel = lambda v: v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return [channel(int(hex_colour[i:i + 2], 16) / 255) for i in (1, 3, 5)] + [1.0]


def material(name):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    colour, roughness = COLOURS[name]
    m = bpy.data.materials.new(name)
    shader = m.node_tree.nodes['Principled BSDF']
    shader.inputs['Base Color'].default_value = linear(colour)
    shader.inputs['Roughness'].default_value = roughness
    return m


class Part:
    """Collects boxes, prisms and tubes into one mesh per material."""

    def __init__(self, name):
        self.name = name
        self.meshes = {}

    def bm(self, kind):
        return self.meshes.setdefault(kind, bmesh.new())

    def box(self, kind, x0, x1, y0, y1, z0, z1):
        """Axis box in Blender metres: x along the wall, -y out of the wall, z up."""
        b = self.bm(kind)
        verts = [b.verts.new((x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
        for face in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
            b.faces.new([verts[i] for i in face])

    def prism(self, kind, outline, y0, y1):
        """A flat outline in x/z (counter-clockwise seen from the front) extruded from y0 to y1."""
        b = self.bm(kind)
        front = [b.verts.new((x, y0, z)) for x, z in outline]
        back = [b.verts.new((x, y1, z)) for x, z in outline]
        b.faces.new(front)
        b.faces.new(list(reversed(back)))
        for i in range(len(outline)):
            j = (i + 1) % len(outline)
            b.faces.new((front[i], back[i], back[j], front[j]))

    def build(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        for kind, b in self.meshes.items():
            bmesh.ops.recalc_face_normals(b, faces=b.faces)
            mesh = bpy.data.meshes.new(f'{self.name}-{kind}')
            b.to_mesh(mesh)
            mesh.materials.append(material(kind))
            bpy.context.collection.objects.link(bpy.data.objects.new(f'{self.name}-{kind}', mesh))
        OUT.mkdir(parents=True, exist_ok=True)
        path = OUT / f'{self.name}.glb'
        bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', export_apply=True, export_yup=True)
        print(path.relative_to(OUT.parents[1]), path.stat().st_size // 1024, 'kB')


def arch_outline(width, spring, inset=0.0):
    """Outline of an arched opening: straight sides up to `spring`, then a half circle."""
    r = width / 2 - inset
    points = [(-r, inset), (r, inset)]
    points += [(r * math.cos(a), spring + r * math.sin(a)) for a in (math.pi * k / SEGMENTS for k in range(SEGMENTS + 1))]
    return points


def shutter_door(part, width=1.2, spring=1.7, proud=0.03):
    """A pair of brown louvred leaves under a half-round head, in a white moulded surround."""
    r = width / 2
    # Leaves: a backing panel, then louvres every 6 cm, each cut to the arch at its height.
    part.prism('shutter', list(reversed(arch_outline(width, spring))), -proud, 0)
    z = 0.08
    while z < spring + r - 0.06:
        half = r - 0.05 if z <= spring else math.sqrt(max(r * r - (z - spring) ** 2, 0)) - 0.05
        if half > 0.05:
            part.box('shutter', -half, half, -proud - 0.025, -proud, z, z + 0.035)
        z += 0.06
    part.box('shutter', -0.015, 0.015, -proud - 0.03, -proud, 0, spring + r - 0.02)  # meeting stiles
    # Surround: a 12 cm band following the opening, 4 cm proud of the wall, and a sill.
    band = 0.12
    for side in (1, -1):
        ring = [(side * x, z) for x, z in arch_outline(width + 2 * band, spring)[1:SEGMENTS // 2 + 2]]
        ring += [(side * x, z) for x, z in reversed(arch_outline(width, spring)[1:SEGMENTS // 2 + 2])]
        part.prism('plaster', ring if side == 1 else list(reversed(ring)), -0.04, 0)
    part.box('plaster', -r - band, -r, -0.04, 0, 0, spring)
    part.box('plaster', r, r + band, -0.04, 0, 0, spring)
    part.box('plaster', -r - band - 0.04, r + band + 0.04, -0.07, 0, -0.06, 0)


def iron_balcony(part, width=1.8, depth=0.45, rail=0.95):
    """A white slab with a black railing of square bars and a row of rings, open to the wall."""
    part.box('plaster', -width / 2, width / 2, -depth, 0, -0.12, 0)
    w, d = width / 2 - 0.03, depth - 0.03
    for x0, x1, y0, y1 in ((-w, w, -d - 0.02, -d), (-w - 0.02, -w, -d, 0), (w, w + 0.02, -d, 0)):
        part.box('iron', x0, x1, y0, y1, rail - 0.04, rail)   # top rail
        part.box('iron', x0, x1, y0, y1, 0.08, 0.11)         # bottom rail
    x = -w
    while x <= w + 1e-6:
        part.box('iron', x - 0.008, x + 0.008, -d - 0.016, -d, 0.0, rail)
        x += 0.11
    for y in (-d + 0.11, -d + 0.22, -d + 0.33):
        for side in (-w, w):
            part.box('iron', side - 0.008, side + 0.008, y - 0.008, y + 0.008, 0.0, rail)
    x = -w + 0.055
    while x < w:  # rings between the bars, as seen in IMG_2204
        for k in range(8):
            a, b = 2 * math.pi * k / 8, 2 * math.pi * (k + 1) / 8
            r = 0.04
            part.box('iron', x + r * math.cos(a) - 0.006, x + r * math.cos(a) + 0.006, -d - 0.012, -d - 0.004,
                     0.3 + r * math.sin(a) - 0.006, 0.3 + r * math.sin(b) + 0.006)
        x += 0.22


def wood_balcony(part, width=3.0, depth=0.9, rail=0.95, eave=2.45, ridge=2.75):
    """A white slab with a timber balustrade and posts carrying a lean-to of barrel tiles."""
    part.box('plaster', -width / 2, width / 2, -depth, 0, -0.14, 0)
    w, d = width / 2 - 0.06, depth - 0.06
    for x in (-w, w, -w / 3, w / 3):
        part.box('timber', x - 0.05, x + 0.05, -d - 0.05, -d + 0.05, 0, eave)          # posts
    part.box('timber', -w, w, -d - 0.04, -d + 0.04, rail - 0.06, rail)                 # handrail
    part.box('timber', -w, w, -d - 0.03, -d + 0.03, 0.06, 0.12)
    for side in (-w, w):
        part.box('timber', side - 0.04, side + 0.04, -d, 0, rail - 0.06, rail)
    x = -w + 0.1
    while x < w - 0.05:
        part.box('timber', x - 0.02, x + 0.02, -d - 0.02, -d + 0.02, 0.12, rail - 0.06)  # balusters
        x += 0.12
    part.box('timber', -w - 0.05, w + 0.05, -d - 0.06, -d + 0.06, eave - 0.12, eave)  # beam
    # Roof: barrel tiles in alternating channels, from the wall down to beyond the posts.
    overhang = 0.25
    run = depth + overhang
    slope = math.atan2(ridge - eave, depth)
    tile_r, x = 0.11, -width / 2 - 0.05
    k = 0
    while x < width / 2 + 0.05:
        up = k % 2 == 0
        z0 = ridge + (0.04 if up else 0)
        for i in range(SEGMENTS // 2):
            a = math.pi * i / (SEGMENTS // 2)
            b = math.pi * (i + 1) / (SEGMENTS // 2)
            dx0, dz0 = tile_r * math.cos(a), tile_r * math.sin(a) * (1 if up else -1) * 0.6
            dx1, dz1 = tile_r * math.cos(b), tile_r * math.sin(b) * (1 if up else -1) * 0.6
            outline = [(x + dx0, z0 + dz0), (x + dx1, z0 + dz1), (x + dx1, z0 + dz1 + 0.025), (x + dx0, z0 + dz0 + 0.025)]
            outline = outline if dx1 < dx0 else list(reversed(outline))
            part.prism('tile', outline, -run, 0)
        x += tile_r * 1.7
        k += 1
    part.box('tile', -width / 2 - 0.05, width / 2 + 0.05, -run, 0, ridge - 0.04, ridge)  # underlay between channels
    # Tip the tiles to fall from the wall; prisms were laid level, so shear them in z by y.
    b = part.bm('tile')
    for v in b.verts:
        v.co.z -= (-v.co.y) * math.tan(slope)
    part.box('plaster', -width / 2 - 0.1, width / 2 + 0.1, -0.12, 0, ridge - 0.05, ridge + 0.2)  # wall flashing


def shutter_window(part, width=1.4, sill=1.0, height=1.1, proud=0.03):
    """A dark glazed opening with its two louvred shutters folded open against the wall, under a
    white moulded hood and over a white sill (IMG_2204/2205, the block east of the north pool)."""
    r = width / 2
    part.box('glass', -r, r, -0.005, 0, sill, sill + height)
    for side in (1, -1):
        x0, x1 = sorted((side * r, side * (r + width / 2)))
        part.box('shutter', x0, x1, -proud, 0, sill, sill + height)
        z = sill + 0.06
        while z < sill + height - 0.05:
            part.box('shutter', x0 + 0.03, x1 - 0.03, -proud - 0.02, -proud, z, z + 0.03)
            z += 0.06
    part.box('plaster', -r - 0.08, r + 0.08, -0.08, 0, sill - 0.07, sill)                   # sill
    part.box('plaster', -r - 0.18, r + 0.18, -0.1, 0, sill + height + 0.1, sill + height + 0.22)  # hood
    part.box('plaster', -r - 0.1, r + 0.1, -0.06, 0, sill + height + 0.22, sill + height + 0.3)


def arched_window(part, width=0.7, sill=0.9, spring=0.95):
    """A narrow louvred window under a half-round head: the door's leaves and surround, smaller and
    raised to a sill (the arched windows on the east row of the north pool)."""
    shutter_door(part, width=width, spring=spring)
    for b in part.meshes.values():
        for v in b.verts:
            v.co.z += sill


def main():
    for name, build in (('shutter-door', shutter_door), ('iron-balcony', iron_balcony), ('wood-balcony', wood_balcony),
                        ('shutter-window', shutter_window), ('arched-window', arched_window)):
        part = Part(name)
        build(part)
        part.build()


if __name__ == '__main__':
    main()
