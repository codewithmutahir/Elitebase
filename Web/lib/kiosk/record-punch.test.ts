/**
 * Run: npm run test:record-punch (from Web/)
 */
import assert from "node:assert/strict";
import {
  invalidTransitionMessage,
  invokeRecordPunch,
  readIdempotencyKey,
} from "./record-punch";

function testReadIdempotencyKey() {
  assert.equal(readIdempotencyKey("  abc  ", undefined), "abc");
  assert.equal(readIdempotencyKey(null, " body-key "), "body-key");
  assert.equal(readIdempotencyKey("header", "body"), "header");
  assert.equal(readIdempotencyKey(null, "  "), null);
}

function testInvalidTransitionMessages() {
  assert.match(
    invalidTransitionMessage("in", "clock_in"),
    /Already clocked in/i
  );
  assert.match(
    invalidTransitionMessage("out", "clock_out"),
    /Not clocked in/i
  );
  assert.match(
    invalidTransitionMessage("on_break", "clock_out"),
    /End your break/i
  );
}

async function testInvokeRecordPunchSuccess() {
  const admin = {
    rpc: async () => ({
      data: [
        {
          ok: true,
          error_code: null,
          current_state: "out",
          replayed: false,
          id: "11111111-1111-1111-1111-111111111111",
          employee_id: "e1",
          company_id: "c1",
          tablet_id: "t1",
          type: "clock_in",
          timestamp: "2026-09-30T12:00:00.000Z",
          face_match_score: null,
          attendance_status: "on_time",
          idempotency_key: "k1",
          client_timestamp: null,
          stale_shift_detected: false,
        },
      ],
      error: null,
    }),
  };

  const result = await invokeRecordPunch(admin as never, {
    companyId: "c1",
    employeeId: "e1",
    tabletId: "t1",
    type: "clock_in",
    idempotencyKey: "k1",
    clientTimestamp: null,
    faceMatchScore: null,
    attendanceStatus: "on_time",
  });

  assert.equal("replayed" in result && result.replayed, false);
  assert.equal("staleShiftDetected" in result && result.staleShiftDetected, false);
  assert.equal(result.attendance?.id, "11111111-1111-1111-1111-111111111111");
}

async function testInvokeRecordPunchReplay() {
  const admin = {
    rpc: async () => ({
      data: [
        {
          ok: true,
          error_code: null,
          current_state: "in",
          replayed: true,
          id: "11111111-1111-1111-1111-111111111111",
          type: "clock_in",
          timestamp: "2026-09-30T12:00:00.000Z",
          attendance_status: "on_time",
          stale_shift_detected: false,
        },
      ],
      error: null,
    }),
  };

  const result = await invokeRecordPunch(admin as never, {
    companyId: "c1",
    employeeId: "e1",
    tabletId: "t1",
    type: "clock_in",
    idempotencyKey: "k1",
    clientTimestamp: null,
    faceMatchScore: null,
    attendanceStatus: "on_time",
  });

  assert.equal(result.replayed, true);
}

async function testInvokeRecordPunchInvalidTransition() {
  const admin = {
    rpc: async () => ({
      data: [
        {
          ok: false,
          error_code: "INVALID_TRANSITION",
          current_state: "in",
          replayed: false,
          id: null,
          type: "clock_in",
          timestamp: null,
        },
      ],
      error: null,
    }),
  };

  const result = await invokeRecordPunch(admin as never, {
    companyId: "c1",
    employeeId: "e1",
    tabletId: "t1",
    type: "clock_in",
    idempotencyKey: "different-key",
    clientTimestamp: null,
    faceMatchScore: null,
    attendanceStatus: "on_time",
  });

  assert.equal(result.kind, "invalid_transition");
  if (result.kind === "invalid_transition") {
    assert.equal(result.code, "INVALID_TRANSITION");
    assert.equal(result.state, "in");
  }
}

async function testInvokeRecordPunchNoKey() {
  let capturedKey: string | null = "unset";
  const admin = {
    rpc: async (_name: string, args: { p_idempotency_key: string | null }) => {
      capturedKey = args.p_idempotency_key;
      return {
        data: [
          {
            ok: true,
            replayed: false,
            id: "11111111-1111-1111-1111-111111111111",
            type: "clock_out",
            timestamp: "2026-09-30T18:00:00.000Z",
            attendance_status: null,
            stale_shift_detected: false,
          },
        ],
        error: null,
      };
    },
  };

  await invokeRecordPunch(admin as never, {
    companyId: "c1",
    employeeId: "e1",
    tabletId: "t1",
    type: "clock_out",
    idempotencyKey: null,
    clientTimestamp: null,
    faceMatchScore: null,
    attendanceStatus: null,
  });

  assert.equal(capturedKey, null);
}

async function main() {
  testReadIdempotencyKey();
  testInvalidTransitionMessages();
  await testInvokeRecordPunchSuccess();
  await testInvokeRecordPunchReplay();
  await testInvokeRecordPunchInvalidTransition();
  await testInvokeRecordPunchNoKey();
  console.log("record-punch: all tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
