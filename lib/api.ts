import Constants from "expo-constants";
import { supabase } from "./supabase";

// Production API fallback (deployed backend)
const PRODUCTION_API_FALLBACK = "https://minecomplyapi-4a46.onrender.com/api";

const apiBaseUrl = resolveApiBaseUrl();

function resolveApiBaseUrl(): string {
  const extra = Constants?.expoConfig?.extra || {};

  // Automatic switching based on build type:
  // __DEV__ = true  → Development (Expo Go) → Use local API
  // __DEV__ = false → Production (APK)      → Use Render API

  if (__DEV__) {
    // Development: Use local API
    const localUrl = sanitizeBaseUrl(extra.localApiBaseUrl);
    if (localUrl) {
      if (__DEV__) {
      console.log("[API] Development mode - using LOCAL API:", localUrl);
      }
      return localUrl;
    }

    // Fallback to dev host detection
    const derived = deriveDevHostBaseUrl();
    if (derived) {
      if (__DEV__) {
      console.log("[API] Development mode - using DERIVED API:", derived);
      }
      return derived;
    }

    if (__DEV__) {
    console.warn("[API] Development mode - no local API found, using fallback");
    }
    return "http://localhost:3000/api";
  } else {
    // Production: Use Render API
    const productionUrl = sanitizeBaseUrl(extra.productionApiBaseUrl);
    if (productionUrl) {
      // Validate it ends with /api
      if (!productionUrl.endsWith('/api')) {
        console.warn(`[API] Production URL should end with /api: ${productionUrl}`);
      }
      console.log("[API] Production mode - using CONFIGURED API:", productionUrl);
      return productionUrl;
    }

    // Fallback to production API (prevents crashes)
    console.warn(
      "[API] Production mode - no PRODUCTION_API_BASE_URL configured, using fallback:",
      PRODUCTION_API_FALLBACK
    );
    return PRODUCTION_API_FALLBACK;
  }
}

function sanitizeBaseUrl(value: string | null | undefined): string | null {
  // Explicit type check ensures TypeScript narrows correctly
  if (typeof value !== 'string' || !value) {
    return null;
  }
  // Now TypeScript knows value is definitely a non-empty string
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/\/+$/, "");
}

function deriveDevHostBaseUrl(): string | null {
  const host = getDevServerHost();
  if (!host) {
    return null;
  }
  return `http://${host}:3000/api`;
}

function getDevServerHost(): string | null {
  const candidates: Array<unknown> = [
    (Constants as any)?.expoConfig?.hostUri,
    (Constants as any)?.expoGoConfig?.hostUri,
    (Constants as any)?.manifest?.debuggerHost,
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri,
  ];

  for (const candidate of candidates) {
    const host = parseHost(candidate);
    if (host) {
      return host;
    }
  }

  return null;
}

function parseHost(candidate: unknown): string | null {
  if (typeof candidate !== "string" || candidate.length === 0) {
    return null;
  }

  const value = candidate.includes("://") ? candidate : `http://${candidate}`;

  try {
    const url = new URL(value);
    return url.hostname || null;
  } catch {
    return null;
  }
}

function getApiHealthUrl(): string {
  return `${apiBaseUrl.replace(/\/+$/, "")}/health`;
}

function createNetworkErrorMessage(fullUrl: string): string {
  if (__DEV__) {
    return [
      `Network error calling ${fullUrl}.`,
      "The local backend is not reachable from Expo Go.",
      "Start the backend with `npm run start:dev` in E:\\FREELANCE\\minecomplyapi,",
      `then verify ${getApiHealthUrl()}.`,
      "If it still times out, check Windows Firewall and make sure the phone and PC are on the same network.",
    ].join(" ");
  }

  return `Network error calling ${fullUrl}. Please check your internet connection and try again.`;
}

