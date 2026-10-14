import dns from "node:dns";
import { Resend } from "resend";
import { getAppBaseUrl } from "@/lib/app-url";

// Prefer A records — dual-stack Cloudflare hosts often fail intermittently on
// Windows when IPv6 is advertised but not actually reachable.
dns.setDefaultResultOrder("ipv4first");

let resendClient: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

/** Elitebase email tokens — light professional canvas, navy + gold brand. */
const EB = {
  ink: "#070F24",
  text: "#14265A",
  muted: "#5B6B8C",
  faint: "#94A3B8",
  gold: "#D9A63F",
  goldDark: "#B8801F",
  goldSoft: "#FBF6EA",
  surface: "#F4F5F7",
  card: "#FFFFFF",
  border: "#E2E8F0",
  check: "#16A34A",
} as const;

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL?.trim() || "noreply@example.com";
}

const SEND_ATTEMPTS = 3;
const SEND_RETRY_MS = 400;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function brandHeader() {
  // Text wordmark — reliable across clients; our PNG is tuned for dark UIs.
  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td align="center" style="padding:0 0 28px;">
      <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:${EB.gold};font-family:Arial,Helvetica,sans-serif;">
        elitebase
      </p>
    </td>
  </tr>
</table>
  `.trim();
}

function featureList(items: readonly string[]) {
  const rows = items
    .map(
      (item) => `
<tr>
  <td valign="top" style="padding:0 10px 12px 0;width:22px;font-size:16px;line-height:22px;color:${EB.check};font-family:Arial,Helvetica,sans-serif;">&#10003;</td>
  <td style="padding:0 0 12px;font-size:15px;line-height:22px;color:${EB.text};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(item)}</td>
</tr>`
    )
    .join("");

  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 8px;">
  ${rows}
</table>
  `.trim();
}

function infoBox(rows: readonly { label: string; value: string }[]) {
  const lines = rows
    .map(
      (row) =>
        `<p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:${EB.text};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(row.label)}: <strong style="color:${EB.ink};">${escapeHtml(row.value)}</strong></p>`
    )
    .join("");

  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0 8px;">
  <tr>
    <td style="padding:16px 18px;background:${EB.surface};border:1px solid ${EB.border};border-radius:10px;">
      ${lines}
    </td>
  </tr>
</table>
  `.trim();
}

function actionButton(label: string, href: string) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 8px;">
  <tr>
    <td align="center">
      <a href="${escapeHtml(href)}" style="display:inline-block;background:${EB.gold};color:${EB.ink};text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;box-shadow:0 6px 16px rgba(217,166,63,0.28);">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>
  `.trim();
}

function softPanel(title: string, body: string, tint: string) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 24px;">
  <tr>
    <td style="padding:20px 18px;background:${tint};border-radius:14px;">
      <p style="margin:0 0 6px;font-size:17px;font-weight:700;line-height:1.35;color:${EB.ink};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(title)}</p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:${EB.text};font-family:Arial,Helvetica,sans-serif;">${escapeHtml(body)}</p>
    </td>
  </tr>
