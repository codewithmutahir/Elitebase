import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

const primaryColor = "#2563EB";
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@example.com";

function emailLayout(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;backgr1ound:#F8FAFC;font-family:Arial,Helvetica,sans-serif;color:#0F172A;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${primaryColor};">Elitebase</p>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">${title}</h1>
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function actionButton(label: string, href: string) {
  return `
<p style="margin:24px 0;">
  <a href="${href}" style="display:inline-block;background:${primaryColor};color:#FFFFFF;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">
    ${label}
  </a>
</p>
  `.trim();
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
) {
  const html = emailLayout(
    "Reset your password",
    `
<p style="margin:0 0 12px;color:#64748B;">Hi ${name},</p>
<p style="margin:0 0 12px;color:#64748B;">We received a request to reset your password. Click the button below to choose a new one.</p>
${actionButton("Reset password", resetUrl)}
<p style="margin:0;color:#94A3B8;font-size:13px;">If you did not request this, you can safely ignore this email.</p>
    `
  );

  await getResendClient().emails.send({
    from: fromEmail,
    to: email,
    subject: "Reset your Elitebase password",
    html,
  });
}

export async function sendWelcomeEmail(email: string, companyName: string) {
  const html = emailLayout(
    "Welcome to Elitebase",
    `
<p style="margin:0 0 12px;color:#64748B;">Your company workspace <strong>${companyName}</strong> is ready.</p>
<p style="margin:0 0 12px;color:#64748B;">You can now set up employees, kiosk tablets, and attendance tracking from your dashboard.</p>
<p style="margin:0;color:#64748B;">We are glad to have you on board.</p>
    `
  );

  await getResendClient().emails.send({
    from: fromEmail,
    to: email,
    subject: `Welcome to Elitebase — ${companyName}`,
    html,
  });
}
