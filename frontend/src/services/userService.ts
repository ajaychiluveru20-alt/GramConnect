import { API_BASE_URL, getAuthHeaders } from "./api";
import type { CreateWorkerInput, UserProfile } from "../types/auth";

export async function getUsers(): Promise<UserProfile[]> {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || "Failed to fetch users");
  }

  return response.json();
}

export async function getWorkers(): Promise<UserProfile[]> {
  const response = await fetch(`${API_BASE_URL}/workers`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || "Failed to fetch workers");
  }

  return response.json();
}

export async function createWorker(input: CreateWorkerInput): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/workers`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || "Failed to create worker account");
  }

  return response.json();
}

export async function toggleWorkerStatus(id: number, active: boolean): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/workers/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ active }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || "Failed to update worker status");
  }

  return response.json();
}
