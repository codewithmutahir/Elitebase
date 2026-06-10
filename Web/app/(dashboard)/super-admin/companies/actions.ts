"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdminSession } from "@/lib/super-admin/session";

export async function suspendCompany(companyId: string) {
  await requireSuperAdminSession();

  const id = companyId.trim();
  if (!id) {
    redirect("/super-admin/companies?error=invalid");
  }

  const admin = createClient();
  const { error } = await admin
    .from("companies")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("suspendCompany failed:", error.message);
    redirect("/super-admin/companies?error=suspend_failed");
  }

  revalidatePath("/super-admin/companies");
  redirect("/super-admin/companies?suspended=1");
}
