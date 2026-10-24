import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/routes/paths";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img
            src="/images/logo.svg"
            alt="FitMyJob Logo"
            className="h-6 w-6 shrink-0"
          />
          <p className="font-sans text-sm font-semibold text-primary">
            FitMyJob Admin
          </p>
        </div>
        <h1 className="text-5xl font-sans font-extrabold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          This page is not part of the FitMyJob Admin console.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to={PATHS.HOME}>Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to={PATHS.SIGN_IN}>Go to Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
