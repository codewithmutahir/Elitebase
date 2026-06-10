"use client";

import { useActionState, useState } from "react";
import { addEmployee, type AddEmployeeState } from "@/app/(dashboard)/employees/actions";

const initialState: AddEmployeeState | null = null;

export function AddEmployeePanel() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addEmployee, initialState);
  const modalOpen = open && !state?.plainPin;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2563EB] px-5 font-semibold text-white transition hover:bg-[#1D4ED8]"
      >
        Add Employee
      </button>

      {state?.plainPin ? (
        <div className="mt-6 rounded-2xl border border-[#10B981] bg-[#ECFDF5] p-6">
          <h2 className="text-lg font-semibold text-[#047857]">
            Employee added — save this PIN
          </h2>
          <p className="mt-2 text-sm text-[#065F46]">
            {state.employeeName} was created. This PIN is shown once for kiosk
            clock-in.
          </p>
          <p className="mt-4 font-mono text-4xl font-bold tracking-widest text-[#047857]">
            {state.plainPin}
          </p>
          {state.employeeId ? (
            <a
              href={`/employees/${state.employeeId}`}
              className="mt-4 inline-block text-sm font-semibold text-[#2563EB]"
            >
              View employee profile →
            </a>
          ) : null}
        </div>
      ) : null}

      {state?.error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#B91C1C]">
          {state.error}
        </p>
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Add employee</h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  A 4-digit kiosk PIN will be generated automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold" htmlFor="fullName">
                  Full name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  required
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 outline-none ring-[#2563EB] focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 outline-none ring-[#2563EB] focus:ring-2"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold" htmlFor="department">
                    Department
                  </label>
                  <input
                    id="department"
                    name="department"
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 outline-none ring-[#2563EB] focus:ring-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" htmlFor="position">
                    Position
                  </label>
                  <input
                    id="position"
                    name="position"
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 outline-none ring-[#2563EB] focus:ring-2"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue="employee"
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 outline-none ring-[#2563EB] focus:ring-2"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" htmlFor="hireDate">
                    Hire date
                  </label>
                  <input
                    id="hireDate"
                    name="hireDate"
                    type="date"
                    className="w-full rounded-lg border border-[#CBD5E1] px-3 py-2 outline-none ring-[#2563EB] focus:ring-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-[#64748B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {pending ? "Adding..." : "Add employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
