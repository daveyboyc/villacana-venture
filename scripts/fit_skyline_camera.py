#!/usr/bin/env python3
"""Fits a camera for one of Dave's photos that shows the mountain skyline but has no solved pose.

The position comes from the photo's GPS pin in public/photos-ref/manifest.json; the focal length
from its lens (26 mm equivalent = 1202 px, 52 mm = 2403 px on a 1200x1600 copy). Yaw, pitch and
roll are fitted so the photo's sky/mountain crest, projected onto the backdrop cylinder, lies on
the measured skyline in scripts/build_mountain_texture.py (a truncated loss, so trees and roofs
above the skyline do not pull the fit). The result goes into FITTED in build_mountain_texture.py.

Usage: python3 scripts/fit_skyline_camera.py IMG_2483 2403 54 [eye height m, default 1.6]
       (photo, focal length px, starting yaw = the photo's compass heading)
"""
import sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np
from PIL import Image
from scipy import ndimage as ndi, optimize
import build_mountain_texture as M
YAWR, PITR = 12, 12

ROOT = M.ROOT
man = {e['file']: e for e in json.load(open(ROOT / 'public/photos-ref/manifest.json'))}
FB, FE = np.array(M.FAR).T
NB, NE = np.array(M.NEAR).T
def target(b):
    e = np.maximum(np.interp(b, FB, FE), np.interp(b, NB, NE, left=-9, right=-9))
    return e

def crest_pixels(img, step=4):
    """Per column (every `step` px): first row from the top where the pixel leaves the sky."""
    a = img.astype(np.float32)
    a = ndi.gaussian_filter(a, (1.5, 1.5, 0))
    h, w, _ = a.shape
    us, vs = [], []
    for x in range(0, w, step):
        col = a[:, x]
        top = col[: max(20, h // 30)]
        L = col @ np.array([.3, .59, .11])
        if not ((top[:, 2] > top[:, 0] + 10).mean() > 0.7): continue
        ref = top.mean(0); run = 0
        for y in range(h // 30, int(h * 0.8)):
            d = np.abs(col[y] - ref).max()
            sky_like = (d < 22) or (col[y, 2] > col[y, 0] + 25 and L[y] > 150)
            if sky_like:
                ref = 0.85 * ref + 0.15 * col[y]; run = 0
            else:
                run += 1
                if run >= 4:
                    us.append(x); vs.append(y - 3); break
    return np.array(us, float), np.array(vs, float)

def rays_to_cyl(p, w, h, u, v):
    c = np.stack([(u - w / 2) / p['f'], -(v - h / 2) / p['f'], -np.ones_like(u)], -1)
    d = c @ M.rotation(p).T
    px, pz = p['x'] - M.CX, p['z'] - M.CZ
    dx, dz = d[:, 0], d[:, 2]
    A = dx * dx + dz * dz; B = 2 * (px * dx + pz * dz); C = px * px + pz * pz - M.R ** 2
    t = (-B + np.sqrt(B * B - 4 * A * C)) / (2 * A)
    X, Y, Z = px + t * dx, p['y'] + t * d[:, 1], pz + t * dz
    bear = np.degrees(np.arctan2(X, -Z))
    elev = np.degrees(np.arctan(Y / M.R))
    return bear, elev

def fit(name, f0, yaw0, y=1.6, lo=-200, hi=200, trunc=0.8, pos=None):
    img = np.asarray(Image.open(ROOT / f'public/photos-ref/{name}.jpg').convert('RGB'))
    h, w, _ = img.shape
    e = man[name + '.jpg']
    x0, z0 = (pos if pos else (e['x'], e['z']))
    u, v = crest_pixels(img)
    def pose(q):
        return {'x': x0, 'y': y, 'z': z0, 'yaw': q[0], 'pitch': q[1], 'roll': q[2], 'f': f0}
    def loss(q):
        if abs(q[2]) > 3: return 9
        b, el = rays_to_cyl(pose(q), w, h, u, v)
        m = (b > lo) & (b < hi)
        if m.sum() < 20: return 9
        r = el[m] - target(b[m])
        return np.mean(np.minimum(np.abs(r), trunc)) + 0.3 * (1 - m.mean())
    best = None
    for yaw in np.arange(yaw0 - YAWR, yaw0 + YAWR + 0.1, 1.0):
        for pitch in np.arange(-PITR, PITR + 0.1, 1.0):
            l = loss([yaw, pitch, 0])
            if best is None or l < best[0]: best = (l, [yaw, pitch, 0])
    q0 = np.array(best[1], float)
    simplex = [q0] + [q0 + d for d in (np.array([0.7, 0, 0]), np.array([0, 0.7, 0]), np.array([0, 0, 1.5]))]
    res = optimize.minimize(loss, q0, method='Nelder-Mead', options={'initial_simplex': np.array(simplex), 'xatol': 1e-3, 'fatol': 1e-5, 'maxiter': 4000})
    q = res.x
    p = pose(q)
    b, el = rays_to_cyl(p, w, h, u, v)
    m = (b > lo) & (b < hi)
    r = el[m] - target(b[m])
    good = np.abs(r) < 0.5
    print(f"{name}: yaw {q[0]:.2f} pitch {q[1]:.2f} roll {q[2]:.2f} f {p['f']:.0f} loss {res.fun:.3f} "
          f"bearings {b.min():.1f}..{b.max():.1f}, crest within 0.5deg on {100*good.mean():.0f}% ({good.sum()} cols), median|r| {np.median(np.abs(r)):.2f}")
    return p, (b, el, r)

if __name__ == '__main__':
    name, f0, yaw0 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    y = float(sys.argv[4]) if len(sys.argv) > 4 else 1.6
    p, _ = fit(name, f0, yaw0, y=y)
    print(json.dumps({k: round(v, 3) for k, v in p.items()}))
