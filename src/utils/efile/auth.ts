import type { AuthenticateRequest, AuthenticateResponse } from '@/types/efile';
import { apiClient } from './apiClient';

const CLIENT_TOKEN =
  import.meta.env.VITE_EFILE_CLIENT_TOKEN ||
  process.env.VITE_EFILE_CLIENT_TOKEN;

export async function authenticate(
  username: string,
  password: string,
): Promise<string> {
  const req: AuthenticateRequest = { data: { username, password } };
  const { data } = await apiClient.post<AuthenticateResponse>(
    '/il/user/authenticate',
    req,
    { headers: { clienttoken: CLIENT_TOKEN } },
  );
  return data.item.auth_token;
}

export function storeToken(token: string, expiresIn: number) {
  const expires = Date.now() + expiresIn * 1000;
  localStorage.setItem('efileAuth', JSON.stringify({ token, expires }));
}

export function getStoredToken(): { token: string; expires: number } | null {
  const raw = localStorage.getItem('efileAuth');
  return raw ? JSON.parse(raw) : null;
}

export function isTokenExpired(expires: number) {
  return Date.now() > expires;
}

/**
 * Ensure an auth token is available and not expired. If missing or expired,
 * authenticate using credentials from environment variables.
 */
export async function ensureAuth(
  currentToken: string | null,
  expires: number | null,
  dispatch: React.Dispatch<{ type: 'SET_TOKEN'; token: string; expires: number }>,
): Promise<string> {
  if (currentToken && expires && !isTokenExpired(expires)) {
    return currentToken;
  }
  const username = import.meta.env.VITE_EFILE_USERNAME;
  const password = import.meta.env.VITE_EFILE_PASSWORD;
  const token = await authenticate(username, password);
  // Docs do not specify expiration; assume 1 hour
  const expiry = Date.now() + 60 * 60 * 1000;
  dispatch({ type: 'SET_TOKEN', token, expires: expiry });
  return token;
}
