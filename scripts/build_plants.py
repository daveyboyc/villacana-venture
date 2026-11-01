#!/usr/bin/env python3
"""Build the 3D plants headless in Blender and export them as glTF for the game.

  pip install bpy==5.2.3          (Blender as a Python module; no desktop Blender needed)
  python3 scripts/build_plants.py writes public/models/plants/<plant>.glb

They replace the painted crossed cards (src/sprites.ts) for the plants the north-pool photos show
closest: the Strelitzia clumps beside the pool (IMG_2204, IMG_2206), the clipped and flowering
hedges round the lawn (IMG_2204-2206), the many-headed yucca by the east wall (IMG_2205) and the
feather palms behind the houses. Each plant is built from numbers here, seeded so a rebuild is
byte-identical, at the size of the card it replaces (SPRITE_SIZE in src/sprites.ts): standing on
its origin, x and y across the ground, z up. They are original models, not scans of the actual plants.
"""
import math
import random
from pathlib import Path

import bpy
import bmesh  # only importable once bpy is loaded

OUT = Path(__file__).resolve().parents[1] / 'public/models/plants'

COLOURS = {  # sRGB, from the photos
    'strelitzia': ('#5b7646', 0.65),      # grey-green paddle leaves, IMG_2204
    'strelitzia-light': ('#748c52', 0.65),
    'strelitzia-stem': ('#8c8068', 0.85),
    'palm-frond': ('#5e7a3c', 0.7),
    'palm-trunk': ('#7d6a52', 0.95),
    'yucca': ('#58733a', 0.6),
    'yucca-dry': ('#9a8a62', 0.9),         # the dead leaves hanging under each head
    'yucca-trunk': ('#8a7c66', 0.95),
    'hedge': ('#3b5631', 0.95),              # clipped hedges round the lawn, IMG_2204-2206
    'hedge-light': ('#58783f', 0.9),
    'hedge-dark': ('#2b4024', 0.95),
    'hibiscus': ('#c42a3a', 0.6),           # red flowers in the hedge in front of the camera, IMG_2204
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
    m.use_backface_culling = False  # exported as double-sided: leaves are seen from both faces
    return m


def add(a, b, k=1.0):
    return (a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k)


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(a):
    n = math.sqrt(sum(v * v for v in a)) or 1.0
    return (a[0] / n, a[1] / n, a[2] / n)


class Plant:
    """Collects tubes, blades and blobs into one mesh per material."""

    def __init__(self, name, seed):
        self.name = name
        self.meshes = {}
        self.rng = random.Random(seed)

    def bm(self, kind):
        return self.meshes.setdefault(kind, bmesh.new())

    def tube(self, kind, p0, p1, r0, r1, sides=8, rings=1, ripple=0.0, ring_step=None):
        """A tapering tube from p0 to p1. With `ripple`, rings alternate a diamond bulge (palm trunks)."""
        b = self.bm(kind)
        axis = unit((p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]))
        side = unit(cross(axis, (0, 0, 1) if abs(axis[2]) < 0.99 else (1, 0, 0)))
        other = cross(axis, side)
        length = math.dist(p0, p1)
        if ring_step:
            rings = max(1, round(length / ring_step))
        loops = []
        for i in range(rings + 1):
            t = i / rings
            centre = add(p0, axis, length * t)
            r = r0 + (r1 - r0) * t
            loop = []
            for j in range(sides):
                a = 2 * math.pi * j / sides
                rr = r * (1 + ripple * math.cos(sides / 2 * a + i * math.pi)) if ripple else r
                loop.append(b.verts.new(add(add(centre, side, math.cos(a) * rr), other, math.sin(a) * rr)))
            loops.append(loop)
        for i in range(rings):
            for j in range(sides):
                k = (j + 1) % sides
                b.faces.new((loops[i][j], loops[i][k], loops[i + 1][k], loops[i + 1][j])).smooth = True
        b.faces.new(list(reversed(loops[0])))
        b.faces.new(loops[-1])

    def blade(self, kind, base, direction, side, length, width, droop=0.3, fold=0.2, segments=8, shape='oblong', tears=0):
        """A leaf blade along `direction` from `base`, `width` either side of its midrib, sagging by
        `droop` of its length at the tip and folded up from the midrib by `fold`. `tears` cuts that
        many slits in from each edge, as wind shreds a Strelitzia leaf."""
        b = self.bm(kind)
        d, s = unit(direction), unit(side)
        n = unit(cross(d, s))
        cut = set()
        for _ in range(tears):
            cut.add((self.rng.choice((0, 1)), self.rng.randrange(2, segments - 1)))
        rows = []
        for i in range(segments + 1):
            t = i / segments
            centre = add(add(base, d, length * t), (0, 0, -1), droop * length * t * t)
            if shape == 'oblong':
                w = width * min(1.0, 3.2 * math.sin(math.pi * t) ** 0.7) * (1 - 0.35 * t)
            elif shape == 'strap':
                w = width * (1 - t) ** 0.6
            else:  # leaflet: widest a third along, to a point
                w = width * math.sin(math.pi * min(1.0, t * 1.2)) ** 0.8
            edge_lift = fold * w
            rows.append([b.verts.new(add(add(centre, s, w), n, edge_lift)), b.verts.new(centre),
                         b.verts.new(add(add(centre, s, -w), n, edge_lift))])
        for i in range(segments):
            for half in (0, 1):
                if (half, i) in cut:
                    continue
                a, c = (0, 1) if half == 0 else (1, 2)
                f = b.faces.new((rows[i][a], rows[i][c], rows[i + 1][c], rows[i + 1][a]))
                f.smooth = True

    def card(self, kind, centre, normal, size, spin, offset=0.0):
        """A small flat quad facing `normal`, turned by `spin` and moved `offset` along its long side:
        one leaf or petal of a hedge."""
        b = self.bm(kind)
        n = unit(normal)
        s0 = unit(cross(n, (0, 0, 1) if abs(n[2]) < 0.95 else (1, 0, 0)))
        o0 = cross(n, s0)
        c, si = math.cos(spin), math.sin(spin)
        s = tuple(s0[k] * c + o0[k] * si for k in range(3))
        o = tuple(o0[k] * c - s0[k] * si for k in range(3))
        centre = add(centre, s, offset)
        w, h = size
        pts = [add(add(centre, s, sx * w), o, sy * h) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
        b.faces.new([b.verts.new(p) for p in pts])

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


def strelitzia(p, height=4.6, spread=1.7):
    """Strelitzia nicolai: a clump of grey stems, each carrying a flat fan of paddle leaves on long
    stalks, the outer ones bowed and torn into strips (IMG_2204, IMG_2206)."""
    rng = p.rng
    for stem in range(7):
        a = rng.uniform(0, 2 * math.pi)
        foot = (math.cos(a) * rng.uniform(0, 0.45), math.sin(a) * rng.uniform(0, 0.45), 0)
        top = rng.uniform(0.4, 1.6) if stem else 1.9
        crown = add(foot, (rng.uniform(-0.15, 0.15), rng.uniform(-0.15, 0.15), top))
        p.tube('strelitzia-stem', foot, crown, 0.09, 0.06, sides=7, rings=3)
        fan = rng.uniform(0, math.pi)  # leaves of one stem open in a single vertical fan
        across = (math.cos(fan), math.sin(fan), 0)
        for leaf in range(rng.randint(5, 8)):
            lean = rng.uniform(-0.85, 0.85)  # angle from vertical within the fan
            stalk_dir = unit((across[0] * math.sin(lean), across[1] * math.sin(lean), math.cos(lean)))
            stalk = rng.uniform(0.4, 0.8)
            start = add(crown, stalk_dir, stalk)
            p.tube('strelitzia-stem', crown, start, 0.03, 0.022, sides=5)
            length = min(rng.uniform(1.6, 2.2), height - start[2] + 0.6)
            blade_dir = unit(add(stalk_dir, across, 0.25 * math.copysign(1, lean)))
            p.blade('strelitzia-light' if leaf % 2 else 'strelitzia', start, blade_dir,
                    (-across[1], across[0], 0.15), length, rng.uniform(0.28, 0.36),
                    droop=0.15 + 0.35 * abs(lean), fold=0.25, segments=9, tears=rng.choice((0, 0, 2, 3, 5)))


def palm(p, height=10.0, crown=2.5):
    """A Canary date palm: a stout, diamond-scarred trunk under a dense dome of arching feather fronds."""
    rng = p.rng
    trunk_top = height - crown - 0.4
    p.tube('palm-trunk', (0, 0, 0), (0.15, 0.05, trunk_top), 0.4, 0.33, sides=12, ripple=0.06, ring_step=0.22)
    head = (0.15, 0.05, trunk_top)
    fronds = 44
    for i in range(fronds):
        a = 2 * math.pi * i / fronds * 2.618  # golden-angle spiral, as palms grow
        up = 1.25 - 1.05 * (i / fronds) ** 0.8 + rng.uniform(-0.1, 0.1)  # upper fronds steep, lower ones flat
        d = unit((math.cos(a) * math.cos(up), math.sin(a) * math.cos(up), math.sin(up)))
        side = (-math.sin(a), math.cos(a), 0)
        length = rng.uniform(3.0, 3.6)
        droop = 0.25 + 0.35 * (i / fronds)
        steps = 32
        prev = head
        for k in range(1, steps + 1):
            t = k / steps
            point = add(add(head, d, length * t), (0, 0, -1), droop * length * t * t)
            if t > 0.15:  # leaflet pairs along the midrib, in a V
                span = 0.55 * math.sin(math.pi * min(1.0, (t - 0.12) * 1.15)) + 0.12
                along = unit((point[0] - prev[0], point[1] - prev[1], point[2] - prev[2]))
                for sign in (1, -1):
                    out = unit(add(add((side[0] * sign, side[1] * sign, 0), along, 0.6), (0, 0, 1), 0.45))
                    p.blade('palm-frond', point, out, along, span, 0.035, droop=0.12, fold=0, segments=1, shape='strap')
            prev = point
        p.tube('palm-frond', head, add(add(head, d, length * 0.5), (0, 0, -1), droop * length * 0.25), 0.03, 0.015, sides=4)


def yucca(p, height=4.6, spread=2.1):
    """Yucca elephantipes: several leaning trunks from one base, each ending in a spiky rosette over
    a skirt of dead leaves (the big yucca by the east wall in IMG_2205)."""
    rng = p.rng
    heads = 5
    for h in range(heads):
        a = 2 * math.pi * h / heads + rng.uniform(-0.3, 0.3)
        lean = rng.uniform(0.15, 0.45)
        tall = rng.uniform(1.6, height - 1.0)
        top = (math.cos(a) * math.sin(lean) * tall, math.sin(a) * math.sin(lean) * tall, math.cos(lean) * tall)
        p.tube('yucca-trunk', (0, 0, 0), top, 0.22, 0.14, sides=8, rings=4)
        for leaf in range(72):
            polar = math.acos(1 - rng.uniform(0, 1.55))  # from straight up to just below level
            spin = rng.uniform(0, 2 * math.pi)
            d = (math.sin(polar) * math.cos(spin), math.sin(polar) * math.sin(spin), math.cos(polar))
            side = (-math.sin(spin), math.cos(spin), 0)
            p.blade('yucca', top, d, side, rng.uniform(0.75, 1.1), 0.05, droop=0.1 + 0.3 * polar / 1.6,
                    fold=0.3, segments=4, shape='strap')
        for leaf in range(14):
            spin = rng.uniform(0, 2 * math.pi)
            d = (0.35 * math.cos(spin), 0.35 * math.sin(spin), -1)
            p.blade('yucca-dry', add(top, (0, 0, -0.08)), d, (-math.sin(spin), math.cos(spin), 0),
                    rng.uniform(0.4, 0.65), 0.035, droop=0, fold=0.2, segments=3, shape='strap')


def hedge(p, width=1.7, height=1.3, flowers=0):
    """A clipped hedge: a squarish rounded mound with uneven lumps, its surface broken by small leaves
    in three greens; with `flowers`, red hibiscus flowers set into the outside (IMG_2204-2206)."""
    rng = p.rng
    b = p.bm('hedge-dark')  # the shell reads as the shadowed inside of the hedge; leaves cover it
    a, c = width * 0.55, height * 0.5  # a little wider than the card, so neighbours in a row join up
    se = lambda w: math.copysign(abs(w) ** (2 / 4.5), w)  # superellipse: boxy, clipped

    def surface(u, v, out=1.0):
        x, y, z = se(math.cos(v) * math.cos(u)), se(math.cos(v) * math.sin(u)), se(math.sin(v))
        return (x * a * out, y * a * out, max(0.0, c + z * c * out)), unit((math.cos(v) * math.cos(u), math.cos(v) * math.sin(u), math.sin(v)))

    lumps = [(rng.uniform(0, 2 * math.pi), rng.uniform(0.2, 1.4), rng.uniform(0.03, 0.06)) for _ in range(7)]
    rows, cols = 10, 20
    grid = []
    for i in range(rows + 1):
        v = -math.pi / 2 + math.pi * i / rows
        row = []
        for j in range(cols):
            u = 2 * math.pi * j / cols
            x, y, z = se(math.cos(v) * math.cos(u)), se(math.cos(v) * math.sin(u)), se(math.sin(v))
            bump = sum(h * math.cos(u - au) * math.cos(v - av) for au, av, h in lumps)
            r = 1 + bump + rng.uniform(-0.015, 0.015)
            row.append(b.verts.new((x * a * r, y * a * r, max(0.0, c + z * c * r))))
        grid.append(row)
    for i in range(rows):
        for j in range(cols):
            k = (j + 1) % cols
            b.faces.new((grid[i][j], grid[i][k], grid[i + 1][k], grid[i + 1][j])).smooth = True
    for leaf in range(900):
        u, v = rng.uniform(0, 2 * math.pi), rng.uniform(-0.15, 1.0) * math.pi / 2
        centre, normal = surface(u, v, 1.03)
        tilt = unit(add(normal, (rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), rng.uniform(-0.3, 0.6))))
        p.card(rng.choice(('hedge-light', 'hedge', 'hedge')), centre, tilt, (0.09, 0.055), rng.uniform(0, math.pi))
    for flower in range(flowers):
        u, v = rng.uniform(0, 2 * math.pi), rng.uniform(0.05, 0.8) * math.pi / 2
        centre, normal = surface(u, v, 1.07)
        for petal in range(5):  # five petals round the centre, splayed slightly outwards
            spin = 2 * math.pi * petal / 5 + rng.uniform(-0.2, 0.2)
            p.card('hibiscus', centre, normal, (0.055, 0.04), spin, offset=0.05)


def main():
    for name, seed, build in (('strelitzia', 11, strelitzia), ('palm', 23, palm), ('yucca', 37, yucca),
                              ('hedge', 41, hedge), ('hibiscus-hedge', 53, lambda p: hedge(p, flowers=22))):
        plant = Plant(name, seed)
        build(plant)
        plant.build()


if __name__ == '__main__':
    main()
