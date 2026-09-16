import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useImprovedAuth } from "@/context/ImprovedAuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, LogOut, Building } from "lucide-react";
import { useRecruiterAuth } from "@/hooks/useRecruiterAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const Navigation: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useImprovedAuth();
  const { isRecruiter } = useRecruiterAuth();
  const { isAdmin } = useAdminAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.firstName?.[0] || "?";

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
      <div className="container flex justify-between items-center h-16 px-4 md:px-6">
        {/* Logo */}
        <Link
          to={
            user
              ? isRecruiter
                ? "/recruiter/dashboard"
                : isAdmin
                ? "/admin"
                : "/"
              : "/"
          }
          className="flex items-center gap-2 font-mono text-xl font-bold"
          aria-label="FitMyJob Home"
        >
          <img src="/images/logo.svg" alt="FitMyJob Logo" className="w-8 h-8" />
          <span>Fitmyjob</span>
        </Link>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.imageUrl}
                        alt={user.fullName || ""}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.fullName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isRecruiter && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/recruiter/dashboard"
                        className="flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        Recruiter Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Admin Portal
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive("/") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Home
              </Link>
              <Button asChild variant="outline" size="sm">
                <Link to="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMobileMenu}
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-white animate-fade-in">
          <div className="flex flex-col p-4 space-y-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3 p-3 bg-accent rounded-md">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.imageUrl}
                      alt={user.fullName || ""}
                    />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
                {isRecruiter && (
                  <Link
                    to="/recruiter/dashboard"
                    onClick={closeMobileMenu}
                    className="p-3 rounded-md text-sm font-medium"
                  >
                    Recruiter Portal
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={closeMobileMenu}
                    className="p-3 rounded-md text-sm font-medium"
                  >
                    Admin Portal
                  </Link>
                )}
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 text-destructive"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="p-3 rounded-md text-sm font-medium"
                >
                  Home
                </Link>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/sign-in" onClick={closeMobileMenu}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/sign-up" onClick={closeMobileMenu}>
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
