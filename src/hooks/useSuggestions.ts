import { useState, useEffect, useCallback } from "react";
import {
  getSkillSuggestions,
  addSkillSuggestion,
  getJobTitleSuggestions,
  addJobTitleSuggestion,
  getQualificationSuggestions,
  addQualificationSuggestion,
  getFieldOfStudySuggestions,
  addFieldOfStudySuggestion,
  SuggestionItem,
} from "@/api/suggestions";
import { useToast } from "@/hooks/use-toast";

type SuggestionType =
  | "skills"
  | "job-titles"
  | "qualifications"
  | "field-of-study";

interface UseSuggestionsOptions {
  type: SuggestionType;
  debounceMs?: number;
  limit?: number;
}

export const useSuggestions = ({
  type,
  debounceMs = 300,
  limit = 10,
}: UseSuggestionsOptions) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const getSuggestionFunction = useCallback(() => {
    switch (type) {
      case "skills":
        return getSkillSuggestions;
      case "job-titles":
        return getJobTitleSuggestions;
      case "qualifications":
        return getQualificationSuggestions;
      case "field-of-study":
        return getFieldOfStudySuggestions;
      default:
        throw new Error(`Unknown suggestion type: ${type}`);
    }
  }, [type]);

  const getAddFunction = useCallback(() => {
    switch (type) {
      case "skills":
        return addSkillSuggestion;
      case "job-titles":
        return addJobTitleSuggestion;
      case "qualifications":
        return addQualificationSuggestion;
      case "field-of-study":
        return addFieldOfStudySuggestion;
      default:
        throw new Error(`Unknown suggestion type: ${type}`);
    }
  }, [type]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setLoading(true);
        const getSuggestions = getSuggestionFunction();
        const results = await getSuggestions(query, limit);
        setSuggestions(results);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(debounceTimer);
  }, [query, getSuggestionFunction, limit, debounceMs]);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  const addNew = useCallback(
    async (name: string): Promise<SuggestionItem | null> => {
      try {
        const addFunction = getAddFunction();
        const newItem = await addFunction(name);

        // Optimistically add to current suggestions
        setSuggestions((prev) => [newItem, ...prev]);

        toast({
          title: "Added successfully",
          description: `"${name}" has been added and is pending verification.`,
        });

        return newItem;
      } catch (error) {
        toast({
          title: "Failed to add item",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
        return null;
      }
    },
    [getAddFunction, toast]
  );

  const clear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    loading,
    search,
    addNew,
    clear,
    query,
  };
};
