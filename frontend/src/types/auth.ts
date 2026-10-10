export type UserRole = 'ADMIN' | 'WORKER' | 'VILLAGER';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  village?: string | null;
  role: UserRole;
  active: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface LoginCredentials {
  email: string;
  password: string;
  requiredRole?: UserRole;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  village?: string;
}

export interface CreateWorkerInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}