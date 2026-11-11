/**
 * Round the stair-stepped edges between ground-cover classes (25 cm cells) without
 * mixing their colours: each class is blurred on its own and every pixel takes the
 * class that is strongest there.
 *
 * The blur is done here in plain arrays rather than with a canvas `filter: blur()`:
 * three box blurs each way, the approximation of a Gaussian that the SVG/CSS filter
 * spec (and so the browser's own canvas blur) uses. Only the tiles near an edge are
 * blurred, so it runs in a fraction of the time of a full-canvas filter draw and
 * read-back per class, and gives the same edges in every browser (Safari ignores
 * canvas filters and was left with square edges).
 */
export function smoothClassEdges(ctx: CanvasRenderingContext2D, size: number, classes: string[], blurPx: number): void {
  const rgb = classes.map((hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]);
  const image = ctx.getImageData(0, 0, size, size), d = image.data, count = size * size;
  // Which class each pixel is painted in (255: none).
  const owner = new Uint8Array(count).fill(255);
  for (let p = 0, k = 0; p < count; p++, k += 4) {
    for (let c = 0; c < rgb.length; c++) {
      if (d[k] === rgb[c][0] && d[k + 1] === rgb[c][1] && d[k + 2] === rgb[c][2]) { owner[p] = c; break; }
    }
  }
  const passes = boxPasses(blurPx);
  // How far a pixel's blurred value can reach: the passes' widths added up.
  const reach = passes.reduce((sum, [lo, hi]) => sum + Math.max(-lo, hi), 0);
  const best = new Uint8Array(count), strength = new Uint8Array(count);
  // Work tile by tile. A tile whose surroundings, out to the blur's reach, hold one class
  // only (or none) keeps exactly the colour it has, so only tiles near an edge are blurred.
  // Each is blurred over its surroundings and only its own pixels kept, which gives the
  // same values as blurring the whole canvas.
  const TILE = 32, side = TILE + 2 * reach;
  let a = new Uint8Array(side * side), b = new Uint8Array(side * side);
  const sums = new Int32Array(side), present = new Uint8Array(rgb.length + 1);
  for (let ty = 0; ty < size; ty += TILE) for (let tx = 0; tx < size; tx += TILE) {
    const x0 = Math.max(0, tx - reach), y0 = Math.max(0, ty - reach);
    const x1 = Math.min(size, tx + TILE + reach), y1 = Math.min(size, ty + TILE + reach);
    const w = x1 - x0, h = y1 - y0, first = owner[y0 * size + x0];
    present.fill(0);
    let mixed = false;
    for (let y = y0; y < y1; y++) for (let p = y * size + x0, end = p + w; p < end; p++) {
      const o = owner[p];
      if (o !== first) mixed = true;
      present[o === 255 ? rgb.length : o] = 1;
    }
    if (!mixed) continue;
    for (let c = 0; c < rgb.length; c++) {
      if (!present[c]) continue;
      for (let y = 0; y < h; y++) for (let x = 0, p = (y + y0) * size + x0; x < w; x++, p++) a[y * w + x] = owner[p] === c ? 255 : 0;
      // Beyond the canvas counts as empty, as it does for a canvas filter.
      for (const [lo, hi] of passes) { blurRows(a, b, w, h, lo, hi); [a, b] = [b, a]; }
      for (const [lo, hi] of passes) { blurColumns(a, b, w, h, lo, hi, sums); [a, b] = [b, a]; }
      for (let y = ty; y < Math.min(size, ty + TILE); y++) for (let x = tx; x < Math.min(size, tx + TILE); x++) {
        const v = a[(y - y0) * w + (x - x0)], p = y * size + x;
        if (v > strength[p]) { strength[p] = v; best[p] = c; }
      }
    }
  }
  for (let p = 0; p < count; p++) {
    if (!strength[p]) continue;
    const c = rgb[best[p]];
    d[p * 4] = c[0]; d[p * 4 + 1] = c[1]; d[p * 4 + 2] = c[2];
  }
  ctx.putImageData(image, 0, 0);
}

/**
 * The three box windows (offsets from the output pixel) that approximate a Gaussian of
 * this standard deviation, as the SVG feGaussianBlur spec gives them.
 */
export function boxPasses(sigma: number): [number, number][] {
  const d = Math.floor(sigma * 3 * Math.sqrt(2 * Math.PI) / 4 + 0.5);
  if (d <= 1) return [];
  if (d % 2) { const r = (d - 1) / 2; return [[-r, r], [-r, r], [-r, r]]; }
  const r = d / 2;
  return [[-r, r - 1], [-r + 1, r], [-r, r]];
}

/**
 * One box blur along each row of a w by h block: each output is the mean of the inputs
 * from lo to hi pixels away, with anything off the end of the row counting as zero.
 */
function blurRows(src: Uint8Array, dst: Uint8Array, w: number, h: number, lo: number, hi: number): void {
  const n = hi - lo + 1;
  for (let row = 0; row < h * w; row += w) {
    let sum = 0;
    for (let k = Math.max(0, lo); k <= Math.min(w - 1, hi); k++) sum += src[row + k];
    for (let i = 0; i < w; i++) {
      dst[row + i] = (sum / n + 0.5) | 0;
      const leaving = i + lo, entering = i + 1 + hi;
      if (leaving >= 0 && leaving < w) sum -= src[row + leaving];
      if (entering >= 0 && entering < w) sum += src[row + entering];
    }
  }
}

/** The same down the columns, a row at a time so memory is read in order. */
function blurColumns(src: Uint8Array, dst: Uint8Array, w: number, h: number, lo: number, hi: number, sums: Int32Array): void {
  const n = hi - lo + 1;
  sums.fill(0, 0, w);
  for (let k = Math.max(0, lo); k <= Math.min(h - 1, hi); k++) for (let x = 0, at = k * w; x < w; x++) sums[x] += src[at + x];
  for (let y = 0; y < h; y++) {
    const out = y * w;
    for (let x = 0; x < w; x++) dst[out + x] = (sums[x] / n + 0.5) | 0;
    const leaving = y + lo, entering = y + 1 + hi;
    if (leaving >= 0 && leaving < h) for (let x = 0, at = leaving * w; x < w; x++) sums[x] -= src[at + x];
    if (entering >= 0 && entering < h) for (let x = 0, at = entering * w; x < w; x++) sums[x] += src[at + x];
  }
}
