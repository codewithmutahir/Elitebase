import type { NextRequest } from "next/server";

type RouteHandler = (request: NextRequest) => Promise<Response>;

/**
 * Wraps a v1 handler served at a legacy unversioned URL.
 * Adds standard deprecation headers without changing status or body.
 */
export function withLegacyApiAlias(
  successorPath: string,
  handler: RouteHandler
): RouteHandler {
  return async (request: NextRequest) => {
    const response = await handler(request);
    const headers = new Headers(response.headers);
    headers.set("Deprecation", "true");
    headers.append("Link", `<${successorPath}>; rel="successor-version"`);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}