async function getAccessToken(): Promise<string> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("[API] Failed to get session:", error);
      throw new Error("Authentication error. Please log in again.");
    }
    
    const token = data.session?.access_token;
    if (!token) {
      console.warn("[API] No access token available. User may be logged out.");
      throw new Error("You are not logged in. Please log in to continue.");
    }
    
    return token;
  } catch (error: any) {
    // If it's already our custom error, re-throw it
    if (error.message?.includes("log in")) {
      throw error;
    }
    // Otherwise, wrap it in a user-friendly message
    console.error("[API] Unexpected error getting access token:", error);
    throw new Error("Authentication error. Please restart the app and log in again.");
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const token = await getAccessToken();
    // Ensure path starts with / to avoid double slashes
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${apiBaseUrl}${normalizedPath}`;
    
    // Log the full URL in production for debugging
    if (!__DEV__) {
      console.log(`[API] GET ${fullUrl}`);
    }
    
    let res: Response;
    try {
      res = await fetch(fullUrl, {
        ...init,
        method: "GET",
        headers: {
          ...(init?.headers || {}),
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (e: any) {
      console.error(`[API] Network error on GET ${fullUrl}:`, e);
      throw new Error(createNetworkErrorMessage(fullUrl));
    }
    
    if (!res.ok) {
      const body = await safeJson(res);
      const errorMsg = body?.message || `Request failed with status ${res.status}`;
      console.error(`[API] GET ${fullUrl} failed (${res.status}):`, errorMsg);
      throw new Error(`${errorMsg} (${fullUrl})`);
    }
    
    return (await res.json()) as T;
  } catch (error: any) {
    // Re-throw with preserved message
    throw error;
  }
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  try {
    const token = await getAccessToken();
    // Ensure path starts with / to avoid double slashes
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${apiBaseUrl}${normalizedPath}`;
    
    // Log the full URL in production for debugging
    if (!__DEV__) {
      console.log(`[API] POST ${fullUrl}`);
    }
    
    let res: Response;
    try {
      res = await fetch(fullUrl, {
        ...init,
        method: "POST",
        headers: {
          ...(init?.headers || {}),
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e: any) {
      console.error(`[API] Network error on POST ${fullUrl}:`, e);
      throw new Error(createNetworkErrorMessage(fullUrl));
    }
    
    if (!res.ok) {
      const data = await safeJson(res);
      const errorMsg = data?.message || `Request failed with status ${res.status}`;
      console.error(`[API] POST ${fullUrl} failed (${res.status}):`, errorMsg);
      throw new Error(`${errorMsg} (${fullUrl})`);
    }
    
    return (await res.json()) as T;
  } catch (error: any) {
    // Re-throw with preserved message
    throw error;
  }
}

export async function apiDelete<T = void>(
  path: string,
  init?: RequestInit
): Promise<T | void> {
  try {
    const token = await getAccessToken();
    // Ensure path starts with / to avoid double slashes
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${apiBaseUrl}${normalizedPath}`;
    
    // Log the full URL in production for debugging
    if (!__DEV__) {
      console.log(`[API] DELETE ${fullUrl}`);
    }
    
    let res: Response;
    try {
      res = await fetch(fullUrl, {
        ...init,
        method: "DELETE",
        headers: {
          ...(init?.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e: any) {
      console.error(`[API] Network error on DELETE ${fullUrl}:`, e);
      throw new Error(createNetworkErrorMessage(fullUrl));
    }
    
    if (!res.ok) {
      const data = await safeJson(res);
      const errorMsg = data?.message || `Request failed with status ${res.status}`;
      console.error(`[API] DELETE ${fullUrl} failed (${res.status}):`, errorMsg);
      throw new Error(`${errorMsg} (${fullUrl})`);
    }
    
    // Try to parse JSON; if none, return void
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        return (await res.json()) as T;
      }
    } catch {}
    return undefined;
  } catch (error: any) {
    // Re-throw with preserved message
    throw error;
  }
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  init?: RequestInit
): Promise<T> {
  try {
    const token = await getAccessToken();
    // Ensure path starts with / to avoid double slashes
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${apiBaseUrl}${normalizedPath}`;
    
    // Log the full URL in production for debugging
    if (!__DEV__) {
      console.log(`[API] PATCH ${fullUrl}`);
    }
    
    let res: Response;
    try {
      res = await fetch(fullUrl, {
        ...init,
        method: "PATCH",
        headers: {
          ...(init?.headers || {}),
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e: any) {
      console.error(`[API] Network error on PATCH ${fullUrl}:`, e);
      throw new Error(createNetworkErrorMessage(fullUrl));
    }
    
    if (!res.ok) {
      const data = await safeJson(res);
      const errorMsg = data?.message || `Request failed with status ${res.status}`;
      console.error(`[API] PATCH ${fullUrl} failed (${res.status}):`, errorMsg);
      throw new Error(`${errorMsg} (${fullUrl})`);
    }
    
    return (await res.json()) as T;
  } catch (error: any) {
    // Re-throw with preserved message
    throw error;
  }
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

export async function getJwt(): Promise<string> {
  return getAccessToken();
}

async function safeJson(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await apiPost("/storage/delete-files", { paths });
}

export type {};
