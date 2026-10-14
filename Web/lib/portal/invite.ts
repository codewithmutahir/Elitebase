import { createClient } from "@/lib/supabase/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { sendEmployeePortalInviteEmail } from "@/lib/email";
import {
  generatePortalInviteToken,
  hashPortalInviteToken,
  portalInviteExpiresAt,
} from "@/lib/portal/tokens";

const INVITE_EMAIL_DEV_FALLBACK =
  process.env.NODE_ENV !== "production";

export type CreatePortalInviteResult =
  | {
      ok: true;
      email: string;
      invitedAt: string;
      acceptUrl: string;
      emailed: boolean;
      /** Present when invite was saved but Resend failed (dev fallback only). */
      emailError?: string;
    }
  | { error: string };

/**
 * Creates a hashed invite token, emails the accept link, and stamps portal_invited_at.
 * Prior unused invites for the employee are expired so only the latest link works.
 */
export async function createAndSendPortalInvite(input: {
  companyId: string;
  companyName: string;
  employeeId: string;
  employeeName: string;
  email: string;
}): Promise<CreatePortalInviteResult> {
  const admin = createClient();
  const email = input.email.trim().toLowerCase();
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = portalInviteExpiresAt(now);

  const { data: existingLink } = await admin
    .from("employees")
    .select("user_id")
    .eq("id", input.employeeId)
    .eq("company_id", input.companyId)
    .maybeSingle();

  if (existingLink?.user_id) {
    return {
      error:
        "This employee already activated their portal. Ask them to sign in.",
    };
  }

  const { error: expireError } = await admin
    .from("employee_portal_invites")
    .update({ expires_at: nowIso })
    .eq("employee_id", input.employeeId)
    .is("accepted_at", null)
    .gt("expires_at", nowIso);

  if (expireError) {
    console.error("expire prior portal invites:", expireError.message);
    return { error: "Could not prepare invite." };
  }

  const rawToken = generatePortalInviteToken();
  const tokenHash = hashPortalInviteToken(rawToken);

  const { error: insertError } = await admin
    .from("employee_portal_invites")
    .insert({
      employee_id: input.employeeId,
      company_id: input.companyId,
      email,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    console.error("insert portal invite:", insertError.message);
    return { error: "Could not create invite." };
  }

  const acceptUrl = `${getAppBaseUrl()}/portal/accept-invite?token=${encodeURIComponent(rawToken)}`;

  let emailed = false;
  let emailError: string | undefined;
  try {
    await sendEmployeePortalInviteEmail({
      email,
      employeeName: input.employeeName,
      companyName: input.companyName,
      acceptUrl,
    });
    emailed = true;
  } catch (error) {
    emailError =
      error instanceof Error ? error.message : "Email provider rejected the send.";
    console.error("portal invite email failed:", emailError);
    if (!INVITE_EMAIL_DEV_FALLBACK) {
      return {
        error: `Could not send invite email: ${emailError}`,
      };
    }
    console.info("[dev] portal invite URL (email skipped):", acceptUrl);
  }

  const { error: stampError } = await admin
    .from("employees")
    .update({ portal_invited_at: nowIso })
    .eq("id", input.employeeId)
    .eq("company_id", input.companyId);

  if (stampError) {
    console.error("stamp portal_invited_at:", stampError.message);
    return { error: "Invite created but could not update roster status." };
  }

  return {
    ok: true,
    email,
    invitedAt: nowIso,
    acceptUrl,
    emailed,
    ...(emailError ? { emailError } : {}),
  };
}
