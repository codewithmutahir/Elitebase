import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Elitebase",
  description:
    "How Elitebase collects, uses, and protects personal and biometric data.",
};

const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL ?? "privacy@elitebase.com";

const LAST_UPDATED = "May 28, 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
      <div className="mt-4 space-y-4 text-[#334155] leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-[#2563EB]">
            ← Elitebase
          </Link>
          <p className="text-xs text-[#64748B]">Last updated: {LAST_UPDATED}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-4 text-[#64748B]">
          Elitebase (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) provides
          workforce time-tracking software for employers and on-site kiosk
          clock-in. This policy describes how we handle personal information and
          biometric data when you use our website, employer dashboard, and
          related services (collectively, the &quot;Service&quot;).
        </p>

        <Section title="1. Who this policy applies to">
          <p>
            This policy applies to <strong>company administrators</strong> who
            register and manage accounts on Elitebase, and to{" "}
            <strong>employees</strong> whose employers add them to the platform.
            Employees typically interact with Elitebase only through an
            employer-provided kiosk tablet (PIN and optional face verification),
            not through a personal web login in Phase 1.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>Depending on how you use the Service, we may collect:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Account data</strong> (employers): name, email address,
              password (stored in hashed form), and company profile details.
            </li>
            <li>
              <strong>Employee profile data</strong> (added by the employer):
              name, optional email, role, department, position, and hire date.
            </li>
            <li>
              <strong>Kiosk PIN</strong>: a short numeric code used to identify
              an employee at a tablet. PINs are stored using one-way hashing; we
              do not store plain-text PINs after initial setup.
            </li>
            <li>
              <strong>Biometric data (face templates)</strong>: if an employer
              enrolls employees in face verification, the kiosk may capture a
              facial image and convert it into a mathematical face template
              (a numeric &quot;face descriptor&quot;). We do{" "}
              <strong>not</strong> use biometric data for surveillance,
              marketing, or identification outside of timekeeping at the
              employer&apos;s kiosk.
            </li>
            <li>
              <strong>Attendance records</strong>: clock-in, clock-out, break
              events, timestamps, optional face-match scores, and the tablet used.
            </li>
            <li>
              <strong>Technical data</strong>: device/tablet identifiers, API
              logs, and similar data needed to operate and secure the Service.
            </li>
          </ul>
        </Section>

        <Section title="3. Biometric data — purpose and consent">
          <p>
            Biometric information is collected{" "}
            <strong>only for timekeeping and fraud prevention</strong> at the
            employer&apos;s direction: to verify that the person clocking in is
            the enrolled employee. We do not use biometric data for surveillance,
            marketing, or identification outside of timekeeping at the
            employer&apos;s kiosk.
          </p>
          <p>
            On the kiosk, employees are shown a consent screen before the camera
            is used for enrollment. Enrollment does not proceed without
            acceptance. Face templates are compared only to the enrolled
            employee&apos;s stored template during clock-in verification.
          </p>
        </Section>

        <Section title="4. Employer responsibilities (biometric & employee consent)">
          <p>
            If you register as a <strong>company administrator</strong> and use
            face recognition for your workforce, you agree that your company is
            responsible for compliance with applicable privacy and biometric
            laws—not Elitebase acting as your legal advisor.
          </p>
          <p>
            <strong>Before enrolling any employee in face recognition</strong>,
            your company must obtain <strong>written consent</strong> from that
            employee (or otherwise satisfy legal requirements in your
            jurisdiction). This includes, where applicable:
          </p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <strong>Illinois</strong> — Biometric Information Privacy Act
              (BIPA): written notice, purpose, retention schedule, and written
              release before collecting or using biometric identifiers or
              information.
            </li>
            <li>
              <strong>Texas</strong> — Capture or Use of Biometric Identifier Act
              (CUBI): notice and consent before capturing biometric identifiers
              for commercial purposes.
            </li>
            <li>
              <strong>California</strong> — California Consumer Privacy Act
              (CCPA/CPRA): notice at collection, purpose limitation, and
              employee rights for sensitive personal information, including
              biometrics where applicable.
            </li>
          </ul>
          <p>
            Elitebase provides kiosk consent flows and technical controls to
            support your program, but <strong>you</strong> remain responsible for
            obtaining and documenting employee consent, maintaining required
            notices, and honoring employee rights requests. Do not enable face
            enrollment for employees who have not provided valid consent.
          </p>
        </Section>

        <Section title="5. How we use information">
          <p>We use collected information to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Provide, maintain, and improve the Service;</li>
            <li>Authenticate employer accounts and secure the platform;</li>
            <li>Record and display attendance and timesheets for the employer;</li>
            <li>Operate kiosk pairing, PIN verification, and face matching;</li>
            <li>Respond to support requests and legal obligations;</li>
            <li>Detect abuse, fraud, and security incidents.</li>
          </ul>
        </Section>

        <Section title="6. Retention">
          <p>
            We retain personal and employment-related data for as long as the
            employer&apos;s account is active and as needed to provide the
            Service.
          </p>
          <p>
            <strong>Biometric face templates and related enrollment metadata</strong>{" "}
            are retained for up to <strong>one (1) year</strong> after the
            employee is deactivated or the employer deletes the enrollment,
            whichever occurs first, unless a longer period is required by law or
            agreed in writing with the employer. After that period, templates are
            deleted or irreversibly destroyed.
          </p>
          <p>
            Attendance records are retained according to the employer&apos;s
            business needs and applicable wage-and-hour laws; employers may
            export data before account closure.
          </p>
        </Section>

        <Section title="7. We do not sell your information">
          <p>
            We do <strong>not</strong> sell, rent, or trade personal information
            or biometric data to third parties for their marketing purposes. We
            do not disclose biometric data to third parties except as described
            below.
          </p>
        </Section>

        <Section title="8. Service providers and disclosures">
          <p>
            We use trusted infrastructure providers to run the Service (for
            example, cloud hosting, database, and email delivery). They process
            data only on our instructions and under contractual safeguards. We
            may also disclose information if required by law, court order, or to
            protect rights, safety, and security.
          </p>
        </Section>

        <Section title="9. Your rights and choices">
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or obtain a copy of your personal information, and to
            withdraw consent for biometric processing where applicable.
          </p>
          <p>
            <strong>Employees</strong> should contact their{" "}
            <strong>employer</strong> first to request access, correction, or
            deletion of employment and biometric data, since the employer controls
            the workplace program. We will assist employers in fulfilling valid
            requests.
          </p>
          <p>
            <strong>Employer account holders</strong> may update company and
            account settings in the dashboard or contact us using the information
            below.
          </p>
          <p>
            California residents may have additional rights under the CCPA/CPRA,
            including the right to know, delete, and correct personal
            information, and to limit use of sensitive personal information. We
            do not use biometric data for purposes beyond timekeeping as
            described in this policy.
          </p>
        </Section>

        <Section title="10. Security">
          <p>
            We use administrative, technical, and organizational measures
            designed to protect data, including encryption in transit, access
            controls, and hashed storage for credentials and PINs. No method of
            transmission or storage is completely secure; we cannot guarantee
            absolute security.
          </p>
        </Section>

        <Section title="11. Children">
          <p>
            The Service is intended for workplace use and is not directed to
            children under 16. We do not knowingly collect information from
            children.
          </p>
        </Section>

        <Section title="12. Changes to this policy">
          <p>
            We may update this policy from time to time. We will post the
            revised version on this page and update the &quot;Last updated&quot;
            date. Material changes may be communicated to account holders by
            email or in-product notice where appropriate.
          </p>
        </Section>

        <Section title="13. Contact us">
          <p>
            For privacy questions, biometric data requests, or to exercise your
            rights, contact:
          </p>
          <p>
            <strong>Elitebase Privacy</strong>
            <br />
            Email:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="text-sm text-[#64748B]">
            Please include your name, employer (if you are an employee), and a
            description of your request. We aim to respond within 30 days where
            required by law.
          </p>
        </Section>

        <footer className="mt-16 border-t border-[#E2E8F0] pt-8 text-sm text-[#64748B]">
          <Link href="/" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
            Return to home
          </Link>
          {" · "}
          <Link href="/register" className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]">
            Get started
          </Link>
        </footer>
      </main>
    </div>
  );
}
