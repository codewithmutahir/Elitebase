"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateKioskSetupCode } from "@/lib/kiosk/setup-code";
import { requireCompanySession } from "@/lib/employees/session";

export type GenerateSetupCodeState = {
  error?: string;
  setupCode?: string;
  locationName?: string;
};

const MAX_CODE_ATTEMPTS = 8;

export async function generateSetupCode(
  _prev: GenerateSetupCodeState | null,
  formData: FormData
): Promise<GenerateSetupCodeState> {
  const { company } = await requireCompanySession();
  const locationName =
    String(formData.get("locationName") ?? "").trim() || "Main Location";

  const admin = createClient();

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const setupCode = generateKioskSetupCode();
    const { error } = await admin.from("kiosk_tablets").insert({
      company_id: company.id,
      location_name: locationName,
      setup_code: setupCode,
      is_active: true,
    });

    if (!error) {
      revalidatePath("/kiosk-setup");
      return { setupCode, locationName };
    }

    if (error.code !== "23505") {
      console.error("generateSetupCode failed:", error.message);
      return { error: "Could not generate setup code. Please try again." };
    }
  }

  return { error: "Could not generate a unique code. Please try again." };
}

export async function deactivateTablet(tabletId: string) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  const { error } = await admin
    .from("kiosk_tablets")
    .update({ is_active: false })
    .eq("id", tabletId)
    .eq("company_id", company.id);

  if (error) {
    console.error("deactivateTablet failed:", error.message);
    return { error: "Could not deactivate tablet." };
  }

  revalidatePath("/kiosk-setup");
  return { ok: true };
}
