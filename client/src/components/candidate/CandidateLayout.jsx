import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui";
import { usePortalPaths } from "@/context/PortalPathContext";
import ChatWidget from "@/components/ChatWidget";
import BrandLogo from "@/components/BrandLogo";

const CandidateLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const portalPaths = usePortalPaths();

  const logout = () => {
    localStorage.removeItem("candidateToken");
    localStorage.removeItem("candidateUser");
    navigate(portalPaths.candidate.login);
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  let candidateUser = {};
  try {
    candidateUser = JSON.parse(localStorage.getItem("candidateUser") || "{}");
  } catch (_error) {
    candidateUser = {};
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <BrandLogo
              iconClassName="h-8 w-8"
              textClassName="text-lg font-bold text-gray-900"
            />
            <p className="text-xs text-gray-500">Apply jobs and track your progress</p>
          </div>
          <Button className="btn-secondary" onClick={logout}>Logout</Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-5 gap-6">
        <aside className="md:col-span-1">
          <div className="card space-y-1">
            <Link className={`block px-3 py-2 rounded-md ${isActive(portalPaths.candidate.dashboard) ? "bg-primary-100 text-primary-700" : "text-gray-700 hover:bg-gray-100"}`} to={portalPaths.candidate.dashboard}>Dashboard</Link>
            <Link className={`block px-3 py-2 rounded-md ${isActive(portalPaths.candidate.jobs) ? "bg-primary-100 text-primary-700" : "text-gray-700 hover:bg-gray-100"}`} to={portalPaths.candidate.jobs}>Open Jobs</Link>
            <Link className={`block px-3 py-2 rounded-md ${isActive(portalPaths.candidate.applications) ? "bg-primary-100 text-primary-700" : "text-gray-700 hover:bg-gray-100"}`} to={portalPaths.candidate.applications}>My Applications</Link>
            <Link className={`block px-3 py-2 rounded-md ${isActive(portalPaths.candidate.profile) ? "bg-primary-100 text-primary-700" : "text-gray-700 hover:bg-gray-100"}`} to={portalPaths.candidate.profile}>My Profile</Link>
          </div>
        </aside>

        <main className="md:col-span-4">
          <Outlet />
        </main>
      </div>
      <ChatWidget
        user={{ ...candidateUser, role: "candidate" }}
        enableAi={false}
      />
    </div>
  );
};

export default CandidateLayout;
