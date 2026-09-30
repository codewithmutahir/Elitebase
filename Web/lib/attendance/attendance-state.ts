/** Derived punch state from the latest non-voided event type (Phase 2+ will ignore voided). */
export type AttendanceDerivedState = "out" | "in" | "on_break";

export type AttendanceAction =
  | "clock_in"
  | "clock_out"
  | "break_start"
  | "break_end";

const ALL_ACTIONS: AttendanceAction[] = [
  "clock_in",
  "clock_out",
  "break_start",
  "break_end",
];

/**
 * Maps the latest attendance event type to a coarse state for transition rules.
 * Matches current kiosk `employee-status` semantics.
 */
export function deriveState(
  latestType: string | null | undefined
): AttendanceDerivedState {
  if (!latestType || latestType === "clock_out") {
    return "out";
  }
  if (latestType === "clock_in" || latestType === "break_end") {
    return "in";
  }
  if (latestType === "break_start") {
    return "on_break";
  }
  return "out";
}

/** Actions permitted in each state (kiosk product rules as of Phase 1). */
export function allowedActions(
  state: AttendanceDerivedState
): AttendanceAction[] {
  switch (state) {
    case "out":
      return ["clock_in"];
    case "in":
      return ["clock_out", "break_start"];
    case "on_break":
      return ["break_end"];
  }
}

export type TransitionValidation =
  | { ok: true }
  | { ok: false; state: AttendanceDerivedState; action: AttendanceAction };

export function validateTransition(
  state: AttendanceDerivedState,
  action: AttendanceAction
): TransitionValidation {
  if (allowedActions(state).includes(action)) {
    return { ok: true };
  }
  return { ok: false, state, action };
}

/** Same as legacy `isEmployeeClockedIn` — used by employee-status. */
export function isClockedInForStatus(
  latestType: string | null | undefined
): boolean {
  return deriveState(latestType) === "in";
}

export function isOnBreakForStatus(
  latestType: string | null | undefined
): boolean {
  return latestType === "break_start";
}

export function allActionStateMatrix(): {
  state: AttendanceDerivedState;
  action: AttendanceAction;
  allowed: boolean;
}[] {
  const states: AttendanceDerivedState[] = ["out", "in", "on_break"];
  const rows: {
    state: AttendanceDerivedState;
    action: AttendanceAction;
    allowed: boolean;
  }[] = [];

  for (const state of states) {
    const allowed = new Set(allowedActions(state));
    for (const action of ALL_ACTIONS) {
      rows.push({ state, action, allowed: allowed.has(action) });
    }
  }

  return rows;
}
