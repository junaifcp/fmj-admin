// src/api/download.ts
// Admin CSV exports (candidates, recruiters, employers). The server streams the file,
// so a big export can take a while: no 15–20 s client timeout here.
import type { AxiosInstance } from "axios";

const EXPORT_TIMEOUT_MS = 10 * 60 * 1000;

export type DownloadResult = { filename: string; rows: number | null };

function filenameFrom(header: unknown, fallback: string): string {
  if (typeof header !== "string") return fallback;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) return decodeURIComponent(star[1]);
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1] : fallback;
}

/** The server's JSON message (e.g. "N rows match…") from an error sent as a blob. */
async function messageFromBlob(err: unknown): Promise<string | null> {
  const data = (err as any)?.original?.response?.data;
  if (!(data instanceof Blob)) return null;
  try {
    const body = JSON.parse(await data.text());
    return typeof body?.message === "string" && body.message.trim() ? body.message : null;
  } catch {
    return null;
  }
}

export async function downloadCsv(
  client: AxiosInstance,
  url: string,
  fallbackName: string,
  opts?: { signal?: AbortSignal }
): Promise<DownloadResult> {
  try {
    const res = await client.get(url, {
      responseType: "blob",
      timeout: EXPORT_TIMEOUT_MS,
      signal: opts?.signal,
    });
    const filename = filenameFrom(res.headers?.["content-disposition"], fallbackName);
    const rows = Number(res.headers?.["x-export-rows"]);
    const href = window.URL.createObjectURL(res.data as Blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Revoking at once can cancel the download in some browsers.
    window.setTimeout(() => window.URL.revokeObjectURL(href), 60_000);
    return { filename, rows: Number.isFinite(rows) ? rows : null };
  } catch (err) {
    const message = await messageFromBlob(err);
    if (message) throw new Error(message);
    throw err;
  }
}
