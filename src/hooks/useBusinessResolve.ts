import { useState } from "react";
import { businessResolve } from "@/api/places";
import { useAuthToken } from "@/utils/auth";
import type { BusinessResolveResponse } from "@/types/onboarding";

export function useBusinessResolve() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BusinessResolveResponse | null>(null);
  const { getAuthToken } = useAuthToken();

  const resolve = async (placeId: string): Promise<BusinessResolveResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const result = await businessResolve(placeId, token || undefined);
      setData(result);
      return result;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to resolve business";
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { resolve, loading, error, data };
}
