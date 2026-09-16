import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Briefcase,
  Building2,
  Filter,
  X,
  CheckCircle2,
  Loader2,
  Send,
  Search,
  Mail,
  AlertCircle,
  Calendar,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  filterCandidatesForEmail,
  sendBulkEmails,
  getEmailServerCapacity,
  getEmailTemplates,
  getEmailServers,
  getEmailTemplate,
  previewEmailTemplate,
  FilterCandidate,
  FilterOptions,
  EmailTemplate,
  EmailServer,
} from "@/api/admin";
import { extractVariablesFromTemplate } from "@/utils/emailTemplateUtils";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { SuggestionInput } from "@/components/ui/suggestion-input";
import { Location } from "@/types/location";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type UserType = "candidates" | "recruiters" | "employers";

const SendEmailPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Type selector state
  const [selectedType, setSelectedType] = useState<UserType>("candidates");

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState<Location | null>(null);
  const [filterRadius, setFilterRadius] = useState<number>(50000);
  const [filterSkills, setFilterSkills] = useState<string[]>([]);
  const [filterJobTitles, setFilterJobTitles] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterSubscriptionStatus, setFilterSubscriptionStatus] = useState<
    "active" | "inactive" | "all"
  >("all");
  const [filterLastActiveFrom, setFilterLastActiveFrom] = useState("");
  const [filterLastActiveTo, setFilterLastActiveTo] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Candidates list state
  const [candidates, setCandidates] = useState<FilterCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(
    []
  );
  const [isRecipientsCollapsed, setIsRecipientsCollapsed] = useState(false);

  // Email composition state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedEmailServerId, setSelectedEmailServerId] =
    useState<string>("");
  const [emailServers, setEmailServers] = useState<EmailServer[]>([]);
  const [capacity, setCapacity] = useState<any>(null);
  const [templateVariables, setTemplateVariables] = useState<
    Record<string, any>
  >({});
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [emailPreview, setEmailPreview] = useState<{
    subject: string;
    html: string;
  } | null>(null);

  // Confirmation dialog state
  const [showSendDialog, setShowSendDialog] = useState(false);

  // Load templates and servers on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesData, serversData] = await Promise.all([
          getEmailTemplates(1, 100, undefined, true),
          getEmailServers(1, 100),
        ]);

        setTemplates(templatesData.data || []);
        setEmailServers(serversData.data || []);

        // Set default email server
        const defaultServer = serversData.data?.find((s) => s.isDefault);
        if (defaultServer) {
          setSelectedEmailServerId(defaultServer._id);
          loadCapacity(defaultServer._id);
        }
      } catch (error) {
        toast({
          title: "Failed to load data",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [toast]);

  // Load capacity when server changes
  const loadCapacity = async (serverId: string) => {
    try {
      const capacityData = await getEmailServerCapacity(serverId);
      setCapacity(capacityData);
    } catch (error) {
      console.error("Failed to load capacity:", error);
    }
  };

  useEffect(() => {
    if (selectedEmailServerId) {
      loadCapacity(selectedEmailServerId);
    }
  }, [selectedEmailServerId]);

  // Load template when selected
  useEffect(() => {
    const loadSelectedTemplate = async () => {
      if (selectedTemplateId) {
        try {
          const template = await getEmailTemplate(selectedTemplateId);
          setSelectedTemplate(template);

          // Auto-populate variables from first selected recipient
          if (selectedCandidateIds.length > 0) {
            const firstCandidate = candidates.find((c) =>
              selectedCandidateIds.includes(c._id)
            );
            if (firstCandidate) {
              const autoVars: Record<string, any> = {
                userName:
                  `${firstCandidate.firstName || ""} ${
                    firstCandidate.lastName || ""
                  }`.trim() || firstCandidate.email,
                firstName: firstCandidate.firstName || "",
                lastName: firstCandidate.lastName || "",
                email: firstCandidate.email,
              };

              // Extract additional variables from template
              const extractedVars = extractVariablesFromTemplate(
                template.htmlBody,
                template.subject
              );
              extractedVars.forEach((varName) => {
                if (
                  !autoVars[varName] &&
                  !["userName", "firstName", "lastName", "email"].includes(
                    varName
                  )
                ) {
                  autoVars[varName] = "";
                }
              });

              setTemplateVariables(autoVars);
            }
          }
        } catch (error) {
          console.error("Failed to load template:", error);
        }
      } else {
        setSelectedTemplate(null);
        setTemplateVariables({});
      }
    };

    loadSelectedTemplate();
  }, [selectedTemplateId, selectedCandidateIds, candidates]);

  // Generate preview when variables or template changes
  useEffect(() => {
    const generatePreview = async () => {
      if (selectedTemplateId && Object.keys(templateVariables).length > 0) {
        try {
          const preview = await previewEmailTemplate(
            selectedTemplateId,
            templateVariables
          );
          setEmailPreview({ subject: preview.subject, html: preview.html });
        } catch (error) {
          console.error("Failed to generate preview:", error);
          setEmailPreview(null);
        }
      } else {
        setEmailPreview(null);
      }
    };

    if (showPreview && selectedTemplateId) {
      generatePreview();
    }
  }, [selectedTemplateId, templateVariables, showPreview]);

  // Apply filters
  const handleApplyFilters = async () => {
    try {
      setLoadingCandidates(true);
      setSelectedCandidateIds([]);

      const filters: FilterOptions = {};

      // Deduplicate: Track seen emails to avoid duplicates
      const seenEmails = new Set<string>();

      if (filterLocation && filterLocation.lat && filterLocation.lng) {
        filters.location = {
          lat: filterLocation.lat,
          lng: filterLocation.lng,
          radius: filterRadius,
        };
      }

      if (filterSkills.length > 0) {
        filters.skills = filterSkills;
      }

      if (filterJobTitles.length > 0) {
        filters.jobTitles = filterJobTitles;
      }

      if (filterDateFrom || filterDateTo) {
        filters.dateRange = {
          from: filterDateFrom,
          to: filterDateTo,
        };
      }

      if (filterSubscriptionStatus !== "all") {
        filters.subscriptionStatus = filterSubscriptionStatus;
      }

      if (filterLastActiveFrom || filterLastActiveTo) {
        filters.lastActiveRange = {
          from: filterLastActiveFrom,
          to: filterLastActiveTo,
        };
      }

      if (filterSearch.trim()) {
        filters.search = filterSearch.trim();
      }

      const result = await filterCandidatesForEmail(selectedType, filters);

      // Deduplicate candidates by email
      const uniqueCandidates: FilterCandidate[] = [];
      const emailMap = new Map<string, FilterCandidate>();

      (result.candidates || []).forEach((candidate) => {
        const emailKey = candidate.email.toLowerCase().trim();
        if (!emailMap.has(emailKey)) {
          emailMap.set(emailKey, candidate);
          uniqueCandidates.push(candidate);
        }
      });

      setCandidates(uniqueCandidates);
      setHasActiveFilters(true);

      toast({
        title: "Filters applied",
        description: `Found ${result.candidates?.length || 0} candidates`,
      });
    } catch (error) {
      toast({
        title: "Failed to filter candidates",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilterLocation(null);
    setFilterRadius(50000);
    setFilterSkills([]);
    setFilterJobTitles([]);
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterSubscriptionStatus("all");
    setFilterLastActiveFrom("");
    setFilterLastActiveTo("");
    setFilterSearch("");
    setHasActiveFilters(false);
    setCandidates([]);
    setSelectedCandidateIds([]);
  };

  // Toggle candidate selection
  const toggleCandidateSelection = (candidateId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(candidateId)
        ? prev.filter((id) => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  // Select all candidates
  const handleSelectAll = () => {
    if (selectedCandidateIds.length === candidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(candidates.map((c) => c._id));
    }
  };

  // Send emails
  const handleSendEmails = async () => {
    if (!selectedTemplateId) {
      toast({
        title: "Template required",
        description: "Please select an email template",
        variant: "destructive",
      });
      return;
    }

    if (selectedCandidateIds.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const result = await sendBulkEmails({
        emailServerId: selectedEmailServerId || undefined,
        templateId: selectedTemplateId,
        recipientIds: selectedCandidateIds,
        variables: templateVariables,
      });

      toast({
        title: "Emails queued successfully",
        description: `${result.immediateCount} immediate, ${result.scheduledCount} scheduled`,
      });

      // Clear selections
      setSelectedCandidateIds([]);
      setShowSendDialog(false);

      // Redirect to Email Dashboard
      navigate("/admin/email/dashboard");
    } catch (error) {
      toast({
        title: "Failed to send emails",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Send Email</h1>
        <p className="text-muted-foreground mt-1">
          Send bulk emails to candidates, recruiters, or employers
        </p>
      </div>

      {/* Type Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedType === "candidates" && "ring-2 ring-primary"
          )}
          onClick={() => setSelectedType("candidates")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Candidates</CardTitle>
              <Users
                className={cn(
                  "h-5 w-5",
                  selectedType === "candidates"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Send emails to candidate users
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md opacity-50",
            selectedType === "recruiters" && "ring-2 ring-primary opacity-100"
          )}
          onClick={() => {
            toast({
              title: "Coming soon",
              description: "Recruiters email sending will be available soon",
            });
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recruiters</CardTitle>
              <Briefcase
                className={cn(
                  "h-5 w-5",
                  selectedType === "recruiters"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Send emails to recruiters
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "cursor-pointer transition-all hover:shadow-md opacity-50",
            selectedType === "employers" && "ring-2 ring-primary opacity-100"
          )}
          onClick={() => {
            toast({
              title: "Coming soon",
              description: "Employers email sending will be available soon",
            });
          }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Employers</CardTitle>
              <Building2
                className={cn(
                  "h-5 w-5",
                  selectedType === "employers"
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Send emails to employers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer hover:bg-accent rounded-md p-2 -m-2">
                <div>
                  <CardTitle>Filters</CardTitle>
                  <CardDescription>
                    Apply filters to find recipients for your email
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="h-5 px-1">
                      Active
                    </Badge>
                  )}
                  {isFilterOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <div className="px-6 pb-4 flex items-center gap-2">
            <Button
              variant={isFilterOpen ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen(!isFilterOpen);
              }}
              className={cn(
                hasActiveFilters &&
                  !isFilterOpen &&
                  "border-primary text-primary"
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleApplyFilters}
              disabled={loadingCandidates}
            >
              {loadingCandidates ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Filtering...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Apply Filters
                </>
              )}
            </Button>
          </div>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-6 border-t pt-6">
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <Input
                    placeholder="Search by email, name..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                </div>

                {/* Location Filter */}
                <div className="space-y-3">
                  <Label>Location</Label>
                  <LocationAutocomplete
                    value={filterLocation}
                    onChange={setFilterLocation}
                    placeholder="Search for a location..."
                    allowManual={false}
                  />

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Search Radius
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={filterRadius === 50000 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterRadius(50000)}
                        className="rounded-full px-4"
                      >
                        50 km
                      </Button>
                      <Button
                        type="button"
                        variant={filterRadius === 80000 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterRadius(80000)}
                        className="rounded-full px-4"
                      >
                        80 km
                      </Button>
                      <Button
                        type="button"
                        variant={
                          filterRadius === 100000 ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setFilterRadius(100000)}
                        className="rounded-full px-4"
                      >
                        100 km
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Skills Filter */}
                <div className="space-y-2">
                  <Label>Skills</Label>
                  <SuggestionInput
                    type="skills"
                    value={filterSkills}
                    onChange={setFilterSkills}
                    placeholder="Select skills..."
                    maxItems={10}
                  />
                </div>

                {/* Job Titles Filter */}
                <div className="space-y-2">
                  <Label>Job Titles</Label>
                  <SuggestionInput
                    type="job-titles"
                    value={filterJobTitles}
                    onChange={setFilterJobTitles}
                    placeholder="Select job titles..."
                    maxItems={10}
                  />
                </div>

                {/* Registration Date Range */}
                <div className="space-y-4">
                  <Label>Registration Date Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="dateFrom"
                        className="text-sm text-muted-foreground"
                      >
                        From
                      </Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        max={filterDateTo || undefined}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="dateTo"
                        className="text-sm text-muted-foreground"
                      >
                        To
                      </Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        min={filterDateFrom || undefined}
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Status */}
                <div className="space-y-2">
                  <Label>Subscription Status</Label>
                  <Select
                    value={filterSubscriptionStatus}
                    onValueChange={(value: any) =>
                      setFilterSubscriptionStatus(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Last Active Date Range */}
                <div className="space-y-4">
                  <Label>Last Active Date Range</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="lastActiveFrom"
                        className="text-sm text-muted-foreground"
                      >
                        From
                      </Label>
                      <Input
                        id="lastActiveFrom"
                        type="date"
                        value={filterLastActiveFrom}
                        onChange={(e) =>
                          setFilterLastActiveFrom(e.target.value)
                        }
                        max={filterLastActiveTo || undefined}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="lastActiveTo"
                        className="text-sm text-muted-foreground"
                      >
                        To
                      </Label>
                      <Input
                        id="lastActiveTo"
                        type="date"
                        value={filterLastActiveTo}
                        onChange={(e) => setFilterLastActiveTo(e.target.value)}
                        min={filterLastActiveFrom || undefined}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Apply Filters Button at Bottom */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  size="sm"
                  onClick={handleApplyFilters}
                  disabled={loadingCandidates}
                  className="w-full sm:w-auto"
                >
                  {loadingCandidates ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Filtering...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Apply Filters
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Candidates List */}
      {candidates.length > 0 && (
        <Card>
          <Collapsible
            open={!isRecipientsCollapsed}
            onOpenChange={(open) => setIsRecipientsCollapsed(!open)}
          >
            <CardHeader>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer hover:bg-accent rounded-md p-2 -m-2">
                  <div>
                    <CardTitle>
                      Recipients ({candidates.length} found)
                    </CardTitle>
                    <CardDescription>
                      Select recipients to send emails to
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAll();
                      }}
                    >
                      {selectedCandidateIds.length === candidates.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                    <Badge variant="secondary">
                      {selectedCandidateIds.length} selected
                    </Badge>
                    {isRecipientsCollapsed ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={
                              candidates.length > 0 &&
                              selectedCandidateIds.length === candidates.length
                            }
                            onChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.map((candidate) => (
                        <TableRow key={candidate._id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedCandidateIds.includes(
                                candidate._id
                              )}
                              onChange={() =>
                                toggleCandidateSelection(candidate._id)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {candidate.email}
                          </TableCell>
                          <TableCell>{candidate.firstName || "-"}</TableCell>
                          <TableCell>{candidate.lastName || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Email Composition */}
      {candidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Email Composition</CardTitle>
            <CardDescription>
              Configure your email template and send settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Server Selection */}
            <div className="space-y-2">
              <Label>Email Server (Optional)</Label>
              <Select
                value={selectedEmailServerId}
                onValueChange={(value) => {
                  setSelectedEmailServerId(value);
                  loadCapacity(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Use default server" />
                </SelectTrigger>
                <SelectContent>
                  {emailServers
                    .filter((s) => s.isActive)
                    .map((server) => (
                      <SelectItem key={server._id} value={server._id}>
                        {server.name} {server.isDefault && "(Default)"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {capacity && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    Daily: {capacity.dailyUsed}/
                    {capacity.dailyUsed + capacity.dailyRemaining} remaining:{" "}
                    {capacity.dailyRemaining}
                  </div>
                  <div>
                    Monthly: {capacity.monthlyUsed}/
                    {capacity.monthlyUsed + capacity.monthlyRemaining}{" "}
                    remaining: {capacity.monthlyRemaining}
                  </div>
                </div>
              )}
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <Label>
                Email Template <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates
                    .filter((t) => t.isActive)
                    .map((template) => (
                      <SelectItem key={template._id} value={template._id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variable Input Section */}
            {selectedTemplate && selectedCandidateIds.length > 0 && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">
                      Template Variables
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Configure variable values for your email template
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Variable Input Form */}
                  <div className="space-y-3">
                    {Object.entries(templateVariables).map(([key, value]) => {
                      const isAutoPopulated = [
                        "userName",
                        "firstName",
                        "lastName",
                        "email",
                      ].includes(key);
                      return (
                        <div key={key} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`var-${key}`}
                              className="text-sm font-medium"
                            >
                              {key}
                              {isAutoPopulated && (
                                <Badge
                                  variant="secondary"
                                  className="ml-2 text-xs"
                                >
                                  Auto
                                </Badge>
                              )}
                            </Label>
                          </div>
                          <Input
                            id={`var-${key}`}
                            value={value || ""}
                            onChange={(e) =>
                              setTemplateVariables((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder={`Enter value for ${key}`}
                            disabled={isAutoPopulated}
                            className={isAutoPopulated ? "bg-muted" : ""}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Preview */}
                  {showPreview && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Preview</Label>
                      <div className="border rounded-lg bg-background overflow-hidden">
                        {emailPreview ? (
                          <>
                            <div className="p-3 border-b bg-muted">
                              <p className="text-sm font-medium">
                                Subject: {emailPreview.subject}
                              </p>
                            </div>
                            <div className="max-h-[400px] overflow-auto">
                              <iframe
                                srcDoc={emailPreview.html}
                                className="w-full h-[400px] border-0"
                                title="Email Preview"
                              />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                            <Eye className="h-12 w-12 mb-3 animate-pulse" />
                            <p className="text-sm font-medium">
                              Preview will be available here
                            </p>
                            <p className="text-xs mt-1">
                              Select a template and recipients to see preview
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Capacity Warning */}
            {capacity &&
              selectedCandidateIds.length > 0 &&
              (selectedCandidateIds.length > capacity.dailyRemaining ||
                selectedCandidateIds.length > capacity.monthlyRemaining) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You're trying to send {selectedCandidateIds.length} emails,
                    but only{" "}
                    {Math.min(
                      capacity.dailyRemaining,
                      capacity.monthlyRemaining
                    )}{" "}
                    can be sent immediately. The rest will be scheduled for
                    later.
                  </AlertDescription>
                </Alert>
              )}

            {/* Send Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowSendDialog(true)}
                disabled={
                  !selectedTemplateId ||
                  selectedCandidateIds.length === 0 ||
                  sending
                }
                size="lg"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {selectedCandidateIds.length} recipients
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!hasActiveFilters && candidates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No recipients selected
            </h3>
            <p className="text-muted-foreground mb-4">
              Apply filters to find recipients for your email campaign
            </p>
            <Button onClick={() => setIsFilterOpen(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Open Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Send Confirmation Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send Email</DialogTitle>
            <DialogDescription>
              Are you sure you want to send emails to{" "}
              {selectedCandidateIds.length} recipients?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {capacity &&
              (selectedCandidateIds.length > capacity.dailyRemaining ||
                selectedCandidateIds.length > capacity.monthlyRemaining) && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {Math.min(
                      capacity.dailyRemaining,
                      capacity.monthlyRemaining
                    )}{" "}
                    emails will be sent immediately. The remaining{" "}
                    {selectedCandidateIds.length -
                      Math.min(
                        capacity.dailyRemaining,
                        capacity.monthlyRemaining
                      )}{" "}
                    will be scheduled for later.
                  </AlertDescription>
                </Alert>
              )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button onClick={handleSendEmails} disabled={sending}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Emails
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendEmailPage;
