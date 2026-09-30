/**
 * Optional DB integration tests (requires migration 20260930140000 applied).
 * Run: npm run test:record-punch:integration
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: TEST_KIOSK_TABLET_TOKEN, TEST_EMPLOYEE_ID (else skipped)
 */
import assert from "node:assert/strict";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { invokeRecordPunch } from "./record-punch";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tabletToken = process.env.TEST_KIOSK_TABLET_TOKEN;
const employeeId = process.env.TEST_EMPLOYEE_ID;

async function main() {
  if (!url || !key || !tabletToken || !employeeId) {
    console.log(
      "record-punch integration: skipped (set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TEST_KIOSK_TABLET_TOKEN, TEST_EMPLOYEE_ID)"
    );
    return;
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: tablet, error: tabletError } = await admin
    .from("kiosk_tablets")
    .select("id, company_id")
    .eq("tablet_token", tabletToken)
    .maybeSingle();

  if (tabletError || !tablet) {
    console.error("integration: invalid TEST_KIOSK_TABLET_TOKEN");
    process.exit(1);
  }

  const companyId = tablet.company_id as string;
  const tabletId = tablet.id as string;
  const runKey = `integration-${Date.now()}`;

  async function ensureOutState() {
    const { data: latest } = await admin
      .from("attendance")
      .select("type")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .is("voided_at", null)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest?.type === "clock_in" || latest?.type === "break_end") {
      await invokeRecordPunch(admin, {
        companyId,
        employeeId,
        tabletId,
        type: "clock_out",
        idempotencyKey: `${runKey}-cleanup-out`,
        clientTimestamp: null,
        faceMatchScore: null,
        attendanceStatus: null,
      });
    }
    if (latest?.type === "break_start") {
      await invokeRecordPunch(admin, {
        companyId,
        employeeId,
        tabletId,
        type: "break_end",
        idempotencyKey: `${runKey}-cleanup-break`,
        clientTimestamp: null,
        faceMatchScore: null,
        attendanceStatus: null,
      });
      await invokeRecordPunch(admin, {
        companyId,
        employeeId,
        tabletId,
        type: "clock_out",
        idempotencyKey: `${runKey}-cleanup-out-2`,
        clientTimestamp: null,
        faceMatchScore: null,
        attendanceStatus: null,
      });
    }
  }

  await ensureOutState();

  const first = await invokeRecordPunch(admin, {
    companyId,
    employeeId,
    tabletId,
    type: "clock_in",
    idempotencyKey: `${runKey}-in`,
    clientTimestamp: new Date().toISOString(),
    faceMatchScore: null,
    attendanceStatus: "on_time",
  });

  assert.equal("replayed" in first && first.replayed, false);
  assert.ok("attendance" in first && first.attendance?.id);

  const replay = await invokeRecordPunch(admin, {
    companyId,
    employeeId,
    tabletId,
    type: "clock_in",
    idempotencyKey: `${runKey}-in`,
    clientTimestamp: null,
    faceMatchScore: null,
    attendanceStatus: "on_time",
  });

  assert.equal("attendance" in replay && replay.replayed, true);
  if ("attendance" in first && "attendance" in replay) {
    assert.equal(replay.attendance.id, first.attendance.id);
  }

  const invalid = await invokeRecordPunch(admin, {
    companyId,
    employeeId,
    tabletId,
    type: "clock_in",
    idempotencyKey: `${runKey}-duplicate-action`,
    clientTimestamp: null,
    faceMatchScore: null,
    attendanceStatus: "on_time",
  });

  assert.equal("kind" in invalid && invalid.kind, "invalid_transition");

  const concurrent = await Promise.all([
    invokeRecordPunch(admin, {
      companyId,
      employeeId,
      tabletId,
      type: "clock_out",
      idempotencyKey: `${runKey}-out-a`,
      clientTimestamp: null,
      faceMatchScore: null,
      attendanceStatus: null,
    }),
    invokeRecordPunch(admin, {
      companyId,
      employeeId,
      tabletId,
      type: "break_start",
      idempotencyKey: `${runKey}-break-b`,
      clientTimestamp: null,
      faceMatchScore: null,
      attendanceStatus: null,
    }),
  ]);

  const successes = concurrent.filter((r) => "attendance" in r);
  const failures = concurrent.filter(
    (r) => "kind" in r && r.kind === "invalid_transition"
  );
  assert.equal(successes.length, 1);
  assert.equal(failures.length, 1);

  console.log("record-punch integration: passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
