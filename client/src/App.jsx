import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { AttendanceProvider } from "./context/AttendanceContext";
import PrivateRoute from "./components/PrivateRoute";
import SessionRecovery from "./components/SessionRecovery";
import OrganizationChart from "./pages/OrganizationChart";
import FileManagement from "./pages/FileManagement";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { SettingsProvider } from "./context/SettingsContext";

// 2. Updated imports to use lazy loading
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ApplyLeave = lazy(() => import("./pages/ApplyLeave"));
const LeaveHistory = lazy(() => import("./pages/LeaveHistory"));
const LeaveRequests = lazy(() => import("./pages/LeaveRequests"));
const Users = lazy(() => import("./pages/Users"));
const Departments = lazy(() => import("./pages/Departments"));
const DepartmentDetails = lazy(() => import("./pages/DepartmentDetails"));
const DepartmentEdit = lazy(() => import("./pages/DepartmentEdit"));
const DepartmentAnalytics = lazy(() => import("./pages/DepartmentAnalytics"));
const AttendanceHistory = lazy(() => import("./pages/AttendanceHistory"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Layout = lazy(() => import("./components/Layout"));

// Loading Component (Fallback)
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AttendanceProvider>
            <SessionRecovery />
            <Toaster position="top-right" />
            {/* 3. Wrap Routes in Suspense */}
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <Layout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="apply-leave" element={<ApplyLeave />} />
                  <Route path="leave-history" element={<LeaveHistory />} />
                  <Route path="leave-requests" element={<LeaveRequests />} />
                  <Route path="users" element={<Users />} />
                  <Route path="departments" element={<Departments />} />
                  <Route
                    path="departments/:id"
                    element={<DepartmentDetails />}
                  />
                  <Route
                    path="departments/edit/:id"
                    element={<DepartmentEdit />}
                  />
                  <Route
                    path="departments/analytics"
                    element={<DepartmentAnalytics />}
                  />
                  <Route path="attendance" element={<AttendanceHistory />} />
                  <Route path="organization" element={<OrganizationChart />} />
                  <Route path="announcements" element={<Announcements />} />
                  <Route path="files" element={<FileManagement />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </Suspense>
          </AttendanceProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
