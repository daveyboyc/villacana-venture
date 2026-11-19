#!/usr/bin/env python3
"""Build the banana plant beside Calle de Miguel headless in Blender and export it as glTF.

  python3 scripts/build_banana.py      writes public/models/plants/banana.glb

The plant photographed over the garden wall in IMG_3092 (key view, looking up from the lane),
IMG_3090 (from further west) and IMG_3093 (a leaf edge in shade): one slender pseudostem with
brown dried sheaths, about ten paddle leaves on long pale petioles, the upper ones nearly upright
and the lower ones arching out and down, their margins yellowed and dried brown and torn into
strips along the lateral veins; a bunch of small green bananas (hands of upward-curving fingers)
on a curved stalk below the crown, and below it, at the end of a bare rachis, the dark
purple-maroon male bud with one bract lifted.

Sizes are estimated from the photos (see docs/reviews/banana-asset/README.md): leaves part from the
pseudostem at about 2.75 m, the top leaf tip is at 5.97 m, blades are 1.55-2.55 m long and 0.54-0.70 m
wide, and the whole plant spans about 4.4 by 4.1 m. It stands on its origin, x and y across
the ground, z up (exported y-up). The textures are painted here from numbers (numpy) and embedded in
the GLB; everything is seeded so a rebuild is byte-identical. An original procedural model, not a
scan or a downloaded model. Shares Plant (one bmesh per material) with scripts/build_plants.py.
"""
import math
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_plants import OUT, Plant, add, cross, unit  # noqa: E402  (bpy is loaded by build_plants)

import bpy  # noqa: E402

SEED = 3092  # the key photo

# Materials: (texture, roughness, double-sided, alpha-masked, normal map). Four in all.
MATERIALS = {
    'banana-leaf': ('leaf', 0.48, True, True, 'leaf-normal'),
    'banana-stem': ('stem', 0.78, False, False, None),
    'banana-fruit': ('fruit', 0.55, False, False, None),
    'banana-bud': ('bud', 0.32, True, False, None),
}

# Leaf atlas: four leaves side by side, u across the blade, v from stalk (0) to tip (1).
GREEN, YELLOWED, BROWNED, DEAD = range(4)
# Stem atlas columns (u ranges) for the pseudostem, petioles/midribs, the fruit stalk and the rachis.
PSEUDOSTEM, PETIOLE, PEDUNCLE, RACHIS = (0.0, 0.5), (0.5, 0.7), (0.7, 0.85), (0.85, 1.0)


