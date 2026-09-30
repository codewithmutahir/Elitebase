import {
  deriveState,
  validateTransition,
  type AttendanceAction,
} from "@/lib/attendance/attendance-state";
import { isAttendanceType } from "@/lib/kiosk/attendance";

export type DedupeAttendanceRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  type: string;
  timestamp: string;
};

export type VoidProposal = {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  timestamp: string;
  reason:
    | "duplicate_clock_in"
    | "duplicate_clock_out"
    | "orphan_event";
  detail: string;
};

function sortEvents(rows: DedupeAttendanceRow[]): DedupeAttendanceRow[] {
  return [...rows].sort((a, b) => {
    const t =
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    if (t !== 0) return t;
    return a.id.localeCompare(b.id);
  });
}

function proposeConsecutiveDuplicates(
  events: DedupeAttendanceRow[],
  punchType: "clock_in" | "clock_out"
): VoidProposal[] {
  const proposals: VoidProposal[] = [];
  for (let i = 1; i < events.length; i += 1) {
    const prev = events[i - 1];
    const current = events[i];
    if (prev.type !== punchType || current.type !== punchType) continue;
    proposals.push({
      id: current.id,
      employeeId: current.employee_id,
      employeeName: current.employee_name,
      type: current.type,
      timestamp: current.timestamp,
      reason:
        punchType === "clock_in" ? "duplicate_clock_in" : "duplicate_clock_out",
      detail: `Consecutive ${punchType} after ${prev.timestamp}`,
    });
  }
  return proposals;
}

function proposeOrphans(events: DedupeAttendanceRow[]): VoidProposal[] {
  const proposals: VoidProposal[] = [];
  let state = deriveState(null);

  for (const event of events) {
    if (!isAttendanceType(event.type)) continue;
    const action = event.type as AttendanceAction;
    const validation = validateTransition(state, action);
    if (!validation.ok) {
      proposals.push({
        id: event.id,
        employeeId: event.employee_id,
        employeeName: event.employee_name,
        type: event.type,
        timestamp: event.timestamp,
        reason: "orphan_event",
        detail: `Invalid transition from state "${state}" with action "${action}"`,
      });
      continue;
    }

    state = deriveState(action);
  }

  return proposals;
}

/** Proposes voids for duplicate runs and orphan punches (earliest kept in duplicate runs). */
export function planAttendanceVoids(
  rows: DedupeAttendanceRow[]
): VoidProposal[] {
  const byEmployee = new Map<string, DedupeAttendanceRow[]>();

  for (const row of rows) {
    const bucket = byEmployee.get(row.employee_id) ?? [];
    bucket.push(row);
    byEmployee.set(row.employee_id, bucket);
  }

  const proposalMap = new Map<string, VoidProposal>();

  for (const employeeEvents of byEmployee.values()) {
    const sorted = sortEvents(employeeEvents);
    for (const proposal of [
      ...proposeConsecutiveDuplicates(sorted, "clock_in"),
      ...proposeConsecutiveDuplicates(sorted, "clock_out"),
    ]) {
      proposalMap.set(proposal.id, proposal);
    }

    const voidIds = new Set(proposalMap.keys());
    const remaining = sorted.filter((event) => !voidIds.has(event.id));
    for (const proposal of proposeOrphans(remaining)) {
      if (!proposalMap.has(proposal.id)) {
        proposalMap.set(proposal.id, proposal);
      }
    }
  }

  return [...proposalMap.values()].sort((a, b) => {
    if (a.employeeName !== b.employeeName) {
      return a.employeeName.localeCompare(b.employeeName, "en", {
        sensitivity: "base",
      });
    }
    return a.timestamp.localeCompare(b.timestamp);
  });
}

export function filterVoidProposals(
  rows: DedupeAttendanceRow[],
  voidIds: Set<string>
): DedupeAttendanceRow[] {
  return rows.filter((row) => !voidIds.has(row.id));
}
