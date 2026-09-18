import axios from 'axios';
import { getConfig } from '@/config/env';
import { getAccessToken, setAccessToken } from './tokenMemory';
import { PORTAL, PublicUser } from './types';

// Dedicated auth axios instance. This is the ONLY client that sends
// credentials (the fms_rt refresh cookie is scoped to /api/auth) — product
// clients attach a Bearer token from memory instead (see attachInterceptors.ts).
export const authApi = axios.create({
  baseURL: getConfig().apiBaseUrl,
  withCredentials: true,
});

interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface VerifyResult {
  accessToken: string;
  user: PublicUser;
}

export async function requestOtp(email: string, portal: string = PORTAL): Promise<{ message: string }> {
  const res = await authApi.post<Envelope<null>>('/auth/otp/request', { email, portal });
  return { message: res.data.message || 'If the email is eligible, a code was sent.' };
}

export async function verifyOtp(
  email: string,
  otp: string,
  portal: string = PORTAL,
): Promise<VerifyResult> {
  const res = await authApi.post<Envelope<VerifyResult>>('/auth/otp/verify', { email, otp, portal });
  return res.data.data;
}

export async function loginWithGoogle(idToken: string, portal: string = PORTAL): Promise<VerifyResult> {
  const res = await authApi.post<Envelope<VerifyResult>>('/auth/google', { idToken, portal });
  return res.data.data;
}

export async function logout(): Promise<void> {
  await authApi.post('/auth/logout');
}

export async function fetchMe(): Promise<PublicUser> {
  const token = getAccessToken();
  const res = await authApi.get<Envelope<PublicUser>>('/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data.data;
}

// Only refresh.ts calls this internally; exported so refresh.ts can stay a
// thin single-flight wrapper without re-implementing the unwrap logic.
export async function requestRefresh(): Promise<string> {
  const res = await authApi.post<Envelope<{ accessToken: string }>>('/auth/refresh');
  const token = res.data.data.accessToken;
  setAccessToken(token);
  return token;
}
