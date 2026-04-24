import type { Metadata } from "next";

import { LegalDocument, LegalList, type LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy | Dealvinci",
  description:
    "How Dealvinci collects, uses, shares, and protects information for accounts, trackers, notifications, and support.",
};

const effectiveDate = "April 25, 2026";
const contactEmail = "hello@dealvinci.com";

const sections: LegalSection[] = [
  {
    id: "scope",
    label: "01",
    title: "Scope and role",
    children: (
      <>
        <p>
          This Privacy Policy explains how Dealvinci collects, uses, discloses, and protects
          personal information when you use our website, account system, price tracking workspace,
          notification integrations, and related services.
        </p>
        <p>
          Dealvinci is the controller of personal information we process for our own service
          operations. When you submit product URLs, retail pages, target prices, notification
          preferences, or support requests, you are responsible for making sure you have the right
          to provide that information to us.
        </p>
      </>
    ),
  },
  {
    id: "information-collected",
    label: "02",
    title: "Information we collect",
    children: (
      <>
        <p>We collect information needed to operate a reliable price tracking service:</p>
        <LegalList>
          <li>
            Account information, such as name, email address, email verification status, profile
            image if provided by a social login provider, account creation date, and account update
            date.
          </li>
          <li>
            Authentication and security information, such as password hashes, verification tokens,
            session identifiers, session expiry, IP address, user agent, rate limit records, audit
            events, and encrypted OAuth tokens if you connect a supported social login provider.
          </li>
          <li>
            Tracker and product information, such as product URLs, store or site metadata, product
            names, images, prices, currencies, target amounts, tracking mode, check interval,
            tracker status, notification preferences, and recent check state.
          </li>
          <li>
            Notification integration information, including Telegram connection state, bot username,
            chat identifier, Telegram username if available, connection expiry, and connection
            timestamps.
          </li>
          <li>
            Plan, entitlement, and usage information, such as plan key, active tracker limit,
            minimum check interval, monthly check credits, consumed credits, remaining credits, and
            reset period.
          </li>
          <li>
            Communications and support information, including messages you send to us, email
            delivery metadata, and information needed to respond to account, access, billing, or
            product questions.
          </li>
          <li>
            Device and local preference information, such as cookies required for authentication,
            theme preference, sidebar preference, and local cache data used to keep the workspace
            responsive.
          </li>
        </LegalList>
      </>
    ),
  },
  {
    id: "use",
    label: "03",
    title: "How we use information",
    children: (
      <>
        <p>We use personal information to:</p>
        <LegalList>
          <li>create, verify, secure, and maintain your account and sessions;</li>
          <li>process product URLs, create previews, run price checks, and maintain trackers;</li>
          <li>send service emails, verification emails, password reset emails, and alerts;</li>
          <li>connect supported notification channels, including Telegram, at your request;</li>
          <li>apply plan limits, credits, usage controls, and abuse prevention rules;</li>
          <li>debug errors, preserve service reliability, prevent fraud, and enforce our Terms;</li>
          <li>respond to support requests and administrative inquiries;</li>
          <li>comply with legal obligations and protect rights, safety, and security.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "legal-bases",
    label: "04",
    title: "Legal bases for processing",
    children: (
      <>
        <p>
          Where European or similar privacy laws apply, our legal bases include performance of a
          contract when we provide the service you request, legitimate interests in operating and
          securing Dealvinci, consent where we ask for optional choices, and legal obligations when
          we must preserve or disclose information under applicable law.
        </p>
        <p>
          You can withdraw consent for optional processing where applicable, but doing so may limit
          features that depend on that consent, such as a connected notification channel.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    label: "05",
    title: "How we disclose information",
    children: (
      <>
        <p>We disclose information only as needed to operate and protect Dealvinci:</p>
        <LegalList>
          <li>
            Service providers that host infrastructure, databases, backend processing, email
            delivery, analytics or observability if enabled, support tooling, and security systems.
          </li>
          <li>
            Authentication providers, such as Google or GitHub, when you choose to sign in with
            those providers.
          </li>
          <li>
            Notification services, such as Telegram, when you connect an integration or ask us to
            send alerts through that channel.
          </li>
          <li>
            Retailers, marketplaces, or public websites to the limited extent necessary to request
            product pages or price data for URLs you submit.
          </li>
          <li>
            Payment processors and billing providers if you purchase a paid plan or paid credits.
          </li>
          <li>
            Professional advisers, authorities, or other parties when required by law, to enforce
            our agreements, or to protect rights, safety, and security.
          </li>
          <li>
            Successors in a merger, acquisition, financing, reorganization, or sale of all or part
            of the business, subject to appropriate protections.
          </li>
        </LegalList>
        <p>
          We do not sell personal information. We do not share personal information for
          cross-context behavioral advertising. We do not use sensitive personal information to
          infer characteristics about you.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    label: "06",
    title: "Cookies and local storage",
    children: (
      <>
        <p>
          Dealvinci uses cookies and similar storage for authentication, session continuity,
          security, CSRF protection, rate limiting, theme preference, workspace preference, and
          short-lived client cache behavior. Some cookies are required for the service to work.
        </p>
        <p>
          Your browser may let you block or delete cookies, but blocking required cookies can
          prevent sign-in, account security features, or workspace functionality from working
          correctly.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    label: "07",
    title: "Retention",
    children: (
      <>
        <p>
          We retain personal information for as long as needed to provide Dealvinci, maintain
          business records, resolve disputes, enforce agreements, preserve security, and comply with
          law.
        </p>
        <LegalList>
          <li>Account records are generally kept while your account remains active.</li>
          <li>Trackers and product URL records are kept until you delete them or close the account.</li>
          <li>Authentication sessions expire according to our session settings and may be revoked.</li>
          <li>
            Security logs, rate limit records, audit events, and backup copies may be retained for a
            reasonable period after deletion when needed for integrity, security, or legal reasons.
          </li>
        </LegalList>
      </>
    ),
  },
  {
    id: "rights",
    label: "08",
    title: "Your privacy rights",
    children: (
      <>
        <p>
          Depending on your location, you may have rights to access, correct, delete, export, or
          restrict certain personal information; object to certain processing; opt out of certain
          disclosures; or appeal a privacy request decision.
        </p>
        <p>
          To make a request, email{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          . We may ask you to verify your identity before responding. We will not discriminate
          against you for exercising privacy rights, but some deletion or restriction requests may
          limit your ability to use Dealvinci.
        </p>
      </>
    ),
  },
  {
    id: "international",
    label: "09",
    title: "International transfers",
    children: (
      <p>
        We may process and store information in countries other than where you live. When required,
        we use appropriate safeguards for international transfers, such as contractual protections
        or other lawful transfer mechanisms.
      </p>
    ),
  },
  {
    id: "security",
    label: "10",
    title: "Security",
    children: (
      <p>
        We use technical and organizational safeguards designed to protect personal information,
        including secure cookies in production, CSRF and origin checks, rate limits, password policy
        enforcement, encrypted OAuth token storage, limited access controls, and audit logging.
        No online service is completely secure, so you should use a strong password and protect your
        account credentials.
      </p>
    ),
  },
  {
    id: "children",
    label: "11",
    title: "Children",
    children: (
      <p>
        Dealvinci is not directed to children under 13, and we do not knowingly collect personal
        information from children under 13. If you believe a child has provided personal information
        to us, contact us so we can take appropriate action.
      </p>
    ),
  },
  {
    id: "automated-processing",
    label: "12",
    title: "Automated processing",
    children: (
      <p>
        Dealvinci uses automated systems to fetch product pages, normalize product information,
        compare prices, apply tracker rules, count usage, and send notifications. We do not use
        automated processing to make decisions that produce legal or similarly significant effects
        about you.
      </p>
    ),
  },
  {
    id: "changes-contact",
    label: "13",
    title: "Changes and contact",
    children: (
      <>
        <p>
          We may update this Privacy Policy as Dealvinci changes. If changes are material, we will
          provide notice by reasonable means, such as posting the updated policy or notifying account
          holders.
        </p>
        <p>
          Questions or privacy requests can be sent to{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Dealvinci privacy"
      title="Privacy Policy"
      description="This policy describes the information we collect to run accounts, product trackers, alerts, integrations, and support, and the choices you have over that information."
      effectiveDate={effectiveDate}
      sections={sections}
    />
  );
}
