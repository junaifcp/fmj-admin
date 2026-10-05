import React, { useState, useRef, useEffect } from "react";
import { usePlaceAutocomplete } from "@/hooks/usePlaceAutocomplete";
import { Location, PlaceSuggestion } from "@/types/location";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationAutocompleteProps {
  value?: Location | null;
  onChange: (location: Location | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowManual?: boolean;
  className?: string;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter location...",
  disabled = false,
  allowManual = true,
  className,
}) => {
  const [inputValue, setInputValue] = useState(value?.formattedAddress || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    value || null
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const { suggestions, loading, resolving, search, resolve, clear } =
    usePlaceAutocomplete();

  useEffect(() => {
    if (!value) {
      setSelectedLocation(null);
      setInputValue("");
      return;
    }
    if (value !== selectedLocation) {
      setSelectedLocation(value);
      setInputValue(value.formattedAddress);
    }
  }, [value, selectedLocation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    setFocusedIndex(-1);

    if (newValue.trim()) {
      search(newValue);
    } else {
      clear();
      setSelectedLocation(null);
      onChange(null);
    }
  };

  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);

    const location = await resolve(suggestion.placeId);
    if (location) {
      setSelectedLocation(location);
      onChange(location);
    }
  };

  const handleManualEntry = () => {
    if (allowManual && inputValue.trim()) {
      const manualLocation: Location = {
        placeId: `manual_${Date.now()}`,
        formattedAddress: inputValue.trim(),
        lat: 0,
        lng: 0,
        source: "manual",
      };
      setSelectedLocation(manualLocation);
      onChange(manualLocation);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    setSelectedLocation(null);
    onChange(null);
    setShowSuggestions(false);
    clear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    // Ensure suggestions is always an array
    const suggestionList = Array.isArray(suggestions) ? suggestions : [];

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < suggestionList.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && suggestionList[focusedIndex]) {
          handleSuggestionSelect(suggestionList[focusedIndex]);
        } else if (allowManual && inputValue.trim()) {
          handleManualEntry();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!e.currentTarget.contains(document.activeElement)) {
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
    }, 150);
  };

  // Ensure suggestions is always an array for rendering
  const suggestionList = Array.isArray(suggestions) ? suggestions : [];

  return (
    <div className={cn("relative", className)} onBlur={handleBlur}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled || resolving}
          className="pr-20"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {(loading || resolving) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {selectedLocation && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleClear}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Selected location preview */}
      {selectedLocation && (
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <MapPin className="h-3 w-3 mr-1" />
            {selectedLocation.source === "manual" ? "Manual" : "Verified"}
          </Badge>
          {selectedLocation.lat !== 0 && selectedLocation.lng !== 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedLocation?.lat?.toFixed(4)},{" "}
              {selectedLocation?.lng?.toFixed(4)}
            </span>
          )}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && !resolving && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-background border shadow-lg">
          {loading && (
            <div className="p-3 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              <span className="text-sm text-muted-foreground">
                Searching...
              </span>
            </div>
          )}

          {!loading && suggestionList.length === 0 && inputValue.trim() && (
            <div className="p-3">
              <p className="text-sm text-muted-foreground">
                No suggestions found
              </p>
              {allowManual && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full justify-start"
                  onClick={handleManualEntry}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use "{inputValue}" as manual location
                </Button>
              )}
            </div>
          )}

          {!loading &&
            suggestionList.map((suggestion, index) => (
              <button
                key={suggestion.placeId}
                ref={(el) => {
                  suggestionRefs.current[index] = el;
                }}
                className={cn(
                  "w-full p-3 text-left hover:bg-accent transition-colors",
                  "border-b border-border last:border-b-0",
                  focusedIndex === index && "bg-accent"
                )}
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    {suggestion.structured ? (
                      <>
                        <div className="font-medium text-sm truncate">
                          {suggestion.structured.main_text}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {suggestion.structured.secondary_text}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm truncate">
                        {suggestion.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}

          {!loading &&
            suggestionList.length > 0 &&
            allowManual &&
            inputValue.trim() && (
              <div className="border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start p-3"
                  onClick={handleManualEntry}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use "{inputValue}" as manual location
                </Button>
              </div>
            )}
        </Card>
      )}
    </div>
  );
};
