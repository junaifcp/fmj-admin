// src/components/recruiter/RecruiterLayout.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useRecruiterAuth } from "@/hooks/useRecruiterAuth";
import { CompanyOnboardingModal } from "@/components/onboarding/CompanyOnboardingModal";
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
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileText,
  Plus,
  Settings,
  LogOut,
  Building,
  GitBranch,
} from "lucide-react";

import { useQueryClient } from "@tanstack/react-query";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/recruiter/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Companies",
    url: "/recruiter/companies",
    icon: Building,
  },
  {
    title: "Jobs",
    url: "/recruiter/jobs",
    icon: Briefcase,
  },
  {
    title: "Post Job",
    url: "/recruiter/post-job",
    icon: Plus,
  },
  {
    title: "Applications",
    url: "/recruiter/applications",
    icon: FileText,
  },
  {
    title: "Candidates",
    url: "/recruiter/candidates",
    icon: Users,
  },
  {
    title: "Hiring Pipelines",
    url: "/recruiter/pipelines",
    icon: GitBranch,
  },
  {
    title: "Profile",
    url: "/recruiter/profile",
    icon: Settings,
  },
];

const RecruiterSidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className="w-60" collapsible="icon">
      <SidebarContent>
        <div className="hidden h-16 w-full items-center justify-center group-data-[collapsible=icon]:flex">
          <img
            src="/images/logo.svg"
            alt="FitMyJob Logo"
            className="h-8 w-8 shrink-0"
          />
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="h-16 w-full px-3">
            <div className="flex h-full w-full items-center gap-2">
              <img
                src="/images/logo.svg"
                alt="FitMyJob Logo"
                className="h-8 w-8 shrink-0"
              />
              <span className="text-lg font-semibold leading-none">
                Recruiter Portal
              </span>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild size="lg">
                    <Link
                      to={item.url}
                      className={
                        isActive(item.url)
                          ? "bg-muted text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};

const RecruiterHeader: React.FC = () => {
  const { user } = useRecruiterAuth();
  const { signOut } = useImprovedAuth();

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
    <header className="h-16 flex items-center justify-between px-6 border-b bg-white">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <span className="font-semibold">Recruiter Portal</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.profileImageUrl}
                alt={user?.firstName || ""}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
              {user?.company && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.company}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/recruiter/profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Profile Settings
            </Link>
          </DropdownMenuItem>
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
    </header>
  );
};

const RecruiterLayout: React.FC = () => {
  const { user, checking } = useRecruiterAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!checking && user && !user.basicInfoProvided) {
      setShowOnboarding(true);
    }
  }, [checking, user]);

  const handleOnboardingComplete = async () => {
    // Close modal first
    setShowOnboarding(false);

    // Invalidate recruiter / me queries so fresh data is fetched
    try {
      await queryClient.invalidateQueries({ queryKey: ["recruiterMe"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
    } catch (err) {
      // swallow - not fatal
      console.warn("Failed to invalidate queries after onboarding:", err);
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      <CompanyOnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        // onClose={handleOnboardingClose}
      />
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <RecruiterSidebar />
          <div className="flex-1 flex flex-col">
            <RecruiterHeader />
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default RecruiterLayout;
