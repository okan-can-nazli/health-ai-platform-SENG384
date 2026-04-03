import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NonAdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <p style={{ padding: "2rem" }}>Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default NonAdminRoute;
