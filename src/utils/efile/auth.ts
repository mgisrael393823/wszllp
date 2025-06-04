import type { AuthenticateRequest, AuthenticateResponse } from '@/types/efile';
import { apiClient } from './apiClient';

const CLIENT_TOKEN = import.meta.env.VITE_EFILE_CLIENT_TOKEN;

// Only fall back to process.env in Node (e.g. when running scripts/tests)
const FALLBACK_CLIENT_TOKEN =
  typeof process !== 'undefined' && process.env.VITE_EFILE_CLIENT_TOKEN;

export const getClientToken = () => {
  const token = CLIENT_TOKEN ?? FALLBACK_CLIENT_TOKEN;
  // Ensure we're using EVICT87 for production
  if (!token) {
    console.error('[E-File Auth] No client token found in environment variables');
    throw new Error('E-Filing client token not configured');
  }
  return token;
};

export async function authenticate(
  username: string,
  password: string,
): Promise<string> {
  const clientToken = getClientToken();
  
  // Log authentication attempt (without exposing credentials)
  console.info('[E-File Auth] Attempting authentication', {
    username: username ? `${username.substring(0, 3)}***` : 'missing',
    clientToken: clientToken ? `${clientToken.substring(0, 3)}***` : 'missing',
    baseURL: import.meta.env.VITE_EFILE_BASE_URL,
  });
  
  const req: AuthenticateRequest = { data: { username, password } };
  
  try {
    const { data } = await apiClient.post<AuthenticateResponse>(
      '/il/user/authenticate',
      req,
      { headers: { clienttoken: clientToken } },
    );
    
    // Verify response structure
    if (!data?.item?.auth_token) {
      console.error('[E-File Auth] Invalid response structure', data);
      throw new Error('Invalid authentication response from Tyler API');
    }
    
    console.info('[E-File Auth] Authentication successful');
    return data.item.auth_token;
  } catch (error) {
    console.error('[E-File Auth] Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      response: (error as any)?.response?.data,
      status: (error as any)?.response?.status,
    });
    throw error;
  }
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
    console.info('[E-File Auth] Using existing valid token');
    return currentToken;
  }
  
  const username = import.meta.env.VITE_EFILE_USERNAME;
  const password = import.meta.env.VITE_EFILE_PASSWORD;
  
  console.info('[E-File Auth] Token expired or missing, re-authenticating...');
  
  // Always use the API endpoint - this is the simplest solution
  console.info('[E-File Auth] Using API endpoint for authentication');
  try {
    const response = await fetch('/api/tyler/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }
    
    const data = await response.json();
    dispatch({ type: 'SET_TOKEN', token: data.token, expires: data.expires });
    storeToken(data.token, 3600);
    return data.token;
  } catch (error) {
    console.error('[E-File Auth] API authentication failed:', error);
    throw new Error('E-Filing authentication service unavailable');
  }
}
