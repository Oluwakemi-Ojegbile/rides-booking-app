import { createContext, useContext } from "react";

const AuthContext = createContext({ user: null, token: null });

export const AuthProvider = AuthContext.Provider;

export function useAuth() {
  return useContext(AuthContext);
}
