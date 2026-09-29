import { GET as getV1 } from "@/lib/api/v1/timesheets/months";
import { defineLegacyApiRoute } from "@/lib/api/define-route";

export const GET = defineLegacyApiRoute("timesheets/months", getV1);
