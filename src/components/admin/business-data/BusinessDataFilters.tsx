// src/components/admin/business-data/BusinessDataFilters.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FilterOptions, Filters } from "@/types/businessData";
import { Check, X, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface BusinessDataFiltersProps {
  filterOptions: FilterOptions;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  loading?: boolean;
}

export const BusinessDataFilters: React.FC<BusinessDataFiltersProps> = ({
  filterOptions,
  filters,
  onFilterChange,
  loading = false,
}) => {
  // Local state for filter values (not applied until Filter button is clicked)
  const [localFilters, setLocalFilters] = useState<Filters>(filters);
  const [keywordsOpen, setKeywordsOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");

  // Sync local filters when external filters change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Get available locations based on selected keywords
  const availableLocations = useMemo(() => {
    if (!localFilters.keywords || localFilters.keywords.length === 0) {
      // If no keywords selected, show all locations
      const allLocations: Array<{
        placeId: string;
        formattedAddress: string;
        count: number;
      }> = [];
      Object.values(filterOptions.locationsByKeyword).forEach((locations) => {
        locations.forEach((loc) => {
          const existing = allLocations.find((l) => l.placeId === loc.placeId);
          if (existing) {
            existing.count += loc.count;
          } else {
            allLocations.push({ ...loc });
          }
        });
      });
      return allLocations.sort((a, b) =>
        a.formattedAddress.localeCompare(b.formattedAddress)
      );
    }

    // If keywords selected, show only locations from those keywords
    const locationMap = new Map<
      string,
      { placeId: string; formattedAddress: string; count: number }
    >();
    localFilters.keywords.forEach((keyword) => {
      const locations = filterOptions.locationsByKeyword[keyword] || [];
      locations.forEach((loc) => {
        const existing = locationMap.get(loc.placeId);
        if (existing) {
          existing.count += loc.count;
        } else {
          locationMap.set(loc.placeId, { ...loc });
        }
      });
    });
    return Array.from(locationMap.values()).sort((a, b) =>
      a.formattedAddress.localeCompare(b.formattedAddress)
    );
  }, [localFilters.keywords, filterOptions.locationsByKeyword]);

  // Filter locations by search term (only within available locations)
  const filteredLocations = useMemo(() => {
    if (!locationSearch.trim()) {
      return availableLocations;
    }
    const searchLower = locationSearch.toLowerCase();
    return availableLocations.filter((loc) =>
      loc.formattedAddress.toLowerCase().includes(searchLower)
    );
  }, [availableLocations, locationSearch]);

  const handleKeywordToggle = (keyword: string) => {
    const currentKeywords = localFilters.keywords || [];
    const newKeywords = currentKeywords.includes(keyword)
      ? currentKeywords.filter((k) => k !== keyword)
      : [...currentKeywords, keyword];
    setLocalFilters({
      ...localFilters,
      keywords: newKeywords.length > 0 ? newKeywords : undefined,
      // Clear location selections when keywords change
      locationPlaceIds: undefined,
    });
  };

  const handleLocationToggle = (placeId: string) => {
    const currentLocationIds = localFilters.locationPlaceIds || [];
    const newLocationIds = currentLocationIds.includes(placeId)
      ? currentLocationIds.filter((id) => id !== placeId)
      : [...currentLocationIds, placeId];
    setLocalFilters({
      ...localFilters,
      locationPlaceIds: newLocationIds.length > 0 ? newLocationIds : undefined,
    });
  };

  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters: Filters = {};
    setLocalFilters(emptyFilters);
    setLocationSearch("");
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters =
    (localFilters.keywords && localFilters.keywords.length > 0) ||
    (localFilters.locationPlaceIds &&
      localFilters.locationPlaceIds.length > 0) ||
    localFilters.search ||
    localFilters.minRating !== undefined ||
    localFilters.hasWebsite !== undefined ||
    localFilters.hasEmail !== undefined ||
    localFilters.hasPhone !== undefined;

  const hasChanges = JSON.stringify(localFilters) !== JSON.stringify(filters);

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          )}
          <Button
            type="button"
            onClick={handleApplyFilters}
            disabled={loading || !hasChanges}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Keywords Multi-select */}
        <div className="space-y-2">
          <Label>Keywords</Label>
          <Popover open={keywordsOpen} onOpenChange={setKeywordsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
                disabled={loading}
              >
                {localFilters.keywords && localFilters.keywords.length > 0
                  ? `${localFilters.keywords.length} selected`
                  : "Select keywords..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search keywords..." />
                <CommandList>
                  <CommandEmpty>No keywords found.</CommandEmpty>
                  <CommandGroup>
                    {filterOptions.keywords.map((keyword) => (
                      <CommandItem
                        key={keyword.value}
                        value={keyword.value}
                        onSelect={() => handleKeywordToggle(keyword.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            localFilters.keywords?.includes(keyword.value)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <span>{keyword.value}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({keyword.count})
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {localFilters.keywords && localFilters.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {localFilters.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="text-xs">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleKeywordToggle(keyword)}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Locations Multi-select */}
        <div className="space-y-2">
          <Label>Locations</Label>
          <Popover open={locationsOpen} onOpenChange={setLocationsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
                disabled={
                  loading ||
                  (localFilters.keywords &&
                    localFilters.keywords.length === 0 &&
                    filterOptions.keywords.length > 0)
                }
              >
                {localFilters.locationPlaceIds &&
                localFilters.locationPlaceIds.length > 0
                  ? `${localFilters.locationPlaceIds.length} selected`
                  : "Select locations..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search locations..."
                  value={locationSearch}
                  onValueChange={setLocationSearch}
                />
                <CommandList>
                  <CommandEmpty>No locations found.</CommandEmpty>
                  <CommandGroup>
                    {filteredLocations.map((location) => (
                      <CommandItem
                        key={location.placeId}
                        value={location.placeId}
                        onSelect={() => handleLocationToggle(location.placeId)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            localFilters.locationPlaceIds?.includes(
                              location.placeId
                            )
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <span>{location.formattedAddress}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({location.count})
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {localFilters.locationPlaceIds &&
            localFilters.locationPlaceIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {localFilters.locationPlaceIds.map((placeId) => {
                  const location = availableLocations.find(
                    (l) => l.placeId === placeId
                  );
                  return (
                    <Badge
                      key={placeId}
                      variant="secondary"
                      className="text-xs"
                    >
                      {location?.formattedAddress || placeId}
                      <button
                        type="button"
                        onClick={() => handleLocationToggle(placeId)}
                        className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
        </div>

        {/* Search Input */}
        <div className="space-y-2">
          <Label>Search</Label>
          <Input
            placeholder="Search business name or address..."
            value={localFilters.search || ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                search: e.target.value || undefined,
              })
            }
            disabled={loading}
          />
        </div>

        {/* Min Rating */}
        <div className="space-y-2">
          <Label>Min Rating</Label>
          <Input
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="0"
            value={localFilters.minRating ?? ""}
            onChange={(e) => {
              const value = e.target.value
                ? parseFloat(e.target.value)
                : undefined;
              setLocalFilters({ ...localFilters, minRating: value });
            }}
            disabled={loading}
          />
        </div>

        {/* Has Website Checkbox */}
        <div className="space-y-2">
          <Label>Has Website</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="hasWebsite"
              checked={localFilters.hasWebsite === true}
              onCheckedChange={(checked) => {
                setLocalFilters({
                  ...localFilters,
                  hasWebsite:
                    checked === true
                      ? true
                      : checked === false
                      ? false
                      : undefined,
                });
              }}
              disabled={loading}
            />
            <label
              htmlFor="hasWebsite"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Only show businesses with website
            </label>
          </div>
        </div>

        {/* Has Email Checkbox */}
        <div className="space-y-2">
          <Label>Has Email</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="hasEmail"
              checked={localFilters.hasEmail === true}
              onCheckedChange={(checked) => {
                setLocalFilters({
                  ...localFilters,
                  hasEmail:
                    checked === true
                      ? true
                      : checked === false
                      ? false
                      : undefined,
                });
              }}
              disabled={loading}
            />
            <label
              htmlFor="hasEmail"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Only show businesses with email
            </label>
          </div>
        </div>

        {/* Has Phone Checkbox */}
        <div className="space-y-2">
          <Label>Has Phone</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="hasPhone"
              checked={localFilters.hasPhone === true}
              onCheckedChange={(checked) => {
                setLocalFilters({
                  ...localFilters,
                  hasPhone:
                    checked === true
                      ? true
                      : checked === false
                      ? false
                      : undefined,
                });
              }}
              disabled={loading}
            />
            <label
              htmlFor="hasPhone"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Only show businesses with phone
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
