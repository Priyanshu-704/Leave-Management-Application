import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { canAccessFeature } from "@/config/featureAccess";

const AccessRoute = ({ children, roles = null, featureKey = null, access = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (Array.isArray(roles) && roles.length && !roles.includes(user.role) && user.role !== "super_admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  if (access === "recruitment_admin") {
    const isHr =
      String(user?.department || "").toLowerCase() === "hr" ||
      String(user?.designation || "").toLowerCase() === "hr";
    const allowed = ["admin", "super_admin"].includes(user.role) || isHr;
    if (!allowed) return <Navigate to="/unauthorized" replace />;
  }

  if (featureKey && !canAccessFeature(user, featureKey)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default AccessRoute;
