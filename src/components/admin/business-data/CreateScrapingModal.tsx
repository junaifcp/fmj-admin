// src/components/admin/business-data/CreateScrapingModal.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { Location } from "@/types/location";
import { startScrapingJob } from "@/api/businessData";
import { toast } from "sonner";
import { X } from "lucide-react";

interface CreateScrapingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (jobId: string) => void;
  isScrapingActive: boolean;
}

export const CreateScrapingModal: React.FC<CreateScrapingModalProps> = ({
  open,
  onClose,
  onSuccess,
  isScrapingActive,
}) => {
  const [keyword, setKeyword] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [currentLocationInput, setCurrentLocationInput] =
    useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    keyword?: string;
    locations?: string;
  }>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setKeyword("");
      setSelectedLocations([]);
      setCurrentLocationInput(null);
      setErrors({});
    }
  }, [open]);

  const handleLocationSelect = (location: Location | null) => {
    if (!location) return;

    // Check if location already selected
    if (selectedLocations.some((loc) => loc.placeId === location.placeId)) {
      toast.error("This location is already selected");
      setCurrentLocationInput(null);
      return;
    }

    // Check max locations
    if (selectedLocations.length >= 5) {
      toast.error("Maximum 5 locations allowed");
      setCurrentLocationInput(null);
      return;
    }

    // Add location
    setSelectedLocations((prev) => [...prev, location]);
    setCurrentLocationInput(null);
  };

  const handleRemoveLocation = (placeId: string) => {
    setSelectedLocations((prev) =>
      prev.filter((loc) => loc.placeId !== placeId)
    );
  };

  const validateForm = (): boolean => {
    const newErrors: { keyword?: string; locations?: string } = {};

    if (!keyword.trim()) {
      newErrors.keyword = "Keyword is required";
    } else if (keyword.length > 200) {
      newErrors.keyword = "Keyword must be 200 characters or less";
    }

    if (selectedLocations.length === 0) {
      newErrors.locations = "At least one location is required";
    } else if (selectedLocations.length > 5) {
      newErrors.locations = "Maximum 5 locations allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await startScrapingJob({
        keyword: keyword.trim(),
        locations: selectedLocations.map((loc) => ({
          placeId: loc.placeId,
          formattedAddress: loc.formattedAddress,
          lat: loc.lat,
          lng: loc.lng,
        })),
      });

      // Show success message with skipped locations info
      if (response.skippedLocationsCount > 0) {
        toast.info(
          `${response.skippedLocationsCount} location(s) were already scraped and skipped. ${response.newLocationsCount} new location(s) will be scraped.`,
          {
            duration: 5000,
          }
        );
      } else {
        toast.success(
          `Scraping job started for ${response.newLocationsCount} location(s)`
        );
      }

      onSuccess(response.jobId);
      onClose();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to start scraping job. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Scraping Job</DialogTitle>
          <DialogDescription>
            Start a new business data scraping job by providing a keyword and
            selecting locations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Keyword Input */}
          <div className="space-y-2">
            <Label htmlFor="keyword">
              Keyword <span className="text-destructive">*</span>
            </Label>
            <Input
              id="keyword"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (errors.keyword) {
                  setErrors((prev) => ({ ...prev, keyword: undefined }));
                }
              }}
              placeholder="e.g., education institute"
              maxLength={200}
              disabled={loading || isScrapingActive}
              required
            />
            {errors.keyword && (
              <p className="text-sm text-destructive">{errors.keyword}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {keyword.length}/200 characters
            </p>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label>
              Locations <span className="text-destructive">*</span>
            </Label>
            <LocationAutocomplete
              value={currentLocationInput}
              onChange={handleLocationSelect}
              placeholder="Search and select a location..."
              disabled={
                loading || isScrapingActive || selectedLocations.length >= 5
              }
              allowManual={false}
            />
            {errors.locations && (
              <p className="text-sm text-destructive">{errors.locations}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedLocations.length}/5 locations selected
            </p>

            {/* Selected Locations */}
            {selectedLocations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedLocations.map((location) => (
                  <Badge
                    key={location.placeId}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <span className="max-w-[200px] truncate">
                      {location.formattedAddress}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveLocation(location.placeId)}
                      disabled={loading || isScrapingActive}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {isScrapingActive && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Another scraping job is currently running. Please wait for it to
                complete before starting a new one.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                isScrapingActive ||
                !keyword.trim() ||
                selectedLocations.length === 0
              }
            >
              {loading ? "Starting..." : "Start Scraping"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
