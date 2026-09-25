import { SuperAdminCompaniesTable } from "@/components/super-admin/companies-table";
import { listAllCompaniesForSuperAdmin } from "@/lib/super-admin/companies";
import { requireSuperAdminSession } from "@/lib/super-admin/session";

export default async function SuperAdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; suspended?: string }>;
}) {
  const [params, companies] = await Promise.all([
    searchParams,
    (async () => {
      await requireSuperAdminSession();
      return listAllCompaniesForSuperAdmin();
    })(),
  ]);

  const errorMessage =
    params.error === "suspend_failed"
      ? "Could not suspend company. Please try again."
      : params.error
        ? "Something went wrong."
        : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All companies</h1>
        <p className="mt-2 text-[#64748B]">
          Platform-wide company list. Suspending blocks the company account from
          active use.
        </p>
      </div>

      {params.suspended === "1" ? (
        <p className="rounded-lg bg-[#ECFDF5] px-4 py-3 text-sm text-[#047857]">
          Company suspended.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-[#B91C1C]">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <SuperAdminCompaniesTable companies={companies} />
      </div>
    </div>
  );
}
