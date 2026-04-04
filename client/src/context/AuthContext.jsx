import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadUser(currentToken) {
    try {
      const data = await getCurrentUser(currentToken);
      setUser(data.data);
    } catch (error) {
      console.error("Failed to load user:", error);
      localStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  function login(authToken) {
    localStorage.setItem("accessToken", authToken);
    setToken(authToken);
    setLoading(true);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    setToken(null);
    setUser(null);
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token && user),
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
