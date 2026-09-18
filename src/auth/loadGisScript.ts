const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let gisPromise: Promise<void> | null = null;

/**
 * Loads the Google Identity Services script exactly once, sharing one
 * in-flight promise across concurrent callers (jwt-authentication phase 9.1;
 * button wiring is 9.2).
 */
export function loadGisScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadGisScript can only run in the browser"));
  }

  if ((window as any).google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!gisPromise) {
    gisPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
      if (existing) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gisPromise = null;
        reject(new Error("Failed to load Google Identity Services script"));
      };
      document.head.appendChild(script);
    });
  }

  return gisPromise;
}
