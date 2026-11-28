#!/usr/bin/env python3
"""Builds the mountain backdrop public/art/mountains/panorama.webp from Dave's own Villacana photos.

The panorama is a flat 4096x224 RGBA strip, 21.1 px per degree, covering compass bearings
-112..82 degrees (0 = north, + = east) and elevations -2.1..8.5 degrees. src/backdrop.ts wraps it
round a cylinder of radius 4200 m centred on RESORT_CENTRE. Every pixel of the strip is a point on
that cylinder; the script projects it into each source photo through the photo's camera (solved
poses from data/photo_poses.json, plus IMG_2214 whose pose is fitted below) and samples it, so seen
from that camera the backdrop lines up with the photo.

Each bearing range uses one photo (SOURCES), cross-faded over 2 degrees at the seams. The sky is
cut away with a soft edge. Per column, the photo's crest is used where it is clear sky above
mountain; where trees, roofs or cloud hide the ridge, or no photo covers the bearing, the crest
falls back to the skyline measured from the solved cameras (FAR and NEAR below, the old
FAR_RIDGE / NEAR_RIDGE outline), smoothed so it has no polygon corners, and the colour is filled
in from the nearest photographed mountain and the photo's average crest-to-foot shading. Below
the range the photo's distant town is kept down to the first roofs next to the resort; lower down,
and under filled stretches, the town's colours are carried down. No haze band is added.

Needs numpy, scipy and Pillow. Usage: python3 scripts/build_mountain_texture.py
"""
import json, math
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public/art/mountains/panorama.webp"
W, H = 4096, 224
PXDEG = W / 194.0
B0, E_TOP = -112.0, 8.5
CX, CZ, R = -80.0, 90.0, 4200.0  # RESORT_CENTRE and FAR_DISTANCE in src/backdrop.ts

# Skyline measured from the solved cameras (IMG_2204-2206, IMG_2360) and the rooftop and beach
# photos: [bearing, elevation] in degrees. Far range, and the nearer Monte Mayor foothill.
FAR = [(-112, -0.5), (-102, 0.0), (-92, 1.2), (-82, 2.7), (-74, 4.2), (-66, 5.2), (-60, 4.9), (-55, 5.4), (-50, 4.8), (-46, 4.6), (-42, 5.4), (-39, 4.6), (-35, 4.5), (-32, 4.4), (-28, 4.0), (-24, 4.8), (-21, 4.5), (-18, 5.0), (-14, 3.8), (-10, 3.7), (-6, 4.4), (-3, 5.2), (-1, 5.6), (0, 5.45), (1, 5.9), (3.5, 5.5), (7, 4.8), (10.5, 4.1), (14.5, 3.3), (17.5, 3.6), (20, 3.9), (23.5, 3.9), (26.5, 2.7), (30, 2.3), (34, 2.2), (38, 2.4), (41.5, 3.0), (44.5, 3.75), (45.5, 3.55), (46.6, 4.15), (48.5, 3.45), (51.5, 2.7), (54.5, 2.25), (57.5, 1.7), (60.5, 1.0), (63.5, 1.3), (66.5, 0.95), (71, 0.4), (75, 0.0), (82, -0.5)]
NEAR = [(-26, 0.0), (-19, 1.7), (-14, 2.3), (-11, 2.7), (-8.5, 2.75), (-7.0, 3.8), (-6.0, 5.1), (-4.8, 3.9), (-3.2, 2.8), (-1.0, 1.6), (2.5, 0.25), (4.0, 0.0)]

# IMG_2214 (rooftop, clear sky, the whole range) has no solved camera. Its pin position and
# heading come from data/photo_coverage.json; yaw, pitch, roll and focal length were fitted so the
# pointed Monte Mayor peak and the eastern summit land where the solved IMG_2205 sees them.
IMG_2214 = {"x": -154.9, "y": 8.43, "z": 44.8, "yaw": -0.571, "pitch": -2.808, "roll": 1.227, "f": 1093.34}

# photo, bearing range it supplies, threshold of "darker than sky" (luminance), elevation shift
SOURCES = [
    ("IMG_2214", -20.5, 27.0, 128, 0.0),   # west of -20.5 a water heater on the roof hides the range
]
SEAM = 2.0
# The photo is used from the crest down to the distant town at the foot of the range (TOWN_LOW);
# lower down it shows the palms and roofs right next to the resort, which must not be in a
# backdrop 4 km away, so below that the town strip's colours are carried down instead.
TOWN_LOW = 0.0
FOOT = 1.8   # elevation (deg) where, in the fill, mountain gives way to the trees and town below

