/**
 * Backfill missing clock-in / clock-out rows in attendance from schedule times.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  defaultBackfillRange,
  listCompanyIds,
  planAndApplyMissingPunchBackfill,
  planMissingPunchBackfill,
} from "../lib/timesheets/backfill-missing-punches.ts";
import { companyTimezone } from "../lib/dashboard/format.ts";

config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const companyArg = args.find((a) => a.startsWith("--company="));
const fromArg = args.find((a) => a.startsWith("--from="));
const toArg = args.find((a) => a.startsWith("--to="));

const companyFilter = companyArg?.split("=")[1]?.trim();
const fromOverride = fromArg?.split("=")[1]?.trim();
const toOverride = toArg?.split("=")[1]?.trim();

let companyIds = companyFilter ? [companyFilter] : await listCompanyIds(admin);

if (companyIds.length === 0) {
  console.log("No companies found.");
  process.exit(0);
}

console.log(apply ? "APPLY mode — inserting punches" : "DRY RUN — no writes");
console.log("Companies:", companyIds.length);

for (const companyId of companyIds) {
  const { data: company } = await admin
    .from("companies")
    .select("name, timezone")
    .eq("id", companyId)
    .maybeSingle();

  const tz = companyTimezone(company?.timezone);
  const range =
    fromOverride && toOverride
      ? { from: fromOverride, to: toOverride }
      : defaultBackfillRange(tz);

  if (!apply) {
    const plans = await planMissingPunchBackfill(admin, {
      companyId,
      from: range.from,
      to: range.to,
    });
    console.log(
      `\n${company?.name ?? companyId} (${range.from} → ${range.to}): ${plans.length} punch(es) to add (first pass)`
    );
    for (const plan of plans) {
      console.log(
        `  ${plan.employeeName} · ${plan.shiftDate} · ${plan.type} · ${plan.localDate} ${plan.localTimeHm}`
      );
    }
    continue;
  }

  const result = await planAndApplyMissingPunchBackfill(admin, {
    companyId,
    from: range.from,
    to: range.to,
    dryRun: false,
  });

  console.log(
    `\n${company?.name ?? companyId} (${range.from} → ${range.to}): inserted ${result.totalInserted} in ${result.passes} pass(es), skipped ${result.totalSkipped}`
  );

  if (result.errors.length > 0) {
    console.error("Errors:");
    for (const err of result.errors) console.error(" ", err);
    process.exit(1);
  }
}
