#!/usr/bin/env python3
"""Builds the photographic mountain panorama public/art/mountains/panorama.webp (src/backdrop.ts addRidge).

A flat 4096x224 RGBA strip, 21.1 px per degree, covering bearings -112..82 degrees (0 = north,
+ = east) and elevations -2.1..8.5 degrees as seen from Villacana. It is assembled from real
photographs of the ranges on Wikimedia Commons (licences in public/art/mountains/README.md):
the sky is cut away with a soft, feathered edge, each photo is scaled so its peaks stand about as
high as the photo-measured skyline in the old ridge data (up to ~5-6 degrees), and the colours are
cooled and hazed more and more toward the horizon until they match the sky's horizon colour, so
there is no hard outline anywhere. Neighbouring photos cross-fade sideways.

Needs numpy, scipy and Pillow. Usage: python3 scripts/build_mountain_texture.py [cache-dir]
"""
import json, re, sys, urllib.parse, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

OUT = Path(__file__).resolve().parent.parent / "public/art/mountains"
CACHE = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/villacana-mountain-src")
UA = {"User-Agent": "villacana-roam/1.0 (mountain panorama build)"}

W, H = 4096, 224
PXDEG = W / 194.0
B0 = -112.0            # bearing of column 0
E_TOP = 8.5            # elevation of row 0
ROW0 = E_TOP * PXDEG   # row of elevation 0 degrees
HAZE = np.array([0xa9, 0xd4, 0xf2], np.float32)   # SKY_HORIZON in src/sky.ts
COOL = np.array([0x6f, 0x8f, 0xb5], np.float32)   # distant-rock blue-grey

def lum(a): return 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]

# name -> (Commons file, ground rule, crest search rows, row where the mountain's foot meets the foreground)
SOURCES = {
    "concha": ("Marbella - Picho de la Concha (Sierra Blanca).jpg", lambda a: ((a[..., 2] - a[..., 0]) < 62) | (lum(a) < 120), (0, 700), 800),
    "bermeja_vista": ("Sierra Bermeja vista.jpg", lambda a: lum(a) < 152, (300, 650), 625),
    "crest2": ("Sierra Crestellina2.jpg", lambda a: lum(a) < 172, (590, 900), 800),
}

def fetch(commons_name):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / re.sub(r"\W+", "_", commons_name)
    if not path.exists():
        q = "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&format=json&titles=" + urllib.parse.quote("File:" + commons_name)
        info = json.load(urllib.request.urlopen(urllib.request.Request(q, headers=UA)))
        url = next(iter(info["query"]["pages"].values()))["imageinfo"][0]["url"]
        path.write_bytes(urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read())
    return np.asarray(Image.open(path).convert("RGB")).astype(np.float32)

def crest_rows(a, rule, rows):
    y_min, y_max = rows
    m = ndi.binary_opening(rule(a), np.ones((5, 5)))
    out = np.zeros(m.shape[1], int)
    for x in range(m.shape[1]):
        run, c = 0, y_max
        for y, v in enumerate(m[y_min:y_max, x]):
            run = run + 1 if v else 0
            if run >= 14:
                c = y - 13 + y_min
                break
        out[x] = c
    out = ndi.median_filter(out, size=5)
    out = ndi.minimum_filter1d(out, 31)
    return ndi.uniform_filter1d(out, 9).astype(int)

def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

