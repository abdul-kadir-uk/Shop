// lib/auth.ts

export const TOKEN_KEY = "token";
export const USER_KEY = "user";
export const ROLE_KEY = "role";

/**
 * Get JWT token
 */
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get logged in user
 */
export const getUser = () => {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem(USER_KEY);

  return user ? JSON.parse(user) : null;
};

/**
 * Get user role
 */
export const getRole = (): string | null => {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(ROLE_KEY);
};

/**
 * Check login status
 */
export const isLoggedIn = (): boolean => {
  return !!getToken();
};

/**
 * Save auth data
 */
export const setAuth = (token: string, user: any, role: string) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("role", role);
};
/**
 * Logout
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
};
