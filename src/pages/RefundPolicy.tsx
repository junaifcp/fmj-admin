import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import MetaTags from "@/components/SEO/MetaTags";

const RefundPolicy = () => {
  // Helper to format paise -> rupees
  const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

  // Optional: show plan ids/prices for transparency
  const starter = {
    displayName: "Starter",
    pricePaise: 79900, // ₹799
    cashfreePlanId: "CF_STARTER_PLAN_ID",
  };

  const premium = {
    displayName: "Premium",
    pricePaise: 129900, // ₹1299
    cashfreePlanId: "CF_PREMIUM_PLAN_ID",
  };

  return (
    <>
      <MetaTags
        title="Refunds & Cancellations Policy - FitMyJob Recruiter Portal"
        description="Learn about our refund and cancellation policy for recruiter subscriptions on FitMyJob Recruiter Portal. Includes billing, cancellations, and how refunds are processed via Cashfree."
        canonicalUrl="https://recruiter.fitmyskill.com/refund-policy"
      />
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl text-center">
                  Refunds & Cancellations Policy
                </CardTitle>
                <p className="text-center text-gray-600 mt-2">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <div className="space-y-6">
                  <section>
                    <h2 className="text-2xl font-semibold mb-3">1. Overview</h2>
                    <p className="text-gray-700">
                      This Refund and Cancellation Policy explains how refunds,
                      cancellations, and billing disputes are handled for
                      subscriptions purchased on the FitMyJob Recruiter Portal.
                      Subscriptions enable recruiters to post jobs, access
                      analytics, and use premium features.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      2. Subscription Cancellations
                    </h2>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">
                        2.1 How to Cancel
                      </h3>
                      <ul className="list-disc pl-6 text-gray-700 space-y-2">
                        <li>
                          Cancel anytime from{" "}
                          <Link
                            to="/recruiter/profile"
                            className="text-primary underline"
                          >
                            Your Profile &gt; Subscriptions
                          </Link>{" "}
                          in the Recruiter Dashboard.
                        </li>
                        <li>
                          You may also request cancellation by contacting our
                          support team at{" "}
                          <a
                            href="mailto:support@fitmyskill.com"
                            className="text-primary underline"
                          >
                            support@fitmyskill.com
                          </a>
                          .
                        </li>
                        <li>
                          Cancellations take effect at the end of the current
                          billing period; you will retain access until then.
                        </li>
                      </ul>

                      <h3 className="text-lg font-semibold">
                        2.2 Effect of Cancellation
                      </h3>
                      <ul className="list-disc pl-6 text-gray-700 space-y-2">
                        <li>
                          After cancellation, your subscription will not renew
                          and your account will revert to the free tier once the
                          paid period ends.
                        </li>
                        <li>
                          Any job posts created during your paid period remain
                          subject to our retention policies; check your
                          dashboard for details.
                        </li>
                        <li>
                          Cancelling does not automatically issue a refund for
                          the current billing period.
                        </li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      3. Refund Policy
                    </h2>
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">
                        3.1 When Refunds May Be Issued
                      </h3>
                      <p className="text-gray-700">
                        Refunds are considered in the following cases:
                      </p>
                      <ul className="list-disc pl-6 text-gray-700 space-y-2">
                        <li>Duplicate charges or clear billing errors.</li>
                        <li>
                          Technical issues with the Service that prevent use for
                          more than 48 hours (and that are confirmed to be our
                          fault).
                        </li>
                        <li>
                          Subscription purchased in error within 7 days of the
                          initial purchase (case-by-case).
                        </li>
                      </ul>

                      <h3 className="text-lg font-semibold">
                        3.2 Refund Limitations
                      </h3>
                      <ul className="list-disc pl-6 text-gray-700 space-y-2">
                        <li>
                          Monthly subscriptions: refunds are generally not
                          provided for partial unused periods except where
                          required by law or by our discretion for exceptional
                          cases.
                        </li>
                        <li>
                          Annual subscriptions: refunds for early termination
                          may be prorated based on unused time, subject to our
                          evaluation and any promotional terms in effect at
                          purchase.
                        </li>
                        <li>
                          Refund eligibility may be affected if premium features
                          were consumed or if terms were violated.
                        </li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      4. How to Request a Refund
                    </h2>
                    <div className="space-y-3">
                      <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                        <li>
                          Contact support at{" "}
                          <a
                            href="mailto:support@fitmyskill.com"
                            className="text-primary underline"
                          >
                            support@fitmyskill.com
                          </a>{" "}
                          or billing at{" "}
                          <a
                            href="mailto:billing@fitmyskill.com"
                            className="text-primary underline"
                          >
                            billing@fitmyskill.com
                          </a>
                          .
                        </li>
                        <li>
                          Provide your account email, order id, and any Cashfree
                          payment id (`cf_payment_id`) if available.
                        </li>
                        <li>
                          Explain the reason for the refund request and attach
                          any supporting evidence (screenshots, error logs).
                        </li>
                        <li>
                          Our team will acknowledge receipt and review the
                          request within 2–3 business days.
                        </li>
                      </ol>

                      <h3 className="text-lg font-semibold">
                        4.1 Processing Time
                      </h3>
                      <ul className="list-disc pl-6 text-gray-700 space-y-2">
                        <li>
                          Approved refunds are processed within 5–7 business
                          days.
                        </li>
                        <li>
                          Refunds are issued to the original payment method.
                          Bank processing times may add additional delay.
                        </li>
                        <li>
                          Because payments are processed through Cashfree, some
                          refunds may require coordination with Cashfree and
                          your bank.
                        </li>
                      </ul>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      5. Cashfree & Identifiers
                    </h2>
                    <p className="text-gray-700">
                      Payments and refunds are handled via Cashfree. To help us
                      investigate disputes quickly, please provide any of the
                      following when you contact support:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      <li>Order ID generated by our system</li>
                      <li>Cashfree payment id (`cf_payment_id`)</li>
                      <li>The date and approximate time of the transaction</li>
                    </ul>

                    <p className="text-gray-700 mt-2">
                      For convenience, the current plan identifiers used by our
                      system (for troubleshooting) are shown below:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li>
                        {starter.displayName}: {formatPrice(starter.pricePaise)}{" "}
                        — Plan ID:{" "}
                        <code className="bg-muted px-1 rounded text-xs">
                          {starter.cashfreePlanId}
                        </code>
                      </li>
                      <li>
                        {premium.displayName}: {formatPrice(premium.pricePaise)}{" "}
                        — Plan ID:{" "}
                        <code className="bg-muted px-1 rounded text-xs">
                          {premium.cashfreePlanId}
                        </code>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      6. Disputed Charges
                    </h2>
                    <p className="text-gray-700">
                      If you dispute a charge with your bank before contacting
                      us, we may be limited in our ability to issue a direct
                      refund. Please contact us first so we can attempt to
                      resolve the issue and, if needed, coordinate the refund
                      with Cashfree.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      7. Changes to This Policy
                    </h2>
                    <p className="text-gray-700">
                      We may update this Refund Policy from time to time.
                      Material changes will be posted on this page with an
                      updated "Last updated" date. Continued use of the Service
                      after changes are posted constitutes acceptance of the
                      updated policy.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      8. Contact Information
                    </h2>
                    <p className="text-gray-700">
                      For questions about refunds, cancellations, or billing:
                      <br />
                      Email:{" "}
                      <a
                        href="mailto:support@fitmyskill.com"
                        className="text-primary underline"
                      >
                        support@fitmyskill.com
                      </a>
                      <br />
                      Billing:{" "}
                      <a
                        href="mailto:billing@fitmyskill.com"
                        className="text-primary underline"
                      >
                        billing@fitmyskill.com
                      </a>
                      <br />
                      Visit our{" "}
                      <Link to="/contact" className="text-primary underline">
                        Contact Us
                      </Link>{" "}
                      page for additional options.
                      <br />
                      Address: 24, Stanza Living Lisbon, Lisbon House, Sy. No.
                      47/11, Electronic City 1, Bengaluru, Karnataka 560100
                    </p>
                  </section>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default RefundPolicy;