def lum(a): return 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]

def pose(name):
    if name == "IMG_2214": return IMG_2214, (1200, 1600)
    rec = json.load(open(ROOT / "data/photo_poses.json"))["photos"][name + ".jpg"]
    return rec["solved"]["pose"], tuple(rec["image"])

def rotation(p):
    y, x, z = math.radians(-p["yaw"]), math.radians(p["pitch"]), math.radians(p["roll"])
    Ry = np.array([[math.cos(y), 0, math.sin(y)], [0, 1, 0], [-math.sin(y), 0, math.cos(y)]])
    Rx = np.array([[1, 0, 0], [0, math.cos(x), -math.sin(x)], [0, math.sin(x), math.cos(x)]])
    Rz = np.array([[math.cos(z), -math.sin(z), 0], [math.sin(z), math.cos(z), 0], [0, 0, 1]])
    return Ry @ Rx @ Rz  # three.js Euler order YXZ: rotation.set(pitch, -yaw, roll)

bearings = B0 + (np.arange(W) + 0.5) / PXDEG
elev = E_TOP - (np.arange(H) + 0.5) / PXDEG

def reproject(name, shift):
    """Samples the photo at every strip pixel (shifted up by `shift` degrees); returns rgb, inside."""
    p, (w, h) = pose(name)
    img = np.asarray(Image.open(ROOT / f"public/photos-ref/{name}.jpg").convert("RGB")).astype(np.float32)
    b = np.radians(bearings)[None, :]
    e = np.radians(elev - shift)[:, None]
    d = np.stack([CX + R * np.sin(b) - p["x"] + 0 * e, R * np.tan(e) - p["y"] + 0 * b, CZ - R * np.cos(b) - p["z"] + 0 * e], -1)
    c = d @ rotation(p)
    zc = -c[..., 2]
    ok = zc > 1
    u = w / 2 + p["f"] * c[..., 0] / np.where(ok, zc, 1)
    v = h / 2 - p["f"] * c[..., 1] / np.where(ok, zc, 1)
    ok &= (u >= 0) & (u < w - 1) & (v >= 0) & (v < h - 1)
    rgb = np.stack([ndi.map_coordinates(img[..., k], [v, u], order=1, mode="nearest") for k in range(3)], -1)
    return rgb, ok

def skyline():
    fb, fe = np.array(FAR).T
    nb, ne = np.array(NEAR).T
    e = np.maximum(np.interp(bearings, fb, fe), np.interp(bearings, nb, ne, left=-9, right=-9))
    return ndi.gaussian_filter1d(e, 0.5 * PXDEG, mode="nearest")   # no polygon corners

def first_run(mask, need=5):
    """Row of the first run of `need` true pixels in each column (nan if none)."""
    out = np.full(mask.shape[1], np.nan)
    for x in range(mask.shape[1]):
        run = 0
        for y in range(mask.shape[0]):
            run = run + 1 if mask[y, x] else 0
            if run >= need:
                out[x] = y - need + 1
                break
    return out

def row_of(e): return (E_TOP - e) * PXDEG - 0.5

def is_foreground(rgb):
    """Trees (green or very dark) and white roofs/walls, which stand in front of the range."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return ((g > r + 4) & (g > b + 8)) | (lum(rgb) < 38) | (lum(rgb) > 195)

def side_w(lo, hi):
    """Sideways weight: 1 inside a source's range, easing to 0 over SEAM degrees outside it."""
    side = np.clip(1 - np.maximum(lo - bearings, bearings - hi) / SEAM, 0, 1)
    return side * side * (3 - 2 * side)

def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)

