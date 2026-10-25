# 3D browser timeout investigation

Runtime baseline: `5c1e56910a2a0e067215df383ee871f2859fd94a`.
No scene geometry, collision, lighting/shadow or quality setting was changed.

The test environment has no `/dev/dri` device; the existing browser scripts
explicitly use ANGLE/SwiftShader. This is a software-renderer observation, not a
benchmark of a physical iPhone or a diagnosis of its frame rate.

## Observed results

- A serial instrumented Overview run loaded its document in 0.91 s, reached its
  first distance state in 12.15 s, then spent 32.33 s waiting for a real North
  button click and 31.94 / 51.93 s in screenshot/compositor operations. These
  operations succeeded; selectors existed and the camera state assertions passed.
  See [action timings](browser-action-timings.json). The initial diagnostic was
  bounded to 180 s and stopped later in the sequence; that cutoff is not an
  application assertion failure.
- A full serial `test_overview_browser.cjs` run subsequently PASSed every existing
  assertion: zoom, rotation, north reset, focus/overlay toggles, walk visibility
  and the mobile toolbar. It ran from 11:12:05 to 11:18:59 UTC, including browser
  cleanup. No assertion, geometry or render-quality check was removed.
- Existing `shoot_views.cjs` produced four photo-pin context frames before its
  default 30 s screenshot timeout fired for IMG_2253, after fonts had loaded.
  This reproduces a compositor/capture budget failure; it is not evidence of a
  source-position match. IMG_2202's raw pin/third-person capture is not comparable
  because its camera context falls in a planter.
- Five first-person model-context captures then completed serially at 960×720
  with explicit scene-ready checks and a 120 s capture budget. Their total
  per-view times were 14–24 s with zero page errors. See [capture log](capture-log.json).
  `ao=0` matches the existing automation default; shadows/scene geometry remained.
- A separate layout diagnostic completed its computational route/material/collision
  assertions, opened the coastal gate and reached open-gate screenshot capture.
  Its imposed 180 s total diagnostic limit interrupted that capture; no full
  layout-suite pass is claimed from this bounded run. The earlier execution-context
  loss was not reproduced in this run. A subsequent full-duration layout run PASSed all 20 routes in both directions (438 traversal segments), closed/open gate collision, building material groups, surface/visibility assertions and all capture stages with zero page errors. No assertions or runtime quality settings were removed.

## Interpretation and release prerequisite

The timings substantiate slow software-renderer frame/compositor work and test
capture budgets. They do not prove all earlier navigation failures have one cause.
Cold dependency loading and execution-context navigation still need separate
reproduction rather than being relabelled as geometry failure or visual approval.

Issue #143 retains the unresolved full photo-map regression and capture reliability work and requests
serial, staged diagnostics with useful timeout artifacts. Do not quietly reduce
scene quality or delete route/surface/mobile assertions to make them green. A
larger budget alone does not resolve performance. Future geometry task #146
explicitly depends on that prerequisite. This release is source-inventory/UI work.
