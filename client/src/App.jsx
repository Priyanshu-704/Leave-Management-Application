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
import AccessRoute from "./components/AccessRoute";
import CandidateRoute from "./components/candidate/CandidateRoute";
import SessionRecovery from "./components/SessionRecovery";
import AppErrorBoundary from "./components/AppErrorBoundary";
import PageSkeleton from "./components/PageSkeleton";
import { SettingsProvider } from "./context/SettingsContext";
import { PORTAL_PATHS } from "./context/PortalPathContext";

// Route-level lazy loaded pages/components
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
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
const OrganizationChart = lazy(() => import("./pages/OrganizationChart"));
const FileManagement = lazy(() => import("./pages/FileManagement"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const ShiftManagement = lazy(() => import("./pages/ShiftManagement"));
const JobPostings = lazy(() => import("./pages/recruitment/JobPostings"));
const CandidateTracking = lazy(() => import("./pages/recruitment/CandidateTracking"));
const InterviewScheduling = lazy(() => import("./pages/recruitment/InterviewScheduling"));
const OfferLetters = lazy(() => import("./pages/recruitment/OfferLetters"));
const OnboardingChecklist = lazy(() => import("./pages/recruitment/OnboardingChecklist"));
const DocumentVerification = lazy(() => import("./pages/recruitment/DocumentVerification"));
const BackgroundChecks = lazy(() => import("./pages/recruitment/BackgroundChecks"));
const ProbationTracking = lazy(() => import("./pages/recruitment/ProbationTracking"));
const CourseCatalog = lazy(() => import("./pages/learning/CourseCatalog"));
const TrainingNominations = lazy(() => import("./pages/learning/TrainingNominations"));
const TrainingCalendar = lazy(() => import("./pages/learning/TrainingCalendar"));
const CertificationTracking = lazy(() => import("./pages/learning/CertificationTracking"));
const FeedbackForms = lazy(() => import("./pages/learning/FeedbackForms"));
const QuizAssessment = lazy(() => import("./pages/learning/QuizAssessment"));
const LearningPaths = lazy(() => import("./pages/learning/LearningPaths"));
const AIInsights = lazy(() => import("./pages/AIInsights"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const GeoFencedCheckIn = lazy(() => import("./pages/workforce/GeoFencedCheckIn"));
const WeekendHolidayMaintain = lazy(() => import("./pages/workforce/WeekendHolidayMaintain"));
const CheckInControl = lazy(() => import("./pages/workforce/CheckInControl"));
const RequestWorkFromHome = lazy(() => import("./pages/workforce/RequestWorkFromHome"));
const SalarySlips = lazy(() => import("./pages/workforce/SalarySlips"));
const AutomaticLeaveApproval = lazy(() => import("./pages/workforce/AutomaticLeaveApproval"));
const LeaveDeductionCalculation = lazy(() => import("./pages/workforce/LeaveDeductionCalculation"));
const SalaryCalculation = lazy(() => import("./pages/workforce/SalaryCalculation"));
const CompanyAssets = lazy(() => import("./pages/workforce/CompanyAssets"));
const AssetAllocationTracking = lazy(() => import("./pages/workforce/AssetAllocationTracking"));
const AssetReturnOnExit = lazy(() => import("./pages/workforce/AssetReturnOnExit"));
const InventoryManagement = lazy(() => import("./pages/workforce/InventoryManagement"));
const ProjectAllocation = lazy(() => import("./pages/workforce/ProjectAllocation"));
const TaskAssignment = lazy(() => import("./pages/workforce/TaskAssignment"));
const TimesheetEntry = lazy(() => import("./pages/workforce/TimesheetEntry"));
const ProjectBilling = lazy(() => import("./pages/workforce/ProjectBilling"));
const ResourcePlanning = lazy(() => import("./pages/workforce/ResourcePlanning"));
const MilestoneTracking = lazy(() => import("./pages/workforce/MilestoneTracking"));
const GanttChart = lazy(() => import("./pages/workforce/GanttChart"));
const CapacityPlanning = lazy(() => import("./pages/workforce/CapacityPlanning"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Layout = lazy(() => import("./components/Layout"));
const CandidateLayout = lazy(() => import("./components/candidate/CandidateLayout"));
const CandidateLogin = lazy(() => import("./pages/candidate/CandidateLogin"));
const CandidateRegister = lazy(() => import("./pages/candidate/CandidateRegister"));
const CandidateCareers = lazy(() => import("./pages/candidate/CandidateCareers"));
const CandidateDashboard = lazy(() => import("./pages/candidate/CandidateDashboard"));
const CandidateJobs = lazy(() => import("./pages/candidate/CandidateJobs"));
const CandidateApplications = lazy(() => import("./pages/candidate/CandidateApplications"));
const CandidateProfile = lazy(() => import("./pages/candidate/CandidateProfile"));

// Loading Component (Fallback)
const PageLoader = () => (
  <div className="mx-auto w-full max-w-7xl p-6">
    <PageSkeleton rows={6} stats={4} />
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
            <AppErrorBoundary>
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
    </Router>
  );
}

export default App;
