import type { Metadata } from "next";
import {
  LandingLegalPage,
  LegalInlineLink,
  LegalSection,
} from "@/components/landing/landing-legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | Elitebase",
  description: "Terms governing use of the Elitebase website and services.",
};

const LAST_MODIFIED = "January 1, 2026";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://elitebase.com";
const LEGAL_EMAIL =
  process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL ?? "privacy@elitebase.com";

export default function TermsOfServicePage() {
  return (
    <LandingLegalPage
      title="Terms of Service"
      lastModified={LAST_MODIFIED}
      documentTitle="ELITEBASE WEBSITE AND SERVICE TERMS OF USE"
    >
      <LegalSection title="1. Background.">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern access to and use of
          the Elitebase website, employer dashboard, kiosk software, and related
          services (collectively, the &quot;Service&quot;) operated by Elitebase
          (&quot;Elitebase,&quot; &quot;we,&quot; &quot;us,&quot; or
          &quot;our&quot;). By accessing or using the Service, you agree to
          these Terms. If you do not agree, do not use the Service.
        </p>
        <p>
          The Service is offered at{" "}
          <LegalInlineLink href={SITE_URL} external>
            {SITE_URL}
          </LegalInlineLink>{" "}
          and associated applications. Employers register company accounts;
          employees typically clock in through employer-provided kiosks under
          the employer&apos;s program.
        </p>
      </LegalSection>

      <LegalSection title="2. Modification.">
        <p>
          We may update these Terms from time to time. We will post the revised
          Terms on this page and update the &quot;Last Modified&quot; date.
          Material changes may be communicated to account holders by email or
          in-product notice. Continued use of the Service after changes become
          effective constitutes acceptance of the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and eligibility.">
        <p>
          You must be at least 18 years old and authorized to bind your
          organization to create an employer account. You are responsible for
          maintaining the confidentiality of login credentials and for all
          activity under your account. You agree to provide accurate registration
          information and to keep it current.
        </p>
      </LegalSection>

      <LegalSection title="4. Employer responsibilities.">
        <p>
          If you use Elitebase for your workforce, you are responsible for
          compliance with employment, wage-and-hour, privacy, and biometric laws
          applicable to your locations and employees—including obtaining any
          required notices and consents before enabling PIN or face verification
          at kiosks. Elitebase provides tools to support timekeeping; you remain
          the data controller for employee data you upload or generate through
          the Service.
        </p>
      </LegalSection>

      <LegalSection title="5. Acceptable use.">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Use the Service in violation of law or third-party rights;</li>
          <li>Attempt to gain unauthorized access to systems, accounts, or data;</li>
          <li>Interfere with or disrupt the Service or its security measures;</li>
          <li>Reverse engineer or copy the Service except as permitted by law;</li>
          <li>Use the Service to build a competing product using our proprietary materials.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Subscription and fees.">
        <p>
          Paid plans, if offered, are billed according to the pricing and billing
          terms presented at signup or in your account. Fees are non-refundable
          except where required by law or expressly stated in your order. We may
          change pricing with notice to active subscribers as described in your
          agreement or on the website.
        </p>
      </LegalSection>

      <LegalSection title="7. Intellectual property.">
        <p>
          Elitebase and its licensors retain all rights in the Service, including
          software, branding, and documentation. We grant you a limited,
          non-exclusive, non-transferable license to use the Service for your
          internal business operations during your subscription or trial period.
        </p>
      </LegalSection>

      <LegalSection title="8. Disclaimers.">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE.&quot;
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
          EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE
          UNINTERRUPTED OR ERROR-FREE OPERATION.
        </p>
      </LegalSection>

      <LegalSection title="9. Limitation of liability.">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, ELITEBASE AND ITS SUPPLIERS
          WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, OR
          GOODWILL. OUR TOTAL LIABILITY FOR CLAIMS ARISING FROM OR RELATED TO
          THE SERVICE IS LIMITED TO THE GREATER OF (A) AMOUNTS YOU PAID US IN
          THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS
          ($100).
        </p>
      </LegalSection>

      <LegalSection title="10. Termination.">
        <p>
          You may stop using the Service at any time. We may suspend or
          terminate access if you breach these Terms or if required for legal or
          security reasons. Upon termination, your right to use the Service ends;
          sections that by nature should survive will survive (including
          intellectual property, disclaimers, and limitation of liability).
        </p>
      </LegalSection>

      <LegalSection title="11. Privacy.">
        <p>
          Our collection and use of personal information is described in our{" "}
          <LegalInlineLink href="/privacy-policy">Privacy Policy</LegalInlineLink>
          . By using the Service, you acknowledge that policy.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact.">
        <p>
          Questions about these Terms may be sent to{" "}
          <LegalInlineLink href={`mailto:${LEGAL_EMAIL}`}>
            {LEGAL_EMAIL}
          </LegalInlineLink>
          .
        </p>
      </LegalSection>
    </LandingLegalPage>
  );
}
