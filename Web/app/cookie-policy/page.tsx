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
            <strong>Analytics:</strong> Help us understand traffic and product
            usage in aggregate so we can improve the Service. We configure
            analytics to minimize identification where possible.
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
          Most browsers let you block or delete cookies through settings. Blocking
          strictly necessary cookies may prevent you from signing in or using
          parts of the Service. Where required by law, we will request consent
          before placing non-essential cookies on our marketing site.
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
