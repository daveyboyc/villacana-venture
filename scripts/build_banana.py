#!/usr/bin/env python3
"""Build the banana plant beside Calle de Miguel headless in Blender and export it as glTF.

  python3 scripts/build_banana.py            writes public/models/plants/banana.glb
  python3 scripts/build_banana.py --extract  re-cuts the leaf and bunch textures in
                                              scripts/assets/banana/ from the private full-size
                                              original of IMG_3092 (needs pillow-heif and scipy)

It also writes public/models/plants/banana-bunch.glb, the photographed bunch on its own (origin at
the top of its stalk, where it leaves the crown).

The plant photographed over the garden wall in IMG_3092 (key view, looking up from the lane),
IMG_3090 (from further west) and IMG_3093 (a leaf hanging over the lane in shade). It has fruited,
so it makes no new leaves: no rolled 'cigar' leaf at the top, as in the photo. Sixteen live leaves
in a full spiral: the youngest four nearly upright, the middle ones arching out, the oldest drooping
and torn into strips along the lateral veins, plus three dead brown leaves hanging against the stem.
The pseudostem is built from overlapping leaf sheaths, pale green with dark blotches, the outer
ones dried brown and peeling. The bunch hangs from an arching stalk: two dense clusters of hands of
upward-curving green fingers, a long bare rachis and a grey-purple male bud with one bract lifted.

The bunch is the photographed one. Its layout (stalk arch, six hands in two clusters, rachis, bud and
lifted bract) is measured from IMG_3092 at BUNCH_K metres per pixel, scaled from the bud. Its colour is
the photo itself: the bunch is cut out of the sky by `--extract` into scripts/assets/banana/bunch-photo.jpg,
the background is refilled from the nearest bunch pixel, and the photo is projected onto the geometry
from the lane-side view (BUNCH_ORIGIN, bunch_uv).

Leaf colour is photographic: three leaves of IMG_3092 (Dave's photo, published in this repo as
public/photos-ref/IMG_3092.jpg) were traced and unrolled into flat texture strips by `--extract`
(TRACES below) and are kept, small, in scripts/assets/banana/. The build adds the cut-out margin,
the dead-leaf variant, a vein normal map and the other textures from numbers (numpy). Sizes are
estimated from the photos (docs/reviews/banana-asset/README.md). It stands on its origin, x and y
across the ground, z up (exported y-up); the lane camera looks along +y with +x to its right.
Everything is seeded so a rebuild is byte-identical.
"""
import math
import sys
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ASSETS = HERE / 'assets/banana'
ORIGINAL = Path('/home/user/villacana-originals/batch/IMG_3092.HEIC')  # private, never committed
SEED = 3092  # the key photo


