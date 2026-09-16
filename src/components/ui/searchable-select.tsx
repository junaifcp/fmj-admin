import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, Plus, Verified, Clock, X } from "lucide-react";
import { useSuggestions } from "@/hooks/useSuggestions";
import { SuggestionItem } from "@/api/suggestions";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  type: "skills" | "job-titles" | "qualifications" | "field-of-study";
  value: string;
  onChange: (value: string, item?: SuggestionItem) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  type,
  value,
  onChange,
  placeholder = "Type to search...",
  className,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, loading, search, addNew, clear } = useSuggestions({
    type,
  });

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    search(inputValue);
  }, [inputValue, search]);

  const handleSelect = (item: SuggestionItem) => {
    // Notify parent of selection and provide the selected item
    onChange(item.name, item);
    setInputValue(item.name);
    setIsOpen(false);
    clear();
  };

  const handleAddNew = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    try {
      const newItem = await addNew(trimmedInput);
      if (newItem) {
        // when a new item is created, notify parent with the new item
        onChange(newItem.name, newItem);
        setInputValue(newItem.name);
      }
    } catch (error) {
      console.error("Failed to add new item:", error);
    }
    setIsOpen(false);
    clear();
  };

  const getVerificationIcon = (verified: string) => {
    switch (verified) {
      case "verified":
        return <Verified className="h-3 w-3 text-green-500" />;
      case "pending":
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case "rejected":
        return <X className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const exactMatch = suggestions.find(
    (s) => s.name.toLowerCase() === inputValue.toLowerCase()
  );
  const showAddNew = inputValue.trim() && !exactMatch;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            // IMPORTANT: notify parent about raw typed value so caller state stays in sync
            try {
              onChange(val); // pass item undefined
            } catch (err) {
              // if parent didn't pass onChange robustly, ignore
              // but our prop is required in types
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={(e) => {
            // Delay closing to allow for clicking on suggestions
            setTimeout(() => {
              if (!inputRef.current?.contains(document.activeElement)) {
                setIsOpen(false);
              }
            }, 200);
          }}
          placeholder={placeholder}
          className="w-full"
        />
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-border bg-popover text-popover-foreground shadow-md">
            <Command>
              <CommandList>
                <CommandGroup>
                  {loading && (
                    <CommandItem disabled>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading suggestions...
                      </div>
                    </CommandItem>
                  )}

                  {!loading && suggestions.length === 0 && inputValue && (
                    <CommandItem disabled>No suggestions found</CommandItem>
                  )}

                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion._id}
                      onSelect={() => handleSelect(suggestion)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Check
                          className={cn(
                            "h-4 w-4",
                            suggestion.name === value
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span>{suggestion.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getVerificationIcon(suggestion.verified)}
                        <Badge
                          variant={
                            suggestion.verified === "verified"
                              ? "default"
                              : suggestion.verified === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {suggestion.verified}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}

                  {showAddNew && (
                    <CommandItem
                      onSelect={handleAddNew}
                      className="flex items-center justify-between border-t cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Add "{inputValue}"</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        pending
                      </Badge>
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    </div>
  );
};
