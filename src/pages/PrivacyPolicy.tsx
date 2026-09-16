import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import MetaTags from "@/components/SEO/MetaTags";
import { Separator } from "@/components/ui/separator";

const PricingPolicy = () => {
  // Helper to format paise -> rupees
  const formatPrice = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

  // --- Recruiter Plans (paise) ---
  const starter = {
    name: "STARTER",
    displayName: "Starter",
    cashfreePlanId: "CF_STARTER_PLAN_ID",
    pricePaise: 79900, // ₹799
    durationMonths: 1,
    jobPostsLimit: 10,
    features: ["10 job posts per month", "Basic analytics", "Standard support"],
    isActive: true,
  };

  const premium = {
    name: "PREMIUM",
    displayName: "Premium",
    cashfreePlanId: "CF_PREMIUM_PLAN_ID",
    pricePaise: 129900, // ₹1299
    durationMonths: 1,
    jobPostsLimit: -1, // unlimited
    features: [
      "Unlimited job posts",
      "Advanced analytics",
      "Priority support",
      "Featured listings",
    ],
    isActive: true,
  };

  return (
    <>
      <MetaTags
        title="Pricing Policy - FitMyJob Recruiter Portal"
        description="Subscription plans, billing cycles, and pricing for FitMyJob Recruiter Portal. Learn about billing, cancellation, refunds, and how payments are processed (Cashfree)."
        canonicalUrl="https://recruiter.fitmyskill.com/pricing-policy"
      />

      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-center">
                  Pricing Policy — Recruiter Portal
                </CardTitle>

                <p className="text-center text-gray-500 mt-2">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </CardHeader>

              <CardContent className="prose max-w-none text-gray-800">
                <p className="text-center">
                  FitMyJob Recruiter Portal offers subscription plans tailored
                  for recruiters to post jobs, manage candidates, and access
                  analytics. All prices are listed in Indian Rupees (INR) and
                  billed via our payment partner Cashfree.
                </p>

                <Separator className="my-8" />

                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
                      1. Subscription Plans
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {starter.displayName} —{" "}
                          {formatPrice(starter.pricePaise)} / month
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {starter.jobPostsLimit} job posts per month
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                          {starter.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold">
                          {premium.displayName} —{" "}
                          {formatPrice(premium.pricePaise)} / month
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Unlimited job posts
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                          {premium.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
                      2. Billing & Payments
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>
                        <strong>Billing Cycle:</strong> Subscriptions for both
                        Starter and Premium are billed monthly and automatically
                        renew each month until cancelled.
                      </li>
                      <li>
                        <strong>Payment Processor:</strong> All payments are
                        processed by Cashfree. By subscribing you agree to the
                        Cashfree terms and payment flow.
                      </li>
                      <li>
                        <strong>Currency:</strong> Transactions are processed in
                        Indian Rupees (INR).
                      </li>
                      <li>
                        <strong>Payment Receipts:</strong> Receipts are issued
                        by Cashfree and will be emailed to the address on your
                        account.
                      </li>
                      <li>
                        <strong>Failed Payments:</strong> If a renewal payment
                        fails, we may retry the charge. You will be notified to
                        update payment details to avoid interruption.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
                      3. Subscription Management, Cancellation & Auto-renewal
                    </h2>

                    <p className="text-gray-700">
                      Subscriptions renew automatically at the end of each
                      billing period. You can cancel recurring billing at any
                      time from your profile settings. Cancelling stops future
                      billing; you will retain access to paid features until the
                      end of your current paid billing period.
                    </p>

                    <p className="text-gray-700 mt-2">
                      We do not provide prorated refunds for partial unused
                      periods except where required by law or stated in our{" "}
                      <Link
                        to="/refund-policy"
                        className="text-primary underline"
                      >
                        Refund Policy
                      </Link>
                      .
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
                      4. Free Job Posts & Promotions
                    </h2>
                    <p className="text-gray-700">
                      We may offer promotional free job posts (for example, the
                      first two job posts). Promotional offers are subject to
                      change and do not affect subscription billing terms.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
                      5. Refunds & Disputes
                    </h2>
                    <p className="text-gray-700">
                      Refunds are granted only according to our{" "}
                      <Link
                        to="/refund-policy"
                        className="text-primary underline"
                      >
                        Refund Policy
                      </Link>
                      . If you believe a charge is incorrect, contact our
                      support team immediately (billing@fitmyskill.com) so we
                      can investigate and work with Cashfree where necessary.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
                      6. Cache & Billing Identifiers
                    </h2>
                    <p className="text-gray-700">
                      Each subscription maps to a Cashfree plan identifier on
                      our backend. For troubleshooting, support may request the
                      Cashfree payment id or order id associated with the
                      transaction.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
                      7. Privacy & Data
                    </h2>
                    <p className="text-gray-700">
                      Your privacy matters. Our{" "}
                      <Link
                        to="/privacy-policy"
                        className="text-primary underline"
                      >
                        Privacy Policy
                      </Link>{" "}
                      explains how we collect and handle personal data related
                      to your recruiter account, billing, and job postings.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-4 border-b pb-2">
                      8. Contact & Billing Support
                    </h2>
                    <p className="text-gray-700">
                      For billing questions, subscription cancellation help, or
                      payment disputes, email:{" "}
                      <a
                        href="mailto:billing@fitmyskill.com"
                        className="text-primary underline"
                      >
                        billing@fitmyskill.com
                      </a>
                      . You can also visit our{" "}
                      <Link to="/contact" className="text-primary underline">
                        Contact Us
                      </Link>{" "}
                      page for additional options.
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

export default PricingPolicy;
