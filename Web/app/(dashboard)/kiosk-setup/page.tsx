import { GenerateSetupPanel } from "@/components/kiosk/generate-setup-panel";
import { TabletList } from "@/components/kiosk/tablet-list";
import { requireCompanySession } from "@/lib/employees/session";
import { listKioskTablets } from "@/lib/kiosk/queries";

export default async function KioskSetupPage() {
  const { company } = await requireCompanySession();
  const tablets = await listKioskTablets(company.id);

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-500">
        Pair tablets with your company so employees can clock in on-site.
      </p>

      <GenerateSetupPanel />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Registered tablets
        </h2>
        <TabletList tablets={tablets} />
      </section>
    </div>
  );
}
