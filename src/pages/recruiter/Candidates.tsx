import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Users,
  MapPin,
  Briefcase,
  Calendar,
  FileText,
  Eye,
} from "lucide-react";
import { searchCandidates, getCandidateResume } from "@/api/recruiter";
import type {
  Candidate,
  PaginatedCandidates,
  SearchFilters,
} from "@/types/recruiter";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";

// ---- Helper to safely read location ----
const getLocationLabel = (loc?: string | any) => {
  if (!loc) return "";
  if (typeof loc === "string") return loc;
  return loc.formattedAddress || loc.city || "";
};

const CandidateCard: React.FC<{
  candidate: Candidate;
  onViewResume: (candidateId: string) => void;
}> = ({ candidate, onViewResume }) => {
  const initials =
    candidate.firstName && candidate.lastName
      ? `${candidate.firstName[0]}${candidate.lastName[0]}`
      : candidate.firstName?.[0] || "?";

  const locationLabel = getLocationLabel(candidate.location);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage
              src={candidate.profileImageUrl}
              alt={`${candidate.firstName} ${candidate.lastName}`}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-lg">
                {candidate.firstName} {candidate.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{candidate.email}</p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {locationLabel && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{locationLabel}</span>
                </div>
              )}
              {candidate.experience !== undefined && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  <span>{candidate.experience} years exp</span>
                </div>
              )}
              {candidate.lastActive && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Active {new Date(candidate.lastActive).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {candidate.skills && candidate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {candidate.skills.slice(0, 4).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {candidate.skills.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{candidate.skills.length - 4} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => onViewResume(candidate._id)}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Resume ({candidate.resumeCount})
              </Button>

              {/* Details Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {candidate.firstName} {candidate.lastName}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={candidate.profileImageUrl}
                          alt={`${candidate.firstName} ${candidate.lastName}`}
                        />
                        <AvatarFallback className="text-lg">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        <p className="text-muted-foreground">
                          {candidate.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {locationLabel && (
                        <div>
                          <span className="font-medium">Location:</span>
                          <p className="text-muted-foreground">
                            {locationLabel}
                          </p>
                        </div>
                      )}
                      {candidate.experience !== undefined && (
                        <div>
                          <span className="font-medium">Experience:</span>
                          <p className="text-muted-foreground">
                            {candidate.experience} years
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Resumes:</span>
                        <p className="text-muted-foreground">
                          {candidate.resumeCount}
                        </p>
                      </div>
                      {candidate.lastActive && (
                        <div>
                          <span className="font-medium">Last Active:</span>
                          <p className="text-muted-foreground">
                            {new Date(
                              candidate.lastActive
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {candidate.skills && candidate.skills.length > 0 && (
                      <div>
                        <span className="font-medium text-sm">Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {candidate.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => onViewResume(candidate._id)}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Resume
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RecruiterCandidates: React.FC = () => {
  const [candidates, setCandidates] = useState<PaginatedCandidates | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");

  const { trackCandidatesSearchPerformed, trackCandidateResumeViewed } =
    useAnalytics();

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCandidates = async (filters: SearchFilters = {}) => {
    try {
      setLoading(true);
      const data = await searchCandidates(filters, 1, 50);
      setCandidates(data);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = async (candidateId: string) => {
    try {
      const { resumeUrl } = await getCandidateResume(candidateId);

      // Track resume viewed
      trackCandidateResumeViewed({
        candidateId,
        source: "candidates_search",
      });

      window.open(resumeUrl, "_blank");
    } catch (error) {
      console.error("Failed to fetch resume:", error);
      toast.error("Failed to load candidate resume");
    }
  };

  const handleSearch = () => {
    const filters: SearchFilters = {};

    if (experienceFilter !== "all") {
      filters.experience = parseInt(experienceFilter);
    }
    if (locationFilter) {
      filters.location = locationFilter;
    }

    // Track candidate search
    trackCandidatesSearchPerformed({
      query: searchTerm,
      filters: {
        experience: experienceFilter !== "all" ? experienceFilter : undefined,
        location: locationFilter || undefined,
      },
      resultsCount: candidates?.data?.length || 0,
    });

    fetchCandidates(filters);
  };

  const filteredCandidates =
    candidates?.data.filter((candidate) => {
      const candidateName = `${candidate.firstName ?? ""} ${
        candidate.lastName ?? ""
      }`.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        candidateName.includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills?.some((skill) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchesSearch;
    }) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 p-4 border rounded-lg">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidates</h1>
          <p className="text-muted-foreground">
            Search and discover talented candidates
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={experienceFilter}
              onValueChange={setExperienceFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Experience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Experience</SelectItem>
                <SelectItem value="0">Entry Level (0-1 years)</SelectItem>
                <SelectItem value="2">Junior (2-4 years)</SelectItem>
                <SelectItem value="5">Mid Level (5-7 years)</SelectItem>
                <SelectItem value="8">Senior (8+ years)</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />

            <Button onClick={handleSearch} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          {filteredCandidates.length} candidate
          {filteredCandidates.length !== 1 ? "s" : ""} found
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCandidates.map((candidate) => (
          <CandidateCard
            key={candidate._id}
            candidate={candidate}
            onViewResume={handleViewResume}
          />
        ))}
      </div>

      {filteredCandidates.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search criteria to find more candidates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecruiterCandidates;
