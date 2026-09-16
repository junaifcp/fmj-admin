import React from "react";
import { CompanyAutocompleteInput } from "./CompanyAutocompleteInput";
import { Button } from "@/components/ui/button";
import type { BusinessSuggestItem } from "@/types/onboarding";
import { Sparkles } from "lucide-react";

interface Step1CompanySearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSuggestion: (item: BusinessSuggestItem) => void;
  onAddTyped: (typed: string) => void;
  onNext: () => void;
  hasSelection: boolean;
  resolving: boolean;
}

export const Step1CompanySearch: React.FC<Step1CompanySearchProps> = ({
  searchQuery,
  onSearchChange,
  onSelectSuggestion,
  onAddTyped,
  onNext,
  hasSelection,
  resolving,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-primary mb-2">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Step 1 of 3</span>
        </div>
        <h3 className="text-lg font-semibold">Find Your Company</h3>
        <p className="text-sm text-muted-foreground">
          Complete your profile to unlock a free trial and exclusive onboarding perks.
        </p>
      </div>

      <CompanyAutocompleteInput
        value={searchQuery}
        onChange={onSearchChange}
        onSelect={onSelectSuggestion}
        onAddTyped={onAddTyped}
        placeholder="Search your company or type to add…"
      />

      {resolving && (
        <p className="text-sm text-muted-foreground text-center animate-pulse">
          Loading company details...
        </p>
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!hasSelection}
          size="lg"
          className="min-w-[120px]"
        >
          Next
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Need help?{" "}
        <a href="/contact" className="underline hover:text-foreground">
          Contact support
        </a>
      </p>
    </div>
  );
};
