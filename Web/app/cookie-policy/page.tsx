import type { Metadata } from "next";
import {
  LandingLegalPage,
  LegalInlineLink,
  LegalSection,
} from "@/components/landing/landing-legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy | Elitebase",
  description: "How Elitebase uses cookies and similar technologies.",
};

const LAST_MODIFIED = "January 1, 2026";

export default function CookiePolicyPage() {
  return (
    <LandingLegalPage
      title="Cookie Policy"
      lastModified={LAST_MODIFIED}
      documentTitle="ELITEBASE COOKIE POLICY"
    >
      <LegalSection title="1. Overview.">
        <p>
          This Cookie Policy explains how Elitebase (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) uses cookies and similar
          technologies on our marketing website and authenticated web
          applications. It should be read together with our{" "}
          <LegalInlineLink href="/privacy-policy">Privacy Policy</LegalInlineLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. What are cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a
          website. They help sites remember preferences, keep you signed in, and
          understand how pages are used. We may also use local storage or
          similar browser storage for the same purposes where appropriate.
        </p>
      </LegalSection>

      <LegalSection title="3. Types of cookies we use.">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Strictly necessary:</strong> Required for security,
            authentication, and core features (for example, session cookies
            when you sign in to the employer dashboard).
          </li>
          <li>
            <strong>Functional:</strong> Remember choices such as language or
            UI preferences where we offer them.
          </li>
          <li>
            <strong>Analytics &amp; session replay:</strong> With your consent,
            we use PostHog for product analytics and session recording, and
            Sentry for error monitoring and session replay. These help us fix
            bugs and improve the Service. We mask form inputs (including PIN
            fields) and block camera previews from recordings. We do not send
            face images or biometric templates to analytics tools.
          </li>
        </ul>
        <p>
          We do not use cookies to sell personal information. Kiosk tablets
          operated by employers may use device-local storage for clock-in
          sessions; that use is governed by the employer&apos;s program and our
          Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="4. Your choices.">
        <p>
          When you first visit, you can Accept or Reject analytics cookies via
          our cookie banner. You can change your choice anytime using{" "}
          <strong>Cookie settings</strong> in the site footer. Rejecting
          analytics does not affect sign-in; we may still collect technical
          error reports (without session replay) to keep the Service reliable.
          Most browsers also let you block or delete cookies through settings.
          Blocking strictly necessary cookies may prevent you from signing in
          or using parts of the Service.
        </p>
      </LegalSection>

      <LegalSection title="5. Updates.">
        <p>
          We may update this Cookie Policy from time to time. We will post
          changes on this page and update the &quot;Last Modified&quot; date.
        </p>
      </LegalSection>

      <LegalSection title="6. Contact.">
        <p>
          For questions about cookies, contact us at{" "}
          <LegalInlineLink href="mailto:privacy@elitebase.com">
            privacy@elitebase.com
          </LegalInlineLink>
          .
        </p>
      </LegalSection>
    </LandingLegalPage>
  );
}
