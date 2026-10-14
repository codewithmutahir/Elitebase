import type { AttendanceAction } from "@/lib/attendance/attendance-state";
import type { AttendanceType } from "@/lib/kiosk/attendance";
import type { SupabaseClient } from "@supabase/supabase-js";

export type RecordPunchRpcRow = {
  ok: boolean;
  error_code: string | null;
  current_state: string | null;
  replayed: boolean;
  id: string | null;
  employee_id: string | null;
  company_id: string | null;
  tablet_id: string | null;
  type: string | null;
  timestamp: string | null;
  face_match_score: number | null;
  attendance_status: string | null;
  idempotency_key: string | null;
  client_timestamp: string | null;
  stale_shift_detected?: boolean | null;
};

export type RecordPunchSuccess = {
  replayed: boolean;
  staleShiftDetected: boolean;
  attendance: {
    id: string;
    employee_id: string;
    type: AttendanceType;
    timestamp: string;
    attendance_status: string | null;
  };
};

export type RecordPunchFailure =
  | {
      kind: "invalid_transition";
      code: "INVALID_TRANSITION";
      state: string;
      message: string;
    }
  | { kind: "invalid_type"; message: string }
  | { kind: "rpc_error"; message: string };

export function readIdempotencyKey(
  headerValue: string | null,
  bodyKey: string | undefined
): string | null {
  const fromHeader = headerValue?.trim();
  if (fromHeader) return fromHeader;
  const fromBody = bodyKey?.trim();
  return fromBody || null;
}

export function invalidTransitionMessage(
  state: string,
  action: AttendanceAction
): string {
  if (state === "in" && action === "clock_in") {
    return "Already clocked in. Clock out before starting a new shift.";
  }
  if (state === "out" && action === "clock_out") {
    return "Not clocked in. Clock in first.";
  }
  if (state === "out" && action === "break_start") {
    return "Not clocked in. Clock in before starting a break.";
  }
  if (state === "out" && action === "break_end") {
    return "Not on a break.";
  }
  if (state === "in" && action === "break_end") {
    return "Not on a break. Start a break first.";
  }
  if (state === "on_break" && action === "clock_in") {
    return "End your break before clocking in again.";
  }
  if (state === "on_break" && action === "clock_out") {
    return "End your break before clocking out.";
  }
  if (state === "on_break" && action === "break_start") {
    return "Already on a break.";
  }
  if (state === "in" && action === "clock_in") {
    return "Already clocked in.";
  }
  return "That attendance action is not allowed right now.";
}

function firstRpcRow(data: unknown): RecordPunchRpcRow | null {
  if (!data) return null;
  if (Array.isArray(data)) {
    return (data[0] as RecordPunchRpcRow | undefined) ?? null;
  }
  return data as RecordPunchRpcRow;
}

export async function invokeRecordPunch(
  admin: SupabaseClient,
  input: {
    companyId: string;
    employeeId: string;
    /** Null for employee portal punches (no kiosk tablet). */
    tabletId: string | null;
    type: AttendanceType;
    idempotencyKey: string | null;
    clientTimestamp: string | null;
    faceMatchScore: number | null;
    attendanceStatus: string | null;
  }
): Promise<RecordPunchSuccess | RecordPunchFailure> {
  const { data, error } = await admin.rpc("record_punch", {
    p_company_id: input.companyId,
    p_employee_id: input.employeeId,
    p_tablet_id: input.tabletId,
    p_type: input.type,
    p_idempotency_key: input.idempotencyKey,
    p_client_timestamp: input.clientTimestamp,
    p_face_match_score: input.faceMatchScore,
    p_attendance_status: input.attendanceStatus,
  });

  if (error) {
    console.error("record_punch rpc failed:", error.message);
    return {
      kind: "rpc_error",
      message: "Could not record attendance.",
    };
  }

  const row = firstRpcRow(data);
  if (!row) {
    return { kind: "rpc_error", message: "Could not record attendance." };
  }

  if (!row.ok) {
    if (row.error_code === "INVALID_TRANSITION") {
      const state = row.current_state ?? "out";
      return {
        kind: "invalid_transition",
        code: "INVALID_TRANSITION",
        state,
        message: invalidTransitionMessage(state, input.type),
      };
    }
    if (row.error_code === "INVALID_TYPE") {
      return {
        kind: "invalid_type",
        message:
          "type must be clock_in, clock_out, break_start, or break_end.",
      };
    }
    return { kind: "rpc_error", message: "Could not record attendance." };
  }

  if (!row.id || !row.type || !row.timestamp) {
    return { kind: "rpc_error", message: "Could not record attendance." };
  }

  return {
    replayed: row.replayed,
    staleShiftDetected: Boolean(row.stale_shift_detected),
    attendance: {
      id: row.id,
      employee_id: input.employeeId,
      type: row.type as AttendanceType,
      timestamp: row.timestamp,
      attendance_status: row.attendance_status,
    },
  };
}
