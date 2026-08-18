// context/authContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { getToken, getRole, logout, setAuth } from "@/lib/auth";
import api from "@/lib/api";

type AuthContextType = {
  loading: boolean;
  isLoggedIn: boolean;
  user: any;
  role: string | null;
  checkAuth: () => Promise<void>;
  logoutUser: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    setLoading(true);

    const token = getToken();
    const storedRole = getRole();

    if (!token || !storedRole) {
      logout();

      setUser(null);
      setRole(null);
      setIsLoggedIn(false);
      setLoading(false);

      return;
    }

    let endpoint = "";

    switch (storedRole) {
      case "customer":
        endpoint = "/auth/customer/profile";
        break;

      case "seller":
        endpoint = "/auth/seller/profile";
        break;

      case "delivery":
        endpoint = "/auth/delivery/profile";
        break;

      default:
        logout();

        setUser(null);
        setRole(null);
        setIsLoggedIn(false);
        setLoading(false);

        return;
    }
    try {
      const { data } = await api.get(endpoint);

      setAuth(token, data.user, storedRole);

      setUser(data.user);
      setRole(storedRole);
      setIsLoggedIn(true);
    } catch (error: any) {
      console.error(error);

      logout();

      setUser(null);
      setRole(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logoutUser = () => {
    logout();

    setUser(null);
    setRole(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        isLoggedIn,
        user,
        role,
        checkAuth,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
