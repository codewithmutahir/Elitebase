import type { NextRequest } from "next/server";
import { withLegacyApiAlias } from "./legacy-alias";
import { apiV1Path } from "./version";

type RouteHandler = (request: NextRequest) => Promise<Response>;

export function defineLegacyApiRoute(
  v1RelativePath: string,
  handler: RouteHandler
): RouteHandler {
  return withLegacyApiAlias(apiV1Path(v1RelativePath), handler);
}
