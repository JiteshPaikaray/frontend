import { Navigate } from "react-router-dom";
import { hasAuthSession } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = hasAuthSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
