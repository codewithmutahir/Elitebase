import { api } from "@/lib/api";
import { getTabletToken } from "@/lib/storage";

/** Face verify/register can wait on Render cold start + model load. */
export const FACE_API_TIMEOUT_MS = 90_000;

/** Fire-and-forget warmup of the Python face service via Next.js. */
export async function warmupFaceService(): Promise<void> {
  try {
    const tabletToken = await getTabletToken();
    if (!tabletToken) return;

    await api.post(
      "/api/kiosk/face-warmup",
      {},
      {
        headers: { "x-tablet-token": tabletToken },
        timeout: 30_000,
      }
    );
  } catch {
    // Warmup must never block or surface errors on the kiosk.
  }
}
