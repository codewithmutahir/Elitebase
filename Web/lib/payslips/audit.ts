import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function writePayrollAudit(input: {
  companyId: string;
  actorUid: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  employeeId?: string | null;
  before?: unknown;
  after?: unknown;
  admin?: SupabaseClient;
}): Promise<void> {
  const admin = input.admin ?? createClient();
  const { error } = await admin.from("payroll_audit_events").insert({
    company_id: input.companyId,
    actor_uid: input.actorUid,
    action: input.action.slice(0, 80),
    entity_type: input.entityType.slice(0, 40),
    entity_id: input.entityId ?? null,
    employee_id: input.employeeId ?? null,
    before_json: input.before ?? null,
    after_json: input.after ?? null,
  });
  if (error) {
    console.error("writePayrollAudit:", error.message);
  }
}