def main():
    sky_e = skyline()
    sky_row = row_of(sky_e)
    rgb = np.zeros((H, W, 3), np.float32)
    weight = np.zeros((H, W), np.float32)
    crest_sum = np.zeros(W); crest_w = np.zeros(W)
    report = []
    body_all = np.zeros((H, W), bool)
    kept = []
    ref = None
    for name, lo, hi, thr, shift in SOURCES:
        if shift is None:
            img, ok = reproject(name, 0.0)
            c = first_run((lum(img) < thr) & ok)
            cols = (bearings >= lo) & (bearings <= hi) & ~np.isnan(c) & (np.abs(row_of(sky_e) - c) < 3 * PXDEG)
            shift = float(np.median((sky_row - c)[cols])) / PXDEG if cols.any() else 0.0
            shift = -shift  # move the photo so its crest sits on the measured skyline
        img, ok = reproject(name, shift)
        dark = (lum(img) < thr) & ok
        crest = first_run(dark)
        # columns where the photo shows clear sky over mountain near the measured skyline
        near = ~np.isnan(crest) & (crest > sky_row - 1.6 * PXDEG) & (crest < sky_row + 2.2 * PXDEG)
        valid = np.zeros((H, W), bool)
        fg = is_foreground(img)
        # colour of the mountain itself: the few rows just under the crest
        top = [img[int(crest[x]) + 2:int(crest[x]) + 7, x] for x in np.nonzero(near)[0]]
        if not top:
            near[:] = False
        else:
            top = np.concatenate(top)
            mu, sd = top.mean(0), top.std(0) + 6
            unlike = (np.abs((img - mu) / sd) > 2.6).any(-1) | fg | ~ok
            for x in np.nonzero(near)[0]:
                y0 = int(crest[x])
                col = unlike[y0:, x]
                stop = np.argmax(np.convolve(col, np.ones(3), "same") >= 3) if col.any() else len(col)
                if stop >= 8:
                    valid[y0:y0 + stop, x] = True
                else:
                    near[x] = False
        # drop slivers: a photographed stretch must be at least 1 degree wide
        keep = ndi.binary_opening(near, np.ones(int(PXDEG)))
        valid &= keep[None, :]; near = keep
        # the distant town and foothills below the mountain, in every covered column, down to
        # TOWN_LOW or to the first white roof of the buildings next to the resort (below 1 degree)
        body = valid.copy()
        cover = (bearings >= lo) & (bearings <= hi)
        town = np.zeros((H, W), bool)
        low = int(row_of(TOWN_LOW))
        roof = (lum(img) > 200) & (elev[:, None] < 1.0)
        for x in np.nonzero(cover)[0]:
            y0 = (H - np.argmax(valid[::-1, x])) if valid[:, x].any() else int(row_of(2.4))
            r = np.nonzero(np.convolve(roof[:, x], np.ones(5), "same") >= 5)[0]
            r = r[r >= y0]
            town[y0:min(low, r[0] - 3 if len(r) else low), x] = True
        town &= ok & (np.arange(H)[:, None] > sky_row[None, :] + 0.5 * PXDEG)
        valid |= town
        body_all |= body & (side_w(lo, hi) > 0.5)[None, :]
        # match the source's colours to the reference photo (the first source)
        if valid.any():
            m, sd = img[valid].mean(0), img[valid].std(0) + 1e-3
            if ref is None: ref = (m, sd)
            img = (img - m) / sd * ref[1] + ref[0]
        side = side_w(lo, hi)
        wgt = valid * side[None, :]
        rgb += img * wgt[..., None]; weight += wgt
        kept.append((img, ok, side))
        cw = near * side
        crest_sum += np.nan_to_num(crest) * cw; crest_w += cw
        cover = (bearings >= lo) & (bearings <= hi)
        report.append(f"{name}: {lo:+.0f}..{hi:+.0f} deg, shift {shift:+.2f} deg, photo crest used on {100 * near[cover].mean():.0f}% of its columns")

    has = weight > 1e-3
    photo = np.where(has[..., None], rgb / np.maximum(weight, 1e-3)[..., None], 0)

    # Crest: the photographed one where there is one, the measured skyline elsewhere, joined smoothly.
    # Offset from the measured skyline: interpolated across trees and gaps between photographed
    # stretches, then easing back to the skyline over about 6 degrees beyond the last photo.
    acc = crest_w > 0.5
    xs = np.arange(W)
    if acc.any():
        off = np.interp(xs, xs[acc], (crest_sum / np.maximum(crest_w, 1e-6) - sky_row)[acc])
        dist = ndi.distance_transform_edt(~acc)
        inside = (xs >= xs[acc].min()) & (xs <= xs[acc].max())
        off *= np.where(inside, 1.0, np.exp(-dist / (3 * PXDEG)))
    else:
        off = np.zeros(W)
    crest_row = ndi.gaussian_filter1d(sky_row + off, 1.0)

    # Where a tree in front hid the ridge, the photo still shows it, below the crest line: keep it
    # too (trees standing above the skyline are cut away with the sky).
    rows = np.arange(H)[:, None]
    last = np.where(has.any(0), H - 1 - np.argmax(has[::-1], 0), -1)
    gap = (rows > crest_row[None, :] + 2) & (rows < last[None, :])
    for img, ok, side in kept:
        add = gap & ok & (side[None, :] > 0.5) & ~has
        photo[add] = img[add]; has |= add; body_all |= add

    # Fill for what no photo shows (behind trees, or outside the photo's bearings):
    # the mountain's own photographed colour by depth below the crest, giving way below FOOT to the
    # trees and town at its foot (the photo's lowest town colours, blurred over a few degrees), with
    # a little low-frequency light and shade so it does not look flat. No haze is added.
    depth = np.arange(H)[:, None] - crest_row[None, :]
    bins = np.clip(depth.astype(int), 0, H - 1)
    prof = np.zeros((H, 3)); cnt = np.zeros(H)
    np.add.at(prof, bins[body_all], photo[body_all]); np.add.at(cnt, bins[body_all], 1)
    prof = prof / np.maximum(cnt, 1)[:, None]
    for d in range(1, H):
        if cnt[d] < 50: prof[d] = prof[d - 1]
    prof = ndi.gaussian_filter1d(prof, 6, axis=0)   # smooth: no horizontal stripes
    # The fill stands for ranges further off than the photographed one (and lit from other angles),
    # so it is a little lighter and bluer: the far stretches in IMG_2204 / IMG_2206 look like this.
    prof = prof * 0.72 + np.array([128.0, 142.0, 162.0]) * 0.28
    mountain = prof[bins]

    town_px = has & ~body_all
    bottom = np.zeros_like(town_px)
    for x in np.nonzero(town_px.any(0))[0]:
        ys = np.nonzero(town_px[:, x])[0]
        bottom[ys[-8:], x] = True
    tw = bottom.sum(0).astype(np.float32)
    tcol = (photo * bottom[..., None]).sum(0)
    mean_ground = photo[bottom].mean(0) if bottom.any() else prof[-1] * 0.8
    sig = 3.0 * PXDEG
    tcol = np.stack([ndi.gaussian_filter1d(tcol[:, c], sig) for c in range(3)], -1)
    tw = ndi.gaussian_filter1d(tw, sig)
    k = np.clip(tw / 4.0, 0, 1)[:, None]
    ground = k * tcol / np.maximum(tw, 1e-6)[:, None] + (1 - k) * mean_ground
    ground = ground * 0.85 + np.array([92.0, 104.0, 84.0]) * 0.15
    t = smooth((FOOT + 0.6 - elev[:, None]) / 1.2) * smooth((depth - PXDEG) / PXDEG)
    fill = mountain * (1 - t[..., None]) + ground[None, :, :] * t[..., None]
    rng = np.random.default_rng(7)
    noise = ndi.gaussian_filter(rng.standard_normal((H, W)), (0.4 * PXDEG, 1.2 * PXDEG), mode="wrap")
    noise /= noise.std() + 1e-9
    fill *= (1 + 0.06 * np.clip(noise, -2.5, 2.5))[..., None]

    # Photo where seen; just around it, its own colours spread out (normalised blur) and eased into
    # the fill, so the hand-over is soft.
    num = np.stack([ndi.gaussian_filter(photo[..., c] * has, 4) for c in range(3)], -1)
    den = ndi.gaussian_filter(has.astype(np.float32), 4)
    spread = num / np.maximum(den, 1e-6)[..., None]
    wspread = smooth(den / 0.3)[..., None] * (1 - t[..., None] * 0.5)
    out = fill * (1 - wspread) + spread * wspread
    edge = ndi.gaussian_filter(has.astype(np.float32), 1.0)[..., None]
    out = np.where(has[..., None], photo, out) * edge + out * (1 - edge)

    # Soft sky edge (about 4 px) and fades at the two ends of the strip.
    alpha = np.clip((np.arange(H)[:, None] - crest_row[None, :] + 1.5) / 4.0, 0, 1)
    alpha = alpha * alpha * (3 - 2 * alpha)
    ends = np.clip(np.minimum(np.arange(W), np.arange(W)[::-1]) / (5 * PXDEG), 0, 1)
    alpha *= (ends * ends * (3 - 2 * ends))[None, :]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    rgba = np.concatenate([np.clip(out, 0, 255), alpha[..., None] * 255], -1).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(OUT, quality=90, method=6)
    print("\n".join(report))
    print("wrote", OUT)

if __name__ == "__main__":
    main()
