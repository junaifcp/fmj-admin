// src/services/unsubscribeApi.ts
import axios from "axios";
import { getConfig } from "@/config/env";

const API_BASE_URL =
  getConfig().apiBaseUrl || "https://backend.fitmyskill.com/api";

// Unsubscribe endpoints are public (no auth required)
const unsubscribeClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface UnsubscribeInfo {
  token: string;
  email: string;
  isUnsubscribed: boolean;
}

/**
 * Verify unsubscribe token and get user email
 */
export async function verifyUnsubscribeToken(
  token: string
): Promise<UnsubscribeInfo> {
  const response = await unsubscribeClient.get(`/unsubscribe/${token}`);
  return response.data.data;
}

/**
 * Process unsubscribe
 */
export async function unsubscribe(
  token: string
): Promise<{ success: boolean; email: string }> {
  const response = await unsubscribeClient.post(`/unsubscribe/${token}`);
  return response.data.data;
}
