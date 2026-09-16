// src/pages/LandingPage.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import {
  FileText,
  Sparkles,
  LayoutTemplate,
  Eye,
  UploadCloud,
  PenSquare,
  Download,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";

/* --- (keep AnimatedResumePreview and FeatureCard unchanged) --- */

const AnimatedResumePreview = () => {
  return (
    <div className="aspect-[3/4] w-full max-w-sm mx-auto bg-white rounded-lg shadow-2xl p-6 border relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center space-x-4 pb-4 border-b">
        <div
          className="w-16 h-16 rounded-full bg-primary/20 shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))",
          }}
        ></div>
        <div className="w-full space-y-2">
          <div className="h-5 w-3/4 bg-slate-200 rounded animate-pulse"></div>
          <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse"></div>
        </div>
      </div>
      {/* Body Content */}
      <div className="mt-6 space-y-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div
              className="h-3 w-1/3 bg-slate-300 rounded animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
            <div
              className="h-2 w-full bg-slate-200 rounded animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            ></div>
            <div
              className="h-2 w-5/6 bg-slate-200 rounded animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  children,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay: number;
}) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="bg-white p-6 rounded-lg shadow-sm text-center"
    >
      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </motion.div>
  );
};

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, user } = useUser();
  const [deciding, setDeciding] = useState(true);

  useEffect(() => {
    // Wait until Clerk finishes loading
    if (!isLoaded) return;

    // If not signed in, show landing page
    if (!isSignedIn) {
      setDeciding(false);
      return;
    }

    // Signed-in: determine role (prefer server-trusted publicMetadata)
    const publicRole = (user?.publicMetadata as any)?.role as
      | string
      | undefined;
    const unsafeRole = (user?.unsafeMetadata as any)?.role as
      | string
      | undefined;
    const role = publicRole ?? unsafeRole ?? undefined;

    // If role missing or pending -> onboarding
    if (!role || role === "pending") {
      navigate("/role-selection", { replace: true });
      return;
    }

    // Admins / superadmins
    if (role === "admin" || role === "superadmin") {
      navigate("/admin", { replace: true });
      return;
    }

    // Recruiters
    if (role === "recruiter") {
      navigate("/recruiter/dashboard", { replace: true });
      return;
    }

    // Default candidate/home route
    navigate("/home", { replace: true });
  }, [isLoaded, isSignedIn, user, navigate]);

  // While Clerk loads or while we decide where to send a signed-in user, show spinner (do not render landing UI)
  if (!isLoaded || deciding) {
    // if Clerk finished loading and user is not signed in, we should show landing — handled by effect toggling `deciding`
    if (isLoaded && !isSignedIn) {
      // allow landing to render
    } else {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
  }

  // Handler used by the header/mobile Sign In buttons
  const handleSignInClick = () => {
    // If clerk still loading, do nothing (or optionally show a loader)
    if (!isLoaded) return;

    // Not signed in -> go to sign-in page
    if (!isSignedIn) {
      navigate("/sign-in");
      return;
    }

    // Signed in -> route by role (prefers publicMetadata, falls back to unsafeMetadata)
    const publicRole = (user?.publicMetadata as any)?.role as
      | string
      | undefined;
    const unsafeRole = (user?.unsafeMetadata as any)?.role as
      | string
      | undefined;
    const role = publicRole ?? unsafeRole ?? undefined;

    if (!role || role === "pending") {
      navigate("/role-selection");
      return;
    }

    if (role === "admin" || role === "superadmin") {
      navigate("/admin");
      return;
    }

    if (role === "recruiter") {
      navigate("/recruiter/dashboard");
      return;
    }

    // default: candidate/home
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      {/* SEO Schema Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Professional Resume Builder - Create ATS-Friendly Resumes",
            description:
              "Build professional resumes with AI assistance. ATS-friendly templates, real-time preview, and instant PDF download.",
            url: "https://resume.fitmyskill.com",
            mainEntity: {
              "@type": "SoftwareApplication",
              name: "FitMyJob Resume Builder",
              applicationCategory: "BusinessApplication",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            },
          }),
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-sm border-b">
        <div className="container mx-auto flex justify-between items-center h-16 px-4 md:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-mono text-xl font-bold"
            aria-label="FitMyJob Resume Builder Home"
          >
            <img
              src="/images/logo.svg"
              alt="FitMyJob Logo"
              className="w-12 h-12"
            />

            <span>FitMyJob Resume</span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center space-x-4"
            role="navigation"
            aria-label="Main navigation"
          >
            <a
              href="#features"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              How It Works
            </a>
            <Link
              to="/contact"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Contact Us
            </Link>

            {/* Sign In: use handler instead of direct link */}
            <Button onClick={handleSignInClick} variant="ghost" size="sm">
              Sign In
            </Button>

            <Button asChild size="sm">
              <Link to="/sign-up">Get Started Free</Link>
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-16 left-0 w-full bg-white shadow-lg p-4"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                How It Works
              </a>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Contact Us
              </Link>

              {/* Mobile Sign In uses the same handler */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignInClick();
                }}
              >
                Sign In
              </Button>

              <Button asChild className="w-full">
                <Link to="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                  Get Started
                </Link>
              </Button>
            </div>
          </motion.nav>
        )}
      </header>

      {/* Main Content - (keep the rest of your landing content unchanged) */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 md:py-32" aria-labelledby="hero-heading">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 text-center lg:text-left">
                <motion.h1
                  id="hero-heading"
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Create Professional Resumes That Get You Hired
                </motion.h1>
                <motion.p
                  className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Build ATS-friendly resumes with AI assistance. Professional
                  templates, real-time preview, and instant PDF download. Land
                  more interviews today.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <Button size="lg" asChild>
                    <Link to="/sign-up">Create My Resume Now</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="#features">Explore Features</a>
                  </Button>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.3, ease: "backOut" }}
                className="relative"
              >
                <AnimatedResumePreview />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ... rest of your landing content unchanged (How It Works, Features, Testimonials, CTA) ... */}
      </main>

      {/* Footer */}
      <footer className="bg-background border-t" role="contentinfo">
        <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <img
              src="/images/logo.svg"
              alt="FitMyJob Logo"
              className="w-12 h-12"
            />
            <span className="font-mono text-lg font-bold">FitMyJob Resume</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} ITVC FIT MY JOB PRIVATE LIMITED. All
              rights reserved.
            </p>
            <p className="mt-1">
              <a href="/privacy-policy" className="hover:text-primary">
                Privacy Policy
              </a>{" "}
              &middot;{" "}
              <a href="/terms-and-conditions" className="hover:text-primary">
                Terms of Service
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
