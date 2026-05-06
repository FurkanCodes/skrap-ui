import type { Metadata } from "next";

import { LegalDocument, LegalList, type LegalSection } from "@/components/legal/legal-document";

export const metadata: Metadata = {
  title: "Refund Policy | Dealvinci",
  description:
    "How Dealvinci handles refunds, cancellations, paid plans, billing errors, and usage credits.",
};

const effectiveDate = "April 28, 2026";
const contactEmail = "hello@dealvinci.com";

const sections: LegalSection[] = [
  {
    id: "scope",
    label: "01",
    title: "Scope",
    children: (
      <>
        <p>
          This Refund Policy explains how Dealvinci handles refund requests for paid plans, paid
          usage credits, add-ons, and other billing charges connected to the Dealvinci service.
        </p>
        <p>
          Free trials, free plans, promotional credits, beta access, coupons, discounts, and other
          no-charge entitlements have no cash value and are not eligible for refund, credit, or
          exchange.
        </p>
      </>
    ),
  },
  {
    id: "subscriptions",
    label: "02",
    title: "Paid subscriptions",
    children: (
      <>
        <p>
          Subscription fees are billed in advance for the selected billing period. You can cancel a
          paid subscription to stop future renewals, and cancellation does not remove access you
          have already paid for during the current billing period unless your account is suspended
          or terminated under our Terms.
        </p>
        <p>
          Except where required by law or approved under this policy, subscription fees are not
          refundable after the billing period begins, and we do not provide automatic refunds or
          prorated credits for partial billing periods.
        </p>
      </>
    ),
  },
  {
    id: "eligible-refunds",
    label: "03",
    title: "When refunds may be available",
    children: (
      <>
        <p>We may approve a refund when one of these situations applies:</p>
        <LegalList>
          <li>
            You request a refund within 14 days of your first paid subscription purchase and your
            account has not materially used the paid service.
          </li>
          <li>
            You were charged twice for the same plan, charged after a confirmed cancellation, or
            charged an amount that does not match the checkout or order terms.
          </li>
          <li>
            A technical issue caused Dealvinci to fail to provide the paid access, credits, or
            entitlement you purchased, and we cannot reasonably correct the issue.
          </li>
          <li>
            A purchase was made without your authorization, subject to verification and fraud review.
          </li>
          <li>Applicable law gives you a non-waivable refund, cancellation, or cooling-off right.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "non-refundable",
    label: "04",
    title: "What is not refundable",
    children: (
      <>
        <p>Unless required by law, these items are not refundable:</p>
        <LegalList>
          <li>credits already consumed by product checks, previews, scraping jobs, or alerts;</li>
          <li>completed tracker runs, successful product lookups, and delivered notifications;</li>
          <li>unused credits at the end of a billing period or after account cancellation;</li>
          <li>partial months or partial billing periods after service access has begun;</li>
          <li>renewals you did not cancel before the renewal date;</li>
          <li>fees connected to accounts suspended or terminated for abuse, fraud, or Terms violations;</li>
          <li>changes in plan price, feature availability, retailer behavior, or third-party availability.</li>
        </LegalList>
      </>
    ),
  },
  {
    id: "credits",
    label: "05",
    title: "Usage credits",
    children: (
      <>
        <p>
          Dealvinci uses credits to measure paid usage, such as product checks, scraping work,
          previews, monitoring runs, and supported alert activity. Credits are consumed when
          Dealvinci starts or completes the relevant service operation, depending on the feature and
          plan rules shown in the product.
        </p>
        <p>
          Credits are service entitlements, not money or stored value. They cannot be withdrawn,
          transferred outside Dealvinci, redeemed for cash, or refunded after they are used.
        </p>
      </>
    ),
  },
  {
    id: "request",
    label: "06",
    title: "How to request a refund",
    children: (
      <>
        <p>
          To request a refund, email{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>{" "}
          with enough information for us to review the charge.
        </p>
        <LegalList>
          <li>the email address on your Dealvinci account;</li>
          <li>the invoice, receipt, transaction ID, or charge date;</li>
          <li>the plan or credit purchase involved;</li>
          <li>a short explanation of why you are requesting a refund.</li>
        </LegalList>
        <p>
          Refund requests should be sent within 14 days of the charge unless applicable law requires
          a longer period.
        </p>
      </>
    ),
  },
  {
    id: "review",
    label: "07",
    title: "Review and processing",
    children: (
      <>
        <p>
          We review refund requests in good faith and may ask for additional information to confirm
          account ownership, usage, cancellation status, billing history, or suspected unauthorized
          activity.
        </p>
        <p>
          If a refund is approved, we will usually issue it to the original payment method. Payment
          processors, card networks, banks, or tax rules may affect the amount, timing, or method of
          the refund. Approved refunds may take several business days to appear after processing.
        </p>
      </>
    ),
  },
  {
    id: "cancellations",
    label: "08",
    title: "Cancellations",
    children: (
      <>
        <p>
          You are responsible for canceling paid subscriptions before renewal if you do not want
          future charges. If online cancellation is available in your account, use that option. You
          can also contact us at{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>{" "}
          for cancellation help.
        </p>
        <p>
          Cancellation stops future renewal charges after it is processed. It does not automatically
          refund charges already incurred, unused billing time, or unused credits unless this policy
          or applicable law says otherwise.
        </p>
      </>
    ),
  },
  {
    id: "chargebacks",
    label: "09",
    title: "Chargebacks and payment disputes",
    children: (
      <p>
        If you believe a charge is wrong, contact us first so we can investigate and resolve it
        quickly. If a chargeback or payment dispute is opened, we may suspend the affected account,
        pause paid features, preserve billing records, and respond to the payment provider with
        relevant account and usage information.
      </p>
    ),
  },
  {
    id: "changes-contact",
    label: "10",
    title: "Changes and contact",
    children: (
      <>
        <p>
          We may update this Refund Policy from time to time. The version posted on our website
          applies to refund requests submitted after its effective date, unless applicable law
          requires otherwise.
        </p>
        <p>
          Questions about billing, refunds, or cancellation can be sent to{" "}
          <a className="underline underline-offset-4" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Dealvinci refunds"
      title="Refund Policy"
      description="This policy explains when Dealvinci may approve refunds for paid plans, billing errors, usage credits, and cancellation-related charges."
      effectiveDate={effectiveDate}
      sections={sections}
    />
  );
}
