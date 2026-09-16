import React from "react";
import { Helmet } from "react-helmet-async";

interface MetaTagsProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  noIndex?: boolean;
}

const MetaTags: React.FC<MetaTagsProps> = ({
  title = "FitMySkill Recruiter | AI-Powered Hiring Platform for Employers",
  description = "Hire top talent effortlessly with FitMySkill Recruiter. Post jobs, track candidates, and manage applications using our AI-powered recruitment platform.",
  keywords = "recruiter platform, job hiring, AI recruitment, employer hiring tools, candidate management, job posting automation, talent sourcing, applicant tracking system, recruitment software, hire faster",
  canonicalUrl = "https://recruiter.fitmyskill.com",
  ogImage = "https://recruiter.fitmyskill.com/images/og-image.jpg",
  ogType = "website",
  twitterCard = "summary_large_image",
  noIndex = false,
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="FitMySkill Recruiter" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@fitmyskill" />

      {/* Additional SEO */}
      <meta name="author" content="FitMySkill" />
      <meta name="publisher" content="FitMySkill" />
    </Helmet>
  );
};

export default MetaTags;
