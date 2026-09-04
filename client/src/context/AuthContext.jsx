import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tsd_token");
    const username = localStorage.getItem("tsd_username");
    if (token && username) {
      api
        .get("/auth/verify")
        .then(() => setUser({ username }))
        .catch(() => {
          localStorage.removeItem("tsd_token");
          localStorage.removeItem("tsd_username");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("tsd_token", data.token);
    localStorage.setItem("tsd_username", data.username);
    setUser({ username: data.username });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("tsd_token");
    localStorage.removeItem("tsd_username");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
