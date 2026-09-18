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
        <p className="font-mono text-sm font-semibold text-primary mb-3">
          FitMySkill Admin
        </p>
        <h1 className="text-5xl font-mono font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-8">
          This page is not part of the FitMySkill Admin console.
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
