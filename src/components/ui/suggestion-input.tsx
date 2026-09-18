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

interface SuggestionInputProps {
  type: "skills" | "job-titles" | "qualifications" | "field-of-study";
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  className?: string;
}

export const SuggestionInput: React.FC<SuggestionInputProps> = ({
  type,
  value = [],
  onChange,
  placeholder = "Type to search...",
  maxItems = 10,
  className,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { suggestions, loading, search, addNew, clear } = useSuggestions({
    type,
  });

  useEffect(() => {
    search(inputValue);
  }, [inputValue, search]);

  const handleSelect = (item: SuggestionItem) => {
    if (!value.includes(item.name) && value.length < maxItems) {
      onChange([...value, item.name]);
    }
    setInputValue("");
    setIsOpen(false);
    clear();
  };

  const handleAddNew = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || value.includes(trimmedInput)) return;

    try {
      const newItem = await addNew(trimmedInput);
      if (newItem && value.length < maxItems) {
        onChange([...value, newItem.name]);
      }
    } catch (error) {
      console.error("Failed to add new item:", error);
    }
    setInputValue("");
    setIsOpen(false);
    clear();
  };

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter((item) => item !== itemToRemove));
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

  // Ensure suggestions is always an array
  const suggestionList = Array.isArray(suggestions) ? suggestions : [];

  const exactMatch = suggestionList.find(
    (s) => s.name.toLowerCase() === inputValue.toLowerCase()
  );
  const showAddNew =
    inputValue.trim() && !exactMatch && !value.includes(inputValue.trim());

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Items */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              {item}
              <Button
                size="sm"
                variant="ghost"
                className="h-auto p-0 ml-1"
                onClick={() => handleRemove(item)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input with Dropdown */}
      {value.length < maxItems && (
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
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

                    {!loading && suggestionList.length === 0 && inputValue && (
                      <CommandItem disabled>No suggestions found</CommandItem>
                    )}

                    {suggestionList.map((suggestion) => (
                      <CommandItem
                        key={suggestion._id}
                        onSelect={() => handleSelect(suggestion)}
                        disabled={value.includes(suggestion.name)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              value.includes(suggestion.name)
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
      )}

      {value.length >= maxItems && (
        <p className="text-sm text-muted-foreground">
          Maximum {maxItems} items allowed
        </p>
      )}
    </div>
  );
};