def smooth(e0, e1, x):
    t = np.clip((np.asarray(x, np.float32) - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def mix(a, b, k):
    k = np.asarray(k, np.float32)[..., None] if np.ndim(k) else k
    return np.asarray(a, np.float32) * (1 - k) + np.asarray(b, np.float32) * k


def srgb(*c):
    return np.array(c, np.float32) / 255


def noise(rng, h, w, cy, cx):
    """Smooth value noise in 0..1, `cy` by `cx` cells over an h by w image."""
    grid = rng.random((cy + 3, cx + 3)).astype(np.float32)
    big = Image.fromarray(grid, 'F').resize((w * (cx + 3) // cx, h * (cy + 3) // cy), Image.BICUBIC)
    oy, ox = h // cy, w // cx
    return np.clip(np.asarray(big)[oy:oy + h, ox:ox + w], 0, 1)


def fbm(rng, h, w, cy, cx, octaves=3):
    out, amp, total = np.zeros((h, w), np.float32), 1.0, 0.0
    for _ in range(octaves):
        out += amp * noise(rng, h, w, cy, cx)
        total += amp
        amp, cy, cx = amp * 0.5, cy * 2, cx * 2
    return out / total


def blur(a, sigma):
    """Near-Gaussian blur (three box passes each way) of a float image, 2-D or with channels."""
    a = np.asarray(a, np.float32)
    r = max(1, int(round((math.sqrt(4 * sigma * sigma + 1) - 1) / 2)))
    for axis in (0, 1):
        for _ in range(3):
            pad = [(0, 0)] * a.ndim
            pad[axis] = (r + 1, r)
            c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis, dtype=np.float64)
            hi = np.take(c, np.arange(2 * r + 1, c.shape[axis]), axis=axis)
            lo = np.take(c, np.arange(0, c.shape[axis] - 2 * r - 1), axis=axis)
            a = ((hi - lo) / (2 * r + 1)).astype(np.float32)
    return a


# ---------------------------------------------------------------------------------------------
# Photo extraction: unroll three photographed leaves into flat strips (run once, with --extract)
# ---------------------------------------------------------------------------------------------

# Traces in full-size pixels of IMG_3092 (4284 x 5712). Each 'guide' runs from the blade base to
# its tip; the edges are found by walking out from it either side until the sky (or a hand trace).
TRACES = {
    # The upright leaf in the centre, seen from below against the sky: guide on the midrib, both halves.
    'green': dict(kind='midrib', size=(256, 1024), maxd=(330, 330),
                  guide=[(1700, 1925), (1745, 1750), (1790, 1560), (1820, 1400), (1850, 1200), (1875, 1000), (1900, 860)]),
    # The leaf out to the left: one half seen from below, midrib along its upper edge, yellowed and
    # dried along the margin (the lower edge).
    'yellow': dict(kind='half', size=(128, 1024), maxd=(200, 200),
                   guide=[(1420, 1940), (1300, 1830), (1150, 1730), (1000, 1690), (850, 1670), (700, 1660), (560, 1650)]),
    # The big arching leaf to the right with the brown scorched band; its upper edge touches the leaf
    # above, so it is traced by hand.
    'scorch': dict(kind='full', size=(256, 1024), maxd=(330, 330),
                   guide=[(1990, 2080), (2200, 2100), (2400, 2150), (2600, 2240), (2800, 2340), (3000, 2450), (3170, 2575)],
                   hand=[(1960, 2015), (2050, 1975), (2150, 1950), (2300, 1922), (2450, 1906), (2550, 1906),
                         (2650, 1930), (2750, 1975), (2850, 2030), (2950, 2100), (3050, 2200), (3150, 2330),
                         (3250, 2460), (3330, 2610)]),
}


def _resample(poly, n):
    poly = np.asarray(poly, np.float64)
    seg = np.linalg.norm(np.diff(poly, axis=0), axis=1)
    s = np.concatenate([[0], np.cumsum(seg)]) / seg.sum()
    t = np.linspace(0, 1, n)
    return np.stack([np.interp(t, s, poly[:, 0]), np.interp(t, s, poly[:, 1])], 1)


def _bilinear(img, x, y):
    x = np.clip(x, 0, img.shape[1] - 1.001)
    y = np.clip(y, 0, img.shape[0] - 1.001)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    fx, fy = (x - x0)[..., None], (y - y0)[..., None]
    return ((img[y0, x0] * (1 - fx) + img[y0, x0 + 1] * fx) * (1 - fy)
            + (img[y0 + 1, x0] * (1 - fx) + img[y0 + 1, x0 + 1] * fx) * fy)


def _median(a, k=9):
    pad = np.pad(a, k, mode='edge')
    med = np.array([np.median(pad[i:i + 2 * k + 1]) for i in range(len(a))])
    return np.convolve(np.pad(med, 2, mode='edge'), np.ones(5) / 5, 'valid')


def extract():
    import pillow_heif
    pillow_heif.register_heif_opener()
    src = np.asarray(Image.open(ORIGINAL).convert('RGB'), np.float32) / 255
    r, g, b = src[..., 0], src[..., 1], src[..., 2]
    sky = (b > g + 0.04) & (b > r + 0.12)
    ASSETS.mkdir(parents=True, exist_ok=True)
    for name, spec in TRACES.items():
        n = 600
        guide = _resample(spec['guide'], n)
        tang = np.gradient(guide, axis=0)
        tang /= np.linalg.norm(tang, axis=1, keepdims=True)
        perp = np.stack([-tang[:, 1], tang[:, 0]], 1)
        ext = []
        for side, maxd in ((1, spec['maxd'][0]), (-1, spec['maxd'][1])):
            d = np.arange(0, maxd, 1.0)
            pts = guide[:, None, :] + side * perp[:, None, :] * d[None, :, None]
            isky = sky[np.clip(pts[..., 1].round().astype(int), 0, src.shape[0] - 1),
                       np.clip(pts[..., 0].round().astype(int), 0, src.shape[1] - 1)]
            e = np.zeros(n)
            for i in range(n):
                run = last = 0
                for k in range(len(d)):
                    if isky[i, k]:
                        run += 1
                        if run > 12:
                            break
                    else:
                        run, last = 0, d[k]
                e[i] = last
            ext.append(_median(e))
        if 'hand' in spec:  # the minus side from the hand trace: where each perpendicular meets it
            hand = _resample(spec['hand'], 4000)
            for i in range(n):
                rel = hand - guide[i]
                k = np.argmin(np.abs(rel @ tang[i]))
                ext[1][i] = max(0.0, -(rel[k] @ perp[i]))
            ext[1] = _median(ext[1], 5)
        plus, minus = guide + perp * ext[0][:, None], guide - perp * ext[1][:, None]
        w, h = spec['size']
        ss = 2  # supersample, then box down
        rows = np.linspace(0, n - 1, h * ss)
        idx = rows.astype(int).clip(0, n - 2)
        f = (rows - idx)[:, None]
        lerp = lambda a: a[idx] * (1 - f) + a[idx + 1] * f
        G, P, M = lerp(guide), lerp(plus), lerp(minus)
        s = (np.arange(w * ss) + 0.5) / (w * ss)
        inset = 0.02
        if spec['kind'] == 'midrib':   # u -1 at the minus edge, 0 on the midrib, +1 at the plus edge
            u = (s * 2 - 1) * (1 - inset)
            pts = np.where(u[None, :, None] < 0, G[:, None] + (M - G)[:, None] * -u[None, :, None],
                           G[:, None] + (P - G)[:, None] * u[None, :, None])
        else:                          # 'half': midrib (plus edge) to margin; 'full': minus to plus edge
            a, bb = (P, M) if spec['kind'] == 'half' else (M, P)
            k = inset + s * (1 - 2 * inset)
            pts = a[:, None] + (bb - a)[:, None] * k[None, :, None]
        col = _bilinear(src, pts[..., 0], pts[..., 1])
        col = col.reshape(h, ss, w, ss, 3).mean((1, 3)).astype(np.float32)
        # Fill the few pixels of sky or wall caught at the edges from the leaf around them.
        cr, cg, cb = col[..., 0], col[..., 1], col[..., 2]
        bad = ((cb > cg) & (cb > cr + 0.04)) | ((col.max(-1) - col.min(-1) < 0.12) & (col.mean(-1) > 0.55))
        bad = blur(bad.astype(np.float32), 1.5) > 0.1
        good = (~bad).astype(np.float32)
        for radius in (2, 4, 8, 16, 32, 64):
            if not bad.any():
                break
            weight = blur(good, radius)
            fill = blur(col * good[..., None], radius) / np.maximum(weight, 1e-4)[..., None]
            ok = bad & (weight > 0.05)
            col[ok] = fill[ok]
            good[ok] = 1.0
            bad &= ~ok
        # Stored with the blade base at the bottom (v up), as glTF texture coordinates run.
        Image.fromarray((np.flipud(col) * 255 + 0.5).clip(0, 255).astype(np.uint8)).save(
            ASSETS / f'leaf-{name}.jpg', quality=92, optimize=True)
        print('wrote', (ASSETS / f'leaf-{name}.jpg').relative_to(HERE.parent), w, 'x', h)
    extract_bunch()


# The bunch in the full-size original (pixels): the stalk arch, both clusters, the rachis, the bud and
# the lifted bract against the sky. Zones keep out the leaves that cross behind it.
BUNCH_CROP = (1785, 1999, 2427, 3320)
BUNCH_POLY = [(0, 110), (70, 110), (140, 320), (390, 320), (395, 560), (340, 610), (345, 780), (470, 770), (480, 840),
              (390, 880), (375, 1050), (245, 1050), (250, 860), (270, 800), (255, 650), (150, 665), (110, 600),
              (120, 520), (30, 470), (15, 330), (0, 250)]


def extract_bunch():
    from PIL import ImageDraw
    from scipy import ndimage
    c = np.asarray(Image.open(ORIGINAL).convert('RGB').crop(BUNCH_CROP), np.float32) / 255
    H, W = c.shape[:2]
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    lum = c @ np.array([0.3, 0.55, 0.15], np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    sky = (b > r + 0.10) & (b > g)
    zone = Image.new('L', (W, H), 0)
    ImageDraw.Draw(zone).polygon(BUNCH_POLY, fill=255)
    fg = (np.asarray(zone) > 0) & ~sky & ~((r > 0.5) & (g > 0.45) & (r > b + 0.2) & (r > g - 0.08))  # no yellow leaf
    fg &= ~((yy > 640) & (yy < 830) & (lum > 0.33) & ~((xx > 270) & (xx < 335)))  # rachis zone: only the dark stalk
    fg &= ~((yy > 860) & (g > b + 0.04) & (g > r))                                  # bud zone: no green leaf
    fg &= ~((r > g + 0.05) & (r > b + 0.15) & (yy > 600) & (yy < 840))              # orange leaf margin by the rachis
    fg = ndimage.binary_opening(fg, iterations=1)
    lab, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    pale = (lum > 0.72) & ((c.max(-1) - c.min(-1)) < 0.25)                            # hazy sky between fingers
    keep = ndimage.binary_fill_holes(np.isin(lab, 1 + np.where(sizes > 600)[0])) & ~sky & ~pale
    # Everything else takes the colour of the nearest bunch pixel, blended toward the typical colour of
    # its part (fruit, rachis, bract, bud), so a vertex projected a little off the photographed outline
    # still lands on that part's colour, never sky, leaf or a dark edge.
    idx = ndimage.distance_transform_edt(~keep, return_distances=False, return_indices=True)
    out = c[idx[0], idx[1]]
    parts = [(yy < 650), (yy >= 650) & (yy < 800) & (xx < 340), (yy >= 760) & (yy < 870) & (xx >= 330), (yy >= 840)]
    lit = lum > np.percentile(lum[keep], 35)  # the part's lit side, not its shadowed edge
    for part in parts:
        sel = part & keep & lit
        if sel.any():
            typical = np.median(c[sel], axis=0)
            far = part & ~keep
            out[far] = 0.35 * out[far] + 0.65 * typical
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).resize((W * 4 // 5, H * 4 // 5), Image.LANCZOS).save(
        ASSETS / 'bunch-photo.jpg', quality=90, optimize=True)
    print('wrote', (ASSETS / 'bunch-photo.jpg').relative_to(HERE.parent), W * 4 // 5, 'x', H * 4 // 5)


# ---------------------------------------------------------------------------------------------
# Textures
# ---------------------------------------------------------------------------------------------

GREEN, YELLOWED, SCORCHED, DEAD = range(4)   # leaf atlas columns, u across the blade, v base to tip
ATLAS = 1024                                  # four 256 x 1024 columns
VEIN = 0.36                                   # lateral veins: metres toward the tip per metre out

# Stem atlas columns (u ranges): pseudostem core, sheaths, petioles and midribs, fruit stalk, rachis.
CORE, SHEATH, DRY = (0.0, 0.3), (0.3, 0.5), (0.5, 0.62)
PETIOLE, PEDUNCLE, RACHIS = (0.62, 0.76), (0.76, 0.88), (0.88, 1.0)


def photo(name):
    """A photo strip, v up (row 0 = blade base), float RGB."""
    return np.flipud(np.asarray(Image.open(ASSETS / f'leaf-{name}.jpg').convert('RGB'), np.float32) / 255).copy()


def even_light(col, strength=0.6, radius=36):
    """Take out most of the broad light and shadow of the photo, keeping colour and vein detail."""
    lum = col @ np.array([0.3, 0.55, 0.15], np.float32)
    low = blur(lum, radius)
    k = np.clip((np.median(lum) / np.maximum(low, 1e-3)) ** strength, 0.8, 1.3)
    return np.clip(col * k[..., None], 0, 1)


def leaf_columns(rng):
    h, w = ATLAS, ATLAS // 4
    x = ((np.arange(w) + 0.5) / w * 2 - 1)[None, :].repeat(h, 0)   # -1..1 across the blade
    t = ((np.arange(h) + 0.5) / h)[:, None].repeat(w, 1)            # 0 at the base, 1 at the tip
    ax = np.abs(x)

    green = even_light(photo('green'))
    half = even_light(photo('yellow'))
    scorch = even_light(photo('scorch'), 0.45)
    # The yellowed leaf: the photographed half on the right, the same half mirrored on the left,
    # read from further along so the two margins do not match.
    hw = half.shape[1]
    right = np.asarray(Image.fromarray((half * 255).astype(np.uint8)).resize((w // 2, h), Image.LANCZOS),
                       np.float32) / 255
    rows = np.clip((np.arange(h) * 0.86 + 0.09 * h).astype(int), 0, h - 1)
    left = right[rows][:, ::-1]
    yellowed = np.concatenate([left, right], 1)
    # The dead leaf: the brown band of the scorched leaf, spread across, paler and greyer.
    band = scorch[:, int(0.22 * w):int(0.52 * w)]
    band = np.asarray(Image.fromarray((band * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS), np.float32) / 255
    lum = band @ np.array([0.3, 0.55, 0.15], np.float32)
    dead = mix(band, srgb(150, 120, 86) * (lum / max(1e-3, float(lum.mean())))[..., None], 0.55)
    dead = mix(dead, srgb(96, 70, 46), 0.35 * smooth(0.5, 0.8, fbm(rng, h, w, 20, 6)))

    cols = [green, yellowed, scorch, dead]
    alphas, heights = [], []
    rib_col = srgb(196, 198, 128)
    for v, col in enumerate(cols):
        # A pale midrib down the middle (the green photo has its own).
        rib = smooth(0.035 * (1 - 0.6 * t), 0.012 * (1 - 0.6 * t), ax)
        if v != GREEN:
            col = mix(col, rib_col * (0.85 if v == DEAD else 1.0), rib * (0.5 if v == DEAD else 0.85))
        # How dried a margin is, from the photo's own colour (yellow and brown run red > green).
        dry = smooth(-0.02, 0.1, blur(col[..., 0] - col[..., 1], 3))
        edge = fbm(rng, h, w, 120, 2)
        e = 0.004 + 0.018 * smooth(0.45, 1.0, edge) + 0.05 * dry * smooth(0.35, 0.9, fbm(rng, h, w, 60, 6))
        alpha = (1 - ax) > e
        # Fine splits along the lateral veins, in from the margin, more where dried.
        splits = {GREEN: 10, YELLOWED: 26, SCORCHED: 34, DEAD: 40}[v]
        phase = t - VEIN * ax * 0.30 / 2.2          # constant along one lateral vein
        for sign in (1, -1):
            for _ in range(splits):
                p0 = rng.uniform(0.08, 0.97)
                depth = rng.uniform(0.04, 0.35) * (2.2 if v == DEAD else 1.0)
                cut = (np.abs(phase - p0) < 0.6 / h) & ((1 - ax) < depth) & (x * sign > 0)
                alpha &= ~cut
        if v == DEAD:
            alpha &= ~(fbm(rng, h, w, 40, 10) > 0.66)
        lum = col @ np.array([0.3, 0.55, 0.15], np.float32)
        height = (lum - blur(lum, 2.5)) * 6 - 1.2 * smooth(0.04, 0.0, ax)
        cols[v] = col
        alphas.append(alpha)
        heights.append(height)
    rgb = np.concatenate(cols, 1)
    alpha = np.concatenate(alphas, 1)
    height = np.concatenate(heights, 1)
    return rgb, alpha, height


def leaf_textures(rng):
    rgb, alpha, height = leaf_columns(rng)
    image = Image.fromarray((np.flipud(rgb) * 255 + 0.5).clip(0, 255).astype(np.uint8), 'RGB')
    # 255 photographic colours, dithered, plus one fully transparent entry for the cut-outs.
    pal = image.quantize(255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    index = np.asarray(pal).copy()
    index[np.flipud(~alpha)] = 255
    palette = pal.getpalette()[:255 * 3]
    mean = (rgb[alpha].mean(0) * 255).astype(int).tolist()
    out = Image.fromarray(index, 'P')
    out.putpalette(palette + mean)
    out.info['transparency'] = 255
    hs = np.asarray(Image.fromarray(height.astype(np.float32), 'F').resize((512, 512), Image.BILINEAR))
    dy, dx = np.gradient(hs)
    k = 1.2
    n = np.stack([-dx * k, -dy * k, np.ones_like(hs)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    normal = Image.fromarray((np.flipud(n * 0.5 + 0.5) * 255 + 0.5).astype(np.uint8), 'RGB')
    # Glow (emission): living green and yellow tissue lets the sun through, dried brown does not.
    mx, mn = rgb.max(-1), rgb.min(-1)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    hue = np.where(mx == r, ((g - b) / np.maximum(mx - mn, 1e-4)) % 6, (b - r) / np.maximum(mx - mn, 1e-4) + 2) * 60
    living = smooth(30, 48, hue) * smooth(0.12, 0.3, (mx - mn) / np.maximum(mx, 1e-4))
    glow = rgb * living[..., None] * alpha[..., None]
    glow = Image.fromarray((np.flipud(glow) * 255 + 0.5).clip(0, 255).astype(np.uint8)).resize((512, 512), Image.BILINEAR)
    return out, normal, glow


def stem_texture(rng, w=512, h=1024):
    u = (np.arange(w) + 0.5) / w
    v = np.repeat(((np.arange(h) + 0.5) / h)[:, None], w, 1)
    U = np.repeat(u[None, :], h, 0)
    out = np.zeros((h, w, 3), np.float32)

    def region(r):
        return (U >= r[0]) & (U < r[1]), (U - r[0]) / (r[1] - r[0])

    streaks = fbm(rng, h, w, 3, 90)
    fine = fbm(rng, h, w, 6, 220, 2)
    # Pseudostem core and sheaths: pale cream-green, lengthwise fibres, dark brown-black blotches
    # (the 'banana blotch' of the photo), browner and drier toward the ground.
    for r, green in ((CORE, 0.35), (SHEATH, 0.6)):
        sel, s = region(r)
        col = mix(srgb(186, 190, 128), srgb(210, 208, 156), smooth(0.3, 0.75, streaks))
        col = mix(col, srgb(140, 160, 82), green * smooth(0.45, 0.8, fbm(rng, h, w, 6, 4)) * smooth(0.2, 0.7, v))
        blot = fbm(rng, h, w, 14, 10)
        col = mix(col, srgb(92, 66, 52), 0.85 * smooth(0.64, 0.72, blot))
        col = mix(col, srgb(48, 36, 30), 0.8 * smooth(0.74, 0.8, blot))
        dried = smooth(0.5, 0.75, fbm(rng, h, w, 8, 6) + 0.45 * (1 - v) - 0.2)
        col = mix(col, mix(srgb(150, 118, 82), srgb(190, 164, 120), smooth(0.3, 0.8, streaks)), dried)
        if r == SHEATH:  # darker sheath margins either side
            col = col * (1 - 0.25 * smooth(0.06, 0.0, np.minimum(s, 1 - s)))[..., None]
        col *= (0.9 + 0.12 * streaks + 0.08 * fine)[..., None]
        out[sel] = col[sel]
    # Dried outer sheaths: papery brown and tan fibres.
    sel, s = region(DRY)
    fib = fbm(rng, h, w, 4, 160, 2)
    col = mix(srgb(118, 98, 78), srgb(178, 162, 134), smooth(0.35, 0.7, fib))
    col = mix(col, srgb(78, 62, 50), 0.6 * smooth(0.6, 0.75, fbm(rng, h, w, 10, 12)))
    col = mix(col, srgb(168, 164, 140), 0.3 * smooth(0.6, 0.9, fbm(rng, h, w, 5, 5)))
    col = col * (1 - 0.3 * smooth(0.08, 0.0, np.minimum(s, 1 - s)))[..., None]
    out[sel] = col[sel]
    # Petioles and midribs: pale yellow-green, fine lengthwise lines, a darker channel on top.
    sel, s = region(PETIOLE)
    col = mix(srgb(206, 208, 140), srgb(150, 170, 86), 0.5 + 0.5 * np.cos(2 * np.pi * s))
    col *= (0.92 + 0.1 * fine)[..., None]
    out[sel] = col[sel]
    # Fruit stalk: green, speckled.
    sel, s = region(PEDUNCLE)
    col = mix(srgb(66, 86, 38), srgb(98, 112, 54), fbm(rng, h, w, 40, 20))
    out[sel] = col[sel]
    # Rachis: dark brown-maroon, banded by the scars of fallen male flowers.
    sel, s = region(RACHIS)
    band = 0.5 + 0.5 * np.cos(2 * np.pi * (v * 30 + 0.15 * fbm(rng, h, w, 8, 4)))
    col = mix(srgb(52, 40, 34), srgb(92, 72, 56), 0.6 * fbm(rng, h, w, 30, 12))
    col = mix(col, srgb(110, 92, 70), 0.5 * smooth(0.8, 1.0, band) * fbm(rng, h, w, 16, 16))
    out[sel] = col[sel]
    return Image.fromarray((np.flipud(np.clip(out, 0, 1)) * 255 + 0.5).astype(np.uint8), 'RGB')


def write_textures(folder):
    rng = np.random.default_rng(SEED)
    leaf, normal, glow = leaf_textures(rng)
    files = {
        'leaf': ('banana-leaf.png', leaf),
        'leaf-normal': ('banana-leaf-normal.jpg', normal),
        'leaf-glow': ('banana-leaf-glow.jpg', glow),
        'stem': ('banana-stem.jpg', stem_texture(rng)),
        'bunch': ('banana-bunch.jpg', Image.open(ASSETS / 'bunch-photo.jpg').convert('RGB')),
    }
    paths = {}
    for key, (name, image) in files.items():
        path = Path(folder) / name
        if name.endswith('.png'):
            image.save(path, optimize=True, transparency=255)
        else:
            image.save(path, quality=88, optimize=True, subsampling=0 if key == 'leaf-normal' else 2)
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


def add(a, b, k=1.0):
    return (a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k)


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(a):
    n = math.sqrt(sum(v * v for v in a)) or 1.0
    return (a[0] / n, a[1] / n, a[2] / n)


TOP = 2.95                    # the crown: the top of the pseudostem, where the bunch stalk comes out
LEAN = (0.10, 0.03)           # the pseudostem leans this far (x, y) at the top


def stem_centre(z):
    k = (z / TOP) ** 1.6
    return (LEAN[0] * k, LEAN[1] * k, z)


def stem_radius(z):
    z = max(0.0, min(TOP, z))
    flare = 0.025 * math.exp(-z / 0.12)
    return 0.15 - 0.055 * (z / TOP) ** 0.9 + flare - 0.02 * smooth_s(2.6, TOP, z)


def smooth_s(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def make_plant_class():
    from build_plants import Plant  # noqa: E402  (loads bpy)

    class Banana(Plant):
        """Plant with UVs: every vertex carries texture coordinates into its faces."""

        def __init__(self, name, seed):
            super().__init__(name, seed)
            self.uv = {}

        def vert(self, kind, co, uv):
            if kind == 'banana-bunch':
                uv = bunch_uv(co)  # the photo, projected from the lane-side view
            v = self.bm(kind).verts.new(co)
            self.uv[v] = uv
            return v

        def face(self, kind, verts):
            verts = tuple(dict.fromkeys(verts))
            if len(verts) < 3:
                return None
            b = self.bm(kind)
            f = b.faces.new(verts)
            f.smooth = True
            layer = b.loops.layers.uv.verify()
            for loop in f.loops:
                loop[layer].uv = self.uv[loop.vert]
            return f

        def sweep(self, kind, points, radii, sides, urange, vrange=(0.0, 1.0), tip=False, bump=None, roll=0.0,
                  squash=1.0):
            """A tube along `points` with a radius per point (parallel-transported frames). The seam is
            doubled so u runs over `urange` round the tube; v runs over `vrange` along its length. With
            `tip`, the last point closes to a single vertex. `bump(i, j)` scales a ring vertex's radius;
            `squash` flattens the tube across (petioles)."""
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
                    co = add(add(points[i], normal, math.cos(a) * r * squash), other, math.sin(a) * r)
                    ring.append(self.vert(kind, co, (urange[0] + (urange[1] - urange[0]) * j / sides, v)))
                rings.append(ring)
            for i in range(n - 1):
                for j in range(sides):
                    a, b, c, d = rings[i][j], rings[i][j + 1], rings[i + 1][j + 1], rings[i + 1][j]
                    self.face(kind, (a, b, c) if tip and i == n - 2 else (a, b, c, d))

        def blade(self, base, az, a0, bend, length, width, tex, tears=0, depth=(0.4, 0.9), fold=15.0, sag=30.0,
                  wave=10.0, roll=0.0, twist=0.0, hang=45.0, curl=0.0, rows=38, cols=7):
            """A banana blade from `base`, heading `az` (radians from +x) at elevation `a0` and bending
            down by `bend` toward the tip; `width` is the half-width. Each half folds down from the
            midrib by `fold` and curves down further by `sag` toward the margin (degrees), with a wave
            of `wave` along it; `roll` and `twist` turn it about the midrib. `tears` per half are torn
            in along the lateral veins to a depth drawn from `depth` (fraction of the half-width); the
            strips between them hang by up to `hang` degrees more."""
            rng = self.rng
            fold, sag, wave, hang, curl = (math.radians(v) for v in (fold, sag, wave, hang, curl))
            h = (math.cos(az), math.sin(az), 0.0)
            side0 = (-math.sin(az), math.cos(az), 0.0)
            steps = 120
            spine, angles = [base], []
            for k in range(steps):
                tm = (k + 0.5) / steps
                a = a0 - bend * tm ** 1.4
                angles.append(a)
                spine.append(add(spine[-1], (math.cos(a) * h[0], math.cos(a) * h[1], math.sin(a)), length / steps))

            def frame(t):
                f = min(steps - 1e-6, max(0.0, t) * steps)
                k = int(f)
                p = add(spine[k], sub(spine[k + 1], spine[k]), f - k)
                a = angles[min(k, steps - 1)]
                tangent = (math.cos(a) * h[0], math.cos(a) * h[1], math.sin(a))
                s = rotate(side0, tangent, roll + twist * t)
                return p, tangent, s, cross(tangent, s)

            def half_width(t):
                base_f = math.sin(min(1.0, t / 0.1) * math.pi / 2) ** 0.7
                tip_f = math.sqrt(max(0.0, 1 - ((t - 0.84) / 0.16) ** 2)) if t > 0.84 else 1.0
                return width * max(0.02, base_f) * max(0.03, tip_f) * (1 - 0.08 * t)

            shear = VEIN * width / length
            phases = {1: rng.uniform(0, 6.3), -1: rng.uniform(0, 6.3)}
            # Tears per half: (row, inner end as a fraction of the half-width).
            cuts, strips = {}, {}
            for sign in (1, -1):
                chosen = sorted(rng.sample(range(2, rows - 2), min(tears, rows - 5))) if tears else []
                cuts[sign] = {r: 1.0 - rng.uniform(*depth) for r in chosen}
                bounds = [0] + chosen + [rows]
                for k in range(len(bounds) - 1):
                    r0, r1 = bounds[k], bounds[k + 1]
                    root = max(cuts[sign].get(r0, 1.0), cuts[sign].get(r1, 1.0))
                    strips[sign, k] = (r0, r1, root, rng.uniform(0.2, 1.0) * hang, rng.uniform(-0.6, 0.6))

            def strip_of(sign, i, upper):
                for (sg, k), (r0, r1, root, hg, tw) in strips.items():
                    if sg == sign and (r0 <= i < r1 if upper else r0 < i <= r1):
                        return k
                return None

            cache = {}
            u0 = (tex + 0.5) / 4
            sub_steps = 3

            def vertex(i, j, sign, k):
                x = j / cols
                torn = j and (i in cuts[sign]) and x > cuts[sign][i] + 1e-6
                key = (i, j, sign if j else 0, k if torn else None)
                if key in cache:
                    return cache[key]
                ti = i / rows
                t = min(1.0, ti + shear * x * (1 - ti))
                p, tangent, s, n = frame(t)
                w = half_width(t)
                r0, r1, root, hg, tw = strips[sign, k]
                along = (i - r0) / max(1, r1 - r0)
                lat = down = free = 0.0
                at_root = None
                if j:
                    m = j * sub_steps
                    for q in range(m):
                        xx = (q + 0.5) / (cols * sub_steps)
                        if xx > root and at_root is None:
                            at_root = (lat, down)
                        th = fold + sag * xx + wave * math.sin(t * length / 0.42 * 6.283 + phases[sign]) * xx * xx
                        th += curl * smooth_s(0.8, 1.0, xx)
                        if xx > root:
                            th += 0.35 * hg * (1 + tw * (along - 0.5) * 2) * (xx - root) / max(0.05, 1 - root)
                            free += w / (cols * sub_steps)
                        lat += math.cos(th) / (cols * sub_steps)
                        down += math.sin(th) / (cols * sub_steps)
                co = add(add(p, s, sign * lat * w), n, -down * w)
                if free:
                    # A torn strip hangs from where it is still attached: blend its free part toward
                    # hanging under its own weight, each strip by its own amount, splayed apart.
                    rl, rd = at_root
                    root_co = add(add(p, s, sign * rl * w), n, -rd * w)
                    fall = unit(add(add((0, 0, -1), s, 0.45 * sign), tangent, tw * 0.6))
                    g = min(1.0, hg / math.radians(90)) * smooth_s(0.0, 0.12, free)
                    hung = add(root_co, fall, free)
                    co = tuple(co[q] * (1 - g) + hung[q] * g for q in range(3))
                co = add(co, tangent, tw * 0.2 * free)   # torn strips splay apart along the blade
                uv = (u0 + sign * x * 0.49 / 4, t)
                v = cache[key] = self.vert('banana-leaf', co, uv)
                return v

            for sign in (1, -1):
                for i in range(rows):
                    k = strip_of(sign, i, True)
                    for j in range(cols):
                        quad = (vertex(i, j, sign, k), vertex(i, j + 1, sign, k),
                                vertex(i + 1, j + 1, sign, k), vertex(i + 1, j, sign, k))
                        if sign < 0:
                            quad = quad[::-1]
                        self.face('banana-leaf', quad)
            # The midrib: a pale ridge under the blade, thick at the base and fading toward the tip.
            pts, radii = [], []
            for k in range(11):
                t = 0.92 * k / 10
                p, tangent, s, n = frame(t)
                r = 0.022 * (1 - t) ** 0.9 + 0.0035
                pts.append(add(p, n, -1.05 * r))
                radii.append(r)
            self.sweep('banana-stem', pts, radii, 6, PETIOLE, squash=0.8, roll=math.pi / 2)
            return frame

    return Banana


# Leaves, oldest (lowest on the stem) first. Azimuth from +x toward +y (the lane camera looks along
# +y, +x to its right); rise: petiole elevation; pet: petiole length; a0/bend: blade start elevation
# and how far it bends down toward the tip (degrees); L, W: blade length and half-width (m);
# tex: atlas column; tears per half and their depth; fold/sag/wave/roll/twist as in blade().
# The leaves visible from the lane are placed from IMG_3092; the others fill the spiral round the back.
L = dict
LEAVES = [
    # dead leaves hanging against the stem
    L(az=255, pet=0.25, a0=-86, bend=4, L=1.25, W=0.15, tex=DEAD, tears=7, depth=(0.5, 0.95), fold=72, sag=10, hang=20, roll=0, twist=60, h=2.28, dead=True),
    L(az=40, pet=0.2, a0=-88, bend=4, L=1.10, W=0.14, tex=DEAD, tears=6, depth=(0.5, 0.95), fold=75, sag=10, hang=20, roll=0, twist=-50, h=2.34, dead=True),
    L(az=150, pet=0.3, a0=-84, bend=6, L=1.35, W=0.16, tex=DEAD, tears=8, depth=(0.5, 0.95), fold=70, sag=12, hang=20, roll=0, twist=40, h=2.40, dead=True),
    # old leaves, drooping, the blade torn into strips that hang
    L(az=150, rise=28, pet=0.80, a0=8, bend=100, L=1.95, W=0.30, tex=YELLOWED, tears=14, depth=(0.7, 0.98), fold=14, sag=40, hang=80, roll=0, twist=-10, h=2.50),
    L(az=-58, rise=30, pet=0.85, a0=10, bend=96, L=2.10, W=0.31, tex=GREEN, tears=13, depth=(0.65, 0.98), fold=12, sag=38, hang=75, roll=-10, twist=15, h=2.52),
    L(az=100, rise=28, pet=0.80, a0=6, bend=94, L=2.05, W=0.30, tex=GREEN, tears=12, depth=(0.6, 0.97), fold=12, sag=36, hang=75, roll=0, twist=-20, h=2.54),
    L(az=22, rise=30, pet=0.80, a0=10, bend=92, L=2.30, W=0.33, tex=YELLOWED, tears=12, depth=(0.6, 0.97), fold=10, sag=34, hang=70, roll=-30, twist=25, h=2.56),
    L(az=-120, rise=32, pet=0.75, a0=12, bend=86, L=2.05, W=0.30, tex=GREEN, tears=10, depth=(0.55, 0.95), fold=12, sag=34, hang=65, roll=0, twist=10, h=2.58),
    L(az=200, rise=34, pet=0.75, a0=12, bend=88, L=2.00, W=0.30, tex=YELLOWED, tears=11, depth=(0.55, 0.95), fold=12, sag=34, hang=65, roll=30, twist=-15, h=2.60),
    # middle leaves, arching out
    L(az=235, rise=58, pet=0.70, a0=38, bend=72, L=2.00, W=0.30, tex=GREEN, tears=6, depth=(0.4, 0.9), fold=14, sag=30, hang=50, roll=0, twist=10, h=2.64),
    L(az=70, rise=60, pet=0.75, a0=42, bend=70, L=2.10, W=0.30, tex=YELLOWED, tears=6, depth=(0.4, 0.9), fold=14, sag=30, hang=50, roll=0, twist=-10, h=2.67),
    L(az=-62, rise=66, pet=0.80, a0=44, bend=74, L=2.00, W=0.30, tex=GREEN, tears=5, depth=(0.35, 0.85), fold=14, sag=30, hang=45, roll=0, twist=10, h=2.70),
    L(az=-14, rise=62, pet=0.95, a0=38, bend=72, L=2.55, W=0.33, tex=SCORCHED, tears=4, depth=(0.35, 0.85), fold=8, sag=30, hang=35, roll=-40, twist=20, h=2.72),
    L(az=188, rise=66, pet=0.95, a0=30, bend=36, L=1.80, W=0.30, tex=YELLOWED, tears=3, depth=(0.3, 0.8), fold=10, sag=34, hang=30, roll=40, twist=10, h=2.75),
    L(az=20, rise=68, pet=0.90, a0=44, bend=32, L=1.70, W=0.28, tex=YELLOWED, tears=2, depth=(0.3, 0.7), fold=14, sag=26, hang=25, roll=-35, twist=-10, h=2.78),
    # young leaves, nearly upright
    L(az=-150, rise=72, pet=0.75, a0=66, bend=50, L=1.60, W=0.25, tex=GREEN, tears=1, depth=(0.2, 0.5), fold=22, sag=22, hang=10, roll=0, twist=30, h=2.80),
    L(az=62, rise=66, pet=0.70, a0=60, bend=40, L=1.35, W=0.22, tex=GREEN, tears=1, depth=(0.2, 0.5), fold=26, sag=20, hang=10, roll=0, twist=40, h=2.82),
    L(az=168, rise=78, pet=1.00, a0=78, bend=40, L=2.45, W=0.31, tex=YELLOWED, tears=1, depth=(0.2, 0.5), fold=34, sag=20, hang=10, roll=70, twist=-25, h=2.86),
    L(az=110, rise=84, pet=0.98, a0=84, bend=14, L=2.15, W=0.30, tex=GREEN, tears=0, fold=12, sag=18, hang=0, roll=0, twist=15, h=2.90),
]


def pseudostem(p):
    rng = p.rng
    # Core: tapering, slightly leaning, a little uneven.
    zs = [TOP * (k / 24) ** 1.0 for k in range(25)]
    pts = [stem_centre(z) for z in zs]
    wobble = {(i, j): 1 + rng.uniform(-0.03, 0.03) for i in range(25) for j in range(16)}
    p.sweep('banana-stem', pts, [stem_radius(z) for z in zs], 16, CORE, vrange=(0.0, 1.0),
            bump=lambda i, j: wobble[i, j])
    # Overlapping leaf sheaths: each wraps most of the way round, its edge spiralling up. The outer
    # (older) ones end lower; the oldest are dried brown and peel away at the top.
    sheaths = 9
    for k in range(sheaths):
        top = 0.9 + 2.0 * k / (sheaths - 1)
        dried = k < 3
        phi0 = k * 2.4 + 0.4
        span = math.radians(rng.uniform(220, 300))
        gap = 0.0018 * (sheaths - k) + 0.002
        # The dried outer sheaths split into papery strips that peel away at the top.
        pieces = [(-0.5, 0.5, 0.0, 1.0)]
        if dried:
            cuts = sorted(rng.uniform(-0.4, 0.4) for _ in range(3))
            edges = [-0.5] + cuts + [0.5]
            pieces = [(edges[q] + 0.01, edges[q + 1] - 0.01, rng.uniform(0.02, 0.16), rng.uniform(0.55, 1.0))
                      for q in range(4)]
        rows, cols = 14, 4 if dried else 10
        for c0, c1, peel_amount, height in pieces:
            grid = []
            for i in range(rows + 1):
                s = i / rows
                row = []
                for j in range(cols + 1):
                    c = c0 + (c1 - c0) * j / cols
                    # Green sheaths end in a rounded top; dried strips in ragged ends at their own height.
                    zt = top * (height - (0.1 * (2 * c) ** 2 if not dried else 0.04 * rng.random()))
                    z = zt * s
                    peel = peel_amount * smooth_s(0.45, 1.0, s) ** 1.6 if dried else 0.0
                    a = phi0 + 0.25 * z + c * span
                    lip = 0.003 * (abs(c) * 2) ** 6
                    r = stem_radius(z) + gap + lip + peel
                    ctr = stem_centre(z - peel * 0.4)
                    co = (ctr[0] + math.cos(a) * r, ctr[1] + math.sin(a) * r, z - peel * 0.4)
                    region = DRY if dried else SHEATH
                    uv = (region[0] + (region[1] - region[0]) * (c + 0.5), z / TOP)
                    row.append(p.vert('banana-stem', co, uv))
                grid.append(row)
            for i in range(rows):
                for j in range(cols):
                    p.face('banana-stem', (grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))

def crown(p):
    for n, spec in enumerate(LEAVES):
        az = math.radians(spec['az'])
        h = (math.cos(az), math.sin(az), 0)
        z = spec['h']
        ctr = stem_centre(z)
        rad = stem_radius(z)
        rise, a0 = math.radians(spec.get('rise', -60)), math.radians(spec['a0'])
        lp = spec['pet']
        # The sheath: from inside the stem, up and out through its surface.
        sheath = add(add(stem_centre(z - 0.45), h, stem_radius(z - 0.45) * 0.6), (0, 0, 0))
        foot = add(ctr, h, rad * 0.75)
        end = add(foot, (math.cos(rise) * h[0], math.cos(rise) * h[1], math.sin(rise)), lp)
        start_dir = (math.cos(a0) * h[0], math.cos(a0) * h[1], math.sin(a0))
        if spec.get('dead'):   # snapped where it left the stem, hanging straight down against it
            foot = add(ctr, h, rad * 0.85)
            end = add(add(foot, h, 0.025), (0, 0, -1), lp)
            stalk = bezier(foot, add(foot, (0, 0, -1), lp * 0.3), add(end, (0, 0, 1), lp * 0.3), end, 6)
            p.sweep('banana-stem', stalk, [0.022 - 0.008 * k / 6 for k in range(7)], 6, DRY, squash=0.5)
        else:
            ctrl1 = add(foot, (0, 0, 1), lp * 0.4)
            ctrl2 = add(end, start_dir, -lp * 0.3)
            stalk = bezier(foot, ctrl1, ctrl2, end, 9)
            r0 = 0.05
            radii = [r0 * 1.1] + [r0 - (r0 - 0.02) * (k / 9) ** 0.6 for k in range(10)]
            p.sweep('banana-stem', [sheath] + stalk, radii, 8, PETIOLE, squash=0.8)
        p.blade(end, az, a0, math.radians(spec['bend']), spec['L'], spec['W'], spec['tex'],
                tears=spec.get('tears', 0), depth=spec.get('depth', (0.4, 0.9)), fold=spec['fold'],
                sag=spec['sag'], hang=spec['hang'], roll=math.radians(spec['roll']),
                twist=math.radians(spec['twist']), rows=30 if spec.get('dead') else 38,
                cols=5 if spec.get('dead') else 7, wave=6 if spec.get('dead') else 10)


# The bunch as photographed (IMG_3092), in crop pixels of BUNCH_CROP: x right, y down. BUNCH_K metres per
# pixel comes from the bud, 195 px long and 87 px across for a bud of about 0.29 x 0.13 m. BUNCH_ORIGIN puts
# crop pixel (0, 0) in the model so the crown top (crop y 380, where the leaves part beside the stalk)
# meets TOP, and the stem 268 px to the left of the crop meets the pseudostem. The bud's foot then comes
# out at about 1.96 m, just above the garden wall, as photographed.
BUNCH_K = 0.0015
BUNCH_ORIGIN = (0.50, 3.52)
BUNCH_SIZE = (642, 1321)


def P(u, v, y=0.0):
    """A photo pixel on the bunch's plane (through its stalk), in model coordinates."""
    return (BUNCH_ORIGIN[0] + u * BUNCH_K, y, BUNCH_ORIGIN[1] - v * BUNCH_K)


def bunch_uv(co):
    """Texture coordinates of a point by projecting the photo along the lane camera's view (+y)."""
    u = (co[0] - BUNCH_ORIGIN[0]) / BUNCH_K / BUNCH_SIZE[0]
    v = (BUNCH_ORIGIN[1] - co[2]) / BUNCH_K / BUNCH_SIZE[1]
    return (min(0.999, max(0.001, u)), min(0.999, max(0.001, 1 - v)))


def bunch(p, kind='banana-bunch'):
    """The photographed bunch: the stalk arching up out of the crown and down, six hands of upward-curving
    fingers in two clusters, the knobbly bare rachis and the matte bud with one bract lifted to the right."""
    rng = p.rng
    UV = (0.0, 1.0)  # replaced by the projection
    s0 = stem_centre(TOP - 0.05)
    arch = bezier(s0, add(s0, (0, 0, 1), 0.32), P(-80, 80), P(5, 175), 12)
    stalk = arch + [P(47, 220), P(90, 280), P(123, 340), P(150, 372)]
    axis = [P(150, 372), P(160, 420), P(185, 470), P(215, 520), P(245, 568), P(275, 615), P(300, 660)]
    path = stalk + axis[1:]
    p.sweep(kind, path, [0.031] * len(stalk) + [0.03 - 0.004 * k / 6 for k in range(1, 7)], 9, UV)
    # Hands: three in the upper cluster, three in the lower, each a double crescent of fingers growing out
    # from the axis and curving up, wide enough to fill the photographed outline (about 0.36 m across).
    hands = [(P(158, 400), 0.0, 14, 1.0), (P(172, 440), 2.1, 14, 1.0), (P(195, 480), 4.2, 12, 0.95),
             (P(222, 528), 1.0, 14, 1.0), (P(248, 570), 3.1, 13, 0.97), (P(275, 612), 5.2, 11, 0.9)]
    for centre, facing, count, size in hands:
        for row in range(2):
            n_row = count // 2 + (count % 2 if row == 0 else 0)
            for q in range(n_row):
                phi = facing + 2 * math.pi * (q + 0.5 * row) / n_row + rng.uniform(-0.15, 0.15)
                radial = (math.cos(phi), math.sin(phi), 0)
                base = add(add(centre, radial, 0.032 + 0.026 * row), (0, 0, -0.022 * row))
                finger(p, kind, base, radial, rng.uniform(0.13, 0.15) * size, 0.026 * size,
                       rng.uniform(-0.3, -0.05) + 0.2 * row, rng.uniform(1.2, 1.45), rng.uniform(0, 1))
    # The bare rachis, dark and knobbly with bract scars, down to the bud.
    rachis = [P(300, 660), P(303, 700), P(305, 730), P(310, 760), P(312, 790), P(311, 820), P(311, 845)]
    knots = {i: 1.0 + (0.25 if i % 2 else 0.0) for i in range(len(rachis))}
    dense = [add(rachis[i], sub(rachis[i + 1], rachis[i]), t / 3) for i in range(len(rachis) - 1) for t in range(3)] + [rachis[-1]]
    p.sweep(kind, dense, [0.015 - 0.003 * k / len(dense) for k in range(len(dense))], 6, UV,
            bump=lambda i, j: knots[i % len(knots)] * (1 + 0.12 * ((i * 7 + j * 3) % 5) / 5))
    bud(p, kind, P(311, 845))


def finger(p, kind, base, radial, length, radius, start, end, spin):
    """One banana: a six-sided finger, out from the stalk then curving up, to a dark dried tip."""
    pts, radii = [], []
    pos = base
    steps = 7
    for k in range(steps + 1):
        s = k / steps
        if k:
            a = start + (end - start) * (s - 0.5 / steps) ** 0.8
            pos = add(pos, (radial[0] * math.cos(a), radial[1] * math.cos(a), math.sin(a)), length / steps)
        pts.append(pos)
        # Plump and blunt, as photographed: a short neck at the stalk, full along the body, rounded at the tip.
        body = min(1.0, 0.45 + 2.2 * s) * (1 - 0.55 * max(0.0, (s - 0.8) / 0.2) ** 2)
        radii.append(radius * (0.42 if k == 0 else body))
    pts.append(add(pts[-1], unit(sub(pts[-1], pts[-2])), radius * 0.35))
    radii.append(0.0)
    p.sweep(kind, pts, radii, 6, (0.0, 1.0), roll=spin, tip=True)


def bud(p, kind, top):
    """The male bud: a teardrop of overlapping bracts 0.29 m long, and the top bract lifted out to the
    right like a lid, as photographed (its maroon inner face shows)."""
    length, R = 0.29, 0.066
    down, side, other = (0, 0, -1), (1, 0, 0), (0, 1, 0)

    def radius(v):
        if v < 0.3:
            return R * (0.3 + 0.7 * math.sin(math.pi / 2 * v / 0.3))
        return R * max(0.0, math.cos(math.pi / 2 * (v - 0.3) / 0.7)) ** 0.7

    def at(v, a, scale=1.0):
        r = radius(v) * scale
        return add(add(add(top, down, v * length), side, math.cos(a) * r), other, math.sin(a) * r)

    pts = [add(top, down, length * k / 14) for k in range(15)]
    p.sweep(kind, pts, [radius(k / 14) * 0.97 for k in range(15)], 14, (0.0, 1.0), tip=True)
    for layer in range(4):  # overlapping bract edges
        centre, v0, rows, cols = layer * 2.4 + 0.5, 0.04 + 0.07 * layer, 10, 8
        grid = [[p.vert(kind, at(v0 + (0.985 - v0) * i / rows, centre + (j / cols - 0.5) * math.radians(200),
                                  1.02 + 0.022 * (3 - layer) + 0.02 * abs(j / cols - 0.5) ** 3 * 8), (0, 0))
                 for j in range(cols + 1)] for i in range(rows + 1)]
        for i in range(rows):
            for j in range(cols):
                p.face(kind, (grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
    # The lifted bract: hinged at the bud's top right, reaching out to the right and a little up (crop
    # pixels 330,840 to 470,815), cupped, two surfaces back to back.
    hinge, tip = P(330, 842), P(470, 815)
    lift = unit(sub(tip, hinge))
    across = unit(cross(lift, (0, 1, 0)))
    normal = unit(cross(across, lift))
    reach, rows, cols = math.dist(hinge, tip), 7, 6
    for face_side in (1, -1):
        grid = []
        for i in range(rows + 1):
            s = i / rows
            w = 0.03 * math.sin(math.pi * min(1.0, 0.25 + s * 0.8)) ** 0.6
            grid.append([p.vert(kind, add(add(add(hinge, lift, reach * s), across, (j / cols * 2 - 1) * w), normal,
                                          0.012 * (1 - (j / cols * 2 - 1) ** 2) - 0.02 * s * s + 0.0015 * face_side), (0, 0))
                         for j in range(cols + 1)])
        for i in range(rows):
            for j in range(cols):
                quad = (grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j])
                p.face(kind, quad if face_side > 0 else quad[::-1])


# ---------------------------------------------------------------------------------------------
# Export
# ---------------------------------------------------------------------------------------------

# Materials: (texture, roughness, double-sided, alpha-masked, normal map, emission). Four in all.
# The leaves glow a little (emission from their own colour): the photographed leaves are lit
# through by the sun, which a standard material cannot show.
MATERIALS = {
    'banana-leaf': ('leaf', 0.62, True, True, 'leaf-normal', ('leaf-glow', 0.35)),
    'banana-stem': ('stem', 0.82, True, False, None, None),
    'banana-bunch': ('bunch', 0.6, True, False, None, ('bunch', 0.65)),  # the photo's own light: it is shaded already
}


def make_material(name, textures):
    import bpy
    key, roughness, double, masked, normal_key, glow = MATERIALS[name]
    m = bpy.data.materials.new(name)
    nodes, links = m.node_tree.nodes, m.node_tree.links
    shader = nodes['Principled BSDF']
    shader.inputs['Roughness'].default_value = roughness
    image = bpy.data.images.load(str(textures[key]))
    tex = nodes.new('ShaderNodeTexImage')
    tex.image = image
    links.new(tex.outputs['Color'], shader.inputs['Base Color'])
    if glow:
        gtex = tex
        if glow[0] != key:
            gtex = nodes.new('ShaderNodeTexImage')
            gtex.image = bpy.data.images.load(str(textures[glow[0]]))
        links.new(gtex.outputs['Color'], shader.inputs['Emission Color'])
        shader.inputs['Emission Strength'].default_value = glow[1]
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
        nmap.inputs['Strength'].default_value = 0.6
        links.new(ntex.outputs['Color'], nmap.inputs['Color'])
        links.new(nmap.outputs['Normal'], shader.inputs['Normal'])
    m.use_backface_culling = not double
    return m


def export(p, textures):
    import bpy
    from build_plants import OUT
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for kind in MATERIALS:
        if kind not in p.meshes:
            continue
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
    if '--extract' in sys.argv:
        extract()
        return
    sys.path.insert(0, str(HERE))
    Banana = make_plant_class()
    plant = Banana('banana', SEED)
    pseudostem(plant)
    crown(plant)
    bunch(plant)
    # The bunch on its own, for reuse: moved so the top of its stalk, where it leaves the crown, is the origin.
    alone = Banana('banana-bunch', SEED)
    bunch(alone)
    s0 = stem_centre(TOP - 0.05)
    for b in alone.meshes.values():
        for v in b.verts:
            v.co = (v.co[0] - s0[0], v.co[1] - s0[1], v.co[2] - s0[2])
    with tempfile.TemporaryDirectory() as folder:
        textures = write_textures(folder)
        export(plant, textures)
        export(alone, textures)


if __name__ == '__main__':
    main()