_src = {}
def layer(name, x0, x1, scale, centre, flip=False):
    """RGBA float layer (H x W x 4) with the photo's columns x0..x1 scaled and centred on a bearing."""
    if name not in _src:
        file, rule, rows, foot = SOURCES[name]
        a = fetch(file)
        _src[name] = (a, crest_rows(a, rule, rows), foot)
    a, crest, foot = _src[name]
    a, crest = a[:, x0:x1], crest[x0:x1]
    top = int(crest.min()) - 30
    img = a[top:foot].copy()
    # sky-edge pixels carry a bluish halo: take the colour from 6 px inside the crest instead
    for x in range(img.shape[1]):
        c = crest[x] - top
        img[c:c + 6, x] = img[min(c + 6, img.shape[0] - 1), x]
    mask = np.zeros(img.shape[:2], np.float32)
    for x in range(img.shape[1]):
        mask[crest[x] - top:, x] = 1
    w, h = max(2, int(round(img.shape[1] * scale))), max(2, int(round(img.shape[0] * scale)))
    rgb = np.asarray(Image.fromarray(img.astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(np.float32)
    mask = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).resize((w, h), Image.BILINEAR)).astype(np.float32) / 255
    mask = ndi.gaussian_filter(ndi.grey_erosion(mask, size=(5, 1)), 1.6)   # soft, slightly eroded crest
    if flip: rgb, mask = rgb[:, ::-1], mask[:, ::-1]
    # horizontal feather, 3 degrees each side
    f = int(2 * PXDEG)
    ramp = np.clip(np.minimum(np.arange(w), np.arange(w)[::-1]) / f, 0, 1)
    mask = mask * (ramp * ramp * (3 - 2 * ramp))[None, :]
    out = np.zeros((H, W, 4), np.float32)
    out[..., :3] = HAZE
    cx = int(round((centre - B0) * PXDEG))
    r0 = int(round(ROW0)) - h   # the photo's foot sits on the 0 degree line
    for (sy0, sy1, dy0) in [(max(0, -r0), min(h, H - r0), max(r0, 0))]:
        xs0, xs1 = max(0, cx - w // 2), min(W, cx - w // 2 + w)
        if xs1 <= xs0: return out
        sx0 = xs0 - (cx - w // 2)
        sl = (slice(dy0, dy0 + sy1 - sy0), slice(xs0, xs1))
        out[sl + (slice(0, 3),)] = rgb[sy0:sy1, sx0:sx0 + xs1 - xs0]
        out[sl + (3,)] = mask[sy0:sy1, sx0:sx0 + xs1 - xs0]
    # below the foot: repeat the last row and its alpha (the haze below turns it into sky colour)
    last = int(round(ROW0))
    out[last:, :, :] = out[last - 1:last, :, :]
    return out

def over(base, top):
    a = top[..., 3:4]
    rgb = top[..., :3] * a + base[..., :3] * (1 - a)
    return np.concatenate([rgb, a + base[..., 3:4] * (1 - a)], 2)

def grade(pan):
    """Cool the rock, then haze it more toward the horizon (aerial perspective)."""
    e = E_TOP - (np.arange(H) + 0.5) / PXDEG        # elevation of each row
    rgb = pan[..., :3]
    rgb = rgb + (lum(rgb)[..., None] - rgb) * 0.35   # pull colour toward grey
    rgb = rgb * 0.8 + COOL * 0.2
    h = (0.2 + 0.8 * smoothstep(3.2, 0.3, e))[:, None, None]
    pan[..., :3] = rgb * (1 - h) + HAZE * h
    return pan

if __name__ == "__main__":
    pan = np.zeros((H, W, 4), np.float32)
    pan[..., :3] = HAZE
    # a lower, hazier foothill range behind everything, so the peaks never stand as islands
    for i, c in enumerate(range(-110, 100, 26)):
        pan = over(pan, layer("bermeja_vista", 0, 1330, 0.45, c, i % 2 == 1))
    for args in [
        ("crest2", 230, 1400, 0.60, -98),                    # Sierra Crestellina, west
        ("bermeja_vista", 0, 1330, 1.00, -57),               # broad Sierra Bermeja massif
        ("bermeja_vista", 0, 1330, 0.85, -8, True),          # the same massif, mirrored, running on north
        ("concha", 150, 1450, 0.20, -6),                     # the pointed peak seen over the roofs
        ("bermeja_vista", 0, 1330, 0.70, 26),                # Benahavis ridge
        ("concha", 150, 1450, 0.16, 46),                     # the second peak, east-north-east
        ("crest2", 230, 1400, 0.50, 70, True),               # lower ground to the east
    ]:
        pan = over(pan, layer(*args))
    pan = grade(pan)
    # fade the two ends of the strip out sideways
    ramp = np.clip(np.minimum(np.arange(W), np.arange(W)[::-1]) / (6 * PXDEG), 0, 1)
    pan[..., 3] *= (ramp * ramp * (3 - 2 * ramp))[None, :]
    OUT.mkdir(parents=True, exist_ok=True)
    rgba = np.concatenate([np.clip(pan[..., :3], 0, 255), np.clip(pan[..., 3:4], 0, 1) * 255], 2).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(OUT / "panorama.webp", quality=88, method=6)
    print("wrote", OUT / "panorama.webp")
