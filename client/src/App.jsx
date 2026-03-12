import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { AttendanceProvider } from "./context/AttendanceContext";
import PrivateRoute from "./components/PrivateRoute";
import AccessRoute from "./components/AccessRoute";
import CandidateRoute from "./components/candidate/CandidateRoute";
import SessionRecovery from "./components/SessionRecovery";
import AppErrorBoundary from "./components/AppErrorBoundary";
import PageSkeleton from "./components/PageSkeleton";
import { SettingsProvider } from "./context/SettingsContext";
import { PORTAL_PATHS } from "./context/PortalPathContext";

const importWithRetry = async (importer, retries = 1) => {
  try {
    return await importer();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    return importWithRetry(importer, retries - 1);
  }
};

const lazyWithRetry = (importer, retries = 1) =>
  lazy(() => importWithRetry(importer, retries));

// Route-level lazy loaded pages/components
const Login = lazyWithRetry(() => import("./pages/Login"));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const ApplyLeave = lazyWithRetry(() => import("./pages/ApplyLeave"));
const LeaveHistory = lazyWithRetry(() => import("./pages/LeaveHistory"));
const LeaveRequests = lazyWithRetry(() => import("./pages/LeaveRequests"));
const Users = lazyWithRetry(() => import("./pages/Users"));
const Departments = lazyWithRetry(() => import("./pages/Departments"));
const DepartmentDetails = lazyWithRetry(() => import("./pages/DepartmentDetails"));
const DepartmentEdit = lazyWithRetry(() => import("./pages/DepartmentEdit"));
const DepartmentAnalytics = lazyWithRetry(() => import("./pages/DepartmentAnalytics"));
const AttendanceHistory = lazyWithRetry(() => import("./pages/AttendanceHistory"));
const Announcements = lazyWithRetry(() => import("./pages/Announcements"));
const OrganizationChart = lazyWithRetry(() => import("./pages/OrganizationChart"));
const FileManagement = lazyWithRetry(() => import("./pages/FileManagement"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const ShiftManagement = lazyWithRetry(() => import("./pages/ShiftManagement"));
const JobPostings = lazyWithRetry(() => import("./pages/recruitment/JobPostings"));
const CandidateTracking = lazyWithRetry(() => import("./pages/recruitment/CandidateTracking"));
const InterviewScheduling = lazyWithRetry(() => import("./pages/recruitment/InterviewScheduling"));
const OfferLetters = lazyWithRetry(() => import("./pages/recruitment/OfferLetters"));
const OnboardingChecklist = lazyWithRetry(() => import("./pages/recruitment/OnboardingChecklist"));
const DocumentVerification = lazyWithRetry(() => import("./pages/recruitment/DocumentVerification"));
const BackgroundChecks = lazyWithRetry(() => import("./pages/recruitment/BackgroundChecks"));
const ProbationTracking = lazyWithRetry(() => import("./pages/recruitment/ProbationTracking"));
const CourseCatalog = lazyWithRetry(() => import("./pages/learning/CourseCatalog"));
const TrainingNominations = lazyWithRetry(() => import("./pages/learning/TrainingNominations"));
const TrainingCalendar = lazyWithRetry(() => import("./pages/learning/TrainingCalendar"));
const CertificationTracking = lazyWithRetry(() => import("./pages/learning/CertificationTracking"));
const FeedbackForms = lazyWithRetry(() => import("./pages/learning/FeedbackForms"));
const QuizAssessment = lazyWithRetry(() => import("./pages/learning/QuizAssessment"));
const LearningPaths = lazyWithRetry(() => import("./pages/learning/LearningPaths"));
const AIInsights = lazyWithRetry(() => import("./pages/AIInsights"));
const Unauthorized = lazyWithRetry(() => import("./pages/Unauthorized"));
const GeoFencedCheckIn = lazyWithRetry(() => import("./pages/workforce/GeoFencedCheckIn"));
const WeekendHolidayMaintain = lazyWithRetry(() => import("./pages/workforce/WeekendHolidayMaintain"));
const CheckInControl = lazyWithRetry(() => import("./pages/workforce/CheckInControl"));
const RequestWorkFromHome = lazyWithRetry(() => import("./pages/workforce/RequestWorkFromHome"));
const SalarySlips = lazyWithRetry(() => import("./pages/workforce/SalarySlips"));
const AutomaticLeaveApproval = lazyWithRetry(() => import("./pages/workforce/AutomaticLeaveApproval"));
const LeaveDeductionCalculation = lazyWithRetry(() => import("./pages/workforce/LeaveDeductionCalculation"));
const SalaryCalculation = lazyWithRetry(() => import("./pages/workforce/SalaryCalculation"));
const CompanyAssets = lazyWithRetry(() => import("./pages/workforce/CompanyAssets"));
const AssetAllocationTracking = lazyWithRetry(() => import("./pages/workforce/AssetAllocationTracking"));
const AssetReturnOnExit = lazyWithRetry(() => import("./pages/workforce/AssetReturnOnExit"));
const InventoryManagement = lazyWithRetry(() => import("./pages/workforce/InventoryManagement"));
const ProjectAllocation = lazyWithRetry(() => import("./pages/workforce/ProjectAllocation"));
const TaskAssignment = lazyWithRetry(() => import("./pages/workforce/TaskAssignment"));
const TimesheetEntry = lazyWithRetry(() => import("./pages/workforce/TimesheetEntry"));
const ProjectBilling = lazyWithRetry(() => import("./pages/workforce/ProjectBilling"));
const ResourcePlanning = lazyWithRetry(() => import("./pages/workforce/ResourcePlanning"));
const MilestoneTracking = lazyWithRetry(() => import("./pages/workforce/MilestoneTracking"));
const GanttChart = lazyWithRetry(() => import("./pages/workforce/GanttChart"));
const CapacityPlanning = lazyWithRetry(() => import("./pages/workforce/CapacityPlanning"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Layout = lazyWithRetry(() => import("./components/Layout"));
const CandidateLayout = lazyWithRetry(() => import("./components/candidate/CandidateLayout"));
const CandidateLogin = lazyWithRetry(() => import("./pages/candidate/CandidateLogin"));
const CandidateRegister = lazyWithRetry(() => import("./pages/candidate/CandidateRegister"));
const CandidateCareers = lazyWithRetry(() => import("./pages/candidate/CandidateCareers"));
const CandidateDashboard = lazyWithRetry(() => import("./pages/candidate/CandidateDashboard"));
const CandidateJobs = lazyWithRetry(() => import("./pages/candidate/CandidateJobs"));
const CandidateApplications = lazyWithRetry(() => import("./pages/candidate/CandidateApplications"));
const CandidateProfile = lazyWithRetry(() => import("./pages/candidate/CandidateProfile"));

// Loading Component (Fallback)
const PageLoader = () => (
  <div className="mx-auto w-full max-w-7xl p-6">
    <PageSkeleton rows={6} stats={4} />
  </div>
);

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

function AppShell() {
  const location = useLocation();

  return (
      <AuthProvider>
        <SettingsProvider>
          <AttendanceProvider>
            <SessionRecovery />
            <Toaster position="top-right" />
            <AppErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route path="/login" element={<Login />} />
                {/* Portal-specific access paths */}
                <Route path={PORTAL_PATHS.aliases.employeeLogin} element={<Navigate to={PORTAL_PATHS.internal.login} replace />} />
                <Route path={PORTAL_PATHS.aliases.managerLogin} element={<Navigate to={PORTAL_PATHS.internal.login} replace />} />
                <Route path={PORTAL_PATHS.aliases.adminLogin} element={<Navigate to={PORTAL_PATHS.internal.login} replace />} />
                <Route path={PORTAL_PATHS.aliases.portalEmployee} element={<Navigate to={PORTAL_PATHS.internal.dashboard} replace />} />
                <Route path={PORTAL_PATHS.aliases.portalEmployeeLogin} element={<Navigate to={PORTAL_PATHS.internal.login} replace />} />
                <Route path={PORTAL_PATHS.aliases.portalEmployeeDashboard} element={<Navigate to={PORTAL_PATHS.internal.dashboard} replace />} />
                <Route path={PORTAL_PATHS.aliases.portalHr} element={<Navigate to={PORTAL_PATHS.hr.home} replace />} />
                <Route path={PORTAL_PATHS.aliases.portalLnd} element={<Navigate to={PORTAL_PATHS.learning.home} replace />} />
                <Route path={PORTAL_PATHS.aliases.portalCandidate} element={<Navigate to={PORTAL_PATHS.candidate.dashboard} replace />} />
                <Route path={PORTAL_PATHS.aliases.portalCandidateLogin} element={<Navigate to={PORTAL_PATHS.candidate.login} replace />} />
                <Route path={PORTAL_PATHS.aliases.portalCandidateRegister} element={<Navigate to={PORTAL_PATHS.candidate.register} replace />} />
                <Route path={PORTAL_PATHS.aliases.portalCandidateJobs} element={<Navigate to={PORTAL_PATHS.candidate.careers} replace />} />
                <Route path={PORTAL_PATHS.candidate.careers} element={<CandidateCareers />} />
                <Route path={PORTAL_PATHS.candidate.login} element={<CandidateLogin />} />
                <Route path={PORTAL_PATHS.candidate.register} element={<CandidateRegister />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route
                  path="/candidate"
                  element={
                    <CandidateRoute>
                      <CandidateLayout />
                    </CandidateRoute>
                  }
                >
                  <Route index element={<Navigate to={PORTAL_PATHS.candidate.dashboard} replace />} />
                  <Route path="dashboard" element={<CandidateDashboard />} />
                  <Route path="jobs" element={<CandidateJobs />} />
                  <Route path="applications" element={<CandidateApplications />} />
                  <Route path="profile" element={<CandidateProfile />} />
                </Route>
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
                  <Route path="leave-requests" element={<AccessRoute roles={["manager", "admin", "super_admin"]}><LeaveRequests /></AccessRoute>} />
                  <Route path="users" element={<AccessRoute roles={["admin", "super_admin"]}><Users /></AccessRoute>} />
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
                    element={<AccessRoute roles={["admin", "super_admin"]}><DepartmentAnalytics /></AccessRoute>}
                  />
                  <Route path="attendance" element={<AttendanceHistory />} />
                  <Route path="organization" element={<OrganizationChart />} />
                  <Route path="announcements" element={<Announcements />} />
                  <Route path="files" element={<FileManagement />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="shifts" element={<ShiftManagement />} />
                  <Route path="recruitment" element={<Navigate to="/recruitment/jobs" replace />} />
                  <Route path="recruitment/jobs" element={<AccessRoute access="recruitment_admin"><JobPostings /></AccessRoute>} />
                  <Route path="recruitment/candidates" element={<AccessRoute access="recruitment_admin"><CandidateTracking /></AccessRoute>} />
                  <Route path="recruitment/interviews" element={<AccessRoute roles={["manager", "admin", "super_admin"]}><InterviewScheduling /></AccessRoute>} />
                  <Route path="recruitment/offers" element={<AccessRoute access="recruitment_admin"><OfferLetters /></AccessRoute>} />
                  <Route path="recruitment/onboarding" element={<AccessRoute access="recruitment_admin"><OnboardingChecklist /></AccessRoute>} />
                  <Route path="recruitment/document-verification" element={<AccessRoute access="recruitment_admin"><DocumentVerification /></AccessRoute>} />
                  <Route path="recruitment/background-checks" element={<AccessRoute access="recruitment_admin"><BackgroundChecks /></AccessRoute>} />
                  <Route path="recruitment/probation" element={<AccessRoute access="recruitment_admin"><ProbationTracking /></AccessRoute>} />
                  <Route path="learning" element={<Navigate to="/learning/courses" replace />} />
                  <Route path="learning/courses" element={<CourseCatalog />} />
                  <Route path="learning/nominations" element={<TrainingNominations />} />
                  <Route path="learning/calendar" element={<TrainingCalendar />} />
                  <Route path="learning/certifications" element={<CertificationTracking />} />
                  <Route path="learning/feedback" element={<FeedbackForms />} />
                  <Route path="learning/assessments" element={<QuizAssessment />} />
                  <Route path="learning/paths" element={<LearningPaths />} />
                  <Route path="ai-insights" element={<AccessRoute roles={["manager", "admin", "super_admin"]}><AIInsights /></AccessRoute>} />
                  <Route path="unauthorized" element={<Unauthorized />} />
                  <Route path="workforce/geofenced-checkin" element={<AccessRoute featureKey="geofencedCheckIn"><GeoFencedCheckIn /></AccessRoute>} />
                  <Route path="workforce/weekend-holiday" element={<AccessRoute featureKey="weekendHoliday"><WeekendHolidayMaintain /></AccessRoute>} />
                  <Route path="workforce/checkin-control" element={<AccessRoute featureKey="checkInControl"><CheckInControl /></AccessRoute>} />
                  <Route path="workforce/request-wfh" element={<AccessRoute featureKey="requestWfh"><RequestWorkFromHome /></AccessRoute>} />
                  <Route path="workforce/salary-slips" element={<AccessRoute featureKey="salarySlips"><SalarySlips /></AccessRoute>} />
                  <Route path="workforce/automatic-leave-approval" element={<AccessRoute featureKey="automaticLeaveApproval"><AutomaticLeaveApproval /></AccessRoute>} />
                  <Route path="workforce/leave-deduction" element={<AccessRoute featureKey="leaveDeduction"><LeaveDeductionCalculation /></AccessRoute>} />
                  <Route path="workforce/salary-calculation" element={<AccessRoute featureKey="salaryCalculation"><SalaryCalculation /></AccessRoute>} />
                  <Route path="workforce/company-assets" element={<AccessRoute featureKey="companyAssets"><CompanyAssets /></AccessRoute>} />
                  <Route path="workforce/asset-allocation-tracking" element={<AccessRoute featureKey="assetTracking"><AssetAllocationTracking /></AccessRoute>} />
                  <Route path="workforce/asset-return-exit" element={<AccessRoute featureKey="assetReturnExit"><AssetReturnOnExit /></AccessRoute>} />
                  <Route path="workforce/inventory-management" element={<AccessRoute featureKey="inventoryManagement"><InventoryManagement /></AccessRoute>} />
                  <Route path="workforce/project-allocation" element={<AccessRoute featureKey="projectAllocation"><ProjectAllocation /></AccessRoute>} />
                  <Route path="workforce/task-assignment" element={<AccessRoute featureKey="taskAssignment"><TaskAssignment /></AccessRoute>} />
                  <Route path="workforce/timesheet-entry" element={<AccessRoute featureKey="timesheetEntry"><TimesheetEntry /></AccessRoute>} />
                  <Route path="workforce/project-billing" element={<AccessRoute featureKey="projectBilling"><ProjectBilling /></AccessRoute>} />
                  <Route path="workforce/resource-planning" element={<AccessRoute featureKey="resourcePlanning"><ResourcePlanning /></AccessRoute>} />
                  <Route path="workforce/milestone-tracking" element={<AccessRoute featureKey="milestoneTracking"><MilestoneTracking /></AccessRoute>} />
                  <Route path="workforce/gantt-chart" element={<AccessRoute featureKey="ganttChart"><GanttChart /></AccessRoute>} />
                  <Route path="workforce/capacity-planning" element={<AccessRoute featureKey="capacityPlanning"><CapacityPlanning /></AccessRoute>} />
                </Route>
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AppErrorBoundary>
          </AttendanceProvider>
        </SettingsProvider>
      </AuthProvider>
  );
}

export default App;
