/**
 * Void duplicate/orphan attendance punches (never DELETE).
 *
 * Usage (from Web/):
 *   npx tsx scripts/attendance-dedupe.mjs --company=<uuid> [--employee=<uuid>] [--from=YYYY-MM-DD] [--to=YYYY-MM-DD]
 *   npx tsx scripts/attendance-dedupe.mjs --company=<uuid> --apply
 *
 * Muneeb / Ameer (2026-07-23, 2026-07-29): run WITHOUT --apply first; review printed
 * before/after shift rows, then apply with a narrow --employee + date range if approved.
 *
 * Optional env: VOIDED_BY_USER_ID (uuid stored in voided_by when --apply)
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { planAttendanceVoids, filterVoidProposals } from "../lib/attendance/dedupe-plan.ts";
import { buildTimesheetRows } from "../lib/timesheets/pairing.ts";
import { companyTimezone } from "../lib/dashboard/format.ts";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const companyId = args.find((a) => a.startsWith("--company="))?.split("=")[1]?.trim();
  const employeeId = args.find((a) => a.startsWith("--employee="))?.split("=")[1]?.trim();
  const from = args.find((a) => a.startsWith("--from="))?.split("=")[1]?.trim();
  const to = args.find((a) => a.startsWith("--to="))?.split("=")[1]?.trim();
  const voidedBy = process.env.VOIDED_BY_USER_ID?.trim() || null;

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  if (!companyId) {
    console.error("--company=<uuid> is required.");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: company } = await admin
    .from("companies")
    .select("name, timezone")
    .eq("id", companyId)
    .maybeSingle();

  const timezone = companyTimezone(company?.timezone);
  const rangeFrom = from ?? "2020-01-01";
  const rangeTo = to ?? "2099-12-31";
  const startIso = `${rangeFrom}T00:00:00.000Z`;
  const endIso = `${rangeTo}T23:59:59.999Z`;

  let query = admin
    .from("attendance")
    .select("id, employee_id, type, timestamp, employees ( full_name )")
    .eq("company_id", companyId)
    .is("voided_at", null)
    .gte("timestamp", startIso)
    .lte("timestamp", endIso)
    .order("timestamp", { ascending: true });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetch attendance failed:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []).map((row) => {
    const employees = row.employees;
    const name = Array.isArray(employees)
      ? employees[0]?.full_name
      : employees?.full_name;
    return {
      id: row.id,
      employee_id: row.employee_id,
      employee_name: name ?? "Unknown",
      type: row.type,
      timestamp: row.timestamp,
    };
  });

  const proposals = planAttendanceVoids(rows);
  const voidIds = new Set(proposals.map((p) => p.id));

  console.log(apply ? "APPLY — voiding proposals" : "DRY RUN — report only");
  console.log(
    `${company?.name ?? companyId} · ${rangeFrom} → ${rangeTo}` +
      (employeeId ? ` · employee ${employeeId}` : "")
  );
  console.log(`Active events scanned: ${rows.length}`);
  console.log(`Void proposals: ${proposals.length}\n`);

  function printShiftSummary(label, eventRows) {
    console.log(`--- ${label} (${eventRows.length} events) ---`);
    const events = eventRows.map((r) => ({
      id: r.id,
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      type: r.type,
      timestamp: r.timestamp,
    }));
    const shifts = buildTimesheetRows(events, timezone, rangeFrom, rangeTo);
    for (const shift of shifts) {
      console.log(
        `  ${shift.employeeName} · ${shift.date} · in=${shift.clockIn ?? "—"} · out=${shift.clockOut ?? "—"} · ${shift.status}${shift.needsReview ? " · needs_review" : ""}`
      );
    }
    if (shifts.length === 0) console.log("  (no paired shifts)");
    console.log("");
  }

  printShiftSummary("Before (current active events)", rows);

  if (proposals.length > 0) {
    for (const proposal of proposals) {
      console.log(
        `VOID ${proposal.employeeName} · ${proposal.type} · ${proposal.timestamp} · ${proposal.reason} · ${proposal.detail} · id=${proposal.id}`
      );
    }
    console.log("");
    printShiftSummary(
      "After (simulated — proposed voids excluded)",
      filterVoidProposals(rows, voidIds)
    );
  }

  if (!apply) {
    console.log(
      "Re-run with --apply to set voided_at / void_reason on proposed rows."
    );
    return;
  }

  let applied = 0;
  let skipped = 0;

  for (const proposal of proposals) {
    const { data: existing } = await admin
      .from("attendance")
      .select("id, voided_at")
      .eq("id", proposal.id)
      .maybeSingle();

    if (!existing || existing.voided_at) {
      skipped += 1;
      continue;
    }

    const { error: updateError } = await admin
      .from("attendance")
      .update({
        voided_at: new Date().toISOString(),
        void_reason: proposal.reason,
        voided_by: voidedBy,
      })
      .eq("id", proposal.id)
      .eq("company_id", companyId)
      .is("voided_at", null);

    if (updateError) {
      console.error(`Failed to void ${proposal.id}:`, updateError.message);
      skipped += 1;
      continue;
    }

    applied += 1;
  }

  console.log(`Applied voids: ${applied}, skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