def mix(a, b, k):
    k = np.asarray(k)[..., None] if np.ndim(k) else k
    return np.asarray(a) * (1 - k) + np.asarray(b) * k


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def noise(rng, h, w, cy, cx):
    """Smooth value noise in 0..1, `cy` by `cx` cells over an h by w image."""
    grid = rng.random((cy + 3, cx + 3)).astype(np.float32)
    big = Image.fromarray(grid, 'F').resize((w * (cx + 3) // cx, h * (cy + 3) // cy), Image.BICUBIC)
    oy, ox = h // cy, w // cx
    return np.clip(np.asarray(big)[oy:oy + h, ox:ox + w], 0, 1)


def noise1(rng, n, cells):
    """1-D smooth noise sampled at n points."""
    return noise(rng, 1, n, 1, cells)[0]


def fbm(rng, h, w, cy, cx, octaves=3):
    out, amp, total = np.zeros((h, w), np.float32), 1.0, 0.0
    for _ in range(octaves):
        out += amp * noise(rng, h, w, cy, cx)
        total += amp
        amp, cy, cx = amp * 0.5, cy * 2, cx * 2
    return out / total


def srgb(*c):
    return np.array(c, np.float32) / 255


# ---------------------------------------------------------------------------------------------
# Textures
# ---------------------------------------------------------------------------------------------

LEAF_L, LEAF_W = 2.2, 0.29  # metres, the blade the texture is painted for (vein spacing)
VEIN_SLOPE = 0.36           # lateral veins run out from the midrib at ~70 degrees, toward the tip


def leaf_column(rng, variant, w=256, h=1024):
    """One leaf of the atlas, painted with v up (row 0 = stalk end); returns RGBA float and height."""
    j = (np.arange(w) + 0.5) / w
    i = (np.arange(h) + 0.5) / h
    x = (j[None, :] - 0.5) / 0.48            # -1..1 across the blade, margins at +-1
    t = np.repeat(i[:, None], w, 1)          # 0 at the stalk, 1 at the tip
    ax = np.abs(x)
    m = 1 - ax                               # 0 at the margin, 1 on the midrib
    phase = t * LEAF_L - ax * LEAF_W * VEIN_SLOPE  # metres along the lateral veins
    half = (x > 0).astype(np.float32)

    def along(cells, scale=1.0):  # noise along the veins (constant along one vein), per half
        a, b = noise1(rng, 2048, cells), noise1(rng, 2048, cells)
        k = np.clip(phase / (LEAF_L + 0.2) + 0.05, 0, 1) * 2047
        return np.where(x > 0, np.interp(k, np.arange(2048), a), np.interp(k, np.arange(2048), b)) * scale

    low = fbm(rng, h, w, 6, 2)
    mid = fbm(rng, h, w, 40, 10)
    fine = 0.5 + 0.5 * np.sin(2 * np.pi * phase / 0.0055)
    pleat = 0.5 + 0.5 * np.sin(2 * np.pi * phase / 0.028)
    streak = along(160)

    dark, base, light = srgb(92, 130, 38), srgb(126, 162, 50), srgb(166, 186, 66)
    col = mix(dark, base, smooth(0.2, 0.6, low))
    col = mix(col, light, 0.45 * smooth(0.55, 0.9, mid) * (0.4 + 0.6 * low))
    col = col * (0.93 + 0.05 * fine + 0.06 * pleat + 0.06 * (streak - 0.5))[..., None]
    # Pale midrib, narrowing toward the tip, and a paler stalk end.
    rib = smooth(0.06 * (1 - 0.6 * t), 0.02 * (1 - 0.6 * t), ax)
    col = mix(col, srgb(196, 196, 128), rib)

    yellow, lime = srgb(206, 182, 52), srgb(160, 160, 46)
    brown, dark_brown, tan = srgb(132, 86, 42), srgb(78, 48, 24), srgb(170, 132, 78)
    edge_noise = along(90)
    dry = np.zeros_like(t)
    if variant == GREEN:
        yb = 0.025 + 0.06 * along(30) * smooth(0.2, 0.9, t)
        dry = 0.5 * smooth(0.012, 0.0, m - 0.02 * edge_noise)
    elif variant == YELLOWED:
        yb = 0.16 + 0.26 * along(24) + 0.08 * t
        bb = 0.03 + 0.14 * along(60) * smooth(0.55, 0.85, along(14))
        dry = smooth(bb, bb * 0.6, m)
    elif variant == BROWNED:
        lop = 0.6 + 0.4 * half             # one half (x > 0) scorched far more, as in the photo
        bb = (0.10 + 0.55 * along(18) * smooth(0.15, 0.4, t)) * lop
        yb = bb + 0.08 + 0.10 * along(30)
        dry = smooth(bb, bb * 0.75, m) * smooth(0.0, 0.03, m - 0.015 * edge_noise + 0.02)
        dry = np.maximum(dry, 0.6 * smooth(0.035, 0.0, m))
    else:  # DEAD: a leaf hanging dried against the stem
        yb = np.full_like(t, 1.5)
        dry = np.full_like(t, 1.0)
    yellowing = smooth(yb, yb * 0.55, m)
    col = mix(col, lime, smooth(yb + 0.06, yb, m) * 0.6)
    col = mix(col, yellow * (0.9 + 0.2 * streak[..., None]), yellowing)
    dry_col = mix(brown, dark_brown, smooth(0.45, 0.8, streak) * 0.8)
    dry_col = mix(dry_col, tan, smooth(0.6, 0.95, mid) * 0.7)
    if variant == DEAD:
        dry_col = mix(srgb(128, 98, 62), srgb(80, 58, 36), smooth(0.3, 0.8, streak))
        dry_col = mix(dry_col, srgb(160, 138, 104), 0.4 * smooth(0.5, 0.9, mid))
    col = mix(col, dry_col, np.clip(dry, 0, 1))
    col = col * (0.96 + 0.06 * fine)[..., None]

    # Alpha: a ragged margin (more ragged where dried) and slits torn in along the lateral veins.
    e = 0.012 + 0.03 * smooth(0.5, 1.0, edge_noise) + 0.05 * dry * smooth(0.3, 0.9, mid)
    alpha = (m > e) & (ax <= 1.0)
    slits = {GREEN: 6, YELLOWED: 14, BROWNED: 18, DEAD: 22}[variant]
    for sign in (1, -1):
        for _ in range(slits):
            p0 = rng.uniform(0.15, LEAF_L - 0.05)
            depth = rng.uniform(0.05, 0.45) * (1.6 if variant != GREEN else 1)
            width = rng.uniform(0.002, 0.006)
            cut = (np.abs(phase - p0) < width) & (m < depth) & ((x * sign) > 0)
            alpha &= ~cut
    if variant == DEAD:
        holes = fbm(rng, h, w, 30, 8) > 0.68
        alpha &= ~holes
    # Height for the normal map: pleats along the lateral veins, a groove on the midrib.
    height = 0.7 * np.sin(2 * np.pi * phase / 0.028) + 0.25 * np.sin(2 * np.pi * phase / 0.0095)
    height -= 1.5 * smooth(0.05, 0.0, ax)
    rgba = np.concatenate([np.clip(col, 0, 1), alpha[..., None].astype(np.float32)], -1)
    return rgba, height


def leaf_textures(rng):
    cols, heights = zip(*(leaf_column(rng, v) for v in range(4)))
    rgba = np.concatenate(cols, 1)
    height = np.concatenate(heights, 1)
    # Bleed colour under transparent pixels so mipmaps do not fringe dark.
    rgb = rgba[..., :3].copy()
    a = rgba[..., 3:]
    blurred = np.asarray(Image.fromarray((rgb * 255).astype(np.uint8)).resize((64, 64), Image.BOX)
                         .resize((rgb.shape[1], rgb.shape[0]), Image.BILINEAR), np.float32) / 255
    rgb = rgb * a + blurred * (1 - a)
    rgba = np.concatenate([rgb, a], -1)
    image = Image.fromarray((np.flipud(rgba) * 255 + 0.5).astype(np.uint8), 'RGBA')
    image = image.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    # Normal map at half size, from the height field (v up, as glTF/OpenGL expect).
    hs = np.asarray(Image.fromarray(height.astype(np.float32), 'F').resize((512, 512), Image.BILINEAR))
    dy, dx = np.gradient(hs)
    k = 0.35
    n = np.stack([-dx * k, -dy * k, np.ones_like(hs)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    normal = Image.fromarray((np.flipud(n * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8), 'RGB')
    return image, normal


def stem_texture(rng, size=512):
    h = w = size
    u = (np.arange(w) + 0.5) / w
    v = np.repeat(((np.arange(h) + 0.5) / h)[:, None], w, 1)
    U = np.repeat(u[None, :], h, 0)
    out = np.zeros((h, w, 3), np.float32)

    # Pseudostem: pale green-cream sheaths with vertical streaks, sheath margins spiralling up,
    # brown dried outer sheaths (most on the lower half) and black blotches.
    streaks = fbm(rng, h, w, 3, 48)
    blot = fbm(rng, h, w, 10, 18)
    patches = fbm(rng, h, w, 5, 6)
    col = mix(srgb(170, 172, 110), srgb(200, 198, 140), smooth(0.3, 0.7, streaks))
    col = mix(col, srgb(120, 138, 70), 0.5 * smooth(0.4, 1.0, v) * smooth(0.5, 0.8, patches))
    sheath = np.abs(((U * 2 + 0.18 * v) * 5) % 1 - 0.5)
    col = col * (1 - 0.18 * smooth(0.06, 0.0, sheath))[..., None]
    dried = smooth(0.42, 0.62, patches + 0.35 * (1 - v) - 0.25 * v) * smooth(0.15, 0.3, sheath + 0.1)
    dry = mix(srgb(122, 92, 58), srgb(164, 132, 90), smooth(0.3, 0.8, streaks))
    col = mix(col, dry, dried)
    col = mix(col, srgb(70, 54, 36), 0.6 * smooth(0.76, 0.84, blot))
    col *= (0.92 + 0.16 * streaks)[..., None]
    sel = U < 0.5
    out[sel] = col[sel]

    # Petioles and midribs: pale yellow-green, greener on the upper side, fine lengthwise lines.
    lines = fbm(rng, h, w, 2, 90)
    pu = (U - 0.5) / 0.2
    col = mix(srgb(200, 200, 128), srgb(150, 168, 82), 0.5 + 0.5 * np.cos(2 * np.pi * pu))
    col *= (0.92 + 0.14 * lines)[..., None]
    sel = (U >= 0.5) & (U < 0.7)
    out[sel] = col[sel]

    # Fruit stalk: darker green, speckled.
    col = mix(srgb(86, 104, 44), srgb(118, 132, 60), fbm(rng, h, w, 40, 40))
    sel = (U >= 0.7) & (U < 0.85)
    out[sel] = col[sel]

    # Rachis: dark maroon-brown, banded by the scars of fallen male flowers.
    band = 0.5 + 0.5 * np.cos(2 * np.pi * v * 16)
    col = mix(srgb(70, 46, 40), srgb(120, 92, 66), smooth(0.6, 1.0, band) * fbm(rng, h, w, 16, 16))
    sel = U >= 0.85
    out[sel] = col[sel]
    return Image.fromarray((np.flipud(np.clip(out, 0, 1)) * 255 + 0.5).astype(np.uint8), 'RGB')


def fruit_texture(rng, w=128, h=256):
    u = (np.arange(w) + 0.5) / w
    v = np.repeat(((np.arange(h) + 0.5) / h)[:, None], w, 1)
    U = np.repeat(u[None, :], h, 0)
    ridge = np.abs((U * 5) % 1 - 0.5) * 2         # 0 on the five ridges
    col = mix(srgb(76, 104, 34), srgb(104, 130, 46), fbm(rng, h, w, 4, 12))
    col = mix(col, srgb(120, 142, 62), 0.4 * smooth(0.25, 0.0, ridge))
    col *= (0.92 + 0.12 * fbm(rng, h, w, 3, 40))[..., None]
    col = mix(col, srgb(70, 80, 32), smooth(0.12, 0.02, v))       # stalk end
    col = mix(col, srgb(40, 32, 20), smooth(0.86, 0.95, v))       # dried flower at the tip
    col = mix(col, srgb(30, 26, 22), 0.5 * smooth(0.82, 0.9, fbm(rng, h, w, 24, 24)))
    return Image.fromarray((np.flipud(np.clip(col, 0, 1)) * 255 + 0.5).astype(np.uint8), 'RGB')


def bud_texture(rng, size=256):
    h = w = size
    u = (np.arange(w) + 0.5) / w
    v = np.repeat(((np.arange(h) + 0.5) / h)[:, None], w, 1)
    U = np.repeat(u[None, :], h, 0)
    streak = fbm(rng, h, w, 3, 60)
    outer = mix(srgb(96, 30, 54), srgb(132, 56, 86), smooth(0.35, 0.75, fbm(rng, h, w, 6, 10)))
    outer = mix(outer, srgb(150, 118, 140), 0.45 * smooth(0.5, 0.85, streak))   # grey-violet bloom
    outer *= (1 - 0.35 * smooth(0.12, 0.0, np.minimum(U, 0.5 - U) * 2))[..., None]  # darker bract edges
    inner = mix(srgb(120, 18, 34), srgb(160, 40, 52), streak)
    inner = mix(inner, srgb(178, 110, 96), 0.4 * smooth(0.85, 1.0, v))
    col = np.where((U < 0.5)[..., None], outer, inner)
    return Image.fromarray((np.flipud(np.clip(col, 0, 1)) * 255 + 0.5).astype(np.uint8), 'RGB')


def write_textures(folder):
    rng = np.random.default_rng(SEED)
    leaf, normal = leaf_textures(rng)
    files = {
        'leaf': ('banana-leaf.png', leaf),
        'leaf-normal': ('banana-leaf-normal.jpg', normal),
        'stem': ('banana-stem.jpg', stem_texture(rng)),
        'fruit': ('banana-fruit.jpg', fruit_texture(rng)),
        'bud': ('banana-bud.jpg', bud_texture(rng)),
    }
    paths = {}
    for key, (name, image) in files.items():
        path = Path(folder) / name
        if name.endswith('.png'):
            image.save(path, optimize=True)
        else:
            image.save(path, quality=86, optimize=True, subsampling=0 if key == 'leaf-normal' else 2)
        paths[key] = path
    return paths


# ---------------------------------------------------------------------------------------------
# Geometry
# ---------------------------------------------------------------------------------------------

def bezier(p0, p1, p2, p3, n):
    pts = []
    for i in range(n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t * t, t ** 3
        pts.append(tuple(a * p0[k] + b * p1[k] + c * p2[k] + d * p3[k] for k in range(3)))
    return pts


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def rotate(v, axis, angle):
    """Rodrigues rotation of v about a unit axis."""
    c, s = math.cos(angle), math.sin(angle)
    k = cross(axis, v)
    d = dot(axis, v) * (1 - c)
    return (v[0] * c + k[0] * s + axis[0] * d, v[1] * c + k[1] * s + axis[1] * d, v[2] * c + k[2] * s + axis[2] * d)


class Banana(Plant):
    """Plant with UVs: every vertex carries texture coordinates into its faces."""

    def __init__(self, name, seed):
        super().__init__(name, seed)
        self.uv = {}

    def vert(self, kind, co, uv):
        v = self.bm(kind).verts.new(co)
        self.uv[v] = uv
        return v

    def face(self, kind, verts):
        b = self.bm(kind)
        f = b.faces.new(verts)
        f.smooth = True
        layer = b.loops.layers.uv.verify()
        for loop in f.loops:
            loop[layer].uv = self.uv[loop.vert]
        return f

    def sweep(self, kind, points, radii, sides, urange, vrange=(0.0, 1.0), tip=False, bump=None, roll=0.0):
        """A tube along `points` with a radius per point (parallel-transported frames). The seam is
        doubled so u runs over `urange` round the tube; v runs over `vrange` along its length. With
        `tip`, the last point closes to a single vertex. `bump(i, j)` scales a ring vertex's radius."""
        n = len(points)
        lengths = [0.0]
        for i in range(1, n):
            lengths.append(lengths[-1] + math.dist(points[i - 1], points[i]))
        total = lengths[-1] or 1.0
        tangents = [unit(sub(points[min(i + 1, n - 1)], points[max(i - 1, 0)])) for i in range(n)]
        t0 = tangents[0]
        normal = unit(cross(t0, (0, 0, 1)) if abs(t0[2]) < 0.95 else cross(t0, (1, 0, 0)))
        normal = rotate(normal, t0, roll)
        rings = []
        for i in range(n):
            t = tangents[i]
            normal = unit(sub(normal, tuple(t[k] * dot(normal, t) for k in range(3))))
            other = cross(t, normal)
            v = vrange[0] + (vrange[1] - vrange[0]) * lengths[i] / total
            if tip and i == n - 1:
                rings.append([self.vert(kind, points[i], (sum(urange) / 2, vrange[1]))] * (sides + 1))
                continue
            ring = []
            for j in range(sides + 1):
                a = 2 * math.pi * j / sides
                r = radii[i] * (bump(i, j % sides) if bump else 1.0)
                co = add(add(points[i], normal, math.cos(a) * r), other, math.sin(a) * r)
                ring.append(self.vert(kind, co, (urange[0] + (urange[1] - urange[0]) * j / sides, v)))
            rings.append(ring)
        for i in range(n - 1):
            for j in range(sides):
                a, b, c, d = rings[i][j], rings[i][j + 1], rings[i + 1][j + 1], rings[i + 1][j]
                if tip and i == n - 2:
                    self.face(kind, (a, b, c))
                else:
                    self.face(kind, (a, b, c, d))

    def leaf(self, base, az, a0, bend, length, width, variant, tears=(0, 0), keel=0.15, curl=0.2,
             roll=0.0, twist=0.0, rows=20, cols=5, droop_strips=1.0):
        """A banana blade from `base`, heading `az` (radians from +x), starting at elevation `a0` and
        bending down by `bend` toward the tip; `width` is the half-width. `keel` folds the halves up
        from the midrib, `curl` hangs the margins down, `twist` rolls it about the midrib toward the
        tip. `tears` = (left, right) strips torn in along the lateral veins, which hang loose."""
        rng = self.rng
        h = (math.cos(az), math.sin(az), 0.0)
        side0 = (-math.sin(az), math.cos(az), 0.0)
        steps = 120
        spine = [base]
        angles = []
        for k in range(steps):
            tm = (k + 0.5) / steps
            a = a0 - bend * tm ** 1.4
            angles.append(a)
            spine.append(add(spine[-1], (math.cos(a) * h[0], math.cos(a) * h[1], math.sin(a)), length / steps))

        def frame(t):
            f = min(steps - 1e-6, t * steps)
            k = int(f)
            p = add(spine[k], sub(spine[k + 1], spine[k]), f - k)
            a = angles[min(k, steps - 1)]
            tangent = (math.cos(a) * h[0], math.cos(a) * h[1], math.sin(a))
            s = rotate(side0, tangent, roll + twist * t)
            return p, tangent, s, cross(tangent, s)

        def half_width(t):
            base_f = math.sin(min(1.0, t / 0.09) * math.pi / 2) ** 0.6
            tip_f = math.sqrt(max(0.0, 1 - ((t - 0.8) / 0.2) ** 2)) if t > 0.8 else 1.0
            return width * max(0.05, base_f) * tip_f * (1 - 0.1 * t)

        shear = VEIN_SLOPE * width / length
        # Tears per half: rows they run along and how far in from the margin (in columns).
        cuts = {}
        for sign, count in ((-1, tears[0]), (1, tears[1])):
            chosen = sorted(rng.sample(range(3, rows - 2), min(count, rows - 5)))
            cuts[sign] = [(r, rng.randint(1, cols - 1)) for r in chosen]
        # Strip sag: each strip between neighbouring tears hangs by its own amount beyond its root.
        sag = {}
        for sign in (-1, 1):
            bounds = [(0, 0)] + cuts[sign] + [(rows, 0)]
            for k in range(len(bounds) - 1):
                (r0, c0), (r1, c1) = bounds[k], bounds[k + 1]
                root = max(c0, c1) if 0 < k < len(bounds) - 2 else (c1 if k == 0 else c0)
                if len(bounds) == 2:
                    root = cols
                sag[sign, k] = (r0, r1, root, rng.uniform(0.05, 0.6) ** 1.5 * droop_strips)

        def strip(sign, i, upper):
            """Which strip a vertex on row i belongs to (upper: the copy used by faces above)."""
            for (sg, k), (r0, r1, root, s) in sag.items():
                if sg == sign and (r0 < i < r1 or (i == r0 and upper and i != rows) or (i == r1 and not upper)
                                    or (i == r0 == 0) or (i == r1 == rows)):
                    return root, s
            return cols, 0.0

        u0 = (variant + 0.5) / 4
        cache = {}

        def vertex(i, c, upper):
            sign = 1 if c > 0 else -1
            torn = c != 0 and any(r == i and abs(c) > cc for r, cc in cuts[sign])
            key = (i, c, upper if torn else None)
            if key in cache:
                return cache[key]
            x = c / cols
            ti = i / rows
            t = min(1.0, ti + shear * abs(x) * (1 - ti))
            p, tangent, s, n = frame(t)
            w = half_width(t)
            lift = keel * abs(x) * w - curl * x * x * w
            co = add(add(p, s, x * w), n, lift)
            if c != 0:
                root, amount = strip(sign, i, upper)
                if abs(c) > root:
                    g = ((abs(c) - root) / (cols - root)) ** 1.6
                    co = add(co, n, -0.55 * amount * g * w)
                    co = add(co, (0, 0, -1), 0.45 * amount * g * w)
            uv = (u0 + x * 0.48 / 4, t)
            v = cache[key] = self.vert('banana-leaf', co, uv)
            return v

        for i in range(rows):
            for c in range(-cols, cols):
                quad = (vertex(i, c, True), vertex(i, c + 1, True), vertex(i + 1, c + 1, False), vertex(i + 1, c, False))
                if len(set(quad)) == 4:
                    self.face('banana-leaf', quad)
                else:
                    self.face('banana-leaf', tuple(dict.fromkeys(quad)))
        # The midrib: a pale ridge under the blade, thick at the stalk and fading toward the tip.
        pts, radii = [], []
        for k in range(9):
            t = 0.8 * k / 8
            p, tangent, s, n = frame(t)
            pts.append(add(p, n, -0.006))
            radii.append(0.016 * (1 - t) + 0.003)
        self.sweep('banana-stem', pts, radii, 5, PETIOLE)
        return frame


# Leaves as seen from the lane camera (looking +y, screen right = +x), from IMG_3092:
# (azimuth deg, petiole chord elevation deg, petiole length, blade start elevation deg, bend deg,
#  blade length, half width, texture, (left, right) tears, keel, curl, roll deg, twist deg).
# Roll turns the blade about its midrib so its face, not its edge, is toward the lane, as photographed.
LEAVES = [
    (165, 80, 1.05, 82, 38, 2.55, 0.31, YELLOWED, (3, 1), 0.05, 0.25, 70, -25),   # tall upright, top left
    (110, 84, 1.00, 84, 14, 2.20, 0.30, GREEN, (0, 1), 0.30, 0.05, 0, 15),        # upright, centre
    (188, 66, 0.95, 28, 34, 1.65, 0.30, YELLOWED, (1, 2), 0.10, 0.30, 40, 10),    # out to the left
    (20, 68, 0.90, 42, 30, 1.55, 0.27, GREEN, (1, 3), 0.15, 0.20, -35, -10),      # up to the right
    (-12, 64, 0.95, 36, 66, 2.15, 0.31, BROWNED, (1, 2), 0.05, 0.30, -40, 20),    # big arching right
    (62, 66, 0.70, 58, 40, 1.30, 0.22, YELLOWED, (2, 1), 0.50, 0.0, 0, 40),       # half-hidden, edge on
    (215, 30, 0.45, 2, 62, 2.00, 0.30, GREEN, (2, 3), 0.05, 0.35, 30, -15),       # lower, left
    (-115, 25, 0.45, 4, 55, 1.95, 0.30, YELLOWED, (3, 3), 0.05, 0.40, 0, 10),     # lower, toward the lane
    (22, 22, 0.50, -8, 66, 2.30, 0.33, GREEN, (2, 1), 0.08, 0.35, -30, 25),       # lower, drooping right
    (110, 18, 0.45, -5, 60, 2.05, 0.30, GREEN, (2, 3), 0.08, 0.35, 0, -20),       # lower, behind
    (255, -70, 0.15, -78, 8, 1.20, 0.14, DEAD, (2, 2), 0.2, 0.3, 0, 30),          # dead, hanging on the stem
]

CROWN = (0.10, 0.03, 2.75)


def banana(p):
    rng = p.rng
    # Pseudostem: slightly leaning, tapering, with uneven sheaths.
    pts = bezier((0, 0, 0), (0.0, 0.0, 1.2), (0.06, 0.02, 2.1), add(CROWN, (0, 0, -0.2)), 18)
    radii = [0.16 - 0.06 * (k / 18) ** 0.8 for k in range(19)]
    wobble = {(i, j): 1 + rng.uniform(-0.04, 0.04) for i in range(19) for j in range(12)}
    p.sweep('banana-stem', pts, radii, 12, PSEUDOSTEM, bump=lambda i, j: wobble[i, j])

    for n, (az, ep, lp, a0, bend, length, width, variant, tears, keel, curl, roll, twist) in enumerate(LEAVES):
        az, ep, a0, bend, roll, twist = (math.radians(v) for v in (az, ep, a0, bend, roll, twist))
        h = (math.cos(az), math.sin(az), 0)
        drop = 0.04 * (n % 4) + (0.35 if variant == DEAD else 0.0)
        sheath = add(add(CROWN, h, 0.02), (0, 0, -0.55 - drop))  # the leaf sheath, wrapped round the stem top
        foot = add(add(CROWN, h, 0.06), (0, 0, -0.1 - drop))
        end = add(foot, (math.cos(ep) * h[0], math.cos(ep) * h[1], math.sin(ep)), lp)
        start_dir = (math.cos(a0) * h[0], math.cos(a0) * h[1], math.sin(a0))
        ctrl1 = add(foot, (0, 0, 1), lp * 0.35 if variant != DEAD else -lp * 0.3)
        ctrl2 = add(end, start_dir, -lp * 0.35)
        stalk = bezier(foot, ctrl1, ctrl2, end, 8)
        p.sweep('banana-stem', [sheath] + stalk, [0.068] + [0.06 - 0.035 * (k / 8) ** 0.5 for k in range(9)], 7, PETIOLE)
        p.leaf(end, az, a0, bend, length, width, variant, tears=tears, keel=keel, curl=curl, roll=roll, twist=twist)

    bunch(p)


def bunch(p):
    rng = p.rng
    az = math.radians(-8)
    out = (math.cos(az), math.sin(az), 0)
    up = (0, 0, 1)
    # Fruit stalk: out of the crown, arching over and hanging.
    a = add(CROWN, (0, 0, -0.05))
    stalk = bezier(a, add(add(a, up, 0.32), out, 0.12), add(add(a, up, 0.36), out, 0.52),
                   add(add(a, up, 0.02), out, 0.66), 12)
    top = stalk[-1]
    axis_bottom = add(add(top, (0, 0, -1), 0.40), out, 0.05)
    axis = bezier(top, add(top, (0, 0, -0.15)), add(axis_bottom, (0, 0, 0.15)), axis_bottom, 8)
    p.sweep('banana-stem', stalk + axis[1:], [0.04] * len(stalk) + [0.04 - 0.012 * k / 8 for k in range(1, 9)],
            8, PEDUNCLE)
    # Hands of fingers, spiralling down the stalk, each a crescent of upward-curving fingers.
    hands = 6
    for k in range(hands):
        t = 0.08 + 0.84 * k / (hands - 1)
        f = t * 8
        i = min(7, int(f))
        centre = add(axis[i], sub(axis[i + 1], axis[i]), f - i)
        facing = k * 2.4 + 0.6
        count = (14, 13, 12, 11, 9, 8)[k]
        size = (1.0, 1.0, 0.96, 0.92, 0.86, 0.8)[k]
        for row in range(2):
            n_row = count // 2 + (count % 2 if row == 0 else 0)
            for q in range(n_row):
                spread = (q / max(1, n_row - 1) - 0.5) * math.radians(150 if row == 0 else 120)
                phi = facing + spread + rng.uniform(-0.08, 0.08)
                radial = (math.cos(phi), math.sin(phi), 0)
                base = add(add(centre, radial, 0.055 + 0.035 * row), (0, 0, -0.03 * row))
                finger(p, base, radial, rng.uniform(0.15, 0.175) * size, 0.028 * size,
                       rng.uniform(0.15, 0.35) + 0.25 * row, rng.uniform(1.15, 1.35), rng.uniform(0, 1))
    # Bare rachis down to the bud, knobbly with bract scars.
    bud_top = add(add(axis_bottom, (0, 0, -1), 0.40), out, 0.03)
    rachis = bezier(axis_bottom, add(axis_bottom, (0, 0, -0.15)), add(bud_top, (0, 0, 0.12)), bud_top, 14)
    knots = {i: 1.0 + (0.18 if i % 2 else 0.0) for i in range(15)}
    p.sweep('banana-stem', rachis, [0.018 - 0.005 * k / 14 for k in range(15)], 6, RACHIS,
            bump=lambda i, j: knots[i] * (1 + 0.1 * ((i * 7 + j * 3) % 5) / 5))
    bud(p, bud_top, out)


def finger(p, base, radial, length, radius, start, end, spin):
    """One banana: a five-sided curved finger, out from the stalk and up, to a dried dark tip."""
    pts, radii = [], []
    pos = base
    steps = 7
    for k in range(steps + 1):
        s = k / steps
        if k:
            a = start + (end - start) * (s - 0.5 / steps)
            pos = add(pos, (radial[0] * math.cos(a), radial[1] * math.cos(a), math.sin(a)), length / steps)
        pts.append(pos)
        body = math.sin(math.pi * min(1.0, 0.18 + s * 0.95)) ** 0.5
        radii.append(radius * (0.45 if k == 0 else max(0.25, body)))
    radii[-1] = 0.0
    p.sweep('banana-fruit', pts, radii, 5, (0.0, 1.0), tip=True, roll=spin)


def bud(p, top, out):
    """The male bud: a glossy purple-maroon teardrop of overlapping bracts, the top one lifted."""
    rng = p.rng
    length, R = 0.27, 0.062
    down = unit(add((0, 0, -1), out, 0.12))
    side = unit(cross(down, (0, 1, 0)))
    other = cross(down, side)

    def radius(v):
        if v < 0.32:
            return R * (0.3 + 0.7 * math.sin(math.pi / 2 * v / 0.32))
        return R * max(0.0, math.cos(math.pi / 2 * (v - 0.32) / 0.68)) ** 0.75

    def at(v, a, scale=1.0):
        r = radius(v) * scale
        c = add(top, down, v * length)
        return add(add(c, side, math.cos(a) * r), other, math.sin(a) * r)

    # Core.
    pts = [add(top, down, length * k / 12) for k in range(13)]
    p.sweep('banana-bud', pts, [radius(k / 12) * 0.97 for k in range(13)], 12, (0.0, 0.5), tip=True)
    # Overlapping bracts: shells round the core, each covering a little over half of it.
    for layer in range(4):
        centre = layer * 2.4 + 0.5
        v0 = 0.04 + 0.06 * layer
        rows, cols = 9, 8
        grid = []
        for i in range(rows + 1):
            v = v0 + (0.985 - v0) * i / rows
            row = []
            for j in range(cols + 1):
                a = centre + (j / cols - 0.5) * math.radians(210)
                edge = abs(j / cols - 0.5) * 2
                scale = 1.02 + 0.025 * (3 - layer) + 0.02 * edge ** 3
                row.append(p.vert('banana-bud', at(v, a, scale), (0.04 + 0.42 * j / cols, v)))
            grid.append(row)
        for i in range(rows):
            for j in range(cols):
                p.face('banana-bud', (grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
    # The lifted bract: hinged at the top on the side facing out, swung up and outward, showing red.
    hinge = add(top, down, 0.03 * length)
    out_dir = unit(sub(at(0.05, 0.0), add(top, down, 0.05 * length)))
    lift = unit(add(add(out_dir, (0, 0, 1), 0.35), down, -0.1))
    across = unit(cross(lift, down))
    normal = unit(cross(across, lift))
    rows, cols = 6, 6
    grid = []
    for i in range(rows + 1):
        s = i / rows
        w = 0.085 * math.sin(math.pi * min(1.0, 0.3 + s * 0.8)) ** 0.6
        row = []
        for j in range(cols + 1):
            x = j / cols * 2 - 1
            co = add(add(add(hinge, lift, 0.15 * s), across, x * w), normal, 0.03 * (1 - x * x) - 0.03 * s * s)
            row.append(p.vert('banana-bud', co, (0.54 + 0.42 * j / cols, 0.1 + 0.85 * s)))
        grid.append(row)
    for i in range(rows):
        for j in range(cols):
            p.face('banana-bud', (grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))


# ---------------------------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------------------------

def make_material(name, textures):
    key, roughness, double, masked, normal_key = MATERIALS[name]
    m = bpy.data.materials.new(name)
    nodes, links = m.node_tree.nodes, m.node_tree.links
    shader = nodes['Principled BSDF']
    shader.inputs['Roughness'].default_value = roughness
    image = bpy.data.images.load(str(textures[key]))
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = image
    links.new(tex.outputs['Color'], shader.inputs['Base Color'])
    if masked:
        cutoff = nodes.new('ShaderNodeMath')
        cutoff.operation = 'ROUND'
        links.new(tex.outputs['Alpha'], cutoff.inputs[0])
        links.new(cutoff.outputs[0], shader.inputs['Alpha'])
    if normal_key:
        nimage = bpy.data.images.load(str(textures[normal_key]))
        nimage.colorspace_settings.name = 'Non-Color'
        ntex = nodes.new('ShaderNodeTexImage')
        ntex.image = nimage
        nmap = nodes.new('ShaderNodeNormalMap')
        nmap.inputs['Strength'].default_value = 0.5
        links.new(ntex.outputs['Color'], nmap.inputs['Color'])
        links.new(nmap.outputs['Normal'], shader.inputs['Normal'])
    m.use_backface_culling = not double
    return m


def export(p, textures):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for kind in MATERIALS:
        b = p.meshes[kind]
        mesh = bpy.data.meshes.new(f'{p.name}-{kind}')
        b.to_mesh(mesh)
        mesh.materials.append(make_material(kind, textures))
        bpy.context.collection.objects.link(bpy.data.objects.new(f'{p.name}-{kind}', mesh))
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f'{p.name}.glb'
    bpy.ops.export_scene.gltf(filepath=str(path), export_format='GLB', export_apply=True, export_yup=True,
                              export_image_format='AUTO')
    tris = sum(sum(len(f.verts) - 2 for f in b.faces) for b in p.meshes.values())
    print(path.relative_to(OUT.parents[2]), path.stat().st_size // 1024, 'kB', tris, 'triangles')


def main():
    plant = Banana('banana', SEED)
    banana(plant)
    with tempfile.TemporaryDirectory() as folder:
        export(plant, write_textures(folder))


if __name__ == '__main__':
    main()
