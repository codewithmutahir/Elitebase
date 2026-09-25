const GENERIC_MESSAGE =
  "Something went wrong on our side. Please try again in a moment.";

const NETWORK_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";

/**
 * Maps thrown errors (including Next.js Server Action failures) to copy safe for end users.
 */
export function getUserFacingError(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return sanitizeKnownMessage(error.trim());
  }

  if (error instanceof Error) {
    return sanitizeKnownMessage(error.message);
  }

  return GENERIC_MESSAGE;
}

function sanitizeKnownMessage(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("body exceeded") ||
    lower.includes("bodysizelimit") ||
    (lower.includes("1 mb") && lower.includes("limit"))
  ) {
    return "That upload is too large for one request. Use a smaller CSV or split it into multiple files.";
  }

  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed")
  ) {
    return NETWORK_MESSAGE;
  }

  if (
    lower.includes("unexpected token") ||
    lower.includes("digest") ||
    lower.includes("minified react error") ||
    lower.includes("server action") ||
    lower.includes("next.js") ||
    lower.includes("turbopack") ||
    lower.includes("webpack") ||
    lower.includes(" at ") ||
    message.includes("node_modules")
  ) {
    return GENERIC_MESSAGE;
  }

  if (message.length > 280) {
    return GENERIC_MESSAGE;
  }

  return message;
}

export const USER_FACING = {
  generic: GENERIC_MESSAGE,
  network: NETWORK_MESSAGE,
  tryAgain: "Try again",
  backToDashboard: "Back to dashboard",
  backToHome: "Back to home",
} as const;
