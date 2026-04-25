import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Billing Policy — StartupKit",
  description:
    "How StartupKit subscriptions, credit purchases, refunds, plan changes, and cancellations work.",
};

export default function BillingPolicyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-zinc-100 mb-8 inline-block"
        >
          ← Back to home
        </Link>

        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Billing Policy
        </h1>
        <p className="text-zinc-400 mb-12">Last updated: April 20, 2026</p>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 mb-12 text-sm text-amber-100">
          <strong>Quick summary:</strong> Subscriptions can be cancelled
          anytime. Credit top-up purchases are <strong>final and
          non-refundable</strong>. Generated media files are deleted 90 days
          after subscription cancellation; financial records are retained.
        </div>

        <Section number="1" title="Two billing products">
          <p>
            StartupKit has exactly two paid products. They are independent —
            buying one does not affect the other.
          </p>
          <Table>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Recurring?</Th>
                <Th>Refundable?</Th>
                <Th>Cancellable?</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>
                  <strong>Subscription plan</strong> (Free / Pro / Business)
                </Td>
                <Td>Yes (monthly or annual)</Td>
                <Td>Pro-rated on cancellation</Td>
                <Td className="text-emerald-400">Yes — anytime</Td>
              </tr>
              <tr>
                <Td>
                  <strong>Credit top-up</strong> (one-time pack)
                </Td>
                <Td>No</Td>
                <Td className="text-amber-300">No — final sale</Td>
                <Td className="text-amber-300">No</Td>
              </tr>
            </tbody>
          </Table>
        </Section>

        <Section number="2" title="Subscription plans">
          <H3>2.1 The three plans</H3>
          <Table>
            <thead>
              <tr>
                <Th>Plan</Th>
                <Th>Price</Th>
                <Th>Monthly credits</Th>
                <Th>Storage</Th>
                <Th>Orgs / members</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>Free</Td>
                <Td>$0</Td>
                <Td>50</Td>
                <Td>300 MB</Td>
                <Td>0 / 1</Td>
              </tr>
              <tr>
                <Td>Pro</Td>
                <Td>$45/mo or $39.90/mo annual</Td>
                <Td>3,500</Td>
                <Td>10 GB</Td>
                <Td>1 / 5</Td>
              </tr>
              <tr>
                <Td>Business</Td>
                <Td>$119/mo or $89.90/mo annual</Td>
                <Td>8,000</Td>
                <Td>20 GB</Td>
                <Td>3 / 15</Td>
              </tr>
            </tbody>
          </Table>

          <H3>2.2 Cancellation</H3>
          <p>
            Cancel anytime from <strong>Billing & Subscription → Plans</strong>.
            Cancellation takes effect immediately when processed by Clerk
            Billing. Your plan downgrades to <strong>Free</strong>; unused
            subscription credits from your previous plan are clawed back; the
            Free plan&apos;s 100-credit grant is then issued.
          </p>
          <p>
            <strong>Top-up credits you have purchased are not affected</strong> —
            they remain in your balance and never expire. Any organizations
            you created are marked lapsed (see §5).
          </p>

          <H3>2.3 Plan changes (upgrade / downgrade) mid-cycle</H3>
          <ul>
            <li>
              <strong>Upgrade</strong> (Free→Pro, Pro→Business, Free→Business):
              you receive the full new monthly credit allowance immediately.
              Existing unused credits are preserved — the upgrade is purely
              additive.
            </li>
            <li>
              <strong>Downgrade</strong> (Business→Pro, Pro→Free,
              Business→Free): the unused portion of the previous plan&apos;s
              monthly grant is clawed back, then the new plan&apos;s grant is
              applied. Top-up purchase credits are never clawed back.
            </li>
            <li>
              <strong>Same plan, mid-cycle</strong>: no change.
            </li>
          </ul>
          <p className="text-zinc-400 text-sm">
            The asymmetric rule (preserve on upgrade, claw back on downgrade)
            prevents accumulating credits by repeatedly cycling subscriptions.
          </p>
        </Section>

        <Section number="3" title="Credit top-up purchases">
          <H3>3.1 The packs</H3>
          <Table>
            <thead>
              <tr>
                <Th>Pack</Th>
                <Th>Price</Th>
                <Th>Credits</Th>
                <Th>Per credit</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>Starter</Td>
                <Td>$9.90</Td>
                <Td>1,000</Td>
                <Td>$0.0099</Td>
              </tr>
              <tr>
                <Td>Standard</Td>
                <Td>$44.90</Td>
                <Td>5,000</Td>
                <Td>$0.00898 (Save 9%)</Td>
              </tr>
              <tr>
                <Td>Pro</Td>
                <Td>$199.00</Td>
                <Td>25,000</Td>
                <Td>$0.00796 (Save 20%)</Td>
              </tr>
            </tbody>
          </Table>

          <H3>3.2 Where the credits land</H3>
          <p>
            Top-up purchases always go into your <strong>personal workspace
            credit balance</strong>, regardless of whether you bought them
            while viewing an org. Use the <strong>Transfer Credits</strong>
            dialog to move them into an org you own.
          </p>

          <H3>3.3 No refunds, no cancellation</H3>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 my-4">
            <p className="text-amber-100 mb-3">
              <strong>Credit top-up purchases are final.</strong> Once a
              purchase completes:
            </p>
            <ul className="space-y-1 text-amber-100/90 text-sm">
              <li>• The credits are immediately added to your balance.</li>
              <li>• The purchase cannot be cancelled or refunded under any
                circumstance.</li>
              <li>• Credits never expire.</li>
              <li>• Credits cannot be converted back to cash, transferred
                between users, or sold.</li>
            </ul>
          </div>
          <p>
            This policy exists because credits are spent in real time on
            third-party AI services (KIE AI, OpenAI, Anthropic, etc.) — the
            underlying compute cost is incurred at the moment of generation
            and cannot be reversed.
          </p>
          <p>
            If a generation fails for technical reasons (NSFW filter, provider
            error, etc.), the system <strong>automatically refunds the
            credits to your balance</strong> — no support ticket needed.
            Generations that succeed but produce an output you don&apos;t
            like are not refundable.
          </p>
        </Section>

        <Section number="4" title="Lapsed subscriptions and data retention">
          <p>
            When a paid subscription ends (cancellation or expiration without
            renewal), affected workspaces are marked <strong>lapsed</strong>.
            New AI generation is blocked; existing files remain accessible
            during the grace period.
          </p>
          <Table>
            <thead>
              <tr>
                <Th>Time after lapse</Th>
                <Th>What happens</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td>Day 0</Td>
                <Td>
                  Subscription ends. Workspaces marked lapsed. New generation
                  blocked. Existing files remain accessible.
                </Td>
              </tr>
              <tr>
                <Td>Days 1 – 90</Td>
                <Td>
                  Grace period. Resubscribe to immediately unlapse and recover
                  full access. Files remain in storage.
                </Td>
              </tr>
              <tr>
                <Td>Day 90+</Td>
                <Td>
                  Eligible for media-file purge. Generated images, videos,
                  and audio are deleted from cloud storage. The financial
                  audit trail (ledger, transactions, invoices) is preserved.
                </Td>
              </tr>
            </tbody>
          </Table>
          <p>
            <strong>Audit-trail retention is not optional.</strong> Even on
            account deletion, financial records are kept for the period
            required by applicable tax law (typically 5–7 years).
          </p>
        </Section>

        <Section number="5" title="Disputes and chargebacks">
          <p>
            If you disagree with a charge, please contact support{" "}
            <strong>before</strong> initiating a chargeback with your bank.
            We can usually resolve issues directly faster than a chargeback
            dispute resolves.
          </p>
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 my-4 text-rose-100 text-sm">
            A chargeback initiated against a credit top-up purchase will not
            result in credits being removed from your balance after the
            credits have been spent — meaning the chargeback effectively
            makes those credits free, which we treat as fraud and may result
            in account suspension and reporting to fraud-prevention services.
          </div>
        </Section>

        <Section number="6" title="Contact">
          <p>
            For billing questions, contact our support team. Include your
            account email, the transaction date and amount, and a description
            of the issue. We aim to respond within one business day.
          </p>
        </Section>

        <hr className="border-zinc-800 my-12" />
        <p className="text-xs text-zinc-500 text-center">
          By using StartupKit you agree to this Billing Policy. We will notify
          users via email of any material changes at least 30 days in advance.
        </p>
      </div>
    </main>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4 flex items-baseline gap-3">
        <span className="text-zinc-500 font-mono text-lg">§{number}</span>
        {title}
      </h2>
      <div className="space-y-3 text-zinc-300 leading-relaxed">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-zinc-100 mt-6 mb-2">
      {children}
    </h3>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-2 bg-zinc-900 text-zinc-400 font-medium border-b border-zinc-800">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`px-3 py-2 border-t border-zinc-800/50 align-top ${className}`}
    >
      {children}
    </td>
  );
}
