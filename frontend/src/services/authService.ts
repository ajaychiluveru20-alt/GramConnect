import { API_BASE_URL, getAuthHeaders } from "./api";
import type { AuthResponse, LoginCredentials, RegisterInput, UserProfile } from "../types/auth";

const TOKEN_KEY = "gramconnect_token";
const USER_KEY = "gramconnect_user";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: UserProfile): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.message || (response.status === 403 ? "Access denied: Unauthorized role for this portal." : "Login failed. Check your credentials.");
    throw new Error(msg);
  }

  const data: AuthResponse = await response.json();
  setStoredAuth(data.token, data.user);
  return data;
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const msg = errorData?.message || "Registration failed. Please check the entered details.";
    throw new Error(msg);
  }

  const data: AuthResponse = await response.json();
  setStoredAuth(data.token, data.user);
  return data;
}

export async function getCurrentUser(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Session expired or invalid token");
  }

  const user: UserProfile = await response.json();
  const token = getStoredToken();
  if (token) {
    setStoredAuth(token, user);
  }
  return user;
}
