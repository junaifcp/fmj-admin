import { useState, useEffect, useCallback } from 'react';
import { getPlaceSuggestions, resolvePlaceId } from '@/api/places';
import { PlaceSuggestion, Location } from '@/types/location';
import { useToast } from '@/hooks/use-toast';

interface UsePlaceAutocompleteOptions {
  debounceMs?: number;
  limit?: number;
}

export const usePlaceAutocomplete = ({ 
  debounceMs = 300, 
  limit = 10 
}: UsePlaceAutocompleteOptions = {}) => {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState('');
  const { toast } = useToast();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await getPlaceSuggestions(query, limit);
        setSuggestions(results);
      } catch (error) {
        console.error('Failed to fetch place suggestions:', error);
        setSuggestions([]);
        toast({
          title: 'Search failed',
          description: 'Unable to fetch location suggestions. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(debounceTimer);
  }, [query, limit, debounceMs, toast]);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
  }, []);

  const resolve = useCallback(async (placeId: string, source: 'google' | 'mapbox' | 'here' | 'manual' = 'google'): Promise<Location | null> => {
    try {
      setResolving(true);
      const location = await resolvePlaceId({ placeId, source });
      return location;
    } catch (error) {
      console.error('Failed to resolve place:', error);
      toast({
        title: 'Location resolution failed',
        description: 'Unable to get detailed location information. Please try again.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setResolving(false);
    }
  }, [toast]);

  const clear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    loading,
    resolving,
    search,
    resolve,
    clear,
    query
  };
};