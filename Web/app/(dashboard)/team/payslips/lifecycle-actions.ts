"use server";

import { revalidatePath } from "next/cache";
import {
  invalidatePortalCompanyPayslipsCache,
  invalidatePortalEmployeePayslipsCache,
} from "@/lib/cache/invalidate";
import { requireCompanySession } from "@/lib/employees/session";
import { writePayrollAudit } from "@/lib/payslips/audit";
import { calculatePayslip } from "@/lib/payslips/calculate";
import { loadPayslipCalcInput } from "@/lib/payslips/load-calc-inputs";
import { fromCents } from "@/lib/money/cents";
import { createClient } from "@/lib/supabase/server";

function revalidatePayslipPaths(companyId: string, employeeId?: string) {
  if (employeeId) {
    invalidatePortalEmployeePayslipsCache(companyId, employeeId);
  } else {
    invalidatePortalCompanyPayslipsCache(companyId);
  }
  revalidatePath("/team/payslips");
  revalidatePath("/portal/payslips");
}

function periodBounds(year: number, month: number) {
  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const last = new Date(year, month, 0).getDate();
  const periodEnd = `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
  return { periodStart, periodEnd };
}

/** Generate (or regenerate draft) payslip for one employee/month. */
export async function generatePayslipDraft(input: {
  employeeId: string;
  year: number;
  month: number;
  confirmNetClamp?: boolean;
}) {
  const { company, userId, user } = await requireCompanySession();
  const admin = createClient();
  const year = Math.trunc(input.year);
  const month = Math.trunc(input.month);
  if (month < 1 || month > 12 || year < 2000 || year > 2100) {
    return { error: "Invalid month or year." };
  }

  const loaded = await loadPayslipCalcInput({
    companyId: company.id,
    employeeId: input.employeeId,
    year,
    month,
    admin,
  });
  if (!loaded.ok) return { error: loaded.error };

  const calculated = calculatePayslip(loaded.input);
  if (calculated.netClamped && !input.confirmNetClamp) {
    return {
      error:
        "Net salary would be zero/negative. Confirm to save draft anyway.",
      requiresNetClampConfirm: true as const,
      warnings: calculated.warnings,
    };
  }

  const { periodStart, periodEnd } = periodBounds(year, month);

  const { data: existing } = await admin
    .from("payslips")
    .select("id, status, lock_version, version")
    .eq("company_id", company.id)
    .eq("employee_id", input.employeeId)
    .eq("year", year)
    .eq("month", month)
    .is("replaced_by_id", null)
    .maybeSingle();

  if (existing && existing.status === "published") {
    return {
      error:
        "A published payslip already exists for this period. Create a revision instead.",
    };
  }

  const payload = {
    company_id: company.id,
    employee_id: input.employeeId,
    year,
    month,
    period_start: periodStart,
    period_end: periodEnd,
    period_label: calculated.payPeriodLabel,
    gross_amount: fromCents(calculated.grossCents),
    net_amount: fromCents(calculated.netSalaryCents),
    currency: loaded.currency,
    status: "draft" as const,
    calculated_snapshot: calculated,
    snapshot: calculated,
    overrides: {},
    published_at: null,
    updated_at: new Date().toISOString(),
  };

  let payslipId: string;

  if (existing) {
    const { data: updated, error } = await admin
      .from("payslips")
      .update({
        ...payload,
        reviewed_by_uid: null,
        reviewed_by_name: null,
        reviewed_at: null,
        approved_by_uid: null,
        approved_by_name: null,
        approved_at: null,
        lock_version: Number(existing.lock_version ?? 1) + 1,
      })
      .eq("id", existing.id)
      .eq("lock_version", existing.lock_version)
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      console.error("generatePayslipDraft update:", error?.message);
      return {
        error:
          "Could not update draft (concurrent edit). Refresh and try again.",
      };
    }
    payslipId = updated.id;
  } else {
    const { data: inserted, error } = await admin
      .from("payslips")
      .insert({
        ...payload,
        version: 1,
        lock_version: 1,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("generatePayslipDraft insert:", error?.message);
      return { error: "Could not create payslip draft." };
    }
    payslipId = inserted.id;
  }

  await writePayrollAudit({
    companyId: company.id,
    actorUid: userId,
    action: "payslip.generate",
    entityType: "payslip",
    entityId: payslipId,
    employeeId: input.employeeId,
    after: { year, month, net: calculated.netSalaryCents, by: user.name },
    admin,
  });

  revalidatePayslipPaths(company.id, input.employeeId);
  return { ok: true as const, id: payslipId };
}

export async function bulkGeneratePayslipDrafts(input: {
  year: number;
  month: number;
  employeeIds?: string[];
  confirmNetClamp?: boolean;
}) {
  const { company } = await requireCompanySession();
  const admin = createClient();

  let employeeIds = input.employeeIds;
  if (!employeeIds?.length) {
    const { data } = await admin
      .from("employees")
      .select("id")
      .eq("company_id", company.id)
      .eq("status", "active");
    employeeIds = (data ?? []).map((r) => r.id as string);
  }

  const results: { employeeId: string; ok: boolean; error?: string; id?: string }[] =
    [];

  for (const employeeId of employeeIds) {
    const result = await generatePayslipDraft({
      employeeId,
      year: input.year,
      month: input.month,
      confirmNetClamp: input.confirmNetClamp,
    });
    if ("ok" in result && result.ok) {
      results.push({ employeeId, ok: true, id: result.id });
    } else {
      results.push({
        employeeId,
        ok: false,
        error: "error" in result ? result.error : "Failed",
      });
    }
  }

  revalidatePayslipPaths(company.id);
  return {
    ok: true as const,
    results,
    successCount: results.filter((r) => r.ok).length,
    failureCount: results.filter((r) => !r.ok).length,
  };
}

export async function markPayslipReviewed(payslipId: string) {
  const { company, userId, user } = await requireCompanySession();
  const admin = createClient();

  const { data: existing } = await admin
    .from("payslips")
    .select("id, status, employee_id, lock_version")
    .eq("id", payslipId)
    .eq("company_id", company.id)
    .is("replaced_by_id", null)
    .maybeSingle();

  if (!existing) return { error: "Payslip not found." };
  if (existing.status !== "draft") {
    return { error: "Only draft payslips can be marked reviewed." };
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("payslips")
    .update({
      status: "reviewed",
      reviewed_by_uid: userId,
      reviewed_by_name: user.name || user.email || "Reviewer",
      reviewed_at: now,
      lock_version: Number(existing.lock_version ?? 1) + 1,
      updated_at: now,
    })
    .eq("id", payslipId)
    .eq("status", "draft")
    .eq("lock_version", existing.lock_version)
    .select("id");

  if (error || !updated?.length) {
    return { error: "Could not mark reviewed (refresh and retry)." };
  }

  await writePayrollAudit({
    companyId: company.id,
    actorUid: userId,
    action: "payslip.review",
    entityType: "payslip",
    entityId: payslipId,
    employeeId: existing.employee_id,
    after: { reviewedBy: user.name },
    admin,
  });

  revalidatePayslipPaths(company.id, existing.employee_id);
  return { ok: true as const };
}

export async function markPayslipApproved(payslipId: string) {
  const { company, userId, user } = await requireCompanySession();
  const admin = createClient();

  const { data: existing } = await admin
    .from("payslips")
    .select("id, status, employee_id, lock_version, reviewed_by_uid")
    .eq("id", payslipId)
    .eq("company_id", company.id)
    .is("replaced_by_id", null)
    .maybeSingle();

  if (!existing) return { error: "Payslip not found." };
  if (existing.status !== "reviewed") {
    return { error: "Payslip must be reviewed before approval." };
  }
  if (!existing.reviewed_by_uid) {
    return { error: "Select/complete review before approving." };
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("payslips")
    .update({
      status: "approved",
      approved_by_uid: userId,
      approved_by_name: user.name || user.email || "Approver",
      approved_at: now,
      lock_version: Number(existing.lock_version ?? 1) + 1,
      updated_at: now,
    })
    .eq("id", payslipId)
    .eq("status", "reviewed")
    .eq("lock_version", existing.lock_version)
    .select("id");

  if (error || !updated?.length) {
    return { error: "Could not approve (refresh and retry)." };
  }

  await writePayrollAudit({
    companyId: company.id,
    actorUid: userId,
    action: "payslip.approve",
    entityType: "payslip",
    entityId: payslipId,
    employeeId: existing.employee_id,
    after: { approvedBy: user.name },
    admin,
  });

  revalidatePayslipPaths(company.id, existing.employee_id);
  return { ok: true as const };
}

export async function publishPayslip(
  payslipId: string,
  options?: { idempotencyKey?: string }
) {
  const { company, userId, user } = await requireCompanySession();
  const admin = createClient();
  void options?.idempotencyKey;

  const { data: existing } = await admin
    .from("payslips")
    .select(
      "id, status, employee_id, lock_version, snapshot, calculated_snapshot, apply_company_stamp, reviewed_by_name, approved_by_name, year, month"
    )
    .eq("id", payslipId)
    .eq("company_id", company.id)
    .is("replaced_by_id", null)
    .maybeSingle();

  if (!existing) return { error: "Payslip not found." };
  if (existing.status !== "approved") {
    return { error: "Only approved payslips can be published." };
  }

  const now = new Date().toISOString();
  const immutableSnapshot = {
    ...(existing.snapshot as object),
    _meta: {
      publishedAt: now,
      publishedBy: user.name,
      applyCompanyStamp: existing.apply_company_stamp,
      reviewedByName: existing.reviewed_by_name,
      approvedByName: existing.approved_by_name,
      logoUrl: company.logo_url,
      companyName: company.name,
      policy: {
        latesPerDayDeduction: company.lates_per_day_deduction,
      },
    },
  };

  const { data: updated, error } = await admin
    .from("payslips")
    .update({
      status: "published",
      published_at: now,
      published_by_uid: userId,
      snapshot: immutableSnapshot,
      lock_version: Number(existing.lock_version ?? 1) + 1,
      updated_at: now,
    })
    .eq("id", payslipId)
    .eq("status", "approved")
    .eq("lock_version", existing.lock_version)
    .select("id");

  if (error || !updated?.length) {
    return { error: "Could not publish (refresh and retry)." };
  }

  await writePayrollAudit({
    companyId: company.id,
    actorUid: userId,
    action: "payslip.publish",
    entityType: "payslip",
    entityId: payslipId,
    employeeId: existing.employee_id,
    after: { year: existing.year, month: existing.month },
    admin,
  });

  revalidatePayslipPaths(company.id, existing.employee_id);
  return { ok: true as const };
}

/**
 * Edit a published payslip by creating a tracked revision.
 * Old published row stays (audit); employee keeps seeing it until the new
 * revision is published. New tip is a draft that must go through review again.
 */
export async function revisePublishedPayslip(input: {
  payslipId: string;
  revisionNote: string;
  confirmNetClamp?: boolean;
}) {
  const { company, userId, user } = await requireCompanySession();
  const admin = createClient();

  const note = input.revisionNote.trim();
  if (note.length < 3 || note.length > 500) {
    return { error: "Revision note must be 3–500 characters." };
  }

  const { data: existing } = await admin
    .from("payslips")
    .select(
      "id, status, employee_id, year, month, version, lock_version, period_start, period_end, period_label, currency, apply_company_stamp, snapshot, net_amount, gross_amount"
    )
    .eq("id", input.payslipId)
    .eq("company_id", company.id)
    .is("replaced_by_id", null)
    .maybeSingle();

  if (!existing) return { error: "Payslip not found." };
  if (existing.status !== "published") {
    return { error: "Only published payslips can be revised. Edit the open draft instead." };
  }

  const year = Number(existing.year);
  const month = Number(existing.month);
  const nextVersion = Number(existing.version ?? 1) + 1;

  const loaded = await loadPayslipCalcInput({
    companyId: company.id,
    employeeId: existing.employee_id,
    year,
    month,
    admin,
  });
  if (!loaded.ok) return { error: loaded.error };

  const calculated = calculatePayslip(loaded.input);
  if (calculated.netClamped && !input.confirmNetClamp) {
    return {
      error:
        "Revised net would be zero/negative. Confirm to create the draft anyway.",
      requiresNetClampConfirm: true as const,
      warnings: calculated.warnings,
    };
  }

  const { periodStart, periodEnd } = periodBounds(year, month);
  const now = new Date().toISOString();

  // Free the unique (employee, year, month) tip slot: mark published as
  // temporarily self-replaced, then insert the draft tip, then point to it.
  const { data: locked, error: lockError } = await admin
    .from("payslips")
    .update({
      replaced_by_id: existing.id,
      lock_version: Number(existing.lock_version ?? 1) + 1,
      updated_at: now,
    })
    .eq("id", existing.id)
    .eq("company_id", company.id)
    .eq("status", "published")
    .is("replaced_by_id", null)
    .eq("lock_version", existing.lock_version)
    .select("id, lock_version");

  if (lockError || !locked?.length) {
    console.error("revisePublishedPayslip lock:", lockError?.message);
    return {
      error:
        "Could not lock the published slip for revision (concurrent edit). Try again.",
    };
  }

  const { data: inserted, error: insertError } = await admin
    .from("payslips")
    .insert({
      company_id: company.id,
      employee_id: existing.employee_id,
      year,
      month,
      period_start: periodStart,
      period_end: periodEnd,
      period_label: calculated.payPeriodLabel,
      gross_amount: fromCents(calculated.grossCents),
      net_amount: fromCents(calculated.netSalaryCents),
      currency: loaded.currency ?? existing.currency,
      status: "draft",
      version: nextVersion,
      revision_note: note,
      supersedes_id: existing.id,
      calculated_snapshot: calculated,
      snapshot: calculated,
      overrides: {},
      apply_company_stamp: Boolean(existing.apply_company_stamp),
      published_at: null,
      lock_version: 1,
      updated_at: now,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    await admin
      .from("payslips")
      .update({
        replaced_by_id: null,
        lock_version: Number(locked[0].lock_version) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    console.error("revisePublishedPayslip insert:", insertError?.message);
    return { error: "Could not create revision draft." };
  }

  const { error: linkError } = await admin
    .from("payslips")
    .update({
      replaced_by_id: inserted.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .eq("company_id", company.id);

  if (linkError) {
    console.error("revisePublishedPayslip link:", linkError.message);
    // Draft exists; published still points at self — repair to draft id best-effort already failed.
    return {
      error:
        "Revision draft created but history link failed. Refresh and contact support if the old slip looks stuck.",
      id: inserted.id as string,
    };
  }

  await writePayrollAudit({
    companyId: company.id,
    actorUid: userId,
    action: "payslip.revise",
    entityType: "payslip",
    entityId: inserted.id,
    employeeId: existing.employee_id,
    before: {
      id: existing.id,
      version: existing.version,
      net_amount: existing.net_amount,
      gross_amount: existing.gross_amount,
      snapshot: existing.snapshot,
    },
    after: {
      id: inserted.id,
      version: nextVersion,
      revision_note: note,
      net_amount: fromCents(calculated.netSalaryCents),
      revised_by: user.name || user.email,
    },
    admin,
  });

  revalidatePayslipPaths(company.id, existing.employee_id);
  return {
    ok: true as const,
    id: inserted.id as string,
    version: nextVersion,
  };
}

export async function setPayslipStamp(payslipId: string, apply: boolean) {
  const { company, userId } = await requireCompanySession();
  const admin = createClient();

  if (apply && !company.logo_url) {
    return {
      error: "Upload a company logo in Settings before applying a stamp.",
    };
  }

  const { data: existing } = await admin
    .from("payslips")
    .select("id, status, employee_id, lock_version")
    .eq("id", payslipId)
    .eq("company_id", company.id)
    .is("replaced_by_id", null)
    .maybeSingle();

  if (!existing) return { error: "Payslip not found." };
  if (existing.status === "published") {
    return { error: "Published payslips are immutable." };
  }

  const { error } = await admin
    .from("payslips")
    .update({
      apply_company_stamp: apply,
      lock_version: Number(existing.lock_version ?? 1) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payslipId)
    .eq("lock_version", existing.lock_version);

  if (error) {
    return { error: "Could not update stamp." };
  }

  await writePayrollAudit({
    companyId: company.id,
    actorUid: userId,
    action: "payslip.stamp",
    entityType: "payslip",
    entityId: payslipId,
    employeeId: existing.employee_id,
    after: { apply },
    admin,
  });

  revalidatePayslipPaths(company.id, existing.employee_id);
  return { ok: true as const };
}
