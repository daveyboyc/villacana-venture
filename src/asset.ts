/// <reference types="vite/client" />
/** Resolves a site-root path like "/map/ground.jpg" against the folder the game is served from. */
export function asset(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}
