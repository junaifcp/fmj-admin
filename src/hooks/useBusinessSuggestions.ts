import { useState, useEffect } from "react";
import { businessSuggest } from "@/api/places";
import { useAuthToken } from "@/utils/auth";
import type { BusinessSuggestItem } from "@/types/onboarding";

export function useBusinessSuggestions(query: string, enabled = true, limit = 5) {
  const [results, setResults] = useState<BusinessSuggestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthToken } = useAuthToken();

  useEffect(() => {
    if (!enabled || !query || query.trim().length === 0) {
      setResults([]);
      return;
    }
    let mounted = true;
    const tid = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getAuthToken();
        const res = await businessSuggest(query, limit, token || undefined);
        if (mounted) setResults(res.results || []);
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to fetch");
      } finally {
        if (mounted) setLoading(false);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(tid);
    };
  }, [query, enabled, limit, getAuthToken]);

  return { results, loading, error };
}
