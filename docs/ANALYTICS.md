# Analytics (`posthog-js`)

Villacana Roam uses [`posthog-js`](https://posthog.com/docs/libraries/js) to measure visits, navigation between Map & Inspect/Walk views, photo reference usage, and 3D exploration summaries.

## Setup and filtering

- **API host**: `https://us.i.posthog.com`
- **Shared project**: The PostHog project is shared with `capacitymarket.co.uk`, so `posthog.register({ app: "villacana-roam" })` is called inside `loaded` before the initial `$pageview` fires. Filter by `app = "villacana-roam"` in PostHog to isolate Villacana Roam traffic.
- **Production-only gate** (`src/analytics.ts`): PostHog initializes only when:
  - `import.meta.env.PROD` is `true`
  - `navigator.webdriver` is falsy (Playwright and browser tests are excluded)
  - `window.location.protocol === "https:"` and the hostname is not `localhost`, `127.0.0.1`, `::1`, `0.0.0.0`, or `*.local`
  - Neither `?photocam=` nor `?export=` is present
- **Single-instance iframe bridge**: When `slice.html` is embedded inside `index.html` (`#resort-scene`), it forwards custom events to the parent window over `postMessage` (`villacana-analytics`) rather than calling `posthog.init()` a second time. This keeps one `$pageview`/`$pageleave` stream, one Web Vitals stream, and one `$session_id`/`$window_id` per visit. Standalone `slice.html` and `silvia-ramp.html` visits initialize PostHog directly.
- **WebGL + Session Replay**: `session_recording.captureCanvas.recordCanvas` is explicitly set to `false` so rrweb never attempts WebGL canvas frame capture or pixel readbacks from the Three.js `<canvas>`.

## Automatic events

- `$pageview` (`capture_pageview: "history_change"`)
- `$pageleave` (`capture_pageleave: true`)
- `$autocapture` (`autocapture: true`)
- `$web_vitals` (`capture_performance: { web_vitals: true }`)

## Custom events

| Event | Where it fires | Properties |
| --- | --- | --- |
| `session_started` | `src/app.ts` on load; standalone `src/slice.ts` / `src/silvia-ramp-study.ts` | `entry`, `initial_view`, `device_type` (`phone` \| `tablet` \| `desktop`), `viewport_width`, `viewport_height`, `initial_area`, `initial_photo` |
| `scene_loaded` | `src/slice.ts` when `boot()` reaches the render loop | `view` (`overview` \| `walk`), `device_type`, `render_tier` (`high` \| `medium` \| `layout`), `details_enabled`, `ambient_occlusion`, `pixel_ratio`, `static_batching`, `pools`, `initial_area`, `embedded`, `load_ms` |
| `view_switched` | `src/app.ts` `setView()` (and standalone `slice.ts` `toggleOverview()`) | `from_view`, `to_view` (`map` \| `overview` \| `walk`), `area`, `photo` |
| `area_jumped` | `src/slice.ts` `#inspection-area` / `#overview-fit` / `.camera-fit`; `src/app.ts` `#visit-silvia` | `area_id`, `area_name`, `source` (`dropdown` \| `fit_button` \| `silvia_shortcut`) |
| `photo_opened` | `src/photo-library.ts` `select()` (including `?photo=` on load) | `photo_id`, `areas`, `has_camera`, `is_private`, `source` (`url` \| `search_list` \| `map_pin` \| `3d_label` \| `history`) |
| `photo_full_viewed` | `src/photo-library.ts` `showDetail()` full-screen photo modal | `photo_id`, `areas` |
| `stroll_summary` | `src/slice.ts` sampled at 500 ms (no per-frame events), flushed every 60 s and on `visibilitychange` (`hidden`) / `pagehide` when active | `trigger` (`periodic` \| `hidden` \| `pagehide`), `active_seconds`, `walk_seconds`, `inspect_seconds`, `walk_distance_m`, `inspect_pan_m`, `delta_seconds`, `delta_walk_distance_m`, `delta_inspect_pan_m`, `areas_visited`, `areas_count`, `current_area`, `current_view` |
