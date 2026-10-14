"use server";

import { revalidatePath } from "next/cache";
import {
  invalidateAttendanceMonthsCache,
  invalidatePortalEmployeeMonthCache,
} from "@/lib/cache/invalidate";
import { parsePortalIdempotencyKey } from "@/lib/portal/idempotency";
import {
  checkPortalRateLimit,
  portalRateLimitMessage,
} from "@/lib/portal/rate-limit";
import { submitPortalFaceEnrollment } from "@/lib/portal/enroll-face";
import { requireEmployeeSession } from "@/lib/portal/session";
import { submitPortalClockPunch } from "@/lib/portal/clock";

export async function portalEnrollFace(formData: FormData) {
  const { employee } = await requireEmployeeSession();

  const rate = await checkPortalRateLimit("face-enroll", employee.id);
  if (rate.limited) {
    return { error: portalRateLimitMessage(rate.retryAfterSeconds) };
  }

  const consent = String(formData.get("consent") ?? "") === "true";
  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File && item.size > 0);

  const result = await submitPortalFaceEnrollment({
    employee,
    files,
    consent,
  });

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/portal/clock");
  revalidatePath("/portal");
  return result;
}

export async function portalClockPunch(formData: FormData) {
  const { employee } = await requireEmployeeSession();

  const rate = await checkPortalRateLimit("clock-punch", employee.id);
  if (rate.limited) {
    return { error: portalRateLimitMessage(rate.retryAfterSeconds) };
  }

  const type = String(formData.get("type") ?? "").trim();
  const latRaw = formData.get("lat");
  const lngRaw = formData.get("lng");
  const latParsed =
    latRaw != null && String(latRaw).trim() !== ""
      ? Number(latRaw)
      : Number.NaN;
  const lngParsed =
    lngRaw != null && String(lngRaw).trim() !== ""
      ? Number(lngRaw)
      : Number.NaN;
  const lat = Number.isFinite(latParsed) ? latParsed : null;
  const lng = Number.isFinite(lngParsed) ? lngParsed : null;
  const accuracyRaw = formData.get("accuracy");
  const accuracyM =
    accuracyRaw != null && String(accuracyRaw).trim() !== ""
      ? Number(accuracyRaw)
      : null;
  const file = formData.get("file");
  const idempotencyKey = parsePortalIdempotencyKey(
    formData.get("idempotencyKey")
  );

  if (!idempotencyKey) {
    return {
      error: "Missing punch key. Refresh the page and try again.",
    };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Camera photo is required." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { error: "Photo is too large. Try again." };
  }

  const result = await submitPortalClockPunch({
    employee,
    type,
    file,
    lat,
    lng,
    accuracyM: Number.isFinite(accuracyM) ? accuracyM : null,
    idempotencyKey,
  });

  if ("error" in result) {
    return { error: result.error };
  }

  invalidatePortalEmployeeMonthCache(employee.company_id, employee.id);
  invalidateAttendanceMonthsCache(employee.company_id);
  revalidatePath("/portal/clock");
  revalidatePath("/portal");
  revalidatePath("/portal/attendance");
  revalidatePath("/portal/pay");
  return result;
}
