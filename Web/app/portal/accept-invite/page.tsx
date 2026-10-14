import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthFooterText } from "@/components/auth/auth-footer-text";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { AcceptPortalInviteForm } from "@/components/auth/accept-portal-invite-form";
import { auth } from "@/lib/auth";
import {
  authRateLimitErrorCode,
  recordAuthRateLimitFailureInAction,
  resolveAuthRateLimitQueryMessage,
} from "@/lib/auth/enforce-rate-limit";
import { peekAuthRateLimitForAction } from "@/lib/auth/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { getPortalInviteByToken } from "@/lib/portal/queries";
import { parseAcceptPortalInviteFormData } from "@/lib/validations/auth";

async function failAccept(error: string, token?: string): Promise<never> {
  await recordAuthRateLimitFailureInAction("accept-portal-invite");
  const query = token
    ? `?token=${encodeURIComponent(token)}&error=${error}`
    : `?error=${error}`;
  redirect(`/portal/accept-invite${query}`);
}

async function acceptPortalInvite(formData: FormData) {
  "use server";

  const tokenHint = String(formData.get("token") ?? "").trim();
  const rateLimit = await peekAuthRateLimitForAction("accept-portal-invite");
  if (rateLimit.limited) {
    const errorCode = authRateLimitErrorCode(rateLimit);
    const query = tokenHint
      ? `?token=${encodeURIComponent(tokenHint)}&error=${errorCode}`
      : `?error=${errorCode}`;
    redirect(`/portal/accept-invite${query}`);
  }

  const parsed = parseAcceptPortalInviteFormData(formData);
  if (!parsed.success) {
    await failAccept("validation", tokenHint || undefined);
    return;
  }

  const { token, password } = parsed.data;
  const invite = await getPortalInviteByToken(token);

  if (!invite || invite.accepted_at) {
    await failAccept("invalid_token");
    return;
  }

  if (new Date(invite.expires_at).getTime() <= Date.now()) {
    await failAccept("invalid_token", token);
    return;
  }

  if (invite.employee_user_id) {
    await failAccept("already_active", token);
    return;
  }

  if (invite.employee_status === "terminated") {
    await failAccept("deactivated", token);
    return;
  }

  const admin = createClient();
  let userId = "";

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: invite.email,
        password,
        name: invite.employee_name,
      },
      headers: await headers(),
    });
    userId = result.user?.id ?? "";
  } catch (error) {
    if (error instanceof APIError) {
      const code = error.body?.code ?? "";
      if (
        code === "USER_ALREADY_EXISTS" ||
        code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
      ) {
        await failAccept("email_taken", token);
        return;
      }
    }

    console.error(
      "Accept portal invite signup failed:",
      error instanceof Error ? error.message : error
    );
    await failAccept("signup_failed", token);
    return;
  }

  if (!userId) {
    await failAccept("signup_failed", token);
    return;
  }

  const nowIso = new Date().toISOString();

  const { data: linked, error: linkError } = await admin
    .from("employees")
    .update({ user_id: userId })
    .eq("id", invite.employee_id)
    .eq("company_id", invite.company_id)
    .is("user_id", null)
    .select("id");

  if (linkError || !linked?.length) {
    console.error("link employee user_id:", linkError?.message);
    await failAccept("link_failed", token);
    return;
  }

  await admin
    .from("employee_portal_invites")
    .update({ accepted_at: nowIso })
    .eq("id", invite.id);

  try {
    await auth.api.signInEmail({
      body: {
        email: invite.email,
        password,
      },
      headers: await headers(),
    });
  } catch (signInError) {
    console.error(
      "portal invite auto sign-in failed:",
      signInError instanceof Error ? signInError.message : signInError
    );
    redirect("/login?reset=success");
  }

  redirect("/portal");
}

export default async function AcceptPortalInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  const rateLimitMessage = resolveAuthRateLimitQueryMessage(error);
  const errorMessage =
    rateLimitMessage ??
    (error === "invalid_token"
      ? "This invite link is invalid or has expired. Ask your manager to resend it."
      : error === "validation"
        ? "Check your password and confirmation, then try again."
        : error === "email_taken"
          ? "An account with this email already exists. Sign in instead, or ask your manager for a different email."
          : error === "already_active"
            ? "This portal is already activated. Sign in with your password."
            : error === "deactivated"
              ? "This employee account is deactivated."
              : error === "link_failed" || error === "signup_failed"
                ? "Could not activate your portal. Try again or ask for a new invite."
                : error
                  ? "Something went wrong. Please try again."
                  : null);

  const failureSignal = error && !rateLimitMessage ? error : null;

  if (!token) {
    return (
      <AuthSplitLayout>
        <AuthFormCard
          eyebrow="Employee portal"
          title="Invite required"
          subtitle="Open the link from your invite email to activate your portal."
          footer={
            <AuthFooterText prompt="Already activated?" href="/login" label="Sign in" />
          }
        >
          <AuthAlert variant="error">
            Missing invite token. Ask your manager to send a new invite.
          </AuthAlert>
        </AuthFormCard>
      </AuthSplitLayout>
    );
  }

  const invite = await getPortalInviteByToken(token);
  const inviteInvalid =
    !invite ||
    invite.accepted_at ||
    new Date(invite.expires_at).getTime() <= Date.now() ||
    Boolean(invite.employee_user_id);

  return (
    <AuthSplitLayout>
      <AuthFormCard
        eyebrow="Employee portal"
        title={inviteInvalid ? "Invite unavailable" : "Set your password"}
        subtitle={
          inviteInvalid
            ? "This invite cannot be used. Ask your manager to resend it."
            : `Join ${invite.company_name} as ${invite.employee_name}.`
        }
        footer={
          <AuthFooterText prompt="Already activated?" href="/login" label="Sign in" />
        }
      >
        {errorMessage ? (
          <AuthAlert variant="error">{errorMessage}</AuthAlert>
        ) : null}

        {inviteInvalid ? (
          <AuthAlert variant="error">
            This invite link is invalid, expired, or already used.
          </AuthAlert>
        ) : (
          <AcceptPortalInviteForm
            token={token}
            action={acceptPortalInvite}
            failureSignal={failureSignal}
          />
        )}
      </AuthFormCard>
    </AuthSplitLayout>
  );
}
