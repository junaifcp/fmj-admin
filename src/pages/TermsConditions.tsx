import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import MetaTags from "@/components/SEO/MetaTags";

const TermsConditions = () => {
  // Plan details (human readable)
  const starter = {
    name: "STARTER",
    displayName: "Starter",
    priceDisplay: "₹799",
    durationMonths: 1,
    jobPostsLimit: 10,
    features: ["10 job posts per month", "Basic analytics", "Standard support"],
  };

  const premium = {
    name: "PREMIUM",
    displayName: "Premium",
    priceDisplay: "₹1299",
    durationMonths: 1,
    jobPostsLimit: -1,
    features: [
      "Unlimited job posts",
      "Advanced analytics",
      "Priority support",
      "Featured listings",
    ],
  };

  return (
    <>
      <MetaTags
        title="Terms & Conditions - FitMyJob Recruiter Portal"
        description="Terms and conditions for recruiters using FitMyJob Recruiter Portal — subscriptions, billing, cancellation policy, and contact information."
        canonicalUrl="https://recruiter.fitmyskill.com/terms-and-conditions"
      />

      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl text-center">
                  Terms & Conditions
                </CardTitle>
                <p className="text-center text-gray-600 text-sm mt-1">
                  Legal Entity: ITVC FIT MY JOB PRIVATE LIMITED
                </p>
                <p className="text-center text-gray-600 mt-2">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </CardHeader>

              <CardContent className="prose max-w-none">
                <div className="space-y-6">
                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      1. Acceptance of Terms
                    </h2>
                    <p className="text-gray-700">
                      By accessing and using the FitMyJob Recruiter Portal
                      ("Service"), operated by ITVC FIT MY JOB PRIVATE LIMITED,
                      you accept and agree to be bound by these Terms &amp;
                      Conditions. If you do not agree to these terms, please do
                      not use the Service.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      2. Service Description
                    </h2>
                    <p className="text-gray-700">
                      The FitMyJob Recruiter Portal enables recruiters to post
                      jobs, manage applications, and access analytics and
                      recruitment tools. Some features (such as job posting
                      beyond free limits, featured listings, and priority
                      support) require a paid subscription.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      3. User Accounts
                    </h2>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      <li>
                        You must provide accurate and complete information when
                        creating an account.
                      </li>
                      <li>
                        You are responsible for maintaining the confidentiality
                        of your account credentials.
                      </li>
                      <li>
                        You are responsible for all activities that occur under
                        your account.
                      </li>
                      <li>
                        You must notify us immediately of any unauthorized use
                        of your account.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      4. Subscription Plans, Billing &amp; Fees
                    </h2>

                    <p className="text-gray-700">
                      We offer subscription plans that grant access to paid
                      functionality. Current monthly plan examples include:
                    </p>

                    <div className="mt-4 space-y-4">
                      <div>
                        <h3 className="text-xl font-medium">
                          {starter.displayName} — {starter.priceDisplay}/month
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {starter.jobPostsLimit} job posts per month
                        </p>
                        <ul className="list-disc pl-6 text-gray-700">
                          {starter.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-medium">
                          {premium.displayName} — {premium.priceDisplay}/month
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Unlimited job posts
                        </p>
                        <ul className="list-disc pl-6 text-gray-700">
                          {premium.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <p className="text-gray-700 mt-4">
                      All prices are quoted in Indian Rupees (INR).
                      Subscriptions are billed on a recurring monthly cycle and
                      automatically renew each billing period unless cancelled
                      prior to the next renewal date.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      5. Free Job Posts &amp; Trial
                    </h2>
                    <p className="text-gray-700">
                      We may offer a limited number of free job posts (for
                      example, the first two job posts) to new recruiter
                      accounts. Free job posts are promotional and may be
                      changed or removed at our discretion. Free job posts do
                      not affect subscription billing and are subject to these
                      Terms.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      6. Auto-renewal, Cancellation &amp; Refunds
                    </h2>

                    <p className="text-gray-700">
                      Subscriptions renew automatically at the end of each
                      billing period. You may cancel your subscription at any
                      time from your profile settings. Cancellation stops future
                      billing but does not retroactively refund prior charges;
                      you will retain access to the paid features until the end
                      of your current billing period.
                    </p>

                    <p className="text-gray-700 mt-2">
                      Refunds are issued only in accordance with our Refund
                      Policy. Except as required by law or our Refund Policy, we
                      do not provide refunds for partial billing periods or for
                      unused features after purchase.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      7. User Content
                    </h2>
                    <p className="text-gray-700">
                      You retain ownership of content you create or upload (such
                      as job descriptions and candidate notes). By using the
                      Service you grant FitMyJob a limited license to store,
                      process and display your content for the purposes of
                      operating and improving the Service. We will not share
                      your content with third parties without your consent
                      except as required to provide the Service or by law.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      8. Prohibited Uses
                    </h2>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      <li>Using the service for any unlawful purpose.</li>
                      <li>
                        Attempting to gain unauthorized access to our systems.
                      </li>
                      <li>
                        Posting false, misleading, or discriminatory job ads.
                      </li>
                      <li>
                        Interfering with the proper functioning of the Service.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">9. Privacy</h2>
                    <p className="text-gray-700">
                      Your privacy is important to us. Our{" "}
                      <Link
                        to="/privacy-policy"
                        className="text-primary underline"
                      >
                        Privacy Policy
                      </Link>{" "}
                      explains how we collect, use, and protect your personal
                      information and is incorporated into these Terms by
                      reference.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      10. Limitation of Liability
                    </h2>
                    <p className="text-gray-700">
                      To the fullest extent permitted by applicable law,
                      FitMyJob will not be liable for any indirect, incidental,
                      special, consequential or punitive damages arising out of
                      your use of the Service.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      11. Termination
                    </h2>
                    <p className="text-gray-700">
                      We may suspend or terminate your access to the Service for
                      violations of these Terms or for other legitimate reasons,
                      including non-payment. Termination does not relieve you of
                      payment obligations incurred prior to termination.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      12. Changes to Terms
                    </h2>
                    <p className="text-gray-700">
                      We may modify these Terms from time to time. If we make a
                      material change we will provide at least 30 days prior
                      notice where practicable. Continued use of the Service
                      after the change constitutes acceptance of the updated
                      Terms.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold mb-3">
                      13. Contact Information
                    </h2>
                    <p className="text-gray-700">
                      For questions regarding these Terms, subscriptions, or
                      billing, please contact us:
                      <br />
                      Email:{" "}
                      <a
                        href="mailto:support@fitmyskill.com"
                        className="text-primary underline"
                      >
                        support@fitmyskill.com
                      </a>
                      <br />
                      Visit our{" "}
                      <Link to="/contact" className="text-primary underline">
                        Contact Us
                      </Link>{" "}
                      page for additional contact options.
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

        <p className="text-center text-gray-500 text-xs mt-8">
          © {new Date().getFullYear()} ITVC FIT MY JOB PRIVATE LIMITED. All
          rights reserved.
        </p>
      </div>
    </>
  );
};

export default TermsConditions;
