/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { notificationService } from "@/services/api";
import { canAccessFeature, ROUTE_FEATURE_MAP } from "@/config/featureAccess";
import ChatWidget from "./ChatWidget";
import BrandLogo from "./BrandLogo";
import {
  FaTachometerAlt,
  FaCalendarPlus,
  FaHistory,
  FaClipboardList,
  FaUsers,
  FaBuilding,
  FaBars,
  FaClock,
  FaBell,
  FaUserCircle,
  FaBullhorn,
  FaLayerGroup,
  FaFolder,
  FaChevronDown,
  FaChevronRight,
  FaUserTie,
  FaCog,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight as FaSidebarChevronRight,
} from "react-icons/fa";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("desktopSidebarOpen");
    return saved === null ? true : saved === "true";
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const { user, logout, isManager, isAdmin } = useAuth();
  const { featureToggles } = useSettings();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const hasAccess = (access) => {
    if (access === "all") return true;
    if (access === "manager" && isManager) return true;
    if (access === "admin" && isAdmin) return true;
    if (
      access === "recruitment_admin" &&
      (isAdmin ||
        String(user?.department || "").toLowerCase() === "hr" ||
        String(user?.designation || "").toLowerCase() === "hr")
    ) {
      return true;
    }
    return false;
  };

  const isRouteActive = (href) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`);

  const canAccessRoute = (path) => {
    const matched = ROUTE_FEATURE_MAP.find(
      ({ prefix }) => path === prefix || path.startsWith(`${prefix}/`),
    );
    if (!matched) return true;
    return canAccessFeature(user, matched.feature);
  };

  const isFeatureEnabled = (href) => {
    if (!featureToggles || Object.keys(featureToggles).length === 0) return true;

    const routeToFeature = {
      "/apply-leave": featureToggles.enableLeaveModule,
      "/leave-history": featureToggles.enableLeaveModule,
      "/leave-requests": featureToggles.enableLeaveModule,
      "/attendance": featureToggles.enableAttendanceModule,
      "/announcements": featureToggles.enableAnnouncements,
      "/files": featureToggles.enableFileManagement,
      "/organization": featureToggles.enableOrganizationChart,
      "/departments": featureToggles.enableDepartmentStructure,
    };

    const enabled = routeToFeature[href];
    return enabled === undefined ? true : enabled;
  };

  const isCurrentRouteEnabled = (() => {
    if (!featureToggles || Object.keys(featureToggles).length === 0) return true;

    const featureByPrefix = [
      { prefix: "/apply-leave", enabled: featureToggles.enableLeaveModule },
      { prefix: "/leave-history", enabled: featureToggles.enableLeaveModule },
      { prefix: "/leave-requests", enabled: featureToggles.enableLeaveModule },
      { prefix: "/attendance", enabled: featureToggles.enableAttendanceModule },
      { prefix: "/announcements", enabled: featureToggles.enableAnnouncements },
      { prefix: "/files", enabled: featureToggles.enableFileManagement },
      { prefix: "/organization", enabled: featureToggles.enableOrganizationChart },
      { prefix: "/departments", enabled: featureToggles.enableDepartmentStructure },
    ];

    const matched = featureByPrefix.find(({ prefix }) =>
      location.pathname === prefix || location.pathname.startsWith(`${prefix}/`),
    );

    return matched ? matched.enabled !== false : true;
  })();

  if (!isCurrentRouteEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname !== "/unauthorized" && !canAccessRoute(location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const navigationGroups = [
    {
      name: "Overview",
      icon: FaTachometerAlt,
      children: [{ name: "Dashboard", href: "/dashboard", access: "all" }],
    },
    {
      name: "Workforce",
      icon: FaLayerGroup,
      children: [
        { name: "Users", href: "/users", access: "admin" },
        { name: "Organization", href: "/organization", access: "all" },
        { name: "Departments", href: "/departments", access: "all" },
        { name: "Attendance", href: "/attendance", access: "all" },
        { name: "Shifts", href: "/shifts", access: "all" },
      ],
    },
    {
      name: "Leaves",
      icon: FaCalendarPlus,
      children: [
        { name: "Apply Leave", href: "/apply-leave", access: "all" },
        { name: "Leave History", href: "/leave-history", access: "all" },
        { name: "Leave Requests", href: "/leave-requests", access: "manager" },
      ],
    },
    {
      name: "Communication",
      icon: FaBullhorn,
      children: [
        { name: "Announcements", href: "/announcements", access: "all" },
        { name: "Files", href: "/files", access: "all" },
      ],
    },
    {
      name: "Recruitment",
      icon: FaUserTie,
      children: [
        { name: "Job Postings", href: "/recruitment/jobs", access: "recruitment_admin" },
        { name: "Candidate Tracking", href: "/recruitment/candidates", access: "recruitment_admin" },
        { name: "Interview Scheduling", href: "/recruitment/interviews", access: "manager" },
        { name: "Offer Letters", href: "/recruitment/offers", access: "recruitment_admin" },
        { name: "Onboarding", href: "/recruitment/onboarding", access: "recruitment_admin" },
        { name: "Document Verification", href: "/recruitment/document-verification", access: "recruitment_admin" },
        { name: "Background Checks", href: "/recruitment/background-checks", access: "recruitment_admin" },
        { name: "Probation Tracking", href: "/recruitment/probation", access: "recruitment_admin" },
      ],
    },
    {
      name: "Learning",
      icon: FaLayerGroup,
      children: [
        { name: "Course Catalog", href: "/learning/courses", access: "all" },
        { name: "Training Nominations", href: "/learning/nominations", access: "all" },
        { name: "Training Calendar", href: "/learning/calendar", access: "all" },
        { name: "Certification Tracking", href: "/learning/certifications", access: "all" },
        { name: "Feedback Forms", href: "/learning/feedback", access: "all" },
        { name: "Quiz / Assessment", href: "/learning/assessments", access: "all" },
        { name: "Learning Paths", href: "/learning/paths", access: "all" },
      ],
    },
    {
      name: "AI Center",
      icon: FaLayerGroup,
      children: [{ name: "AI Insights", href: "/ai-insights", access: "manager" }],
    },
    {
      name: "Advanced HR",
      icon: FaClock,
      children: [
        { name: "GeoFenced Check-In", href: "/workforce/geofenced-checkin", access: "all", featureKey: "geofencedCheckIn" },
        { name: "Weekend & Holiday", href: "/workforce/weekend-holiday", access: "all", featureKey: "weekendHoliday" },
        { name: "Check-In Control", href: "/workforce/checkin-control", access: "admin", featureKey: "checkInControl" },
        { name: "Request WFH", href: "/workforce/request-wfh", access: "all", featureKey: "requestWfh" },
        { name: "Salary Slips", href: "/workforce/salary-slips", access: "all", featureKey: "salarySlips" },
        { name: "Auto Leave Approval", href: "/workforce/automatic-leave-approval", access: "admin", featureKey: "automaticLeaveApproval" },
        { name: "Leave Deduction", href: "/workforce/leave-deduction", access: "all", featureKey: "leaveDeduction" },
        { name: "Salary Calculation", href: "/workforce/salary-calculation", access: "manager", featureKey: "salaryCalculation" },
      ],
    },
    {
      name: "Assets & Inventory",
      icon: FaFolder,
      children: [
        { name: "Company Assets", href: "/workforce/company-assets", access: "all", featureKey: "companyAssets" },
        { name: "Asset Allocation", href: "/workforce/asset-allocation-tracking", access: "all", featureKey: "assetTracking" },
        { name: "Asset Return on Exit", href: "/workforce/asset-return-exit", access: "all", featureKey: "assetReturnExit" },
        { name: "Inventory Management", href: "/workforce/inventory-management", access: "all", featureKey: "inventoryManagement" },
      ],
    },
    {
      name: "Projects & PMO",
      icon: FaClipboardList,
      children: [
        { name: "Project Allocation", href: "/workforce/project-allocation", access: "all", featureKey: "projectAllocation" },
        { name: "Task Assignment", href: "/workforce/task-assignment", access: "all", featureKey: "taskAssignment" },
        { name: "Timesheet Entry", href: "/workforce/timesheet-entry", access: "all", featureKey: "timesheetEntry" },
        { name: "Project Billing", href: "/workforce/project-billing", access: "all", featureKey: "projectBilling" },
        { name: "Resource Planning", href: "/workforce/resource-planning", access: "all", featureKey: "resourcePlanning" },
        { name: "Milestone Tracking", href: "/workforce/milestone-tracking", access: "all", featureKey: "milestoneTracking" },
        { name: "Gantt Chart", href: "/workforce/gantt-chart", access: "all", featureKey: "ganttChart" },
        { name: "Capacity Planning", href: "/workforce/capacity-planning", access: "all", featureKey: "capacityPlanning" },
      ],
    },
  ];

  const filteredNavigation = navigationGroups
    .map((group) => ({
      ...group,
      children: group.children.filter(
        (child) =>
          hasAccess(child.access) &&
          isFeatureEnabled(child.href) &&
          (!child.featureKey || canAccessFeature(user, child.featureKey)),
      ),
    }))
    .filter((group) => group.children.length > 0);

  const activeGroupName = useMemo(() => {
    const match = filteredNavigation.find((group) =>
      group.children.some((child) => isRouteActive(child.href)),
    );
    return match?.name || null;
  }, [filteredNavigation, location.pathname]);

  useEffect(() => {
    if (!openGroup || !filteredNavigation.some((group) => group.name === openGroup)) {
      setOpenGroup(activeGroupName);
    }
  }, [activeGroupName, filteredNavigation, openGroup]);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const response = await notificationService.getNotifications({ limit: 15 });
        if (!mounted) return;
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      } catch (error) {
        // Notification failures should not block layout.
      }
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 60000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("desktopSidebarOpen", String(desktopSidebarOpen));
  }, [desktopSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${desktopSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full"} transition-transform duration-200 ease-in-out z-30 flex flex-col h-full overflow-hidden`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center bg-primary-600 px-3">
          <BrandLogo
            iconClassName="h-8 w-8"
            textClassName="text-xl font-bold text-white"
          />
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-2 pb-6 space-y-2 flex-1 overflow-y-auto">
          {filteredNavigation.map((group) => {
            const GroupIcon = group.icon;
            const groupActive = group.children.some((child) =>
              isRouteActive(child.href),
            );
            const isOpen = openGroup
              ? openGroup === group.name
              : groupActive;

            return (
              <div key={group.name} className="rounded-lg border border-gray-100">
                <Button
                  onClick={() =>
                    setOpenGroup((prev) => (prev === group.name ? null : group.name))
                  }
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold ${
                    groupActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <GroupIcon className="h-4 w-4" />
                    {group.name}
                  </span>
                  {isOpen ? (
                    <FaChevronDown className="h-3 w-3" />
                  ) : (
                    <FaChevronRight className="h-3 w-3" />
                  )}
                </Button>

                {isOpen && (
                  <div className="py-1">
                    {group.children.map((item) => {
                      const isActive = isRouteActive(item.href);
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`ml-2 mr-2 mb-1 flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                            isActive
                              ? "bg-primary-100 text-primary-700"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="w-full p-4 border-t bg-white">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <FaUserCircle className="h-8 w-8 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role} • {user?.department}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`${desktopSidebarOpen ? "lg:pl-64" : "lg:pl-0"} flex flex-col flex-1`}>
        {/* Top navigation */}
        <nav className={`bg-white shadow-sm h-16 fixed top-0 right-0 left-0 ${desktopSidebarOpen ? "lg:left-64" : "lg:left-0"} z-10`}>
          <div className="px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
              {/* Mobile menu button */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-600"
                >
                  <FaBars className="h-6 w-6" />
                </Button>
                <Button
                  onClick={() => setDesktopSidebarOpen((prev) => !prev)}
                  className="hidden lg:inline-flex text-gray-500 hover:text-gray-700"
                  title={desktopSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                  {desktopSidebarOpen ? <FaChevronLeft className="h-4 w-4" /> : <FaSidebarChevronRight className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex-1" />

              {/* Right side items */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative">
                  <Button
                    className="text-gray-400 hover:text-gray-500 relative"
                    onClick={() => setShowNotifications((prev) => !prev)}
                  >
                    <FaBell className="h-6 w-6" />
                    {unreadCount + chatUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center ring-2 ring-white">
                        {unreadCount + chatUnreadCount > 9 ? "9+" : unreadCount + chatUnreadCount}
                      </span>
                    )}
                  </Button>
                  {showNotifications && (
                  <div className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg z-20">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">Notifications</p>
                      <Button
                        className="text-xs text-primary-600"
                        onClick={async () => {
                          await notificationService.markAllRead();
                          setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
                          setUnreadCount(0);
                        }}
                      >
                        Mark all read
                      </Button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {notifications.length ? notifications.map((item) => (
                        <button
                          type="button"
                          key={item._id}
                          className={`w-full text-left p-3 hover:bg-gray-50 ${item.isRead ? "bg-white" : "bg-blue-50/40"}`}
                          onClick={async () => {
                            if (!item.isRead) {
                              await notificationService.markRead(item._id);
                              setNotifications((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
                              setUnreadCount((prev) => Math.max(0, prev - 1));
                            }
                          }}
                        >
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{item.message}</p>
                        </button>
                      )) : (
                        <p className="p-3 text-sm text-gray-500">No notifications</p>
                      )}
                    </div>
                  </div>
                  )}
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                  <Button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 text-sm focus:outline-none"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="hidden md:block text-gray-700">
                        {user?.name}
                      </span>
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </Button>

                  {/* Dropdown menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <FaUserCircle className="h-4 w-4 text-gray-500" />
                        Your Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <FaCog className="h-4 w-4 text-gray-500" />
                        Settings
                      </Link>
                      <Button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <FaSignOutAlt className="h-4 w-4" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="pt-16 min-h-screen">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <ChatWidget user={user} enableAi onUnreadChange={setChatUnreadCount} />
    </div>
  );
};

export default Layout;
