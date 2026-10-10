const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("gramconnect_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export { API_BASE_URL };