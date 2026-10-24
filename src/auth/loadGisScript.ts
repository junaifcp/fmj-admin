const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GIS_READY_TIMEOUT_MS = 10_000;
const GIS_POLL_MS = 50;

let gisPromise: Promise<void> | null = null;

function isGisReady(): boolean {
  return !!(window as any).google?.accounts?.id;
}

/** Poll until GIS exposes google.accounts.id, or reject after timeout. */
function waitForGisReady(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isGisReady()) {
      resolve();
      return;
    }

    const started = Date.now();
    const timer = window.setInterval(() => {
      if (isGisReady()) {
        window.clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer);
        reject(new Error("Google Identity Services script timed out"));
      }
    }, GIS_POLL_MS);
  });
}

/**
 * Loads the Google Identity Services script exactly once, sharing one
 * in-flight promise across concurrent callers (jwt-authentication phase 9+).
 *
 * Resolves only when window.google.accounts.id is defined — never when a
 * script tag merely exists (React Strict Mode remount race).
 */
export function loadGisScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadGisScript can only run in the browser"));
  }

  if (isGisReady()) {
    return Promise.resolve();
  }

  if (!gisPromise) {
    gisPromise = (async () => {
      try {
        const script = document.querySelector(
          `script[src="${GIS_SCRIPT_SRC}"]`,
        ) as HTMLScriptElement | null;

        if (!script) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script");
            s.src = GIS_SCRIPT_SRC;
            s.async = true;
            s.defer = true;
            s.onload = () => resolve();
            s.onerror = () =>
              reject(new Error("Failed to load Google Identity Services script"));
            document.head.appendChild(s);
          });
        }

        await waitForGisReady(GIS_READY_TIMEOUT_MS);
      } catch (err) {
        gisPromise = null;
        throw err;
      }
    })();
  }

  return gisPromise;
}
