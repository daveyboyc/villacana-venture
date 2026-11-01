#!/usr/bin/env python3
"""Build the 3D trees headless in Blender and export them as glTF for the game.

  pip install bpy==5.2.3          (Blender as a Python module; no desktop Blender needed)
  python3 scripts/build_trees.py  writes public/models/trees/<tree>.glb and <tree>-far.glb

The trees the north-pool photos show over the roofs and in the courtyard (IMG_2204-2208):
- umbrella pine (Pinus pinea): a bare trunk forking into a few limbs under a broad flat-topped crown;
- Norfolk Island pine (Araucaria heterophylla): a tall straight trunk with sparse tiers of level
  branches carrying flat sprays (IMG_2204, IMG_2205, IMG_2206);
- eucalyptus: a tall pale trunk forking into an open, ragged crown of hanging grey-green leaves
  (the tall trees over the west wall in IMG_2206);
- broadleaf: a rounded garden tree (the generic `tree` kind);
- spreading tree: a short trunk under long level limbs and a layered, feathery crown (left of IMG_2204);
- pollarded tree: a knobbly trunk with a knuckle of short shoots, each ending in a dense clump
  (the small tree by the path, right of IMG_2204);
- a simple palm for distant use (the near palm is build_plants.py's).

Each tree has a lighter `-far` version (a few lumpy blobs, no leaf cards) for the backdrop beyond the
resort. Built from numbers here with the helpers of build_plants.py, seeded so a rebuild is
byte-identical, at the size of the sprite it replaces (SPRITE_SIZE in src/sprites.ts): standing on
its origin, x and y across the ground, z up. They are original models of the species, not scans.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_plants as kit  # noqa: E402  (loads bpy)
from build_plants import Plant, add, unit  # noqa: E402

kit.OUT = Path(__file__).resolve().parents[1] / 'public/models/trees'
kit.COLOURS.update({  # sRGB, read off the photos' trees in shade and sun
    'pine-needles': ('#3e5631', 0.9),     # umbrella pines over the roofs, IMG_2204 left
    'pine-needles-light': ('#5a6f3e', 0.9),
    'pine-bark': ('#6a5444', 0.95),
    'norfolk': ('#34502f', 0.85),          # dark, slightly blue needles, IMG_2205
    'norfolk-light': ('#4d6a3c', 0.85),
    'norfolk-bark': ('#5c4a3b', 0.95),
    'eucalyptus': ('#4e5f42', 0.85),        # grey-green hanging leaves, IMG_2206 left
    'eucalyptus-light': ('#6b7b5a', 0.85),
    'eucalyptus-bark': ('#b5a891', 0.9),   # pale, peeling trunks
    'broadleaf': ('#36522e', 0.85),
    'broadleaf-light': ('#4f6c3c', 0.85),
    'tree-bark': ('#5a4838', 0.95),
    'feathery': ('#4b6a3a', 0.85),         # layered fine-leaved crown, IMG_2204 left
    'feathery-light': ('#6b8a4b', 0.85),
    'pollard': ('#45663a', 0.85),
    'pollard-light': ('#6a8c4a', 0.85),
    'pollard-bark': ('#77675a', 0.95),
})


def blob(p, kind, centre, radii, rows=6, cols=10, lumpiness=0.12, flat_bottom=0.0):
    """A lumpy ellipsoid: one clump of a crown. Returns a function giving a surface point and its
    normal for (u, v), u round the clump and v from its bottom (-pi/2) to its top (pi/2)."""
    rng = p.rng
    b = p.bm(kind)
    lumps = [(rng.uniform(0, 2 * math.pi), rng.uniform(-1.2, 1.4), rng.uniform(0.5, 1.0) * lumpiness) for _ in range(6)]

    def at(u, v, out=1.0):
        bump = 1 + sum(h * max(0.0, math.cos(u - au)) * math.cos(v - av) for au, av, h in lumps)
        n = (math.cos(v) * math.cos(u), math.cos(v) * math.sin(u), math.sin(v))
        z = n[2] if not flat_bottom or n[2] > -flat_bottom else -flat_bottom + 0.25 * (n[2] + flat_bottom)
        return ((centre[0] + n[0] * radii[0] * bump * out, centre[1] + n[1] * radii[1] * bump * out,
                 centre[2] + z * radii[2] * bump * out), unit(n))

    grid = []
    for i in range(rows + 1):
        v = -math.pi / 2 + math.pi * i / rows
        grid.append([b.verts.new(at(2 * math.pi * j / cols, v)[0]) for j in range(cols)])
    for i in range(rows):
        for j in range(cols):
            k = (j + 1) % cols
            if i == 0:
                b.faces.new((grid[i][j], grid[i + 1][k], grid[i + 1][j])).smooth = True
            elif i == rows - 1:
                b.faces.new((grid[i][j], grid[i][k], grid[i + 1][j])).smooth = True
            else:
                b.faces.new((grid[i][j], grid[i][k], grid[i + 1][k], grid[i + 1][j])).smooth = True
    return at


def leaves(p, kinds, surface, count, size, top_bias=0.3, hang=0.0):
    """Leaf cards scattered over a clump's surface, tilted about their outward normal; `hang`
    turns them towards hanging straight down (eucalyptus)."""
    rng = p.rng
    for _ in range(count):
        u = rng.uniform(0, 2 * math.pi)
        v = math.asin(max(-1.0, min(1.0, rng.uniform(-0.6, 1.0) + top_bias * rng.random()))) if top_bias else rng.uniform(-1.2, 1.4)
        centre, normal = surface(u, v, 1.04)
        tilt = unit(add(normal, (rng.uniform(-0.7, 0.7), rng.uniform(-0.7, 0.7), rng.uniform(-0.4, 0.7))))
        if hang:
            tilt = unit(add(tilt, (math.cos(u), math.sin(u), 0), hang))
        p.card(rng.choice(kinds), centre, tilt, size, rng.uniform(0, math.pi))


def limb(p, kind, start, end, r0, r1, sides=6):
    p.tube(kind, start, end, r0, r1, sides=sides, rings=2)


def umbrella_pine(p, height=12.0, width=10.0, far=False):
    rng = p.rng
    top = (0.35, 0.15, height * 0.55)
    p.tube('pine-bark', (0, 0, 0), top, 0.34, 0.24, sides=5 if far else 8, rings=1 if far else 4)
    crown_z = height - 1.6
    if far:
        for k in range(3):
            a = 2 * math.pi * k / 3
            p.tube('pine-bark', top, (top[0] + math.cos(a) * 2.2, top[1] + math.sin(a) * 2.2, crown_z - 0.6), 0.16, 0.08, sides=4, rings=1)
        blob(p, 'pine-needles', (top[0], top[1], crown_z - 0.2), (width * 0.47, width * 0.45, 1.9), rows=5, cols=10, lumpiness=0.2, flat_bottom=0.35)
        return
    tips = []
    for k in range(5):
        a = 2 * math.pi * k / 5 + rng.uniform(-0.3, 0.3)
        reach = rng.uniform(2.2, 3.4)
        tip = (top[0] + math.cos(a) * reach, top[1] + math.sin(a) * reach, crown_z - rng.uniform(0.6, 1.4))
        limb(p, 'pine-bark', top, tip, 0.17, 0.08)
        tips.append(tip)
    clumps = [(top[0], top[1], crown_z + 0.2)] + tips
    for k, c in enumerate(clumps):
        r = width * (0.24 if k else 0.3)
        surface = blob(p, 'pine-needles', (c[0], c[1], c[2] + 0.5), (r, r * rng.uniform(0.85, 1.05), r * 0.38), rows=5, cols=10, lumpiness=0.15, flat_bottom=0.3)
        leaves(p, ('pine-needles', 'pine-needles-light', 'pine-needles-light'), surface, 120, (0.42, 0.22), top_bias=0.5)


def norfolk_pine(p, height=26.0, width=7.0, far=False):
    rng = p.rng
    p.tube('norfolk-bark', (0, 0, 0), (0, 0, height), 0.38, 0.04, sides=5 if far else 8, rings=2 if far else 6)
    step = 1.8 if far else 0.95
    z = 4.5
    tier = 0
    while z < height - 0.6:
        t = (z - 4.5) / (height - 5.1)
        length = (width * 0.5) * (1 - t) ** 0.75 + 0.35
        spin = rng.uniform(0, 2 * math.pi)
        for k in range(5):
            if rng.random() < (0.12 if far else 0.22):  # the photographed tree is gappy: some branches gone
                continue
            a = spin + 2 * math.pi * k / 5
            d = (math.cos(a), math.sin(a), 0.08)
            side = (-math.sin(a), math.cos(a), 0)
            base = (0, 0, z)
            tip = add(base, d, length)
            if not far:
                p.tube('norfolk-bark', base, add(tip, (0, 0, 0.15)), 0.05, 0.015, sides=4)
            # A flat spray of needles along the branch, the tip turned up a little.
            p.blade('norfolk' if k % 2 else 'norfolk-light', add(base, d, 0.15), unit(add(d, (0, 0, 0.12))), side,
                    length, 0.34 * (1 - 0.4 * t) + 0.12, droop=-0.06, fold=0.15, segments=3 if far else 5, shape='leaflet')
            if not far:
                p.blade('norfolk', add(base, d, 0.25), unit(add(d, (0, 0, 0.12))), (0, 0, 1),
                        length * 0.9, 0.16, droop=-0.04, fold=0, segments=4, shape='leaflet')
        z += step * rng.uniform(0.85, 1.2)
        tier += 1


def eucalyptus(p, height=20.0, width=9.0, far=False):
    """Tall pale trunk forking low into a dense, ragged, upright crown (the tall trees in IMG_2206)."""
    rng = p.rng
    fork = (0.3, -0.2, height * 0.3)
    p.tube('eucalyptus-bark', (0, 0, 0), fork, 0.42, 0.3, sides=5 if far else 8, rings=1 if far else 3)
    if far:
        p.tube('eucalyptus-bark', fork, (0.2, 0, height * 0.6), 0.3, 0.15, sides=4, rings=1)
        for k, (z, r) in enumerate(((0.55, 0.32), (0.74, 0.29), (0.88, 0.2))):
            a = 2.3 * k
            blob(p, 'eucalyptus', (math.cos(a) * 1.0, math.sin(a) * 1.0, height * z), (width * r, width * r * 0.85, height * 0.2), rows=4, cols=7, lumpiness=0.3)
        return
    clumps = []
    for k in range(3):
        a = 2 * math.pi * k / 3 + rng.uniform(-0.4, 0.4)
        mid = (fork[0] + math.cos(a) * 1.0, fork[1] + math.sin(a) * 1.0, height * 0.55)
        tip = (fork[0] + math.cos(a) * width * 0.22, fork[1] + math.sin(a) * width * 0.22, height * rng.uniform(0.78, 0.86))
        limb(p, 'eucalyptus-bark', fork, mid, 0.22, 0.15)
        limb(p, 'eucalyptus-bark', mid, tip, 0.15, 0.06)
        clumps += [tip, add(mid, (math.cos(a) * 1.2, math.sin(a) * 1.2, 0.5)), add(fork, (math.cos(a + 1) * 1.6, math.sin(a + 1) * 1.6, height * 0.2))]
    clumps.append((fork[0], fork[1], height * 0.92))
    for c in clumps:
        r = width * rng.uniform(0.18, 0.24)
        surface = blob(p, 'eucalyptus', c, (r, r * 0.9, r * 2.0), rows=5, cols=8, lumpiness=0.35)
        leaves(p, ('eucalyptus', 'eucalyptus-light'), surface, 150, (0.14, 0.55), top_bias=0, hang=1.0)


def broadleaf(p, height=6.2, width=5.2, far=False):
    rng = p.rng
    fork = (0.1, 0.05, height * 0.38)
    p.tube('tree-bark', (0, 0, 0), add(fork, (0, 0, 0.6 if far else 0)), 0.2, 0.15, sides=5 if far else 7, rings=1 if far else 3)
    centre = (fork[0], fork[1], height * 0.66)
    if far:
        blob(p, 'broadleaf', centre, (width * 0.47, width * 0.45, height * 0.3), rows=5, cols=8, lumpiness=0.15, flat_bottom=0.2)
        return
    for k in range(3):
        a = 2 * math.pi * k / 3 + rng.uniform(-0.3, 0.3)
        limb(p, 'tree-bark', fork, (math.cos(a) * width * 0.22, math.sin(a) * width * 0.22, height * 0.7), 0.1, 0.05)
    for k in range(6):
        a = 2 * math.pi * k / 6 + rng.uniform(-0.3, 0.3)
        c = (centre[0] + math.cos(a) * width * 0.22, centre[1] + math.sin(a) * width * 0.22, centre[2] + rng.uniform(-0.5, 0.6))
        surface = blob(p, 'broadleaf', c, (width * 0.24, width * 0.24, height * 0.2), rows=5, cols=8)
        leaves(p, ('broadleaf', 'broadleaf-light'), surface, 70, (0.16, 0.1))
    surface = blob(p, 'broadleaf', (centre[0], centre[1], centre[2] + height * 0.12), (width * 0.26, width * 0.26, height * 0.2), rows=5, cols=8)
    leaves(p, ('broadleaf', 'broadleaf-light', 'broadleaf-light'), surface, 90, (0.16, 0.1))


def spreading_tree(p, height=5.4, width=5.6):
    """Short trunk, four long nearly level limbs, a layered crown of fine leaves (left of IMG_2204)."""
    rng = p.rng
    fork = (0, 0, 1.7)
    p.tube('tree-bark', (0, 0, 0), fork, 0.22, 0.17, sides=8, rings=3)
    for k in range(4):
        a = 2 * math.pi * k / 4 + rng.uniform(-0.35, 0.35)
        elbow = (math.cos(a) * 0.9, math.sin(a) * 0.9, 2.8)
        tip = (math.cos(a) * width * 0.4, math.sin(a) * width * 0.4, rng.uniform(3.3, 3.9))
        limb(p, 'tree-bark', fork, elbow, 0.13, 0.09)
        limb(p, 'tree-bark', elbow, tip, 0.09, 0.04)
        for layer, (reach, z, r) in enumerate(((0.55, 3.6, 0.3), (0.85, 3.9, 0.26), (0.4, 4.6, 0.28))):
            c = (math.cos(a + 0.4 * layer) * width * 0.5 * reach, math.sin(a + 0.4 * layer) * width * 0.5 * reach, z + rng.uniform(-0.2, 0.3))
            surface = blob(p, 'feathery', c, (width * r, width * r * 0.9, 0.42), rows=4, cols=9, lumpiness=0.18, flat_bottom=0.5)
            leaves(p, ('feathery', 'feathery-light'), surface, 75, (0.12, 0.05), top_bias=0.4)
    surface = blob(p, 'feathery', (0, 0, height - 0.45), (width * 0.24, width * 0.24, 0.45), rows=4, cols=9, flat_bottom=0.5)
    leaves(p, ('feathery', 'feathery-light'), surface, 80, (0.12, 0.05), top_bias=0.4)


def pollarded_tree(p, height=4.2, width=2.6):
    """A knobbly trunk with a knuckle of short shoots, each ending in a dense round clump: an umbrella."""
    rng = p.rng
    knuckle = (0.05, 0, height * 0.6)
    p.tube('pollard-bark', (0, 0, 0), knuckle, 0.16, 0.13, sides=8, rings=4, ripple=0.05)
    blob(p, 'pollard-bark', knuckle, (0.2, 0.2, 0.16), rows=4, cols=8, lumpiness=0.3)
    for k in range(6):
        a = 2 * math.pi * k / 6 + rng.uniform(-0.3, 0.3)
        out = rng.uniform(0.25, 0.42) * width
        tip = (knuckle[0] + math.cos(a) * out * 0.7, knuckle[1] + math.sin(a) * out * 0.7, height * rng.uniform(0.76, 0.84))
        limb(p, 'pollard-bark', knuckle, tip, 0.06, 0.035, sides=5)
        surface = blob(p, 'pollard', add(tip, (math.cos(a) * 0.2, math.sin(a) * 0.2, 0.25)), (0.48, 0.48, 0.36), rows=4, cols=8, lumpiness=0.2)
        leaves(p, ('pollard', 'pollard-light'), surface, 45, (0.11, 0.07), top_bias=0.3)
    surface = blob(p, 'pollard', (0, 0, height - 0.45), (0.6, 0.6, 0.42), rows=4, cols=8)
    leaves(p, ('pollard', 'pollard-light', 'pollard-light'), surface, 60, (0.11, 0.07), top_bias=0.3)


def palm_far(p, height=10.0):
    """A palm for the distance: a plain trunk and a dome of arching fronds, each two leaflet halves in a V."""
    rng = p.rng
    head = (0.15, 0.05, height - 2.6)
    p.tube('palm-trunk', (0, 0, 0), head, 0.38, 0.3, sides=5, rings=1)
    for i in range(16):
        a = 2 * math.pi * i / 16 * 2.618
        up = 1.0 - 1.1 * (i / 16) + rng.uniform(-0.1, 0.1)
        d = unit((math.cos(a) * math.cos(up), math.sin(a) * math.cos(up), math.sin(up)))
        side = (-math.sin(a), math.cos(a), 0)
        for sign in (1, -1):
            half = unit(add((side[0] * sign, side[1] * sign, 0), (0, 0, -1), 0.6))
            p.blade('palm-frond', head, d, half, 3.1, 0.55, droop=0.4, fold=0, segments=5, shape='leaflet')


def main():
    for name, seed, build in (
            ('umbrella-pine', 61, umbrella_pine), ('umbrella-pine-far', 61, lambda p: umbrella_pine(p, far=True)),
            ('norfolk-pine', 67, norfolk_pine), ('norfolk-pine-far', 67, lambda p: norfolk_pine(p, far=True)),
            ('eucalyptus', 71, eucalyptus), ('eucalyptus-far', 71, lambda p: eucalyptus(p, far=True)),
            ('broadleaf', 73, broadleaf), ('broadleaf-far', 73, lambda p: broadleaf(p, far=True)),
            ('spreading-tree', 79, spreading_tree), ('pollarded-tree', 83, pollarded_tree),
            ('palm-far', 89, palm_far)):
        tree = Plant(name, seed)
        build(tree)
        tree.build()


if __name__ == '__main__':
    main()
