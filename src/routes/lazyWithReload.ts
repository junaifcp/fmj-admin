// A lazy route page that survives a stale app. After a deploy (or many dev
// edits) an open tab can ask for a page file that no longer exists, and the
// dynamic import fails with "Failed to fetch dynamically imported module".
// Reload the app once to get the current files. The guard is time-based: at
// most one automatic reload per minute per tab, so a page that is really broken
// shows the normal error screen instead of reloading in a loop.
import { lazy, type ComponentType } from "react";

const KEY = "fmj-admin:stale-chunk-reload-at";
const MIN_GAP_MS = 60_000;

const isStaleChunkError = (e: unknown) =>
  e instanceof Error &&
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    e.message
  );

/** True (and records the time) when no automatic reload happened in the last minute. */
function claimReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last < MIN_GAP_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
    return true;
  } catch {
    // No sessionStorage: never reload automatically (no way to stop a loop).
    return false;
  }
}

export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (e) {
      if (isStaleChunkError(e) && claimReload()) {
        window.location.reload();
        // Keep Suspense showing its fallback while the page reloads.
        return new Promise<{ default: T }>(() => {});
      }
      throw e;
    }
  });
}
