import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getApiError } from "../services/api";

const TOKEN_KEY = "ride_booking_token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        if (active) setUser(response.data.data.user);
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        if (active) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, [token]);

  async function register(payload) {
    const response = await api.post("/auth/register", payload);
    const authData = response.data.data;
    localStorage.setItem(TOKEN_KEY, authData.token);
    setToken(authData.token);
    setUser(authData.user);
    return authData.user;
  }

  async function login(payload) {
    const response = await api.post("/auth/login", payload);
    const authData = response.data.data;
    localStorage.setItem(TOKEN_KEY, authData.token);
    setToken(authData.token);
    setUser(authData.user);
    return authData.user;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, loading, register, login, logout, getApiError }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
