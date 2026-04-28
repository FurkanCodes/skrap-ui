import type { Metadata } from "next";

import { LegalDocument, LegalList, type LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service | Dealvinci",
  description:
    "Terms that govern use of Dealvinci accounts, price tracking, credits, notifications, integrations, and support.",
};

const effectiveDate = "April 25, 2026";
const contactEmail = "hello@dealvinci.com";

const sections: LegalSection[] = [
  {
    id: "agreement",
    label: "01",
    title: "Agreement to these Terms",
    children: (
      <>
        <p>
          These Terms of Service govern your access to and use of Dealvinci, including our website,
          account features, price tracking workspace, notification integrations, and related
          services. By creating an account, signing in, submitting product URLs, connecting an
          integration, or otherwise using Dealvinci, you agree to these Terms.
        </p>
        <p>
          If you use Dealvinci on behalf of a company or other organization, you represent that you
          have authority to bind that organization, and &quot;you&quot; includes that organization.
        </p>
      </>
    ),
  },
  {
    id: "service",
    label: "02",
    title: "The service",
    children: (
      <>
        <p>
          Dealvinci helps users submit product URLs, create product previews, monitor prices, set
          target-price or price-drop rules, manage active trackers, and receive supported
          notifications. Price checks, product data extraction, and notifications may depend on
          third-party websites, backend systems, store availability, and notification providers.
        </p>
        <p>
          We may change, suspend, or discontinue parts of Dealvinci as we improve the product,
          respond to third-party changes, maintain security, or comply with law.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    label: "03",
    title: "Eligibility and accounts",
    children: (
      <>
        <p>
          You must be at least 13 years old and legally able to enter into these Terms. You are
          responsible for the information you provide, for maintaining the confidentiality of your
          account credentials, and for all activity under your account.
        </p>
        <p>
          You must provide accurate account information, keep your email address current, complete
          required verification steps, and promptly notify us if you believe your account has been
          compromised.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    label: "04",
    title: "Acceptable use",
    children: (
      <>
        <p>You agree not to:</p>
        <LegalList>
          <li>use Dealvinci for unlawful, deceptive, harmful, or abusive activity;</li>
          <li>
            submit URLs or content that you do not have the right to submit or that contains
            unlawful, sensitive, or private information about another person;
          </li>
          <li>
            interfere with, probe, overload, bypass, scrape, reverse engineer, or disrupt Dealvinci
            or its security controls;
          </li>
          <li>
            use automated systems against Dealvinci outside the functionality we provide through the
            product;
          </li>
          <li>resell, sublicense, or provide Dealvinci as a competing or managed service;</li>
          <li>
            use Dealvinci to violate the terms, robots instructions, intellectual property rights,
            or access restrictions of retailers, marketplaces, or other third-party sites;
          </li>
          <li>evade plan limits, rate limits, credit limits, or abuse prevention measures.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "submitted-content",
    label: "05",
    title: "Your URLs and content",
    children: (
      <>
        <p>
          You retain ownership of product URLs, target settings, notes, preferences, and other
          content you submit to Dealvinci. You grant us a limited license to host, process,
          transmit, display, and use that content as needed to provide, secure, support, and improve
          Dealvinci.
        </p>
        <p>
          You are responsible for the legality, accuracy, and appropriateness of submitted content.
          We may remove or restrict content, trackers, or accounts when necessary to protect the
          service, comply with law, or enforce these Terms.
        </p>
      </>
    ),
  },
  {
    id: "prices",
    label: "06",
    title: "Product data and price alerts",
    children: (
      <>
        <p>
          Dealvinci provides operational price intelligence, not financial, purchasing, legal, or
          professional advice. Product prices, availability, images, seller details, currencies,
          discounts, fees, taxes, shipping, and checkout terms are controlled by third parties and
          may change without notice.
        </p>
        <p>
          We do not guarantee that extracted product data is complete, current, or error-free, that
          every price change will be detected, or that every notification will be delivered. You
          should verify prices and terms directly with the retailer before making a purchase.
        </p>
      </>
    ),
  },
  {
    id: "plans",
    label: "07",
    title: "Plans, credits, and payment",
    children: (
      <>
        <p>
          Dealvinci may offer free plans, paid plans, usage credits, tracker limits, check interval
          limits, channel limits, or other entitlements. Plan features, pricing, credit amounts,
          reset periods, overage policies, and limits may vary by plan and may change over time.
        </p>
        <p>
          If you purchase a paid plan or paid credits, you authorize us and our payment providers to
          charge applicable fees, taxes, and renewals according to the plan terms presented at
          checkout or in an applicable order form. Except where required by law or expressly stated,
          fees are non-refundable and credits have no cash value, except where required by law or
          expressly stated in our Refund Policy.
        </p>
      </>
    ),
  },
  {
    id: "integrations",
    label: "08",
    title: "Third-party services and integrations",
    children: (
      <>
        <p>
          Dealvinci may interoperate with third-party services such as retailers, marketplaces,
          social login providers, email providers, backend infrastructure providers, Telegram, and
          payment processors. Third-party services are not controlled by Dealvinci and may have
          their own terms, privacy policies, outages, rate limits, or data practices.
        </p>
        <p>
          You authorize Dealvinci to exchange information with connected integrations as needed to
          provide the functionality you request, such as sending verification emails, issuing
          password resets, fetching product pages, or delivering Telegram alerts.
        </p>
      </>
    ),
  },
  {
    id: "communications",
    label: "09",
    title: "Communications",
    children: (
      <p>
        We may send transactional messages related to your account, security, verification,
        password resets, trackers, alerts, plan status, legal notices, and support. You may be able
        to adjust optional notification preferences, but important service and account messages may
        still be sent.
      </p>
    ),
  },
  {
    id: "privacy",
    label: "10",
    title: "Privacy",
    children: (
      <p>
        Our Privacy Policy explains how we collect, use, disclose, and protect information. By using
        Dealvinci, you acknowledge that your information will be handled as described in the Privacy
        Policy.
      </p>
    ),
  },
  {
    id: "ownership",
    label: "11",
    title: "Dealvinci ownership",
    children: (
      <p>
        Dealvinci and its software, interfaces, designs, workflows, documentation, logos, trademarks,
        and other service materials are owned by Dealvinci or its licensors. These Terms do not
        grant you ownership of Dealvinci or any intellectual property rights except the limited
        right to use the service according to these Terms.
      </p>
    ),
  },
  {
    id: "feedback",
    label: "12",
    title: "Feedback",
    children: (
      <p>
        If you send ideas, requests, suggestions, or feedback, you grant us a perpetual, worldwide,
        royalty-free right to use that feedback without restriction or compensation, while you retain
        ownership of any underlying rights you may have.
      </p>
    ),
  },
  {
    id: "suspension",
    label: "13",
    title: "Suspension and termination",
    children: (
      <>
        <p>
          You may stop using Dealvinci at any time. We may suspend or terminate access, remove
          trackers, or restrict features if we believe you violated these Terms, created risk for the
          service or other users, failed to pay amounts owed, or if continued service would be
          unlawful or commercially impractical.
        </p>
        <p>
          After termination, provisions that by their nature should survive will survive, including
          ownership, payment obligations, disclaimers, limits of liability, indemnity, and dispute
          terms.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    label: "14",
    title: "Disclaimers",
    children: (
      <p>
        Dealvinci is provided &quot;as is&quot; and &quot;as available.&quot; To the fullest
        extent permitted by law, we disclaim all warranties, whether express, implied, statutory, or
        otherwise, including warranties of merchantability, fitness for a particular purpose, title,
        non-infringement, availability, reliability, accuracy, and uninterrupted or error-free
        operation.
      </p>
    ),
  },
  {
    id: "liability",
    label: "15",
    title: "Limitation of liability",
    children: (
      <p>
        To the fullest extent permitted by law, Dealvinci will not be liable for indirect,
        incidental, special, consequential, exemplary, or punitive damages, or for lost profits,
        revenues, savings, data, goodwill, or business opportunities. Our total liability for all
        claims relating to Dealvinci will not exceed the greater of the amount you paid to us for
        the service in the three months before the event giving rise to the claim or USD $100.
      </p>
    ),
  },
  {
    id: "indemnity",
    label: "16",
    title: "Indemnity",
    children: (
      <p>
        You will defend, indemnify, and hold harmless Dealvinci and its affiliates, personnel, and
        partners from claims, damages, liabilities, losses, and expenses arising from your use of
        Dealvinci, your submitted content, your violation of these Terms, or your violation of any
        law or third-party right.
      </p>
    ),
  },
  {
    id: "governing-law",
    label: "17",
    title: "Governing law and disputes",
    children: (
      <p>
        Unless applicable law requires otherwise, these Terms are governed by the laws identified in
        your order form or written agreement with Dealvinci. If no separate agreement identifies a
        governing law, disputes will be governed by the laws of the jurisdiction where Dealvinci is
        organized, without regard to conflict of law rules. You and Dealvinci will first try to
        resolve disputes informally by contacting{" "}
        <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
          {contactEmail}
        </a>
        .
      </p>
    ),
  },
  {
    id: "changes-contact",
    label: "18",
    title: "Changes and contact",
    children: (
      <>
        <p>
          We may update these Terms from time to time. If changes are material, we will provide
          reasonable notice, such as posting the updated Terms or notifying account holders.
          Continued use after the effective date of updated Terms means you accept the updated
          Terms.
        </p>
        <p>
          Questions about these Terms can be sent to{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Dealvinci terms"
      title="Terms of Service"
      description="These Terms set the rules for using Dealvinci accounts, product tracking, alerts, integrations, plans, and support."
      effectiveDate={effectiveDate}
      sections={sections}
    />
  );
}
