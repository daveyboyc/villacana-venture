#!/usr/bin/env python3
"""Builds the mountain backdrop public/art/mountains/panorama.webp from Dave's own Villacana photos.

The panorama is a flat 4096x224 RGBA strip, 21.1 px per degree, covering compass bearings
-112..82 degrees (0 = north, + = east) and elevations -2.1..8.5 degrees. src/backdrop.ts wraps it
round a cylinder of radius 4200 m centred on RESORT_CENTRE. Every pixel of the strip is a point on
that cylinder; the script projects it into each source photo through the photo's camera (solved
poses from data/photo_poses.json, plus fitted poses in FITTED below) and samples it, so seen from
that camera the backdrop lines up with the photo.

Four photos (SOURCES) are combined, one per bearing range, cross-faded over 1.5 degrees (SEAM) at
the joins and colour-matched to IMG_2214. The sky is cut away with a soft edge. Per column, the
photo's crest is used where it is clear sky over mountain within -1/+2.2 degrees of the measured
skyline (FAR and NEAR below), and falls back to the measured skyline elsewhere, smoothed. Near
trees and palms in front of the mountain are taken out and the hillside is carried across them.
Below each photo's lowest kept elevation (close-up palms and roofs), the distant town colours are
carried down. Uncovered stretches use a soft-edged silhouette fill along the measured skyline in
the neighbouring photos' colours — lighter and bluer further from any photo, with two faint ridge
lines and a subtle mottle — over a darker tree-belt colour below. No haze band is added.

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

# Cameras for photos without a solved pose (data/photo_poses.json has IMG_2204-2206 and IMG_2360).
# Positions are the phone GPS pins from public/photos-ref/manifest.json (y: eye height in scene
# metres). IMG_2214 (rooftop, clear sky, the whole central range): yaw, pitch, roll and focal length
# fitted so the pointed Monte Mayor peak and the eastern summit land where the solved IMG_2205 sees
# them. The beach photos IMG_2483 (2x lens) and IMG_2224: focal length from the lens (26 / 52 mm
# equivalent), yaw, pitch and roll fitted so the sky/mountain crest lies on the measured skyline
# (median error 0.12 and 0.32 degrees over 200+ crest columns each).
FITTED = {
    "IMG_2214": {"x": -154.9, "y": 8.43, "z": 44.8, "yaw": -0.571, "pitch": -2.808, "roll": 1.227, "f": 1093.34},
    "IMG_2483": {"x": -47.5, "y": 1.6, "z": 179.0, "yaw": 53.885, "pitch": -4.882, "roll": 1.073, "f": 2403.0},
    "IMG_2224": {"x": 63.2, "y": 1.6, "z": 130.5, "yaw": 49.557, "pitch": -4.254, "roll": -0.021, "f": 1202.0},
}

# photo, bearing range it supplies (degrees), elevation shift (degrees), lowest elevation of the
# photo kept (degrees; below it the photo shows things close to the camera). One photo per
# bearing, cross-faded over SEAM degrees at the joins. The first is the colour reference.
SOURCES = [
    ("IMG_2214", -20.5, 27.5, 0.0, 0.0),   # rooftop, morning; west of -20.5 a roof water heater hides the range
    ("IMG_2204", -29.5, -20.5, 0.0, 2.2),  # solved camera; west of -29.5 trees and a pine hide the range; roofs below 2.2 deg
    ("IMG_2483", 38.0, 67.0, 0.0, 1.5),    # paseo, 2x lens: the whole La Concha massif; palms below 1.5 deg
    ("IMG_2224", 67.0, 77.5, 0.0, 0.8),    # beach east of the resort: the range running down to the coast
]
SEAM = 1.5
# Each photo is used from the crest down to the distant town at the foot of the range (its lowest
# elevation in SOURCES); lower down it shows palms and roofs close to the camera, which must not be
# in a backdrop 4 km away, so below that the town strip's colours are carried down instead.
FOOT = 1.8   # elevation (deg) where, in the fill, mountain gives way to the trees and town below

def lum(a): return 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]

def pose(name):
    if name in FITTED: return FITTED[name], Image.open(ROOT / f"public/photos-ref/{name}.jpg").size
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

def sky_crest(img, ok, need=3, tol=22.0):
    """Row where each column first leaves the sky, tracking the sky colour down from the top (nan if
    the column starts outside the photo or not in sky)."""
    out = np.full(img.shape[1], np.nan)
    for x in range(img.shape[1]):
        ys = np.nonzero(ok[:, x])[0]
        if len(ys) < 10 or ys[0] > 0.25 * img.shape[0]: continue
        c = img[:, x]
        ref = c[ys[0]:ys[0] + 3].mean(0)
        if not (ref[2] > ref[0] + 8 and lum(ref) > 110): continue
        run = 0
        for y in range(ys[0], ys[-1]):
            if np.abs(c[y] - ref).max() < tol:
                ref = 0.8 * ref + 0.2 * c[y]; run = 0
            else:
                run += 1
                if run >= need:
                    out[x] = y - need + 1; break
    return out

def row_of(e): return (E_TOP - e) * PXDEG - 0.5

def is_tree(rgb, ref_lum=80.0):
    """Trees and palms: green, or much darker than the shaded mountain."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return ((g > r + 6) & (g >= b - 2)) | (lum(rgb) < 0.6 * ref_lum)

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
    for name, lo, hi, shift, town_low in SOURCES:
        img, ok = reproject(name, shift)
        crest = sky_crest(ndi.gaussian_filter(img, (1, 1, 0)), ok)
        # columns where the photo shows clear sky over mountain near the measured skyline
        near = ~np.isnan(crest) & (crest > sky_row - 1.0 * PXDEG) & (crest < sky_row + 2.2 * PXDEG)
        # ...and where what lies just under that crest is not a tree or palm in front of the range
        for x in np.nonzero(near)[0]:
            y0 = int(crest[x])
            if is_tree(img[y0 + 1:y0 + 6, x]).mean() > 0.4: near[x] = False
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
        low = int(row_of(town_low))
        roof = (lum(img) > 200) & (elev[:, None] < 1.0)
        for x in np.nonzero(cover)[0]:
            y0 = (H - np.argmax(valid[::-1, x])) if valid[:, x].any() else int(row_of(2.4))
            r = np.nonzero(np.convolve(roof[:, x], np.ones(5), "same") >= 5)[0]
            r = r[r >= y0]
            town[y0:min(low, r[0] - 3 if len(r) else low), x] = True
        town &= ok & (np.arange(H)[:, None] > sky_row[None, :] + 0.5 * PXDEG) & (elev[:, None] > town_low)
        body &= (elev[:, None] > town_low)
        valid |= town
        body_all |= body & (side_w(lo, hi) > 0.5)[None, :]
        # match the source's colours to the reference photo (the first source)
        if body.any():
            m, sd = img[body].mean(0), img[body].std(0) + 1e-3
            if ref is None: ref = (m, sd)
            img = (img - m) / sd * ref[1] + ref[0]
        side = side_w(lo, hi)
        wgt = valid * side[None, :]
        rgb += img * wgt[..., None]; weight += wgt
        kept.append((img, ok, side, town_low))
        cw = near * (side > 0.999)   # the crest only from inside the photo's own range
        crest_sum += np.nan_to_num(crest) * cw; crest_w += cw
        cover = (bearings >= lo) & (bearings <= hi)
        report.append(f"{name}: {lo:+.1f}..{hi:+.1f} deg, shift {shift:+.2f} deg, photo crest used on {100 * near[cover].mean():.0f}% of its columns")

    has = weight > 1e-3
    photo = np.where(has[..., None], rgb / np.maximum(weight, 1e-3)[..., None], 0)

    # Crest: the photographed one where there is one, the measured skyline elsewhere, joined smoothly.
    # Offset from the measured skyline: interpolated across trees and gaps between photographed
    # stretches, then easing back to the skyline over about 3 degrees beyond the last photo.
    acc = crest_w > 0.5
    xs = np.arange(W)
    if acc.any():
        off = np.interp(xs, xs[acc], (crest_sum / np.maximum(crest_w, 1e-6) - sky_row)[acc])
        dist = ndi.distance_transform_edt(~acc)
        inside = (xs >= xs[acc].min()) & (xs <= xs[acc].max())
        off *= np.where(inside, 1.0, np.exp(-dist / (1.5 * PXDEG)))
    else:
        off = np.zeros(W)
    crest_row = ndi.gaussian_filter1d(sky_row + off, 3.0)

    # Where a tree in front hid the ridge, the photo still shows it, below the crest line: keep it
    # too (trees standing above the skyline are cut away with the sky).
    rows = np.arange(H)[:, None]
    last = np.where(has.any(0), H - 1 - np.argmax(has[::-1], 0), -1)
    gap = (rows > crest_row[None, :] + 2) & (rows < last[None, :])
    for img, ok, side, town_low in kept:
        add = gap & ok & (side[None, :] > 0.5) & ~has & (elev[:, None] > town_low)
        photo[add] = img[add]; has |= add; body_all |= add

    # Trees and palms near the camera standing in front of the mountain (green, or much darker than
    # the mountain) are taken out and the mountain is carried across them along each row, so from
    # other viewpoints they do not hang in the sky as misplaced silhouettes.
    if body_all.any():
        L = lum(photo)
        med = np.median(L[body_all])
        tree = body_all & is_tree(photo, med)
        tree = ndi.binary_opening(tree, np.ones((2, 2)))
        tree = ndi.binary_dilation(tree, np.ones((3, 3))) & body_all
        good = body_all & ~tree
        xs_ = np.arange(W)
        for y in np.nonzero(tree.any(1))[0]:
            g = good[y]
            if g.sum() < 2: continue
            gi = xs_[g]
            for c in range(3):
                photo[y, tree[y], c] = np.interp(xs_[tree[y]], gi, photo[y, gi, c])
            # only across gaps up to 3 degrees wide; wider ones are left to the fill
            nearest = np.minimum(np.abs(xs_[tree[y]][:, None] - gi[None, :]).min(1), 9999)
            far = nearest > 1.5 * PXDEG
            idx = xs_[tree[y]][far]
            has[y, idx] = False; body_all[y, idx] = False
        # soften the carried-across rows vertically so they read as hillside, not streaks
        soft = np.stack([ndi.gaussian_filter(photo[..., c], (4, 1.5)) for c in range(3)], -1)
        photo[tree] = soft[tree]
        report.append(f"near trees/palms removed from the mountain: {100 * tree.sum() / max(body_all.sum(), 1):.1f}% of its pixels")

    # Fill for what no photo shows (gaps between photos, and the far west and east): a silhouette
    # along the crest with the photographed mountain's own colours, taken from the nearest
    # photographed columns on either side and blended across the gap, shaded by depth below the
    # crest like the photos, with a fine slope texture (gullies running down the hillside) rather
    # than a blur. Below FOOT it gives way to the colours of the town and trees at the foot.
    depth = np.arange(H)[:, None] - crest_row[None, :]
    bins = np.clip(depth.astype(int), 0, H - 1)
    prof = np.zeros((H, 3)); cnt = np.zeros(H)
    np.add.at(prof, bins[body_all], photo[body_all]); np.add.at(cnt, bins[body_all], 1)
    prof = prof / np.maximum(cnt, 1)[:, None]
    for d in range(1, H):
        if cnt[d] < 50: prof[d] = prof[d - 1]
    prof = ndi.gaussian_filter1d(prof, 4, axis=0)
    shade = prof / np.maximum(prof[2:12].mean(0), 1)          # relative darkening with depth
    # colour just under the crest, from the photographed columns, carried across the gaps and
    # smoothed over several degrees so the fill has no streaks
    top = (body_all & (depth >= 1) & (depth < 1.5 * PXDEG))
    tn = top.sum(0); tc = (photo * top[..., None]).sum(0) / np.maximum(tn, 1)[:, None]
    okc = tn >= 5
    xs_ = np.arange(W)
    if okc.any():
        tc = np.stack([np.interp(xs_, xs_[okc], tc[okc, c]) for c in range(3)], -1)
        tc = np.stack([ndi.gaussian_filter1d(tc[:, c], 4 * PXDEG, mode="nearest") for c in range(3)], -1)
    else:
        tc = np.tile(prof[3], (W, 1))
    # away from the photos the fill stands for further ranges: lighter and bluer with distance,
    # as the far western ranges look in IMG_2204 / IMG_2206
    gapd = ndi.distance_transform_edt(~okc) / PXDEG
    far = (0.25 + 0.35 * smooth(gapd / 12.0))[:, None]
    tc = tc * (1 - far) + np.array([122.0, 138.0, 160.0]) * far
    mountain = tc[None, :, :] * shade[bins]

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
    ground = ground * 0.7 + np.array([70.0, 88.0, 66.0]) * 0.3   # greener, like the tree belt in IMG_2206
    t = smooth((FOOT + 0.6 - elev[:, None]) / 1.2) * smooth((depth - PXDEG) / PXDEG)
    fill = mountain * (1 - t[..., None]) + ground[None, :, :] * t[..., None]
    rng = np.random.default_rng(7)
    def noise(sy, sx, shape=(H, W)):
        n = ndi.gaussian_filter(rng.standard_normal(shape), (sy, sx), mode="wrap")
        return np.clip(n / (n.std() + 1e-9), -2.5, 2.5)
    # Layered ridges: two softer ridge lines below the crest, wandering a little, each a touch
    # darker beneath, so the fill reads as overlapping hills rather than a flat curtain.
    mfac = np.ones((H, W))
    for k, (dd, dark) in enumerate(((0.9, 0.07), (1.8, 0.06))):
        wig = noise(0, 2.5 * PXDEG, (1, W))[0] * 0.35 * PXDEG + noise(0, 0.6 * PXDEG, (1, W))[0] * 0.1 * PXDEG
        line = crest_row + dd * PXDEG + wig
        mfac *= 1 - dark * smooth((np.arange(H)[:, None] - line[None, :]) / 3.0)
    # subtle texture: soft mottling at two scales, much weaker than the photo's own detail
    tex = 0.025 * noise(0.25 * PXDEG, 0.35 * PXDEG) + 0.012 * noise(0.8, 0.8)
    mfac *= 1 + tex * smooth(depth / 2.0)
    # the trees and town at the foot: a darker canopy mottle
    gfac = 0.95 * (1 + 0.04 * noise(0.12 * PXDEG, 0.2 * PXDEG) + 0.03 * noise(0.5 * PXDEG, 2 * PXDEG))
    fill = (mountain * mfac[..., None]) * (1 - t[..., None]) + (ground[None, :, :] * gfac[..., None]) * t[..., None]

    # Photo where seen; its edges against the fill fade over about a degree, so a photo never ends
    # in a hard vertical line, and nothing is smeared across the gap.
    inside = ndi.distance_transform_edt(np.pad(has, 1, constant_values=False))[1:-1, 1:-1]
    wph = smooth(inside / (0.8 * PXDEG))[..., None]
    out = np.where(has[..., None], photo * wph + fill * (1 - wph), fill)

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
