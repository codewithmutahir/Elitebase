"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCompanySession } from "@/lib/employees/session";
import { isValidLatLng } from "@/lib/worksites/geo";

function revalidateLocations() {
  revalidatePath("/settings");
  revalidatePath("/settings/locations");
}

export async function updateRemotePunchSettings(formData: FormData) {
  const { company } = await requireCompanySession();
  const allowRemotePunch = formData.get("allowRemotePunch") === "on";
  const requireGeofence = formData.get("requireGeofence") === "on";

  const admin = createClient();
  const { error } = await admin
    .from("companies")
    .update({
      allow_remote_punch: allowRemotePunch,
      require_geofence: requireGeofence,
    })
    .eq("id", company.id);

  if (error) {
    console.error("updateRemotePunchSettings:", error.message);
    return { error: "Could not save remote punch settings." };
  }

  revalidateLocations();
  return { ok: true as const };
}

export async function createWorksite(formData: FormData) {
  const { company } = await requireCompanySession();
  const name = String(formData.get("name") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const radius = Number(formData.get("radiusMeters") ?? 150);

  if (!name) return { error: "Location name is required." };
  if (!isValidLatLng(lat, lng)) {
    return { error: "Enter a valid latitude and longitude." };
  }
  if (!Number.isFinite(radius) || radius < 30 || radius > 5000) {
    return { error: "Radius must be between 30 and 5000 meters." };
  }

  const admin = createClient();
  const { error } = await admin.from("worksites").insert({
    company_id: company.id,
    name,
    lat,
    lng,
    radius_meters: Math.round(radius),
    is_active: true,
  });

  if (error) {
    console.error("createWorksite:", error.message);
    return { error: "Could not create worksite." };
  }

  revalidateLocations();
  return { ok: true as const };
}

export async function updateWorksite(
  worksiteId: string,
  formData: FormData
) {
  const { company } = await requireCompanySession();
  const name = String(formData.get("name") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const radius = Number(formData.get("radiusMeters") ?? 150);
  const isActive = formData.get("isActive") === "on";

  if (!name) return { error: "Location name is required." };
  if (!isValidLatLng(lat, lng)) {
    return { error: "Enter a valid latitude and longitude." };
  }
  if (!Number.isFinite(radius) || radius < 30 || radius > 5000) {
    return { error: "Radius must be between 30 and 5000 meters." };
  }

  const admin = createClient();
  const { error } = await admin
    .from("worksites")
    .update({
      name,
      lat,
      lng,
      radius_meters: Math.round(radius),
      is_active: isActive,
    })
    .eq("id", worksiteId)
    .eq("company_id", company.id);

  if (error) {
    console.error("updateWorksite:", error.message);
    return { error: "Could not update worksite." };
  }

  revalidateLocations();
  return { ok: true as const };
}

export async function deleteWorksite(worksiteId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();
  const { error } = await admin
    .from("worksites")
    .delete()
    .eq("id", worksiteId)
    .eq("company_id", company.id);

  if (error) {
    console.error("deleteWorksite:", error.message);
    return { error: "Could not delete worksite." };
  }

  revalidateLocations();
  return { ok: true as const };
}
