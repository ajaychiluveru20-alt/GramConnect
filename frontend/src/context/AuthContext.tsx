import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { UserProfile, UserRole, RegisterInput } from "../types/auth";
import { 
  loginUser, 
  registerUser, 
  getCurrentUser, 
  getStoredToken, 
  getStoredUser, 
  clearStoredAuth 
} from "../services/authService";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isWorker: boolean;
  isVillager: boolean;
  login: (email: string, password: string, requiredRole?: UserRole) => Promise<UserProfile>;
  register: (input: RegisterInput) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<UserProfile | null>(getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);

  // Validate stored session on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setToken(storedToken);
      } catch (err) {
        console.warn("Session expired or token invalid:", err);
        clearStoredAuth();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string, requiredRole?: UserRole): Promise<UserProfile> => {
      setLoading(true);
      try {
        const response = await loginUser({ email, password, requiredRole });
        setToken(response.token);
        setUser(response.user);
        return response.user;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<UserProfile> => {
      setLoading(true);
      try {
        const response = await registerUser(input);
        setToken(response.token);
        setUser(response.user);
        return response.user;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await getCurrentUser();
      setUser(u);
    } catch {
      logout();
    }
  }, [logout]);

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "ADMIN";
  const isWorker = user?.role === "WORKER";
  const isVillager = user?.role === "VILLAGER";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        isWorker,
        isVillager,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}