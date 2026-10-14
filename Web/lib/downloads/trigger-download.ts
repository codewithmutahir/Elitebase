/** Trigger a browser file download from an in-memory Blob. */
export function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function filenameFromContentDisposition(
  header: string | null,
  fallback: string
): string {
  if (!header) return fallback;
  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      /* fall through */
    }
  }
  const plainMatch = /filename="([^"]+)"/i.exec(header);
  if (plainMatch?.[1]) return plainMatch[1];
  const bareMatch = /filename=([^;]+)/i.exec(header);
  if (bareMatch?.[1]) return bareMatch[1].trim().replace(/^"|"$/g, "");
  return fallback;
}