</table>
  `.trim();
}

function emailShell(content: string) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Elitebase</title>
  </head>
  <body style="margin:0;padding:0;background:${EB.surface};font-family:Arial,Helvetica,sans-serif;color:${EB.ink};-webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${EB.surface};padding:36px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:${EB.card};border:1px solid ${EB.border};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="height:4px;background:${EB.gold};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:36px 32px 40px;">
                ${brandHeader()}
                ${content}
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:12px;line-height:1.5;color:${EB.faint};font-family:Arial,Helvetica,sans-serif;max-width:560px;">
            Sent by Elitebase · Time tracking for teams
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function isTransientEmailError(message: string) {
  return /unable to fetch|could not be resolved|network|econnreset|etimedout|enotfound|fetch failed/i.test(
    message
  );
}

/** Resend returns `{ data, error }` and does not throw on API failures. */
async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = getFromEmail();
  let lastMessage = "Email provider rejected the send.";

  for (let attempt = 1; attempt <= SEND_ATTEMPTS; attempt++) {
    const { data, error } = await getResendClient().emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (!error) {
      return data;
    }

    lastMessage = error.message || lastMessage;
    const retry =
      attempt < SEND_ATTEMPTS && isTransientEmailError(lastMessage);
    if (!retry) {
      break;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, SEND_RETRY_MS * attempt)
    );
  }

  throw new Error(lastMessage);
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
) {
  const safeName = escapeHtml(name || "there");
  const html = emailShell(`
    <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;font-weight:700;color:${EB.ink};font-family:Georgia,'Times New Roman',serif;">
      Reset your password
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${EB.text};font-family:Arial,Helvetica,sans-serif;">
      Hi <strong style="color:${EB.ink};">${safeName}</strong>,
    </p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${EB.text};font-family:Arial,Helvetica,sans-serif;">
      We received a request to reset your Elitebase password. Choose a new one with the button below.
    </p>
    ${actionButton("Reset password", resetUrl)}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${EB.faint};font-family:Arial,Helvetica,sans-serif;">
      If you did not request this, you can safely ignore this email.
    </p>
  `);

  await sendEmail({
    to: email,
    subject: "Reset your Elitebase password",
    html,
  });
}

export async function sendWelcomeEmail(email: string, companyName: string) {
  const safeCompany = escapeHtml(companyName);
  const dashboardUrl = `${getAppBaseUrl()}/dashboard`;
  const html = emailShell(`
    <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;font-weight:700;color:${EB.ink};font-family:Georgia,'Times New Roman',serif;">
      Welcome to Elitebase
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${EB.text};font-family:Arial,Helvetica,sans-serif;">
      Your company workspace <strong style="color:${EB.ink};">${safeCompany}</strong> is ready.
    </p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${EB.text};font-family:Arial,Helvetica,sans-serif;">
      Here’s what you can do next:
    </p>
    ${featureList([
      "Add your team to the roster and send portal invites",
      "Set up kiosk tablets for PIN and face clock-in",
      "Track attendance, schedules, and timesheets in real time",
    ])}
    ${infoBox([{ label: "Account email", value: email }])}
    ${actionButton("Open dashboard", dashboardUrl)}
    ${softPanel(
      "Stay on top of the floor",
      "See who’s clocked in, who’s late, and what’s happening across locations — all from one dashboard.",
      "#EEF2FF"
    )}
    ${softPanel(
      "Pay and documents in one place",
      "Upload payslips and benefits so employees can find them in the portal when they need them.",
      EB.goldSoft
    )}
  `);

  await sendEmail({
    to: email,
    subject: `Welcome to Elitebase — ${companyName}`,
    html,
  });
}

export async function sendEmployeePortalInviteEmail(input: {
  email: string;
  employeeName: string;
  companyName: string;
  acceptUrl: string;
}) {
  const safeName = escapeHtml(input.employeeName);
  const safeCompany = escapeHtml(input.companyName);
  const html = emailShell(`
    <h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;font-weight:700;color:${EB.ink};font-family:Georgia,'Times New Roman',serif;">
      Welcome to ${safeCompany}!
    </h1>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${EB.text};font-family:Arial,Helvetica,sans-serif;">
      Hi <strong style="color:${EB.ink};">${safeName}</strong>,
    </p>
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${EB.text};font-family:Arial,Helvetica,sans-serif;">
      <strong style="color:${EB.ink};">${safeCompany}</strong> invited you to Elitebase. Activate your employee portal to manage your workday in one place.
    </p>
    <p style="margin:20px 0 4px;font-size:17px;font-weight:700;color:${EB.ink};font-family:Arial,Helvetica,sans-serif;">
      What you can do with Elitebase
    </p>
    ${featureList([
      "Clock in and out from the portal or workplace kiosk",
      "See your attendance and hours after every shift",
      "Request time off and track leave status",
      "View pay summaries, benefits, and payslips",
      "Get updates from your employer in one login",
    ])}
    ${infoBox([{ label: "Account email", value: input.email }])}
    ${actionButton("Activate my portal", input.acceptUrl)}
    ${softPanel(
      "Stay on top of your shifts",
      "Clock in and out, review attendance, and keep your schedule clear — from phone or kiosk.",
      "#EEF2FF"
    )}
    ${softPanel(
      "See your hours and pay",
      "Know how much you worked and find payslips and benefits whenever you need them.",
      "#ECFDF5"
    )}
    ${softPanel(
      "Request leave anytime",
      "Submit time-off requests and track approval without chasing your manager.",
      EB.goldSoft
    )}
    <p style="margin:8px 0 0;font-size:13px;line-height:1.5;color:${EB.faint};font-family:Arial,Helvetica,sans-serif;">
      This link expires in 7 days. If you did not expect this email, you can ignore it.
    </p>
  `);

  await sendEmail({
    to: input.email,
    subject: `${input.companyName} invited you to Elitebase`,
    html,
  });
}
