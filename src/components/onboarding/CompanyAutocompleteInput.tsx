import React, { useState, useRef, useEffect } from "react";
import { Search, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBusinessSuggestions } from "@/hooks/useBusinessSuggestions";
import type { BusinessSuggestItem } from "@/types/onboarding";
import { cn } from "@/lib/utils";

interface CompanyAutocompleteInputProps {
  value: string;
  onChange: (v: string) => void;
  onSelect: (item: BusinessSuggestItem) => void;
  onAddTyped: (typed: string) => void;
  placeholder?: string;
}

export const CompanyAutocompleteInput: React.FC<CompanyAutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  onAddTyped,
  placeholder = "Search your company or type to add…",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { results, loading } = useBusinessSuggestions(value, isOpen && value.trim().length > 0);

  useEffect(() => {
    if (value.trim().length > 0) {
      setIsOpen(true);
      setActiveIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex === results.length) {
          // Add typed
          onAddTyped(value);
          setIsOpen(false);
        } else if (activeIndex >= 0 && activeIndex < results.length) {
          onSelect(results[activeIndex]);
          setIsOpen(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelectItem = (item: BusinessSuggestItem) => {
    onSelect(item);
    setIsOpen(false);
  };

  const handleAddTyped = () => {
    onAddTyped(value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls="company-listbox"
          aria-activedescendant={
            activeIndex >= 0 ? `company-option-${activeIndex}` : undefined
          }
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && value.trim().length > 0 && (
        <div
          ref={listRef}
          id="company-listbox"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {results.length > 0 ? (
            <>
              {results.map((item, idx) => (
                <div
                  key={item.placeId || idx}
                  id={`company-option-${idx}`}
                  role="option"
                  aria-selected={activeIndex === idx}
                  className={cn(
                    "px-4 py-2 cursor-pointer hover:bg-accent transition-colors",
                    activeIndex === idx && "bg-accent"
                  )}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {item.structured?.main_text || item.name}
                    </span>
                    {item.structured?.secondary_text && (
                      <span className="text-xs text-muted-foreground">
                        {item.structured.secondary_text}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="border-t border-border" />
            </>
          ) : (
            !loading && (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                No results found
              </div>
            )
          )}
          <div
            id={`company-option-${results.length}`}
            role="option"
            aria-selected={activeIndex === results.length}
            className={cn(
              "px-4 py-2 cursor-pointer hover:bg-accent transition-colors flex items-center gap-2",
              activeIndex === results.length && "bg-accent"
            )}
            onClick={handleAddTyped}
            onMouseEnter={() => setActiveIndex(results.length)}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">Add "{value}"</span>
          </div>
        </div>
      )}
    </div>
  );
};
