import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Menu,
  X,
  LogOut,
  FolderOpen,
  Building,
  Briefcase,
  Tag,
  Award,
  ChevronDown,
  ChevronRight,
  UserCircle,
  MessageCircle,
  Mail,
  Send,
  UserX,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { clearTokenCache } from "@/utils/auth";
import { useImprovedAuth } from "@/context/ImprovedAuthContext";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface CollapsibleNavSection {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAdminAuth();
  const { signOut } = useImprovedAuth();

  const candidateItems: NavItem[] = [
    {
      name: "User Dashboard",
      href: "/admin/candidates/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    { name: "Users", href: "/admin/users", icon: Users, exact: true },
    { name: "Resumes", href: "/admin/resumes", icon: FileText, exact: true },
    { name: "Plans", href: "/admin/plans", icon: CreditCard, exact: true },
    {
      name: "ATS Results",
      href: "/admin/ats-results",
      icon: BarChart3,
      exact: true,
    },
    {
      name: "FitMySkill Data",
      href: "/admin/candidates/fitmyskill-data",
      icon: Award,
      exact: true,
    },
    {
      name: "Verification",
      href: "/admin/candidates/verification",
      icon: ShieldCheck,
      exact: true,
    },
  ];

  const recruiterItems: NavItem[] = [
    {
      name: "Recruiter Dashboard",
      href: "/admin/recruiters/dashboard",
      icon: LayoutDashboard,
      exact: true, // Use exact matching for sibling routes
    },
    {
      name: "Recruiters",
      href: "/admin/recruiters",
      icon: Briefcase,
      exact: true, // Use exact matching for sibling routes
    },
  ];

  const managementItems: NavItem[] = [
    {
      name: "Job Titles",
      href: "/admin/management/job-titles",
      icon: Briefcase,
      exact: true,
    },
    {
      name: "Skills",
      href: "/admin/management/skills",
      icon: Tag,
      exact: true,
    },
    {
      name: "Companies",
      href: "/admin/management/companies",
      icon: Building,
      exact: true,
    },
    {
      name: "Business Data",
      href: "/admin/management/business-data",
      icon: Building,
      exact: true,
    },
    {
      name: "Support Tickets",
      href: "/admin/management/support-tickets",
      icon: MessageCircle,
      exact: true,
    },
    {
      name: "Outside Links",
      href: "/admin/management/outside-links",
      icon: ExternalLink,
      exact: true,
    },
    {
      name: "Tags",
      href: "/admin/management/tags",
      icon: Tag,
      exact: true,
    },
    {
      name: "Certificates",
      href: "/admin/management/certificates",
      icon: Award,
      exact: true,
    },
  ];

  const emailManagementItems: NavItem[] = [
    {
      name: "Email Dashboard",
      href: "/admin/email/dashboard",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Email Server",
      href: "/admin/email/servers",
      icon: Mail,
      exact: true,
    },
    {
      name: "Email Templates",
      href: "/admin/email/templates",
      icon: FileText,
      exact: true,
    },
    {
      name: "Send Email",
      href: "/admin/email/send",
      icon: Send,
      exact: true,
    },
    {
      name: "Scheduled Emails",
      href: "/admin/email/scheduled",
      icon: Calendar,
      exact: true,
    },
    {
      name: "Unsubscriptions",
      href: "/admin/email/unsubscribed",
      icon: UserX,
      exact: true,
    },
  ];

  const collapsibleSections: CollapsibleNavSection[] = [
    { name: "Candidates", icon: UserCircle, items: candidateItems },
    { name: "Recruiters", icon: Briefcase, items: recruiterItems },
    { name: "Management", icon: FolderOpen, items: managementItems },
    { name: "Email Management", icon: Mail, items: emailManagementItems },
  ];

  const isCurrentPath = (href: string, exact = false) => {
    if (exact) {
      return location.pathname === href;
    }
    // Check if current path matches or is a sub-path (followed by /)
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const isSectionActive = (items: NavItem[]) => {
    return items.some((item) => isCurrentPath(item.href, item.exact));
  };

  // Automatically determine which sections should be open based on current route
  const getInitialOpenSections = (): Record<string, boolean> => {
    const openState: Record<string, boolean> = {};
    collapsibleSections.forEach((section) => {
      const sectionKey = section.name.toLowerCase();
      openState[sectionKey] = isSectionActive(section.items);
    });
    return openState;
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    getInitialOpenSections()
  );

  // Auto-expand section when navigating to a route within it
  React.useEffect(() => {
    const activeSection = collapsibleSections.find((section) =>
      isSectionActive(section.items)
    );
    if (activeSection) {
      const sectionKey = activeSection.name.toLowerCase();
      setOpenSections((prev) => ({
        ...prev,
        [sectionKey]: true,
      }));
    }
  }, [location.pathname]);

  const toggleSection = (sectionName: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionName.toLowerCase()]: !prev[sectionName.toLowerCase()],
    }));
  };

  const handleSignOut = async () => {
    // Clear the local flag first (same behavior as user sign-out)
    localStorage.removeItem("has-uploaded-resume");
    clearTokenCache();

    // Close sidebar (good UX on mobile)
    setSidebarOpen(false);

    try {
      // Revokes the refresh cookie, clears the memory token, and redirects to "/".
      await signOut();
    } catch (error) {
      console.error("Admin sign out error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <img
              src="/images/logo.svg"
              alt="FitMyJob Logo"
              className="h-8 w-8 shrink-0"
            />
            <span className="font-sans font-semibold text-lg text-sidebar-foreground">
              Admin Portal
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-sidebar-foreground hover:bg-navy-light hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Dashboard - Always visible */}
          <Link
            to="/admin"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isCurrentPath("/admin", true)
                ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          {/* Collapsible Sections */}
          {collapsibleSections.map((section) => {
            const sectionKey = section.name.toLowerCase();
            const isOpen = openSections[sectionKey];
            const hasActiveItem = isSectionActive(section.items);

            return (
              <div key={section.name} className="space-y-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    hasActiveItem
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <section.icon className="h-4 w-4" />
                    <span>{section.name}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {/* Section Items */}
                {isOpen && (
                  <div className="ml-3 space-y-1">
                    {section.items.map((item) => {
                      const isActive = isCurrentPath(item.href, item.exact);
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            "flex items-center space-x-3 px-6 py-2 rounded-md text-sm font-medium transition-colors",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-8 w-8 bg-navy-light rounded-full flex items-center justify-center text-sidebar-foreground text-sm font-medium">
              {user?.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email}
              </p>
              <Badge
                variant="outline"
                className="text-xs border-sidebar-border text-sidebar-foreground/80 bg-transparent"
              >
                {user?.role}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-navy-light hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 bg-primary text-primary-foreground">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-primary-foreground hover:bg-navy-light hover:text-primary-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span className="font-semibold">Admin Portal</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
