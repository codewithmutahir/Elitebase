import assert from "node:assert/strict";
import {
  getRosterOnboardingStatus,
  rosterStatusLabel,
  rosterStatusTone,
} from "@/lib/employees/roster-status";

const base = {
  status: "active" as const,
  email: null as string | null,
  phone: null as string | null,
  portal_invited_at: null as string | null,
  user_id: null as string | null,
};

assert.equal(
  getRosterOnboardingStatus({ ...base, status: "terminated" }),
  "deactivated"
);

assert.equal(
  getRosterOnboardingStatus({
    ...base,
    email: "a@b.com",
    portal_invited_at: "2026-10-11T00:00:00Z",
    user_id: "user_1",
  }),
  "active"
);

assert.equal(getRosterOnboardingStatus(base), "needs_contact");
assert.equal(
  getRosterOnboardingStatus({ ...base, phone: "03100118238" }),
  "needs_contact",
  "phone alone must not look active or inviteable"
);

assert.equal(
  getRosterOnboardingStatus({ ...base, email: "a@b.com" }),
  "needs_invite"
);

assert.equal(
  getRosterOnboardingStatus({
    ...base,
    email: "a@b.com",
    portal_invited_at: "2026-10-11T00:00:00Z",
  }),
  "pending"
);

assert.equal(rosterStatusLabel("needs_contact"), "Needs email");
assert.equal(rosterStatusLabel("pending"), "Invite pending");
assert.equal(rosterStatusTone("pending"), "warning");
assert.equal(rosterStatusTone("active"), "success");

console.log("roster-status.test.ts: ok");
