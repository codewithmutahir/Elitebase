"use client";

import { useTransition } from "react";
import { suspendCompany } from "@/app/(dashboard)/super-admin/companies/actions";
import type { SuperAdminCompanyRow } from "@/lib/super-admin/companies";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

export function SuperAdminCompaniesTable({
  companies,
}: {
  companies: SuperAdminCompanyRow[];
}) {
  const [pending, startTransition] = useTransition();

  if (companies.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-[#64748B]">
        No companies registered yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#64748B]">
          <tr>
            <th className="px-6 py-3">Company</th>
            <th className="px-6 py-3">Owner email</th>
            <th className="px-6 py-3">Employees</th>
            <th className="px-6 py-3">Created</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {companies.map((company) => (
            <tr key={company.id} className="hover:bg-[#F8FAFC]">
              <td className="px-6 py-4 font-semibold text-[#0F172A]">
                {company.name}
              </td>
              <td className="px-6 py-4 text-[#334155]">{company.ownerEmail}</td>
              <td className="px-6 py-4 text-[#334155]">
                {company.employeeCount}
              </td>
              <td className="px-6 py-4 text-[#334155]">
                {formatDate(company.createdAt)}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    company.isActive
                      ? "bg-[#D1FAE5] text-[#047857]"
                      : "bg-[#FEE2E2] text-[#B91C1C]"
                  }`}
                >
                  {company.isActive ? "Active" : "Suspended"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {company.isActive ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await suspendCompany(company.id);
                      })
                    }
                    className="text-sm font-semibold text-[#B91C1C] hover:text-[#991B1B] disabled:opacity-60"
                  >
                    Suspend
                  </button>
                ) : (
                  <span className="text-xs text-[#64748B]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
