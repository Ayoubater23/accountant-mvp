import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  api,
  clearMemoryToken,
  clearStoredUser,
  getStoredUser,
  setMemoryToken,
  setStoredUser,
} from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Token lives in memory only — lost on page refresh (by design)
  const [token, setToken] = useState(null);
  // Non-sensitive user info persisted to localStorage for UI convenience
  const [user, setUser] = useState(() => getStoredUser());
  const [trialExpired, setTrialExpired] = useState(false);

  useEffect(() => {
    const onAuthExpired = () => {
      clearMemoryToken();
      setToken(null);
      setUser(null);
      clearStoredUser();
    };
    const onTrialExpired = (e) => {
      setTrialExpired(e.detail || "Votre essai gratuit est terminé. Contactez-nous pour continuer.");
    };
    window.addEventListener("facturaai:auth-expired", onAuthExpired);
    window.addEventListener("facturaai:trial-expired", onTrialExpired);
    return () => {
      window.removeEventListener("facturaai:auth-expired", onAuthExpired);
      window.removeEventListener("facturaai:trial-expired", onTrialExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setMemoryToken(data.token);
    setToken(data.token);
    setUser(data.user ?? null);
    setStoredUser(data.user ?? null);
    setTrialExpired(false);
    return data;
  }, []);

  const register = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/register", { email, password });
    setMemoryToken(data.token);
    setToken(data.token);
    setUser(data.user ?? null);
    setStoredUser(data.user ?? null);
    setTrialExpired(false);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearMemoryToken();
    setToken(null);
    setUser(null);
    clearStoredUser();
    setTrialExpired(false);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      register,
      logout,
      trialExpired,
      isAuthenticated: Boolean(token),
    }),
    [token, user, login, register, logout, trialExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return ctx;
}
