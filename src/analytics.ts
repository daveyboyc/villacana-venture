import posthog from "posthog-js";

const POSTHOG_TOKEN = "phc_1T2g9ubpkjTTpvO1uNBlt0XThrr3fb3wlIi1yLKeTj6";
const POSTHOG_HOST = "https://us.i.posthog.com";
const APP_PROPERTY = "villacana-roam";
const ANALYTICS_MESSAGE_TYPE = "villacana-analytics";

export type AnalyticsProperties = Record<string, string | number | boolean | string[] | null | undefined>;
export type DeviceType = "phone" | "tablet" | "desktop";

let initialized = false;
let bridgeAttached = false;

export function isAnalyticsAllowed(): boolean {
  if (!import.meta.env.PROD) return false;
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (navigator.webdriver) return false;
  const { protocol, hostname, search } = window.location;
  if (protocol !== "https:") return false;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local")
  ) {
    return false;
  }
  const params = new URLSearchParams(search);
  if (params.has("photocam") || params.has("export")) return false;
  return true;
}

export function detectDeviceType(): DeviceType {
  const hasTouch = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
  if (!hasTouch) return "desktop";
  return window.matchMedia("(max-width:900px), (max-height:500px)").matches ? "phone" : "tablet";
}

function hasSameOriginParent(): boolean {
  if (typeof window === "undefined" || window.self === window.top) return false;
  try {
    return window.parent.location.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function initAnalytics(): void {
  if (!isAnalyticsAllowed()) return;

  // Embedded scenes (slice.html inside index.html) forward events to the top window so there is
  // one PostHog instance, one $pageview/$pageleave stream, and one $session_id/$window_id.
  if (hasSameOriginParent()) return;

  if (!bridgeAttached) {
    bridgeAttached = true;
    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: unknown; event?: unknown; properties?: unknown } | null;
      if (data?.type !== ANALYTICS_MESSAGE_TYPE || typeof data.event !== "string") return;
      const props =
        data.properties && typeof data.properties === "object" && !Array.isArray(data.properties)
          ? (data.properties as AnalyticsProperties)
          : undefined;
      trackEvent(data.event, props);
    });
  }

  if (initialized) return;
  initialized = true;

  posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_HOST,
    defaults: "2026-01-30",
    capture_pageview: "history_change",
    capture_pageleave: true,
    autocapture: true,
    capture_performance: {
      web_vitals: true,
    },
    // Disable canvas recording to avoid WebGL readback stalls and heavy replay payloads.
    session_recording: {
      captureCanvas: {
        recordCanvas: false,
      },
    },
    loaded: (ph) => {
      ph.register({ app: APP_PROPERTY });
    },
  });
}

export function trackEvent(event: string, properties?: AnalyticsProperties): void {
  if (!isAnalyticsAllowed()) return;
  if (hasSameOriginParent()) {
    window.parent.postMessage(
      { type: ANALYTICS_MESSAGE_TYPE, event, properties },
      window.location.origin,
    );
    return;
  }
  if (!initialized) return;
  posthog.capture(event, properties);
}
